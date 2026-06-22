'use client'

/**
 * WebRtcCallPanel — answer a WebRTC test call inside the GharSoch UI.
 *
 * Joins the call's LiveKit room as the customer (mic published, agent audio
 * played) so the voice agent can be exercised end-to-end without the external
 * meet.livekit.io link or a PSTN carrier.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PanelState = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'

export function WebRtcCallPanel({ callId, className }: { callId: string; className?: string }) {
  const [state, setState] = useState<PanelState>('idle')
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)
  const [micFailed, setMicFailed] = useState(false)
  const [agentPresent, setAgentPresent] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const roomRef = useRef<any>(null)
  const audioHostRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const teardown = useCallback((finalState: PanelState) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const room = roomRef.current
    roomRef.current = null
    if (room) {
      try {
        room.disconnect()
      } catch {
        // already disconnected
      }
    }
    if (audioHostRef.current) audioHostRef.current.innerHTML = ''
    setAgentPresent(false)
    setState(finalState)
  }, [])

  useEffect(() => () => teardown('idle'), [teardown])

  const answer = async () => {
    setState('connecting')
    setError('')
    try {
      const res = await fetch(`/api/calls/${callId}/join`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Could not get join token')

      // Dynamic import keeps livekit-client out of the main bundle.
      const { Room, RoomEvent, Track } = await import('livekit-client')

      const room = new Room()
      roomRef.current = room

      room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === Track.Kind.Audio && audioHostRef.current) {
          const el = track.attach()
          audioHostRef.current.appendChild(el)
          setAgentPresent(true)
        }
      })
      room.on(RoomEvent.ParticipantConnected, () => setAgentPresent(true))
      room.on(RoomEvent.Disconnected, () => teardown('ended'))

      await room.connect(data.url, data.token)

      // Mic failure (no device / permission denied) must not kill the leg —
      // stay connected listen-only so the agent's audio is still testable.
      try {
        await room.localParticipant.setMicrophoneEnabled(true)
        setMicFailed(false)
      } catch (micErr) {
        console.warn('[WebRtcCallPanel] Mic unavailable — listen-only mode:', micErr)
        setMicFailed(true)
      }

      setMuted(false)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
      setAgentPresent(room.remoteParticipants?.size > 0)
      setState('connected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join call')
      teardown('error')
    }
  }

  const toggleMute = async () => {
    const room = roomRef.current
    if (!room) return
    const next = !muted
    await room.localParticipant.setMicrophoneEnabled(!next)
    setMuted(next)
  }

  const hangUp = () => teardown('ended')

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')

  return (
    <div className={`rounded-lg border bg-card p-4 ${className || ''}`}>
      <div ref={audioHostRef} className="hidden" />

      {state === 'idle' && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-medium">Test call ready</div>
            <div className="text-muted-foreground text-xs">
              Answer as the customer — the AI agent is waiting in the room.
            </div>
          </div>
          <Button onClick={answer} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
            <Phone className="w-4 h-4 mr-2" /> Answer
          </Button>
        </div>
      )}

      {state === 'connecting' && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Connecting to the call…
        </div>
      )}

      {state === 'connected' && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="text-sm">
              <div className="font-medium tabular-nums">
                On call · {mins}:{secs}
              </div>
              <div className="text-xs text-muted-foreground">
                {micFailed
                  ? 'Listen-only: microphone unavailable (check browser permission)'
                  : agentPresent
                    ? 'AI agent connected — speak normally'
                    : 'Waiting for the AI agent to join…'}
              </div>
            </div>
            {agentPresent && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                Agent live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant={muted ? 'destructive' : 'outline'} size="sm" onClick={toggleMute}>
              {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button variant="destructive" size="sm" onClick={hangUp} className="rounded-full">
              <PhoneOff className="w-4 h-4 mr-1" /> Hang up
            </Button>
          </div>
        </div>
      )}

      {state === 'ended' && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Call leg ended.</span>
          <Button variant="outline" size="sm" onClick={answer}>
            <Phone className="w-4 h-4 mr-2" /> Rejoin
          </Button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={answer}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
