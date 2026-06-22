import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import OpenAI from 'openai'
import { getAgentConfig } from '@/lib/agentRegistry'
import { authErrorResponse, requireRole } from '@/lib/auth'
import { runAgent } from '@/lib/runAgent'
import { getCallDetails } from '@/lib/voiceRuntime'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

function isVoiceRuntimeConfigured() {
  return Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET)
}

async function fetchVoiceRoomDetails(roomName: string) {
  if (!roomName || !isVoiceRuntimeConfigured()) return null

  try {
    return await getCallDetails(roomName)
  } catch (err) {
    console.error(`[CallSync] Voice room fetch error for ${roomName}:`, err)
    return null
  }
}

async function analyzeTranscript(transcript: string) {
  if (!transcript || !process.env.OPENAI_API_KEY) return {}

  try {
    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a post-call analyst for a real estate brokerage. Extract structured data from the call transcript. Return JSON with these fields:
          - call_summary: 2-3 sentence summary of the conversation
          - disposition: one of [interested, not_interested, callback, voicemail, no_answer, wrong_number, busy]
          - call_outcome: one of [appointment_booked, follow_up_needed, qualified, disqualified, dnc_requested, information_shared, no_outcome]
          - customer_interest_level: one of [hot, warm, cold, not_interested]
          - key_requirements: what the customer wants (string)
          - customer_objections: any objections raised (string)
          - follow_up_required: boolean
          - follow_up_notes: if follow-up needed, what should happen (string)
          - next_steps: recommended next action (string)`,
        },
        { role: 'user', content: `Transcript:\n${transcript}` },
      ],
      response_format: { type: 'json_object' },
    })

    return JSON.parse(extraction.choices[0].message.content || '{}')
  } catch (err) {
    console.error('[CallSync] GPT extraction error:', err)
    return {}
  }
}

async function runCallStateValidation(callData: any, leadState: any) {
  const agentConfig = getAgentConfig('69e8f70b1234567890abcde0')
  if (!agentConfig) {
    throw new Error('State Validator agent not found')
  }

  const { runId, output } = await runAgent({
    agentId: agentConfig.id,
    agentName: agentConfig.name,
    trigger: 'event',
    input: { call_data: callData, lead_state: leadState },
    metadata: { model: agentConfig.model, provider: agentConfig.provider },
    handler: async (ctx, input) => {
      const validationPrompt = `
Please validate the following call outcome against the current lead state.

CALL DATA:
- Disposition: ${callData.disposition || 'unknown'}
- Call Outcome: ${callData.call_outcome || 'unknown'}
- Customer Interest Level: ${callData.customer_interest_level || 'unknown'}
- Follow-up Required: ${callData.follow_up_required !== undefined ? callData.follow_up_required : 'unknown'}

LEAD STATE:
- Status: ${leadState.status || 'unknown'}
- Qualification Status: ${leadState.qualification_status || 'unknown'}
- Interest Level: ${leadState.interest_level || 'unknown'}
- Follow-up Required: ${leadState.follow_up_required !== undefined ? leadState.follow_up_required : 'unknown'}

Check for conflicts and inconsistencies. Return validation results.`

      await ctx.think(
        'evaluation',
        'Analyzing call outcome and lead state for consistency',
        { confidence: 1.0 }
      )

      const { content: responseContent } = await ctx.openai.chat({
        model: agentConfig.model || 'gpt-4o',
        messages: [
          { role: 'system', content: agentConfig.systemPrompt },
          { role: 'user', content: validationPrompt },
        ],
        response_format: { type: 'json_object' },
      })

      let validationResult: any = {}
      try {
        validationResult = JSON.parse(responseContent || '{}')
      } catch {
        validationResult = { text: responseContent }
      }

      await ctx.think(
        'result_analysis',
        `Validation complete: status=${validationResult?.validation_status}, issues found=${validationResult?.issues?.length || 0}`,
        { confidence: 0.95 }
      )

      const validationRecord = {
        lead_id: input.call_data.lead_id,
        previous_state: input.lead_state,
        new_state: input.lead_state,
        trigger: {
          type: 'call_sync',
          agent_name: agentConfig.name,
          call_id: input.call_data._id || input.call_data.voice_call_id || input.call_data.room_name,
        },
        validation: {
          validator_agent_run_id: ctx.runId,
          status: validationResult?.validation_status || 'valid',
          issues: validationResult?.issues || [],
          corrections_applied: validationResult?.recommended_corrections || {},
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const insertRes = await ctx.db.insertOne('lead_state_history', validationRecord)
      await ctx.act('database_insert', 'State validation record saved', {
        result: { collection: 'lead_state_history', inserted_id: insertRes.insertedId },
      })

      return {
        run_id: ctx.runId,
        validation_status: validationResult?.validation_status || 'valid',
        issues: validationResult?.issues || [],
        recommended_corrections: validationResult?.recommended_corrections || {},
        confidence: validationResult?.confidence || 0.8,
        reasoning: validationResult?.reasoning || '',
      }
    },
  })

  return { runId, output }
}

function buildTranscriptFromMessages(messages: any[]): string {
  if (!Array.isArray(messages)) return ''
  return messages
    .filter((m: any) => m.role && (m.message || m.text || m.content))
    .map((m: any) => `${m.role === 'assistant' ? 'Agent' : 'Customer'}: ${m.message || m.text || m.content}`)
    .join('\n')
}

function getVoiceRoomIdentity(call: any): string {
  return call.room_name || call.voice_call_id || call.live_session_id || ''
}

function buildPendingFilter(body: any) {
  if (body.callId) {
    return {
      $or: [
        { voice_call_id: body.callId },
        { room_name: body.callId },
        { live_session_id: body.callId },
      ],
    }
  }

  return {
    call_status: { $in: ['in-progress', 'queued', 'ringing', 'dialing', 'room_created', 'initiated'] },
    $or: [
      { voice_call_id: { $exists: true, $ne: '' } },
      { room_name: { $exists: true, $ne: '' } },
      { live_session_id: { $exists: true, $ne: '' } },
    ],
  }
}

function buildNoTranscriptOutcome(call: any) {
  const endedReason = call.ended_reason || call.voice_error || call.failure_reason || call.call_status || 'unknown'

  if (String(endedReason).includes('no-answer') || String(endedReason).includes('busy') || String(endedReason).includes('did-not-answer')) {
    return {
      disposition: 'no_answer',
      call_outcome: 'no_outcome',
      call_summary: `Call was not answered. Reason: ${endedReason}`,
      customer_interest_level: '',
    }
  }

  if (String(endedReason).includes('voicemail')) {
    return {
      disposition: 'voicemail',
      call_outcome: 'no_outcome',
      call_summary: 'Call went to voicemail.',
      customer_interest_level: '',
    }
  }

  return {
    disposition: call.disposition || 'unknown',
    call_outcome: call.call_outcome || 'no_outcome',
    call_summary: call.call_summary || `Voice room ended. Reason: ${endedReason}`,
    customer_interest_level: call.customer_interest_level || '',
  }
}

/**
 * POST /api/calls/sync
 * Syncs in-progress voice calls with LiveKit room state and stored call artifacts.
 * Can also sync a single call by passing { callId: "..." } in the body.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])

    let body: any = {}
    try {
      body = await request.json()
    } catch {}

    const calls = await getCollection('calls')
    const leads = await getCollection('leads')
    const pendingCalls = await calls.find(buildPendingFilter(body)).toArray()

    if (pendingCalls.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No pending calls to sync' })
    }

    let syncedCount = 0
    const results: any[] = []

    for (const call of pendingCalls) {
      const roomName = getVoiceRoomIdentity(call)

      if (!roomName) {
        results.push({ id: call._id.toString(), status: 'skipped', reason: 'no_voice_room_identity' })
        continue
      }

      if (!isVoiceRuntimeConfigured()) {
        results.push({ id: call._id.toString(), status: 'skipped', reason: 'voice_runtime_not_configured', roomName })
        continue
      }

      const activeRoom = await fetchVoiceRoomDetails(roomName)
      if (activeRoom) {
        await calls.updateOne(
          { _id: call._id },
          {
            $set: {
              call_status: 'in-progress',
              status: 'in-progress',
              voice_status: 'active',
              room_name: roomName,
              live_session_id: (activeRoom as any).sid || call.live_session_id || '',
              updated_at: new Date(),
            },
          }
        )
        results.push({ id: call._id.toString(), status: 'still_active', roomName })
        continue
      }

      const rawTranscript =
        call.transcript ||
        buildTranscriptFromMessages(call.messages || call.artifact?.messages || []) ||
        ''
      const recordingUrl = call.recording_url || call.recordingUrl || ''
      const duration = call.ended_at && call.started_at
        ? Math.round((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
        : call.duration || 0

      let extractedData: any = {}
      if (rawTranscript && rawTranscript.length > 20) {
        extractedData = call.call_summary && call.disposition
          ? {
              call_summary: call.call_summary || '',
              disposition: call.disposition || '',
              call_outcome: call.call_outcome || '',
              customer_interest_level: call.customer_interest_level || '',
              key_requirements: call.key_requirements || '',
              customer_objections: call.customer_objections || '',
              follow_up_required: call.follow_up_required || false,
              follow_up_notes: call.follow_up_notes || '',
              next_steps: call.next_steps || '',
            }
          : await analyzeTranscript(rawTranscript)
      } else {
        extractedData = buildNoTranscriptOutcome(call)
      }

      const updateData: Record<string, any> = {
        call_status: 'completed',
        status: 'completed',
        voice_status: 'completed',
        room_name: roomName,
        duration,
        recording_url: recordingUrl || call.recording_url || '',
        transcript: rawTranscript || call.transcript || '',
        disposition: extractedData.disposition || call.disposition || '',
        call_outcome: extractedData.call_outcome || call.call_outcome || '',
        call_summary: extractedData.call_summary || call.call_summary || '',
        customer_interest_level: extractedData.customer_interest_level || call.customer_interest_level || '',
        key_requirements: extractedData.key_requirements || call.key_requirements || '',
        customer_objections: extractedData.customer_objections || call.customer_objections || '',
        follow_up_required: extractedData.follow_up_required || call.follow_up_required || false,
        follow_up_notes: extractedData.follow_up_notes || call.follow_up_notes || '',
        next_steps: extractedData.next_steps || call.next_steps || '',
        updated_at: new Date(),
      }

      if (extractedData.follow_up_required) {
        updateData.follow_up_date = new Date(Date.now() + 86400000)
      }

      await calls.updateOne({ _id: call._id }, { $set: updateData })

      let updatedLead: any = null
      if (call.lead_phone && extractedData.customer_interest_level) {
        const leadUpdate: Record<string, any> = {
          interest_level: extractedData.customer_interest_level,
          updated_at: new Date(),
          last_contacted_at: new Date(),
          first_call_completed: true,
        }

        if (extractedData.customer_interest_level === 'hot') {
          leadUpdate.qualification_status = 'qualified'
          leadUpdate.lead_score = 80
        } else if (extractedData.customer_interest_level === 'warm') {
          leadUpdate.qualification_status = 'qualified'
          leadUpdate.lead_score = 50
        }

        if (extractedData.follow_up_required) {
          leadUpdate.next_follow_up_date = new Date(Date.now() + 86400000)
          leadUpdate.status = 'follow_up'
        }

        if (extractedData.customer_objections) {
          leadUpdate.objections = extractedData.customer_objections
        }

        await leads.updateOne({ phone: call.lead_phone }, { $set: leadUpdate })
        updatedLead = await leads.findOne({ phone: call.lead_phone })
      }

      try {
        if (updatedLead) {
          const { output } = await runCallStateValidation(
            {
              _id: call._id.toString(),
              voice_call_id: call.voice_call_id,
              room_name: roomName,
              lead_id: call.lead_id,
              disposition: extractedData.disposition,
              call_outcome: extractedData.call_outcome,
              customer_interest_level: extractedData.customer_interest_level,
              follow_up_required: extractedData.follow_up_required,
            },
            {
              status: updatedLead.status,
              qualification_status: updatedLead.qualification_status,
              interest_level: updatedLead.interest_level,
              follow_up_required: updatedLead.follow_up_required,
            }
          )

          await calls.updateOne(
            { _id: call._id },
            {
              $set: {
                validator_status: output?.validation_status || 'valid',
                validator_run_id: output?.run_id,
              },
            }
          )
        }
      } catch (validationError) {
        console.error('[CallSync] State validation error (non-blocking):', validationError)
      }

      syncedCount++
      results.push({
        id: call._id.toString(),
        status: 'synced',
        roomName,
        disposition: extractedData.disposition,
        hasSummary: Boolean(extractedData.call_summary),
        hasTranscript: Boolean(rawTranscript),
        duration,
      })
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      total: pendingCalls.length,
      results,
    })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[CallSync] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
