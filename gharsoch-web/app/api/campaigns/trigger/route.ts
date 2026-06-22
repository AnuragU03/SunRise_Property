import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { triggerCampaignCall } from '@/lib/voiceRuntime'
import { authErrorResponse, requireRole } from '@/lib/auth'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { auth } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    const session = await auth()
    
    let brokerId: string;
    try {
      brokerId = requireBrokerId(session);
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) {
        return NextResponse.json(
          { error: "broker_scope_missing", message: "Your account is not provisioned for a brokerage. Contact admin." },
          { status: 403 }
        );
      }
      throw e;
    }
    // Phase 11.5: verify campaign/lead belongs to session.user.brokerage_id.
    const data = await request.json()
    const { campaignId, leadId } = data

    // Single lead trigger
    if (leadId) {
      const leads = await getCollection('leads')
      const lead = await leads.findOne({ _id: new ObjectId(leadId), is_deleted: { $ne: true } })

      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
      }

      if (lead.dnd_status) {
        return NextResponse.json({ success: false, error: 'Lead is on DNC list' }, { status: 403 })
      }

      const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
      if (await leadHasRecentOutboundCall(lead._id, cooldownMins)) {
        // Log failed call due to cooldown
        const calls = await getCollection('calls')
        await calls.insertOne({
          lead_id: lead._id.toString(),
          broker_id: brokerId,
          lead_phone: lead.phone,
          status: 'failed',
          call_status: 'failed',
          failure_reason: 'cooldown_blocked',
          direction: 'outbound',
          call_type: 'broker_initiated',
          created_at: new Date(),
          updated_at: new Date(),
        })

        return NextResponse.json({
          success: false,
          error: 'cooldown',
          message: `Lead contacted within ${cooldownMins}m cooldown window`,
          lead_id: lead._id.toString(),
        }, { status: 429 })
      }

      // Fetch premium properties for this lead's city to inject into voice context.
      const properties = await getCollection('properties')
      const matchingProperties = await properties.find({ 
        is_deleted: { $ne: true },
        city: { $regex: new RegExp(`^${lead.place || 'Ahmedabad'}$`, 'i') },
        status: 'available' 
      }).limit(5).toArray()

      const propertiesContext = matchingProperties.map(p => 
        `- ${p.title} by ${p.builder}: ${p.type} in ${p.location}, ₹${(p.price/100000).toFixed(2)} Lakhs, ${p.area_sqft} sqft. Amenities: ${p.amenities.slice(0, 3).join(', ')}.`
      ).join('\n')

      const result = await triggerCampaignCall({
        _id: lead._id.toString(),
        phone: lead.phone,
        name: lead.name,
        budget_range: lead.budget_range,
        location_pref: lead.location_pref,
        property_type: lead.property_type,
        notes: lead.notes,
      }, undefined, propertiesContext)

      if (!result.success) {
        // Log failed call due to voice runtime/network error.
        const calls = await getCollection('calls')
        const voiceCallId = result.voiceCallId || result.callId
        if (voiceCallId) {
          await calls.updateOne(
            { voice_call_id: voiceCallId },
            {
              $set: {
                lead_id: lead._id.toString(),
                broker_id: brokerId,
                lead_phone: lead.phone,
                status: 'failed',
                call_status: 'failed',
                voice_status: result.status || 'failed',
                failure_reason: result.error || 'voice_transport_error',
                direction: 'outbound',
                call_type: 'broker_initiated',
                updated_at: new Date(),
              },
            }
          )
        } else {
          await calls.insertOne({
            lead_id: lead._id.toString(),
            broker_id: brokerId,
            lead_phone: lead.phone,
            status: 'failed',
            call_status: 'failed',
            failure_reason: result.error || 'voice_transport_error',
            direction: 'outbound',
            call_type: 'broker_initiated',
            created_at: new Date(),
            updated_at: new Date(),
          })
        }

        return NextResponse.json({ success: false, error: result.error }, { status: 502 })
      }

      // Update lead's last contacted timestamp
      await leads.updateOne(
        { _id: new ObjectId(leadId) },
        { $set: { last_contacted_at: new Date(), updated_at: new Date() }, $inc: { total_calls: 1 } }
      )

      // The voice runtime already created the initial call log; enrich it for the UI.
      const calls = await getCollection('calls')
      const voiceCallId = result.voiceCallId || result.callId
      if (voiceCallId) {
        await calls.updateOne(
          { voice_call_id: voiceCallId },
          {
            $set: {
              lead_id: lead._id.toString(),
              lead_name: lead.name || '',
              lead_phone: lead.phone,
              broker_id: brokerId,
              agent_name: 'GharSoch AI',
              agent_id: 'manual_broker_override',
              campaign_id: '',
              direction: 'outbound',
              call_type: 'broker_initiated',
              call_status: 'in-progress',
              status: 'in-progress',
              voice_status: result.status || 'dialing',
              voice_call_id: voiceCallId,
              room_name: result.roomName || voiceCallId,
              updated_at: new Date(),
            },
          }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Call triggered',
        callId: voiceCallId,
        voice_call_id: voiceCallId,
        room_name: result.roomName,
      })
    }

    // Campaign bulk trigger
    if (campaignId) {
      const campaigns = await getCollection('campaigns')
      const campaign = await campaigns.findOne({ _id: new ObjectId(campaignId) })

      if (!campaign) {
        return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
      }

      const leads = await getCollection('leads')
      const targetLeads = await leads.find({
        _id: { $in: campaign.target_lead_ids.map((id: string) => new ObjectId(id)) },
        dnd_status: { $ne: true },
        is_deleted: { $ne: true },
      }).toArray()

      if (targetLeads.length === 0) {
        return NextResponse.json({ success: false, error: 'No eligible leads found' }, { status: 400 })
      }

      // Update campaign status
      await campaigns.updateOne(
        { _id: new ObjectId(campaignId) },
        { $set: { status: 'active', updated_at: new Date() } }
      )

      const results: { leadId: string; success: boolean; callId?: string; voiceCallId?: string; roomName?: string; error?: string }[] = []
      const cooldownSkips: { lead_id: string; reason: string }[] = []
      const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
      const propertiesColl = await getCollection('properties')
      const callsCol = await getCollection('calls')

      for (const lead of targetLeads) {
        if (await leadHasRecentOutboundCall(lead._id, cooldownMins)) {
          cooldownSkips.push({
            lead_id: lead._id.toString(),
            reason: `Lead contacted within ${cooldownMins}m cooldown window`,
          })
          
          await callsCol.insertOne({
            lead_id: lead._id.toString(),
            broker_id: brokerId,
            lead_phone: lead.phone,
            status: 'failed',
            call_status: 'failed',
            failure_reason: 'cooldown_blocked',
            direction: 'outbound',
            call_type: 'campaign',
            created_at: new Date(),
            updated_at: new Date(),
          })
          
          continue
        }

        // Fetch premium properties for this lead's city to inject into voice context.
        const matchingProperties = await propertiesColl.find({ 
          is_deleted: { $ne: true },
          city: { $regex: new RegExp(`^${lead.place || 'Ahmedabad'}$`, 'i') },
          status: 'available' 
        }).limit(5).toArray()

        const propertiesContext = matchingProperties.map(p => 
          `- ${p.title} by ${p.builder}: ${p.type} in ${p.location}, ₹${(p.price/100000).toFixed(2)} Lakhs, ${p.area_sqft} sqft. Amenities: ${p.amenities.slice(0, 3).join(', ')}.`
        ).join('\n')

        const result = await triggerCampaignCall(
          {
            _id: lead._id.toString(),
            phone: lead.phone,
            name: lead.name,
            budget_range: lead.budget_range,
            location_pref: lead.location_pref,
            property_type: lead.property_type,
            notes: lead.notes,
          },
          {
            _id: campaign._id.toString(),
            campaign_id: campaign._id.toString(),
            campaign_name: campaign.name,
            script_template: campaign.script_template,
          },
          propertiesContext
        )

        if (!result.success) {
          const voiceCallId = result.voiceCallId || result.callId
          if (voiceCallId) {
            await callsCol.updateOne(
              { voice_call_id: voiceCallId },
              {
                $set: {
                  lead_id: lead._id.toString(),
                  broker_id: brokerId,
                  lead_phone: lead.phone,
                  campaign_id: campaign._id.toString(),
                  status: 'failed',
                  call_status: 'failed',
                  voice_status: result.status || 'failed',
                  failure_reason: result.error || 'voice_transport_error',
                  direction: 'outbound',
                  call_type: 'campaign',
                  updated_at: new Date(),
                },
              }
            )
          } else {
            await callsCol.insertOne({
              lead_id: lead._id.toString(),
              broker_id: brokerId,
              lead_phone: lead.phone,
              status: 'failed',
              call_status: 'failed',
              failure_reason: result.error || 'voice_transport_error',
              direction: 'outbound',
              call_type: 'campaign',
              created_at: new Date(),
              updated_at: new Date(),
            })
          }
        }

        results.push({
          leadId: lead._id.toString(),
          success: result.success,
          callId: result.voiceCallId || result.callId,
          voiceCallId: result.voiceCallId || result.callId,
          roomName: result.roomName,
          error: result.error,
        })

        if (result.success) {
          await leads.updateOne(
            { _id: lead._id },
            { $set: { last_contacted_at: new Date(), updated_at: new Date() }, $inc: { total_calls: 1 } }
          )

          const voiceCallId = result.voiceCallId || result.callId
          if (voiceCallId) {
            try {
              await callsCol.updateOne(
                { voice_call_id: voiceCallId },
                {
                  $set: {
                    lead_id: lead._id.toString(),
                    lead_name: lead.name || '',
                    lead_phone: lead.phone,
                    broker_id: brokerId,
                    direction: 'outbound',
                    status: 'initiated',
                    call_status: 'initiated',
                    voice_status: result.status || 'dialing',
                    customer_number: lead.phone,
                    agent_name: 'Campaign Conductor',
                    campaign_id: campaign._id.toString(),
                    triggered_by: 'campaign_bulk',
                    voice_call_id: voiceCallId,
                    room_name: result.roomName || voiceCallId,
                    updated_at: new Date(),
                  },
                }
              )
            } catch (err) {
              console.error(
                '[CAMPAIGNS BULK] Failed to log call to calls collection:',
                (err as Error).message,
                'lead_id:',
                lead._id.toString(),
                'voice_call_id:',
                voiceCallId
              )
            }
          }
        }

        // 2 second delay between calls to avoid carrier throttling
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const successCount = results.filter(r => r.success).length
      await campaigns.updateOne(
        { _id: new ObjectId(campaignId) },
        { $inc: { calls_made: successCount }, $set: { updated_at: new Date() } }
      )

      return NextResponse.json({
        success: true,
        message: `${successCount}/${targetLeads.length} calls triggered`,
        dialed: successCount,
        skipped: cooldownSkips.length,
        cooldown_skips: cooldownSkips,
        results,
      })
    }

    return NextResponse.json({ success: false, error: 'leadId or campaignId is required' }, { status: 400 })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[Campaign Trigger] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
