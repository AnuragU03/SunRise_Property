'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone, PhoneOff, AlertTriangle, MessageSquare, ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SerializedLead } from '@/lib/services/leadService'
import type { SerializedCall } from '@/lib/services/callService'
import { WebRtcCallPanel } from '@/components/calls/WebRtcCallPanel'

interface LiveCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: SerializedLead
  vapiCallId?: string
  activeCallId?: string
  isAutoOpened?: boolean
}

export function LiveCallModal({ open, onOpenChange, lead, vapiCallId, activeCallId: externalCallId, isAutoOpened }: LiveCallModalProps) {
  const [activeCall, setActiveCall] = useState<SerializedCall | null>(null)
  const [polling, setPolling] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Poll for the most recent call
  useEffect(() => {
    if (!open) {
      setActiveCall(null)
      setPolling(false)
      return
    }

    setPolling(true)
    const fetchLatestCall = async () => {
      try {
        const res = await fetch(`/api/calls/lead/${lead._id}`)
        const data = await res.json()
        if (data.success && data.data && data.data.length > 0) {
          const latest = data.data[0]
          setActiveCall(latest)
          
          // Stop polling if completed or failed
          if (['completed', 'ended', 'failed', 'missed'].includes(latest.call_status?.toLowerCase() || '')) {
            setPolling(false)
          }
        }
      } catch (e) {
        console.error('Failed to poll live call', e)
      }
    }

    fetchLatestCall()

    const interval = setInterval(() => {
      if (polling && document.visibilityState !== 'hidden') {
        fetchLatestCall()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [open, lead._id, polling])

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeCall?.transcript_segments])

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ringing': return <Badge variant="outline" className="bg-amber-100 text-amber-800 animate-pulse border-amber-200">Ringing...</Badge>
      case 'in-progress': return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 animate-pulse border-emerald-200">Live</Badge>
      case 'completed': return <Badge variant="secondary">Completed</Badge>
      default: return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
          <div className="flex-1 min-w-0">
            <DialogTitle className="flex items-center gap-2 text-xl truncate">
              <Phone className="w-5 h-5 text-muted-foreground" />
              Call in progress...
            </DialogTitle>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {isAutoOpened ? "Automation initiated this call" : "Manual call in progress"} • {lead.name} ({lead.phone})
            </div>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(activeCall?.call_status || 'connecting')}
          </div>
        </DialogHeader>

        {/* In-app answer leg: WebRTC test calls are answered right here instead of meet.livekit.io */}
        {activeCall &&
          ((activeCall as any).voice_status === 'webrtc_ready' || (activeCall as any).join_url) &&
          !['completed', 'ended', 'failed', 'missed'].includes(activeCall.call_status?.toLowerCase() || '') && (
            <div className="px-6 py-3 border-b shrink-0 bg-muted/20">
              <WebRtcCallPanel callId={activeCall._id} />
            </div>
          )}

        <div className="flex-1 flex overflow-hidden bg-muted/10">
          {/* Transcript Feed */}
          <div className="flex-1 flex flex-col border-r">
            <div className="p-4 border-b bg-muted/30 shrink-0 font-medium flex items-center text-sm">
              <MessageSquare className="w-4 h-4 mr-2" /> Live Transcript
            </div>
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-4">
                {activeCall?.transcript_segments && activeCall.transcript_segments.length > 0 ? (
                  activeCall.transcript_segments.map((seg, idx) => (
                    <div key={idx} className={`flex flex-col max-w-[80%] ${seg.speaker === 'agent' ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                      <div className="text-[11px] text-muted-foreground mb-1 px-1">
                        {seg.speaker === 'agent' ? 'AI Agent' : lead.name}
                      </div>
                      <div className={`p-3 rounded-lg text-sm ${seg.speaker === 'agent' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                        {seg.text}
                      </div>
                    </div>
                  ))
                ) : ['ringing', 'in-progress'].includes(activeCall?.call_status?.toLowerCase() || '') ? (
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-col items-start max-w-[80%]">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-12 w-48 rounded-lg rounded-tl-none" />
                    </div>
                    <div className="flex flex-col items-end max-w-[80%] ml-auto">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-10 w-40 rounded-lg rounded-tr-none" />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-12">
                    <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                    <p>No transcript available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Objection Feed */}
          <div className="w-80 flex flex-col bg-card shrink-0">
            <div className="p-4 border-b bg-muted/30 shrink-0 font-medium flex items-center text-sm">
              <ShieldAlert className="w-4 h-4 mr-2 text-destructive" /> Active Objections
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {activeCall?.objections_logged && activeCall.objections_logged.length > 0 ? (
                  activeCall.objections_logged.map((obj, idx) => (
                    <div key={idx} className={`p-3 rounded-md border text-sm ${obj.resolved ? 'bg-emerald-50 border-emerald-200' : 'bg-destructive/5 border-destructive/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-3 h-3 ${obj.resolved ? 'text-emerald-500' : 'text-destructive'}`} />
                        <span className="font-semibold capitalize text-xs tracking-wider">{obj.category.replace('_', ' ')}</span>
                        {obj.resolved && <Badge variant="outline" className="ml-auto text-[10px] h-4 bg-emerald-100 text-emerald-800 border-emerald-200">Resolved</Badge>}
                      </div>
                      <p className="text-muted-foreground">{obj.detail}</p>
                      {obj.resolution_attempted && (
                        <p className="mt-2 text-xs border-t pt-2 border-border/50 text-foreground">
                          <span className="font-medium">Attempt:</span> {obj.resolution_attempted}
                        </p>
                      )}
                    </div>
                  ))
                ) : ['ringing', 'in-progress'].includes(activeCall?.call_status?.toLowerCase() || '') ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                    <Loader2 className="w-5 h-5 mb-3 animate-spin opacity-50" />
                    <p>Listening for objections...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                    <ShieldAlert className="w-8 h-8 mb-3 opacity-20" />
                    <p>No objections logged</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <div className="p-3 text-center text-xs text-muted-foreground border-t shrink-0">
          Powered by GharSoch automation
        </div>
      </DialogContent>
    </Dialog>
  )
}
