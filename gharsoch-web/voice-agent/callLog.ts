/**
 * callLog.ts — in-process call-record wiring for the voice agent.
 *
 * The Python worker POSTed transcript/status events to /api/voice/events; the
 * in-repo agent writes the SAME fields directly to the `calls` collection via
 * lib/mongodb, so the existing Call Review UI / dashboards keep working with
 * zero HTTP hops. Field shapes mirror app/api/voice/events/route.ts exactly.
 */
import { getCollection } from '@/lib/mongodb'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TRANSCRIPTIONS_DIR = join(process.cwd(), 'data', 'call_transcriptions')

// Ensure directory exists at module load
if (!existsSync(TRANSCRIPTIONS_DIR)) {
  mkdirSync(TRANSCRIPTIONS_DIR, { recursive: true })
}

function identityFilter(identity: string) {
  return {
    $or: [
      { voice_call_id: identity },
      { room_name: identity },
      { live_session_id: identity },
    ],
  }
}

/** Mark the call active when the agent joins / the customer picks up. */
export async function markCallActive(roomName: string): Promise<void> {
  try {
    const calls = await getCollection('calls')
    await calls.updateOne(identityFilter(roomName), {
      $set: {
        call_status: 'in-progress',
        status: 'in-progress',
        voice_status: 'active',
        started_at: new Date(),
        updated_at: new Date(),
      },
      $push: { voice_events: { type: 'call_started', occurred_at: new Date() } } as any,
    })
  } catch (err) {
    console.error('[callLog] markCallActive failed:', (err as Error).message)
  }
}

/** Append one transcript line ("Agent: …" / "Customer: …") to the call record. */
export async function appendTranscript(roomName: string, role: 'agent' | 'customer', text: string): Promise<void> {
  const line = `${role === 'agent' ? 'Agent' : 'Customer'}: ${text}`.trim()
  if (!text.trim()) return
  try {
    const calls = await getCollection('calls')
    const existing = await calls.findOne(identityFilter(roomName), { projection: { transcript: 1 } })
    if (!existing) return
    await calls.updateOne(
      { _id: existing._id },
      {
        $set: {
          transcript: existing.transcript ? `${existing.transcript}\n${line}` : line,
          updated_at: new Date(),
        },
      }
    )
  } catch (err) {
    console.error('[callLog] appendTranscript failed:', (err as Error).message)
  }
}

/** Finalize the call record on teardown (duration, status). Outcome/summary come from tools. */
export async function finalizeCall(roomName: string, durationSeconds: number): Promise<void> {
  try {
    const calls = await getCollection('calls')
    await calls.updateOne(identityFilter(roomName), {
      $set: {
        call_status: 'completed',
        status: 'completed',
        voice_status: 'completed',
        ended_at: new Date(),
        duration: Math.round(durationSeconds),
        updated_at: new Date(),
      },
      $push: { voice_events: { type: 'call_ended', occurred_at: new Date() } } as any,
    })
  } catch (err) {
    console.error('[callLog] finalizeCall failed:', (err as Error).message)
  }

  // Signal call completion for the sequential call queue.
  // 1. In-process event bus (works if agent + Next.js share a process)
  // 2. HTTP callback to the Next.js server (works cross-process — the real path)
  try {
    const { callEventBus } = await import('@/lib/callEvents')
    callEventBus.emit('call:completed', { roomName, voiceCallId: roomName, durationSeconds })
  } catch {
    // in-process emit is best-effort
  }

  // Cross-process HTTP callback — the voice agent runs in a separate process,
  // so this is how the start-calls loop in the Next.js process actually learns
  // the call finished. Fire-and-forget with a short timeout.
  try {
    const base = process.env.GHARSOCH_API_BASE || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 5000)
    await fetch(`${base}/api/voice/call-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceCallId: roomName, roomName, durationSeconds }),
      signal: controller.signal,
    }).catch(() => {})
    clearTimeout(t)
  } catch {
    // HTTP callback is best-effort — the start-calls loop has a DB-poll fallback
  }
}

/**
 * Customer memory for prompt hydration — recent call summaries for this phone
 * (replaces the Python worker's local-JSON memory store with the real call history).
 */
export async function getCustomerMemory(customerPhone: string): Promise<string> {
  if (!customerPhone) return ''
  try {
    const calls = await getCollection('calls')
    const recent = await calls
      .find(
        { lead_phone: customerPhone, call_summary: { $exists: true, $nin: ['', null] } },
        { projection: { call_summary: 1, call_outcome: 1, created_at: 1 } }
      )
      .sort({ created_at: -1 })
      .limit(3)
      .toArray()

    if (!recent.length) return ''
    return recent
      .map((c: any) => {
        const when = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }) : ''
        return `- [${when}] outcome: ${c.call_outcome || 'unknown'} — ${String(c.call_summary).slice(0, 240)}`
      })
      .join('\n')
  } catch (err) {
    console.error('[callLog] getCustomerMemory failed:', (err as Error).message)
    return ''
  }
}

/**
 * Save the full conversation transcript to a local text file.
 * Fetches the transcript from the call record in MongoDB and writes it to:
 *   data/call_transcriptions/{roomName}_{timestamp}.txt
 *
 * Returns the file path, or null if no transcript was found.
 */
export async function saveTranscriptToFile(roomName: string, customerName?: string, customerPhone?: string): Promise<string | null> {
  try {
    const calls = await getCollection('calls')
    const callDoc = await calls.findOne(identityFilter(roomName), {
      projection: { transcript: 1, call_outcome: 1, call_summary: 1, lead_name: 1, lead_phone: 1, created_at: 1, duration: 1 },
    })

    if (!callDoc || !callDoc.transcript) {
      console.log('[callLog] no transcript to save for', roomName)
      return null
    }

    // Build a formatted transcript file
    const header = [
      `=== GharSoch Call Transcript ===`,
      `Room: ${roomName}`,
      `Customer: ${customerName || callDoc.lead_name || 'Unknown'} (${customerPhone || callDoc.lead_phone || ''})`,
      `Date: ${(callDoc.created_at || new Date()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      `Duration: ${callDoc.duration ? `${Math.floor(callDoc.duration / 60)}m ${callDoc.duration % 60}s` : 'unknown'}`,
      `Outcome: ${callDoc.call_outcome || 'pending'}`,
      callDoc.call_summary ? `Summary: ${callDoc.call_summary}` : '',
      `${'='.repeat(40)}`,
      '',
    ].filter(Boolean).join('\n')

    const content = header + callDoc.transcript

    // Generate filename
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const safeName = roomName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `${safeName}_${ts}.txt`
    const filepath = join(TRANSCRIPTIONS_DIR, filename)

    writeFileSync(filepath, content, 'utf8')
    console.log(`[callLog] transcript saved: ${filepath} (${callDoc.transcript.split('\n').length} lines)`)
    return filepath
  } catch (err) {
    console.error('[callLog] saveTranscriptToFile failed:', (err as Error).message)
    return null
  }
}
