# Voice Agent Port — Python worker → GharSoch TypeScript

Goal: move the LiveKit voice agent **into GharSoch** (TypeScript, `@livekit/agents`),
replacing Vapi, so the standalone Python folder (`LiveKitSarvam-VoiceAgent`) can be
**deleted**. The agent imports GharSoch services directly (no cross-repo HTTP).

> Hard constraint: a real-time LiveKit agent is a **persistent process**, not a Next.js
> route. It lives in `gharsoch-web/voice-agent/` and runs via `node` (or `tsx`), but it's
> in the same repo and imports `@/lib/...` directly.

## Run model

```
gharsoch-web/
  app, lib, ...            # Next.js web app (existing)
  voice-agent/             # NEW — the voice worker (separate process, same repo)
    index.ts               # entrypoint (registers with LiveKit, handles jobs)
    agent.ts               # the Agent class + function tools
    prompt.ts              # ✅ DONE — scenario-aware system prompt
    sarvam/stt.ts          # Sarvam Saaras STT plugin (port)
    sarvam/tts.ts          # Sarvam Bulbul TTS plugin (port)
    constants.ts           # greetings / timeouts / outcomes (port)
    recorder.ts            # local call recorder (port)
    setup-twilio-trunk.ts  # ✅ DONE — create LiveKit↔Twilio SIP trunk
```

Start: `npx tsx voice-agent/index.ts dev` (alongside `npm run dev`).

## Python → TypeScript mapping

| Python (worker) | TS target | Notes |
|---|---|---|
| `prompts/system_prompt.md` + `core/prompt_engine.py` | `voice-agent/prompt.ts` ✅ | Ported; brand/office now **variables**, single goal → **per-call-type objective** |
| `setup_plivo_trunk.py` | `voice-agent/setup-twilio-trunk.ts` ✅ | Twilio instead of Plivo |
| `config/constants.py` | `voice-agent/constants.ts` | greetings, silence/wrapup prompts, timeouts, VALID_OUTCOMES |
| `agent/sarvam_plugins/tts.py` | `voice-agent/sarvam/tts.ts` | Bulbul v3 stream → PCM. HTTP only — portable. `set_language` for runtime switch |
| `agent/sarvam_plugins/stt.py` | `voice-agent/sarvam/stt.ts` | Saaras v3 streaming STT |
| `agent/voice_agent.py` | `voice-agent/agent.ts` | 8 function tools; **rewire to GharSoch services** (`appointmentService`, `whatsappService`, lead/lock services) instead of the Python `data_store` |
| `agent/entrypoint.py` | `voice-agent/index.ts` | session config (VAD/STT/LLM/TTS), barge-in tuning, greeting, silence/inactivity watchdogs, goodbye auto-end, teardown, recording |
| `core/call_recorder.py` | `voice-agent/recorder.ts` | local WAV; later swap to blob storage |
| `core/memory.py`, `analytics.py`, `data_store.py`, `whatsapp.py` | **DROP** | GharSoch already owns these (Mongo, `whatsappService`, lead scoring). Tools call GharSoch directly |
| `server/*` (FastAPI routes) | **DROP** | GharSoch is the API/dashboard |

## Dependencies to add

```
@livekit/agents
@livekit/agents-plugin-openai      # LLM (gpt-4o-mini) — already your voice LLM
@livekit/agents-plugin-silero      # VAD
@livekit/agents-plugin-deepgram    # optional STT alternative
# Sarvam STT/TTS: hand-written in voice-agent/sarvam/* (no official JS plugin)
```

## How one agent handles every call type (answers the design question)

The old setup had 3–4 Vapi assistants. Here it's **one** agent + one base prompt; the
`call_type` from GharSoch room metadata selects a per-scenario **objective** (see
`prompt.ts` `CALL_OBJECTIVES`): `reengage`, `matchmaker`, `campaign`, `follow_up_callback`,
`appointment_reminder`. Tone, language switching, safety, and closing are shared — no
duplication.

## Tools → GharSoch services (no Python data_store, no HTTP)

| Tool | Calls directly |
|---|---|
| `book_appointment` | `appointmentService.create` (→ policy + Calendar + WhatsApp, already built) |
| `log_call_outcome` | `callService` update + lead score + `whatsappService` post-call |
| `request_callback` | lead `next_follow_up_date` (Follow-Up Agent picks it up) |
| `mark_wrong_number` / `handle_dispute` | DNC + lead status via lead/dnc services |
| `switch_language` | `sarvam/*` `setLanguage()` |

Because the agent runs in-process, these are **imports**, so the `/api/voice/*` HTTP
endpoints become unnecessary and can be removed once the agent is live.

## Status

- ✅ `prompt.ts` (scenario-aware prompt) — done, compiles
- ✅ `setup-twilio-trunk.ts` — done, compiles
- ✅ `constants.ts` — greetings/silence/wrapup prompts, timeouts, outcomes, goodbye sets
- ✅ `sarvam/tts.ts` — Bulbul v3 streaming→PCM + REST fallback + runtime language switch
- ✅ `sarvam/stt.ts` — Saaras recognize (VAD-segmented via stt.StreamAdapter) + language switch
- ✅ `agent.ts` — 10 tools wired IN-PROCESS to `dispatchVoiceTool` (appointment → policy +
  Google Calendar + WhatsApp; outcome/callback/DNC/dispute/summary; tool events land on the
  call doc so Call Review shows them)
- ✅ `callLog.ts` — transcripts/status/duration written straight to the `calls` collection
  (same fields the Call Review UI reads); customer memory pulled from real call history
- ✅ `index.ts` — session (VAD/STT/LLM/TTS adapters, ms-tuned barge-in/endpointing),
  greeting, silence prompts, max-duration, goodbye auto-end, participant/inactivity
  watchdogs, teardown, shutdown finalize
- ✅ **Runtime-verified:** worker boots under `npm run voice:agent`, loads the full GharSoch
  module graph, and **registers with LiveKit Cloud** (India West). Survives transient
  Mongo TLS failures (kept alive + connection self-heals).
- ⬜ Live phone-call verification — needs `SIP_OUTBOUND_TRUNK_ID` (run `npm run voice:trunk`
  after creating the Twilio Elastic SIP trunk)
- ⬜ Local audio recording (Python `call_recorder.py`) — deferred; transcripts are captured
- ⬜ After live verification: delete `/api/voice/*` HTTP routes + the Python folder

## Run

```bash
npm run voice:agent        # dev worker (auto-dispatches into call-*/web-* rooms)
npm run voice:trunk        # one-time: create the LiveKit↔Twilio SIP outbound trunk
```
