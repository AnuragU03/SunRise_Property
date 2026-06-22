import { runAgent } from '@/lib/runAgent';
import { leadHasRecentOutboundCall } from '@/lib/services/callService';
import { ObjectId } from 'mongodb';
import { tryAcquireLeadLock } from '@/lib/services/leadLockService';
import { matchmakerMayProspect } from '@/lib/orchestrator/rules';

export function normalizeLocation(loc?: string): string {
  if (!loc) return '';
  return loc.split(',')[0].toLowerCase().trim();
}

export async function runMatchmaker(leadId?: string): Promise<any> {
  const { runId, output } = await runAgent({
    agentId: 'matchmaker',
    agentName: 'The Matchmaker',
    trigger: leadId ? 'event' : 'cron',
    input: leadId ? { lead_id: leadId } : { cron_job: 'matchmaker', trigger_time: new Date().toISOString() },
    metadata: leadId ? { trigger_type: 'event' } : { cron_type: 'scheduled', frequency: 'every_30_min' },

    handler: async (ctx) => {
      // ── Step 1: evaluation ─────────────────────────────────────────────
      await ctx.think('evaluation',
        leadId 
          ? `Scanning for matched properties for specific lead ${leadId}.`
          : 'Scanning for unmatched leads (status=new, dnd=false) and available properties to feed into the GPT-4o pairing engine.',
        { confidence: 1.0 }
      );

      const leadQuery: any = {
        status: 'new',
        dnd_status: { $ne: true },
        is_deleted: { $ne: true },
      };
      
      if (leadId) {
        leadQuery._id = new ObjectId(leadId);
      }

      const rawLeads = await ctx.db.findMany('leads', leadQuery);
      
      const unmatchedLeads = [];

      for (const lead of rawLeads as any[]) {
        // Ownership rules (lib/orchestrator/rules.ts): visit-history leads belong to
        // the re-engager, promised callbacks to the follow-up agent, booked leads to
        // the guardian. The matchmaker only cold-prospects leads it OWNS — replaces
        // sole reliance on the 4h matchmaker_skip_until band-aid.
        const verdict = matchmakerMayProspect(lead);
        if (!verdict.allowed) {
          await ctx.db.insertOne('agent_execution_logs', {
            agent_name: 'matchmaker_skipped',
            lead_id: lead._id,
            reason: verdict.reason,
            metadata: { reengage_fired_at: lead.reengage_fired_at, last_visit_type: lead.last_visit_type },
            created_at: new Date(),
          });
        } else {
          unmatchedLeads.push(lead);
        }
      }
      const availableProperties = await ctx.db.findMany('properties', {
        is_deleted: { $ne: true },
        status: 'available',
      });

      // Fetch builder insights for properties to improve matching rationale
      const uniqueLocations = Array.from(new Set((availableProperties as any[]).map(p => p.location).filter(Boolean)));
      for (const loc of uniqueLocations) {
        await ctx.kb.searchBuilders({ location: String(loc) });
      }

      await ctx.think('decision',
        unmatchedLeads.length === 0
          ? 'No unmatched leads in the pipeline. Exiting cleanly.'
          : availableProperties.length === 0
            ? `Found ${unmatchedLeads.length} lead(s) but 0 available properties — no matching possible.`
            : `Found ${unmatchedLeads.length} unmatched lead(s) and ${availableProperties.length} available propert(ies). Submitting to GPT-4o pairing engine with score threshold 75.`,
        {
          confidence: 1.0,
          metadata: {
            leads_count: unmatchedLeads.length,
            properties_count: availableProperties.length,
          },
        }
      );

      if (unmatchedLeads.length === 0 || availableProperties.length === 0) {
        return {
          matches_found: 0,
          calls_triggered: 0,
          total_leads_scanned: unmatchedLeads.length,
          summary: unmatchedLeads.length === 0
            ? 'No unmatched leads in the pipeline.'
            : 'No available properties to match against.',
        };
      }

      // Group leads by normalized location
      const groups = new Map<string, any[]>();
      let unmatchableLeads = 0;
      
      for (const lead of unmatchedLeads) {
        const loc = normalizeLocation(lead.location_pref);
        if (!loc) {
          unmatchableLeads++;
          console.warn(`[Matchmaker] Skipping lead ${lead._id} (${lead.name}) - empty location_pref`);
          continue;
        }
        if (!groups.has(loc)) groups.set(loc, []);
        groups.get(loc)!.push(lead);
      }

      let matches: Array<{ client_id: string; property_id: string; score: number; rationale: string }> = [];
      let totalLeadsSent = 0;
      let totalPropertiesSent = 0;

      // Process each location group via OPTION 1
      for (const [loc, groupLeads] of groups.entries()) {
        const clientPayload = groupLeads.map((c) => ({
          id: String(c._id),
          name: c.name,
          budget: c.budget_range,
          location: c.location_pref,
          type: c.property_type,
          timeline: c.timeline,
          notes: (c.notes || '').slice(0, 200),
        }));

        const groupProperties = availableProperties.filter(p => normalizeLocation(p.location) === loc);
        if (groupProperties.length === 0) {
          // B12 part 2: When no exact-location properties exist, do NOT fall back to nearby properties.
          // GPT-4o ignored the prompt's "cap at 50" instruction and returned cross-location matches at score 80.
          // Code-enforce: no exact match = no match. Brokers can manually match nearby properties if they want.
          console.warn(
            `[Matchmaker] No exact-location properties for "${loc}" — skipping ${groupLeads.length} lead(s), no GPT call made`
          );
          unmatchableLeads += groupLeads.length;
          continue; // skip to next location group
        }

        const propertyPayload = groupProperties.map((p) => ({
          id: String(p._id),
          title: p.title,
          price: p.price,
          location: p.location,
          type: p.type,
          bedrooms: p.bedrooms,
        }));

        totalLeadsSent += clientPayload.length;
        totalPropertiesSent += propertyPayload.length;

        const systemPrompt = `You are an expert real-estate matchmaker AI. Analyse the clients and properties below.
CRITICAL: Only match properties whose location matches the client's preferred location.
Return a JSON object with a single array "matches". Each element must have:
  - client_id  (string)
  - property_id (string)
  - score       (integer 1–100)
  - rationale   (string, ≤ 60 words)
Only include pairs with score ≥ 75. If none qualify, return {"matches":[]}.`;

        const gptResult = await ctx.openai.chat({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: JSON.stringify({ clients: clientPayload, properties: propertyPayload }),
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 1200,
        });

        try {
          const parsed = JSON.parse(gptResult.content);
          const groupMatches = (parsed.matches || []).filter((m: any) => Number(m.score) >= 75);
          matches.push(...groupMatches);
        } catch (err) {
          console.error(`[Matchmaker] Failed to parse GPT output for location ${loc}:`, err);
        }
      }

      await ctx.act('gpt4o_pairing_complete', `GPT-4o returned ${matches.length} qualifying match(es)`, {
        parameters: { leads_sent: totalLeadsSent, properties_sent: totalPropertiesSent, unmatchable_leads_skipped: unmatchableLeads },
        result: { matches_above_75: matches.length },
      });

      if (matches.length === 0) {
        await ctx.think('result_analysis',
          'GPT-4o found no client–property pairs with score >= 75 in this sweep. No voice calls triggered.',
          { confidence: 0.95 }
        );
        return {
          matches_found: 0,
          calls_triggered: 0,
          total_leads_scanned: unmatchedLeads.length,
          summary: 'Matchmaker ran — no qualifying pairs (score < 75) found this sweep.',
        };
      }

      // ── Process matches ────────────────────────────────────────────────
      let callsTriggered = 0;
      const match_details: Array<Record<string, any>> = [];

      for (const match of matches) {
        const clientObjId = (() => {
          try { return new ObjectId(match.client_id) } catch { return null }
        })();
        if (!clientObjId) continue;

        const matchedProperty = (availableProperties as any[]).find(
          (p) => String(p._id) === match.property_id
        );

        // Update lead record with match info
        await ctx.db.updateOne('leads', { _id: clientObjId }, {
          $set: {
            qualification_status: 'matched',
            interest_level: 'warm',
            matched_property_id: match.property_id,
            match_score: match.score,
            match_rationale: match.rationale,
            notes: `[Matchmaker] Matched with ${matchedProperty?.title || match.property_id}. Score: ${match.score}. ${match.rationale}`,
            updated_at: new Date(),
          },
        });

        // Mirror into clients collection (if entry exists there)
        await ctx.db.updateOne('clients', { lead_id: clientObjId }, {
          $set: {
            status: 'matched',
            ai_match_status: 'matched',
            matched_property_id: match.property_id,
            matched_property_title: matchedProperty?.title || match.property_id,
            match_score: match.score,
            match_reason: match.rationale,
            updated_at: new Date(),
          },
        }).catch(() => {}); // Don't throw if client not found since some leads might not be linked to clients in old data

        // Fetch the lead document to get phone/name for voice outreach
        const lead = (unmatchedLeads as any[]).find((l) => String(l._id) === match.client_id);

        if (lead?.phone) {
          const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240');
          if (await leadHasRecentOutboundCall(clientObjId, cooldownMins)) {
            await ctx.act('cooldown_skip', `Skipping outbound call for ${lead.name || match.client_id}`, {
              parameters: {
                lead_id: clientObjId.toString(),
                reason: `Lead contacted within ${cooldownMins}m cooldown window`,
              },
            });
            match_details.push({
              client_id: match.client_id,
              property_id: match.property_id,
              score: match.score,
              status: 'cooldown_skipped',
              reason: `Lead contacted within ${cooldownMins}m cooldown window`,
            });
            continue;
          }

          const lockAcquired = await tryAcquireLeadLock(clientObjId, 'matchmaker', 'Executing matchmaker call')
          if (!lockAcquired) {
            await ctx.act('matchmaker_skip', `Skipping matchmaker call for ${lead.name} due to lock conflict`, {
              parameters: { lead_id: clientObjId.toString() },
            });
            match_details.push({
              client_id: match.client_id,
              property_id: match.property_id,
              score: match.score,
              status: 'cron_lock_conflict_skipped',
              reason: 'cron_lock_conflict',
            });
            continue;
          }

          const voiceResult = process.env.IMMEDIATE_CALL_AFTER_MATCH === "true"
            ? await ctx.voice.triggerCampaignCall(
            {
              phone: lead.phone,
              name: lead.name,
              budget_range: lead.budget_range,
              location_pref: lead.location_pref,
              property_type: lead.property_type,
              notes: lead.notes,
            },
            {
              campaign_name: 'Matchmaker Outbound',
              script_template: `We found a property that closely matches what you're looking for — ${matchedProperty?.title || 'a great option'} in ${matchedProperty?.location || lead.location_pref}. ${match.rationale} Would you like to schedule a visit?`,
            },
            undefined, // propertiesContext
            matchedProperty // passed to inject specific variables
          ) 
          : { success: false, error: 'IMMEDIATE_CALL_AFTER_MATCH=false' };

          if (voiceResult.success) {
            await ctx.db.updateOne(
              'calls',
              { voice_call_id: voiceResult.voiceCallId || voiceResult.callId },
              {
                $set: {
                  lead_id: match.client_id,
                  lead_name: lead.name,
                  lead_phone: lead.phone,
                  agent_name: 'The Matchmaker',
                  agent_id: 'matchmaker',
                  campaign_id: 'auto-matchmaker',
                  call_type: 'match_pitch',
                  disposition: 'queued',
                  call_outcome: 'pending',
                  matched_property_id: match.property_id,
                  match_score: match.score,
                  updated_at: new Date(),
                },
              }
            );

            callsTriggered++;
            match_details.push({
              client_id: match.client_id,
              property_id: match.property_id,
              score: match.score,
              rationale: match.rationale,
              voice_call_id: voiceResult.voiceCallId || voiceResult.callId,
              room_name: voiceResult.roomName,
              status: 'called',
            });
          } else {
            match_details.push({
              client_id: match.client_id,
              property_id: match.property_id,
              score: match.score,
              status: 'match_updated_call_failed',
              error: voiceResult.error,
            });
          }
        } else {
          match_details.push({
            client_id: match.client_id,
            property_id: match.property_id,
            score: match.score,
            status: 'match_updated_no_phone',
          });
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      // ── Step 3: result_analysis ───────────────────────────────────────
      await ctx.think('result_analysis',
        `Matchmaker sweep complete. ${matches.length} pair(s) qualified (score >= 75). ${callsTriggered} voice call(s) triggered. ${matches.length - callsTriggered} updated without call (no phone or voice error).`,
        {
          confidence: 0.95,
          metadata: { matches: matches.length, calls_triggered: callsTriggered },
        }
      );

      return {
        matches_found: matches.length,
        calls_triggered: callsTriggered,
        total_leads_scanned: unmatchedLeads.length,
        match_details,
        summary: `Matched ${matches.length} client-property pair(s); triggered ${callsTriggered} voice outbound call(s).`,
      };
    },
  });
  return { runId, output };
}

export async function runMatchmakerForLead(leadId: string) {
  return runMatchmaker(leadId);
}
