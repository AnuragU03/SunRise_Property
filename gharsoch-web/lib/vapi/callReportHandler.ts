import type { AgentRunContext } from '@/lib/runAgent'
import { getCollection } from '@/lib/mongodb'
import { callInsightAgentService } from '@/lib/services/callInsightAgentService'

function extractTranscript(payload: any) {
  const msg = payload?.message || payload || {}
  return (
    msg?.transcript ||
    msg?.artifact?.transcript ||
    msg?.call?.artifact?.transcript ||
    msg?.endOfCallReport?.transcript ||
    payload?.transcript ||
    payload?.artifact?.transcript ||
    ''
  )
}

function extractRecordingUrl(payload: any) {
  const msg = payload?.message || payload || {}
  return (
    msg?.recordingUrl ||
    msg?.recording_url ||
    msg?.artifact?.recordingUrl ||
    msg?.artifact?.recording_url ||
    msg?.call?.artifact?.recordingUrl ||
    msg?.call?.artifact?.recording_url ||
    msg?.endOfCallReport?.recordingUrl ||
    msg?.endOfCallReport?.recording_url ||
    payload?.recording_url ||
    payload?.recordingUrl ||
    payload?.artifact?.recordingUrl ||
    null
  )
}

function extractCallData(payload: any) {
  const msg = payload?.message || payload || {}
  const call = msg?.call || payload?.call || {}
  const startedAt = msg?.startedAt || payload?.startedAt || call?.startedAt
  const endedAt = msg?.endedAt || payload?.endedAt || call?.endedAt
  const computedDuration =
    startedAt && endedAt
      ? Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000))
      : 0

  return {
    callId: msg?.callId || call?.id || payload?.callId || '',
    assistantId: call?.assistantId || msg?.assistantId || payload?.assistantId || '',
    customerPhone:
      call?.customer?.number ||
      msg?.customer?.number ||
      payload?.customer?.number ||
      '',
    customerName:
      call?.customer?.name ||
      msg?.customer?.name ||
      payload?.customer?.name ||
      '',
    duration: call?.duration || msg?.duration || payload?.duration || computedDuration,
    endedReason: msg?.endedReason || msg?.ended_reason || call?.endedReason || payload?.endedReason || 'unknown',
    vapiSummary: msg?.analysis?.summary || payload?.analysis?.summary || call?.analysis?.summary || '',
    vapiSuccess: msg?.analysis?.successEvaluation || payload?.analysis?.successEvaluation || call?.analysis?.successEvaluation || '',
  }
}

function scheduleRecordingFallback(callId: string) {
  if (!callId || !process.env.VAPI_API_KEY) {
    return
  }

  setTimeout(async () => {
    try {
      const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
      })

      if (!res.ok) {
        console.error('[VAPI WEBHOOK] Async recording fetch failed:', res.status, res.statusText)
        return
      }

      const data = await res.json()
      const recordingUrl =
        data?.recordingUrl ||
        data?.recording_url ||
        data?.artifact?.recordingUrl ||
        data?.artifact?.recording_url ||
        data?.call?.artifact?.recordingUrl ||
        data?.call?.artifact?.recording_url

      if (recordingUrl) {
        const calls = await getCollection('calls')
        await calls.updateOne(
          { vapi_call_id: callId },
          { $set: { recording_url: recordingUrl, updated_at: new Date() } }
        )
      }
    } catch (err: any) {
      console.error('[VAPI WEBHOOK] Async recording fetch failed:', err?.message || err)
    }
  }, 60_000)
}

export async function handleEndOfCallReport(payload: any, ctx: AgentRunContext) {
  const transcript = extractTranscript(payload)
  const recordingUrl = extractRecordingUrl(payload)
  const { callId, assistantId, customerPhone, customerName, duration, endedReason, vapiSummary, vapiSuccess } = extractCallData(payload)

  await ctx.think(
    'evaluation',
    `Persisting end-of-call report for ${callId || 'unknown_call'} with transcript length ${transcript.length}.`
  )

  const calls = await ctx.db.findMany('calls', callId ? { vapi_call_id: callId } : { _id: null })
  const existingCall = calls[0] || null
  const leads = await ctx.db.findMany('leads', customerPhone ? { phone: customerPhone } : { _id: null })
  const lead = leads[0] || null

  // G2: Webhook coexistence logic
  // If the log_call_outcome tool explicitly set the outcome, DO NOT overwrite it with Vapi's generic analysis
  const toolLogged = existingCall?.tool_outcome_logged === true
  
  // Convert boolean/string Vapi success evaluation to our outcome string
  let inferredOutcome = existingCall?.call_outcome || ''
  if (!inferredOutcome && vapiSuccess !== '') {
    inferredOutcome = (String(vapiSuccess).toLowerCase() === 'true') ? 'answered' : 'unanswered'
  }

  const outcomeToSave = toolLogged ? existingCall?.call_outcome : inferredOutcome
  const summaryToSave = toolLogged ? existingCall?.call_summary : (existingCall?.call_summary || vapiSummary || '')

  const callRecord = {
    lead_id: lead?._id?.toString?.() || '',
    lead_name: lead?.name || customerName || '',
    lead_phone: customerPhone,
    agent_name: 'Voice Orchestrator',
    agent_id: assistantId || '',
    campaign_id: existingCall?.campaign_id || '',
    direction: existingCall?.direction || 'outbound',
    call_type: existingCall?.call_type || 'voice_tool_call',
    duration,
    disposition: existingCall?.disposition || '',
    call_outcome: outcomeToSave,
    call_summary: summaryToSave,
    customer_availability: existingCall?.customer_availability || '',
    preferred_callback_time: existingCall?.preferred_callback_time || '',
    preferred_callback_days: existingCall?.preferred_callback_days || [],
    customer_interest_level: existingCall?.customer_interest_level || '',
    follow_up_required: existingCall?.follow_up_required || false,
    follow_up_date: existingCall?.follow_up_date || null,
    follow_up_notes: existingCall?.follow_up_notes || '',
    key_requirements: existingCall?.key_requirements || '',
    customer_objections: existingCall?.customer_objections || '',
    next_steps: existingCall?.next_steps || '',
    recording_url: recordingUrl || existingCall?.recording_url || '',
    transcript,
    trai_compliant: true,
    status: 'ended',
    call_status: 'completed',
    vapi_call_id: callId,
    ended_reason: endedReason,
    updated_at: new Date(),
  }

  if (existingCall?._id) {
    await ctx.db.updateOne('calls', { _id: existingCall._id }, { $set: callRecord })
  } else {
    await ctx.db.insertOne('calls', {
      ...callRecord,
      created_at: new Date(),
    })
  }

  if (lead?._id) {
    await ctx.db.updateOne(
      'leads',
      { _id: lead._id },
      { $set: { last_contacted_at: new Date(), updated_at: new Date() } }
    )
  }

  if (!recordingUrl && callId) {
    scheduleRecordingFallback(callId)
  }

  await ctx.act('call_report_saved', `Saved end-of-call report for ${callId || customerPhone || 'unknown_call'}`, {
    parameters: { call_id: callId, customer_phone: customerPhone },
    result: {
      updated_existing_call: Boolean(existingCall?._id),
      transcript_length: transcript.length,
      recording_url_found: Boolean(recordingUrl),
      duration,
      ended_reason: endedReason,
    },
  })

  // Fire and forget auto-analysis
  if (transcript && !existingCall?.analyzed_at) {
    let targetId = existingCall?._id?.toString?.()
    if (!targetId && callId) {
      const updatedCall = await ctx.db.findOne('calls', { vapi_call_id: callId })
      targetId = updatedCall?._id?.toString?.()
    }

    if (targetId) {
      // Canary log — confirms auto-analyze was attempted (queryable from Atlas)
      const execLogs = await getCollection('agent_execution_logs')
      await execLogs.insertOne({
        agent_name: 'auto_analyze_trigger',
        call_id: targetId,
        lead_id: existingCall?.lead_id || '',
        broker_id: existingCall?.broker_id || '',
        message: 'Auto-analyze triggered after end-of-call-report',
        metadata: {
          has_transcript: true,
          transcript_length: transcript.length,
          already_analyzed: false,
        },
        created_at: new Date(),
      })

      callInsightAgentService.analyzeCall(targetId)
        .then(() => console.log(`[webhook] Auto-analyze completed for call ${targetId}`))
        .catch(async (err) => {
          console.error(`[webhook] Auto-analyze failed for call ${targetId}:`, err.message)
          try {
            await execLogs.insertOne({
              agent_name: 'auto_analyze_error',
              call_id: targetId,
              message: `Auto-analyze threw: ${err.message}`,
              metadata: { error: err.message, stack: err.stack?.slice(0, 500) },
              created_at: new Date(),
            })
          } catch { /* best effort */ }
        })
    }
  }

  // G7: if this was a re-engage call, record the attempt in lead history
  const callType = existingCall?.call_type || ''
  const callPurpose = existingCall?.metadata?.call_purpose
    || existingCall?.assistantOverrides?.variableValues?.call_purpose
    || ''
  if ((callType === 'reengage' || callPurpose === 'reengage') && existingCall?.lead_id) {
    try {
      const { recordReengageAttempt } = await import('@/lib/services/reengagerService')
      await recordReengageAttempt({
        lead_id: String(existingCall.lead_id),
        call_id: existingCall._id?.toString?.() || callId,
        outcome: existingCall.call_outcome || existingCall.disposition || 'completed',
        visit_type_at_attempt: existingCall.metadata?.visit_type
          || existingCall.assistantOverrides?.variableValues?.visit_type
          || 'unknown',
      })
      console.log(`[webhook] Recorded re-engage attempt for lead ${existingCall.lead_id}`)
    } catch (err: any) {
      console.error('[webhook] Failed to record re-engage attempt:', err.message)
    }
  }

  return {
    success: true,
    message: 'Call report processed',
    callId,
  }
}
