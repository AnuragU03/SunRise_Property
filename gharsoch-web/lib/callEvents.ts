/**
 * lib/callEvents.ts — in-process call lifecycle event bus.
 *
 * A lightweight EventEmitter singleton shared between the voice agent worker
 * and the Next.js server process. Used to signal call completion so sequential
 * call queues can proceed without polling the DB.
 *
 * Events:
 *   'call:completed'  → { roomName: string, voiceCallId: string, durationSeconds: number }
 *   'call:failed'     → { roomName: string, voiceCallId: string, error: string }
 *
 * NOTE: This only works when the voice agent runs in the SAME process as Next.js
 * (which it does in dev via tsx, and in production via the standalone build).
 * If the voice agent runs in a separate process, use the DB poll fallback.
 */
import { EventEmitter } from 'node:events'

class CallEventBus extends EventEmitter {
  constructor() {
    super()
    // Allow many listeners (one per queued call waiting for a prior call to finish)
    this.setMaxListeners(50)
  }
}

// Singleton — survives HMR in dev via globalThis
const globalKey = '__gharsoch_call_event_bus__'

function getCallEventBus(): CallEventBus {
  const g = globalThis as any
  if (!g[globalKey]) {
    g[globalKey] = new CallEventBus()
  }
  return g[globalKey]
}

export const callEventBus = getCallEventBus()

export interface CallCompletedEvent {
  roomName: string
  voiceCallId: string
  durationSeconds: number
}

export interface CallFailedEvent {
  roomName: string
  voiceCallId: string
  error: string
}
