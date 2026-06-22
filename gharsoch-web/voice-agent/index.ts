/**
 * index.ts — GharSoch voice agent worker entrypoint (TS port of entrypoint.py + run_agent.py).
 *
 * Pipeline: Silero VAD → Sarvam Saaras STT → GPT-4o-mini (or Sarvam LLM) → Sarvam Bulbul TTS.
 * Runs as a separate process IN THIS REPO and imports GharSoch services directly:
 *   npx tsx voice-agent/index.ts dev
 *
 * GharSoch's lib/voiceRuntime.ts creates the room (metadata = customer/call context) and
 * dials the SIP participant; this worker auto-dispatches into managed rooms, talks, and
 * writes transcripts/outcomes straight into Mongo via the shared service layer.
 */
import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  stt as agentsStt,
  tts as agentsTts,
  tokenize,
  voice,
} from '@livekit/agents'
import * as openai from '@livekit/agents-plugin-openai'
import * as silero from '@livekit/agents-plugin-silero'
import { SarvamSTT } from './sarvam/stt'
import { SarvamTTS } from './sarvam/tts'
import { buildTools, type ToolDeps } from './agent'
import { buildSystemPrompt, type CallType } from './prompt'
import {
  AGENT_GOODBYE_PHRASES,
  CONVERSATION_INACTIVITY_TIMEOUT_SECONDS,
  CUSTOMER_GOODBYE_PHRASES,
  DEFAULT_LANGUAGE,
  GREETING_TEXTS,
  INACTIVITY_WATCHDOG_INTERVAL_SECONDS,
  INBOUND_GREETING_KNOWN_TEXTS,
  INBOUND_GREETING_TEXTS,
  MANAGED_ROOM_PREFIXES,
  MAX_CALL_DURATION_SECONDS,
  SILENCE_PROMPTS,
  USER_AWAY_TIMEOUT_SECONDS,
  WRAPUP_PROMPTS,
} from './constants'
import { appendTranscript, finalizeCall, getCustomerMemory, markCallActive, saveTranscriptToFile } from './callLog'
import { INBOUND_ROOM_PREFIX, prepareInboundCall } from './inbound'
import { CallRecorder } from './recorder'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// A transient DB/API hiccup must never kill the whole worker (it can be serving live calls).
process.on('unhandledRejection', (reason) => {
  console.error('[voice-agent] unhandled rejection (worker kept alive):', (reason as Error)?.message || reason)
})

function resolveCallType(metadata: Record<string, any>): CallType {
  const raw = String(metadata.call_purpose || metadata.call_type || 'outbound').toLowerCase()
  if (raw.includes('inbound')) return 'inbound'
  if (raw.includes('reengage') || raw.includes('re_engage') || raw.includes('re-engage')) return 'reengage'
  if (raw.includes('reminder')) return 'appointment_reminder'
  if (raw.includes('callback') || raw.includes('follow')) return 'follow_up_callback'
  if (raw.includes('campaign')) return 'campaign'
  if (raw.includes('match')) return 'matchmaker'
  return 'outbound'
}

function stringVars(metadata: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(metadata)) {
    if (typeof v === 'string' || typeof v === 'number') out[k] = String(v)
  }
  // Aliases the prompt objectives reference
  out.matched_property = out.matched_property || out.property_title || out.last_visit_property || 'a matching property'
  out.prior_topic = out.prior_topic || 'your property requirements'

  // ── Corpus-playbook composites (degrade gracefully when data is missing) ──
  out.min_carpet_note = out.min_carpet_sqft ? `, carpet above ${out.min_carpet_sqft} sq ft` : ''
  out.objection_history = out.objection_history || 'none recorded — listen for new ones'
  out.seller_urgency = out.seller_urgency || ''
  out.property_facing = out.property_facing || out.facing_pref || ''
  out.ask_price = out.property_ask_price || ''

  // One-line pitch like the real broker's: "title — 690 sq ft carpet, 27th floor, NE-facing, ask 195 lakhs"
  const pitchParts: string[] = []
  if (out.property_carpet_sqft) pitchParts.push(`${out.property_carpet_sqft} sq ft carpet`)
  if (out.property_floor) pitchParts.push(`${out.property_floor}th floor`)
  if (out.property_facing) pitchParts.push(`${out.property_facing}-facing`)
  if (out.property_ask_price) pitchParts.push(`asking ${out.property_ask_price}`)
  out.property_pitch = pitchParts.length
    ? `${out.matched_property} — ${pitchParts.join(', ')}`
    : `${out.matched_property} (use search_properties for specifics)`
  return out
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load()
  },

  entry: async (ctx: JobContext) => {
    await ctx.connect()

    // Warm the MongoDB connection NOW, before the conversation starts. Atlas can be
    // slow to first-connect from a home ISP; without this, the first in-call tool
    // (book_appointment / check_availability / save_conversation_summary) hits a cold
    // connection and times out mid-call. Fire-and-forget — never blocks the greeting.
    void (async () => {
      try {
        const { ensureDbConnected } = await import('@/lib/mongodb')
        const ok = await ensureDbConnected()
        console.log(`[voice-agent] DB warm-up ${ok ? 'ready' : 'FAILED (tools may time out — check Atlas Network Access)'}`)
      } catch (err) {
        console.warn('[voice-agent] DB warm-up threw:', (err as Error).message)
      }
    })()

    const roomName = ctx.room.name || ''
    if (!MANAGED_ROOM_PREFIXES.some((p) => roomName.startsWith(p))) {
      console.log(`[voice-agent] ignoring unmanaged room: ${roomName}`)
      ctx.shutdown('unmanaged room')
      return
    }

    let metadata: Record<string, any> = (() => {
      try {
        return JSON.parse(ctx.room.metadata || '{}')
      } catch {
        return {}
      }
    })()

    // ── Inbound: the dispatch rule created this room, so the brief is built here
    // (caller lookup → call doc → synthesized metadata) instead of by voiceRuntime.
    const isInbound = roomName.startsWith(INBOUND_ROOM_PREFIX)
    let inboundKnownLead = false
    if (isInbound) {
      const inbound = await prepareInboundCall(ctx, roomName)
      if (!inbound) {
        ctx.shutdown('inbound caller never joined')
        return
      }
      metadata = { ...inbound.metadata, ...metadata }
      inboundKnownLead = inbound.knownLead
    }

    const customerName = metadata.customer_name || 'Customer'
    const customerPhone = metadata.customer_phone || ''
    const preferredLanguage = metadata.language || DEFAULT_LANGUAGE
    const callType = resolveCallType(metadata)
    const voiceCallId = metadata.voice_call_id || roomName

    console.log(`[voice-agent] joining ${roomName} | ${customerName} (${customerPhone}) | type=${callType} lang=${preferredLanguage}`)

    // ── Prompt: scenario objective + real customer memory from call history ──
    // Two memory layers: recent call summaries (by phone) + cross-agent notes
    // (agent_conversations) so call N sounds like a continuation of call N-1
    // even when a different agent owned the previous dial.
    let customerMemory = await getCustomerMemory(customerPhone)
    if (metadata.lead_id) {
      try {
        const { getLeadConversationContext } = await import('@/lib/orchestrator/memory')
        const teamNotes = await getLeadConversationContext(String(metadata.lead_id))
        if (teamNotes) {
          customerMemory = customerMemory
            ? `${customerMemory}\nTeam notes:\n${teamNotes}`
            : `Team notes:\n${teamNotes}`
        }
      } catch (err) {
        console.warn('[voice-agent] team-notes fetch failed:', (err as Error).message)
      }
    }
    const brokerName = metadata.broker_name || process.env.VOICE_BROKER_NAME || 'GharSoch Advisor'
    const agencyName = metadata.agency_name || process.env.WHATSAPP_BRAND_NAME || 'GharSoch'
    const systemPrompt = buildSystemPrompt({
      customerName,
      customerPhone,
      brokerName,
      agencyName,
      officeAddress: metadata.office_address || process.env.VOICE_OFFICE_ADDRESS || 'our office',
      brokerPhone: metadata.broker_phone || process.env.VOICE_BROKER_PHONE || '',
      todayHuman:
        metadata.current_date_human_ist ||
        new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        }),
      callType,
      customerMemory,
      vars: stringVars(metadata),
    })

    // ── Voice pipeline ────────────────────────────────────────────────────
    const sarvamStt = new SarvamSTT({ languageCode: preferredLanguage === 'unknown' ? 'unknown' : preferredLanguage })
    const sarvamTts = new SarvamTTS({ targetLanguageCode: preferredLanguage })
    await sarvamTts.prewarm()

    const vad = (ctx.proc.userData.vad as silero.VAD | undefined) ?? (await silero.VAD.load())
    const sttAdapter = new agentsStt.StreamAdapter(sarvamStt, vad)
    const ttsAdapter = new agentsTts.StreamAdapter(sarvamTts, new tokenize.basic.SentenceTokenizer())

    const llmInstance =
      String(process.env.USE_SARVAM_LLM).toLowerCase() === 'true'
        ? new openai.LLM({ model: 'sarvam-30b', baseURL: 'https://api.sarvam.ai/v1', apiKey: process.env.SARVAM_API_KEY, temperature: 0.8 })
        : new openai.LLM({ model: 'gpt-4o-mini', temperature: 0.8 })

    // ── Teardown (idempotent) ─────────────────────────────────────────────
    let disconnecting = false
    let sessionRef: voice.AgentSession | null = null
    const hangup = (delaySeconds: number) => {
      if (disconnecting) return
      disconnecting = true
      void (async () => {
        await sleep(delaySeconds * 1000)
        // Wait for ALL queued speech (goodbye lines) to finish playing.
        // This is critical — without it, the customer hears the goodbye
        // cut off mid-sentence when the room is deleted.
        try {
          const session = sessionRef as any
          // Wait up to 20s for the current speech to finish
          if (session?.currentSpeech?.waitForPlayout) {
            await Promise.race([session.currentSpeech.waitForPlayout(), sleep(20_000)])
          }
          // Extra 1.5s silence after playout so the customer doesn't hear an abrupt cut
          await sleep(1500)
        } catch {
          // playout wait is best-effort
        }
        try {
          await ctx.deleteRoom()
          console.log(`[voice-agent] room deleted: ${roomName}`)
        } catch (err) {
          console.warn('[voice-agent] deleteRoom failed:', (err as Error).message)
        }
        ctx.shutdown('call ended')
      })()
    }

    const deps: ToolDeps = {
      voiceCallId,
      roomName,
      metadata,
      customerName,
      customerPhone,
      stt: sarvamStt,
      tts: sarvamTts,
      hangup,
    }

    const agent = new voice.Agent({
      instructions: systemPrompt,
      tools: buildTools(deps),
      vad,
      stt: sttAdapter,
      tts: ttsAdapter,
      llm: llmInstance,
    })

    const session = new voice.AgentSession({
      // Conversation tuning — parity with the Python worker (JS SDK uses milliseconds)
      userAwayTimeout: USER_AWAY_TIMEOUT_SECONDS,
      turnHandling: {
        endpointing: { minDelay: 250, maxDelay: 2000 },
        interruption: { enabled: true, minDuration: 400, minWords: 2 },
        preemptiveGeneration: { enabled: true },
      },
    })

    sessionRef = session

    // OUTBOUND (webrtc browser OR sip phone): the agent is dispatched into the room
    // when it's CREATED — before the customer/callee is actually connected. So we must
    // wait for the remote participant to JOIN before greeting; otherwise the greeting
    // plays into a not-yet-answered call and the line is silent (the SIP bug).
    //  - webrtc: a human clicks the browser link (wait up to 4 min)
    //  - sip:    the callee answers after ringing (wait up to the ring timeout ~60s)
    // Inbound is already handled by prepareInboundCall (the caller is present).
    const isWebrtc = String(metadata.transport || '').toLowerCase() === 'webrtc' || roomName.startsWith('web-')
    if (!isInbound) {
      const label = isWebrtc ? 'webrtc (browser)' : 'sip (callee)'
      const timeoutMs = isWebrtc ? 240_000 : 60_000
      console.log(`[voice-agent] ${label} — waiting for remote to join ${roomName}…`)
      const waitStart = Date.now()
      while ((ctx.room.remoteParticipants?.size ?? 0) === 0 && Date.now() - waitStart < timeoutMs) {
        if (disconnecting) return
        await sleep(500)
      }
      if ((ctx.room.remoteParticipants?.size ?? 0) === 0) {
        console.log(`[voice-agent] no one joined ${roomName} within ${Math.round(timeoutMs / 1000)}s — closing`)
        hangup(0)
        return
      }
      console.log('[voice-agent] remote joined — starting session')
      // Brief settle so the audio bridge (SIP) / track (webrtc) is up before we greet.
      // The AgentSession auto-subscribes to the participant's audio, so no track poll needed.
      await sleep(800)
    }

    await session.start({ agent, room: ctx.room })

    const callStart = Date.now()
    await markCallActive(roomName)

    // ── Audio recording (opt-in) ──────────────────────────────────────────
    // The local WAV recorder taps the customer mic via a SECOND AudioStream on the
    // same track; with concurrent calls that extra per-call processing degrades audio
    // (stutter) on a single machine. OFF by default; production recording uses LiveKit
    // Egress (lib/voiceRecording). Enable locally with VOICE_LOCAL_RECORDING=true.
    const localRecordingEnabled = String(process.env.VOICE_LOCAL_RECORDING).toLowerCase() === 'true'
    const recorder = localRecordingEnabled ? new CallRecorder(roomName) : null

    // Agent speaks first — DETERMINISTIC greeting via say() (no LLM, no tools on
    // turn 1). The model only engages once the customer actually replies, which
    // stops weak models from logging an outcome / hanging up before the call begins.
    // Inbound flips the shape: we are ANSWERING their call, so identify the agency
    // first and ask how to help (by-name variant when the caller is a known lead).
    const greetingTable = isInbound
      ? (inboundKnownLead ? INBOUND_GREETING_KNOWN_TEXTS : INBOUND_GREETING_TEXTS)
      : GREETING_TEXTS
    const greeting = (greetingTable[preferredLanguage] || greetingTable[DEFAULT_LANGUAGE]!)
      .replace('{customer_name}', customerName)
      .replace('{broker_name}', brokerName)
      .replace('{agency_name}', agencyName)
    session.say(greeting, { addToChatCtx: true })

    // ── Transcript forwarding + goodbye auto-end ──────────────────────────
    let lastActivity = Date.now()
    let goodbyeTimer: NodeJS.Timeout | null = null
    let silenceTimer: NodeJS.Timeout | null = null

    const armCallEnding = (source: string) => {
      if (goodbyeTimer) clearTimeout(goodbyeTimer)
      goodbyeTimer = setTimeout(() => {
        if (!disconnecting) {
          console.log('[voice-agent] goodbye detected but no disconnect in 10s — auto-disconnecting')
          hangup(2)
        }
      }, 10_000)

      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => {
        if (!disconnecting && Date.now() - lastActivity >= 5_500) {
          console.log('[voice-agent] post-goodbye silence — auto-disconnecting')
          hangup(1)
        }
      }, 6_000)

      console.log(`[voice-agent] call-ending armed by ${source}`)
    }

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev: any) => {
      lastActivity = Date.now()
      try {
        const item = ev?.item ?? ev
        const role = item?.role || ''
        let text = ''
        const content = item?.content
        if (typeof content === 'string') text = content
        else if (Array.isArray(content)) {
          text = content.map((p: any) => (typeof p === 'string' ? p : p?.text || '')).join(' ')
        }
        if (!text && typeof item?.textContent === 'string') text = item.textContent
        if (!text) return

        const lower = text.toLowerCase()
        if (role === 'assistant') {
          void appendTranscript(roomName, 'agent', text)
          if (AGENT_GOODBYE_PHRASES.some((p) => lower.includes(p))) armCallEnding('agent_goodbye')
        } else if (role === 'user') {
          void appendTranscript(roomName, 'customer', text)
          if (CUSTOMER_GOODBYE_PHRASES.some((p) => lower.includes(p))) armCallEnding('customer_goodbye')
        }
      } catch {
        // transcript forwarding must never break the call
      }
    })

    // ── Audio recording: capture customer audio frames ────────────────────
    // The recorder captures what comes from the customer's mic. Agent audio
    // (TTS output) is synthesized locally, so we also capture it below.
    // NOTE: The LiveKit agents SDK doesn't expose a clean "room mix" stream,
    // so we record the customer side via TrackSubscribed + the agent side via
    // the ConversationItemAdded text (transcript). Full mixed recording requires
    // LiveKit Egress (production). For local dev, the WAV contains customer audio only.
    if (localRecordingEnabled && recorder) {
      try {
        const { AudioStream, RoomEvent } = await import('@livekit/rtc-node')
        ctx.room.on(RoomEvent.TrackSubscribed, (track: any) => {
          if (track.kind !== 1) return // 1 = AUDIO
          const audioStream = new AudioStream(track, { sampleRate: 24000, numChannels: 1 })
          void (async () => {
            try {
              for await (const frame of audioStream as any) {
                if (disconnecting) break
                if (frame?.data) recorder.pushFrame(frame.data)
              }
            } catch {
              // Stream closed — normal on disconnect
            }
          })()
        })
      } catch (err) {
        console.warn('[voice-agent] audio recording setup failed (non-fatal):', (err as Error).message)
      }
    }

    // ── Silence / user-away handling ──────────────────────────────────────
    let silencePrompts = 0
    session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev: any) => {
      lastActivity = Date.now()
      if (ev?.newState !== 'away' || disconnecting) return
      silencePrompts += 1
      if (silencePrompts <= 2) {
        const lang = sarvamTts.currentLanguage
        session.generateReply({ instructions: SILENCE_PROMPTS[lang] || SILENCE_PROMPTS[DEFAULT_LANGUAGE]! })
        console.log(`[voice-agent] silence prompt ${silencePrompts}/2 (${lang})`)
      } else {
        console.log('[voice-agent] customer unresponsive after 2 prompts — ending call')
        hangup(2)
      }
    })
    session.on(voice.AgentSessionEventTypes.AgentStateChanged, () => {
      lastActivity = Date.now()
    })
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, () => {
      lastActivity = Date.now()
    })

    // ── Max call duration ─────────────────────────────────────────────────
    const maxDurationTimer = setTimeout(() => {
      if (disconnecting) return
      console.log(`[voice-agent] max duration (${MAX_CALL_DURATION_SECONDS}s) reached — wrapping up`)
      const lang = sarvamTts.currentLanguage
      try {
        session.generateReply({ instructions: WRAPUP_PROMPTS[lang] || WRAPUP_PROMPTS[DEFAULT_LANGUAGE]! })
      } catch {
        // best-effort wrap-up line
      }
      hangup(5)
    }, MAX_CALL_DURATION_SECONDS * 1000)

    // ── Participant-presence + inactivity watchdog ────────────────────────
    void (async () => {
      await sleep(INACTIVITY_WATCHDOG_INTERVAL_SECONDS * 1000)
      let participantSeen = false
      while (!disconnecting) {
        await sleep(INACTIVITY_WATCHDOG_INTERVAL_SECONDS * 1000)
        if (disconnecting) return

        let remoteCount = 0
        try {
          remoteCount = ctx.room.remoteParticipants?.size ?? 0
        } catch {
          remoteCount = 0
        }
        if (remoteCount > 0) {
          participantSeen = true
        } else if (participantSeen) {
          console.log(`[voice-agent] customer left ${roomName} — ending call`)
          hangup(0)
          return
        }

        const idleSeconds = (Date.now() - lastActivity) / 1000
        if (idleSeconds >= CONVERSATION_INACTIVITY_TIMEOUT_SECONDS) {
          console.log(`[voice-agent] no conversation for ${Math.round(idleSeconds)}s — ending call`)
          hangup(2)
          return
        }
      }
    })()

    // ── Shutdown: finalize the call record ────────────────────────────────
    ctx.addShutdownCallback(async () => {
      clearTimeout(maxDurationTimer)
      if (goodbyeTimer) clearTimeout(goodbyeTimer)
      if (silenceTimer) clearTimeout(silenceTimer)
      const durationSeconds = (Date.now() - callStart) / 1000
      await finalizeCall(roomName, durationSeconds)

      // Save audio recording to local file (only when local recording is enabled)
      try {
        const audioPath = recorder?.finalize()
        if (audioPath) {
          // Update call record with the local recording path
          const calls = await import('@/lib/mongodb').then(m => m.getCollection('calls'))
          await calls.updateOne(
            { $or: [{ voice_call_id: roomName }, { room_name: roomName }] },
            { $set: { local_recording_path: audioPath, updated_at: new Date() } }
          )
        }
      } catch (err) {
        console.warn('[voice-agent] audio recording save failed:', (err as Error).message)
      }

      // Save transcript to local file
      try {
        await saveTranscriptToFile(roomName, customerName, customerPhone)
      } catch (err) {
        console.warn('[voice-agent] transcript save failed:', (err as Error).message)
      }

      // Post-Call Reconciler: lead state machine + cross-agent memory.
      if (roomName.startsWith('web-')) {
        console.log('[voice-agent] test harness room — skipping post-call reconcile')
      } else {
        try {
          const { reconcilePostCall } = await import('@/lib/orchestrator/postCall')
          const result = await reconcilePostCall(roomName)
          console.log('[voice-agent] post-call reconcile:', JSON.stringify(result))
        } catch (err) {
          console.error('[voice-agent] post-call reconcile failed:', (err as Error).message)
        }
      }
      console.log(`[voice-agent] call ended for ${customerPhone} — ${durationSeconds.toFixed(1)}s`)
    })

    console.log(`[voice-agent] session live on ${roomName} (${preferredLanguage})`)
  },
})

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    // This machine cold-starts a job runner slowly (tsx transpiles the full
    // GharSoch module graph + Silero VAD load). The SDK's 10s default kept
    // declaring the runner dead, then killing the late-spawned replacement
    // mid-call ("job process orphaned"). Give init real headroom and keep one
    // pre-warmed process so jobs never cold-start.
    initializeProcessTimeout: 120_000,
    numIdleProcesses: 1,
  })
)
