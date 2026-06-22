'use client'

/**
 * GlobalIncomingCall — app-wide "incoming test call" banner.
 *
 * Polls for fresh WebRTC calls waiting to be answered and shows a banner anywhere
 * in the admin app (not just the lead's page). Answer opens the in-app call console
 * (WebRtcCallPanel) in a dialog, so a fired call can be picked up from any screen.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WebRtcCallPanel } from '@/components/calls/WebRtcCallPanel'

type ActiveCall = {
  _id: string
  lead_id: string
  lead_name: string
  lead_phone: string
  call_type: string
}

export function GlobalIncomingCall() {
  const [incoming, setIncoming] = useState<ActiveCall | null>(null)
  const [answeredId, setAnsweredId] = useState<string | null>(null)
  const dismissedRef = useRef<Set<string>>(new Set())

  const poll = useCallback(async () => {
    if (document.visibilityState === 'hidden') return
    try {
      const res = await fetch('/api/calls/active')
      if (!res.ok) return
      const data = await res.json()
      const calls: ActiveCall[] = data.data || []
      // First fresh call the user hasn't dismissed or already answered.
      const next = calls.find((c) => !dismissedRef.current.has(c._id))
      setIncoming(next && next._id !== answeredId ? next : null)
    } catch {
      // polling is best-effort
    }
  }, [answeredId])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, 2500)
    return () => clearInterval(interval)
  }, [poll])

  const dismiss = (id: string) => {
    dismissedRef.current.add(id)
    setIncoming(null)
  }

  const answer = (id: string) => {
    setIncoming(null)
    setAnsweredId(id)
  }

  return (
    <>
      {incoming && (
        <div className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 w-[min(92vw,440px)]">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                Test call ready · {incoming.lead_name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {incoming.lead_phone} · {incoming.call_type.replace(/_/g, ' ')} — answer as the customer
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => answer(incoming._id)}
            >
              <Phone className="mr-1 h-4 w-4" /> Answer
            </Button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(incoming._id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(answeredId)} onOpenChange={(o) => !o && setAnsweredId(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> Test call
            </DialogTitle>
          </DialogHeader>
          {answeredId && <WebRtcCallPanel callId={answeredId} />}
          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => setAnsweredId(null)}>
              <PhoneOff className="mr-1 h-4 w-4" /> Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
