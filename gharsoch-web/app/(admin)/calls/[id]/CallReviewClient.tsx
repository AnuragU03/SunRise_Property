'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Phone, Clock, BrainCircuit, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { CallDetail } from '@/lib/services/callService'
import { ToolActivityPanel } from '@/components/calls/ToolActivityPanel'
import { WebRtcCallPanel } from '@/components/calls/WebRtcCallPanel'
import { ActionItemsList } from '@/components/calls/ActionItemsList'

import { toast } from 'sonner'

export function CallReviewClient({ initialCall }: { initialCall: CallDetail }) {
  const [call, setCall] = useState(initialCall)
  const [isReanalyzing, setIsReanalyzing] = useState(false)

  const transcriptSegments: Array<{ speaker: string; text: string }> = (() => {
    if (call.transcript_segments && call.transcript_segments.length > 0) {
      return call.transcript_segments
    }
    const raw = (call as any).transcript
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((l: any) => ({ speaker: String(l.speaker || l.role || 'Agent'), text: String(l.text || l.content || '') })).filter(l => l.text)
    if (typeof raw === 'string') return raw.split('\n').filter(Boolean).map((line: string) => {
      const [s, ...rest] = line.split(':')
      return rest.length ? { speaker: s.trim(), text: rest.join(':').trim() } : { speaker: 'Agent', text: line }
    })
    return []
  })()

  useEffect(() => {
    if (call.analyzed_at) return
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/lead/${call.lead_id}`)
        const data = await res.json()
        if (data.success && data.data) {
          const fresh = data.data.find((c: any) => c._id === call._id)
          if (fresh && fresh.analyzed_at) {
            setCall(fresh)
          }
        }
      } catch (e) {
        console.error('Failed to poll call analysis', e)
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [call._id, call.lead_id, call.analyzed_at])

  const getSentimentColor = (s?: string | null) => {
    switch(s?.toLowerCase()) {
      case 'positive': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'negative': return 'bg-destructive/10 text-destructive border-destructive/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const handleReanalyze = async () => {
    try {
      setIsReanalyzing(true)
      const res = await fetch(`/api/calls/${call._id}/analyze`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual_broker_override' })
      })
      const data = await res.json()
      if (data.success && data.data) {
        setCall(data.data)
        toast.success('Call re-analyzed successfully')
      } else {
        toast.error(data.error || 'Re-analysis failed')
      }
    } catch (err) {
      toast.error('Failed to trigger re-analysis')
    } finally {
      setIsReanalyzing(false)
    }
  }

  const isAnalyzed = !!call.analyzed_at

  return (
    <div className="flex flex-col space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/calls" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Phone className="w-5 h-5 text-muted-foreground" />
            Call with {call.lead_name || 'Unknown Lead'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(call.created_at).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-sm px-3 py-1 bg-background">
            {call.call_status}
          </Badge>
          <Badge variant={call.direction === 'outbound' ? 'default' : 'secondary'} className="capitalize text-sm px-3 py-1">
            {call.direction}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recording & Transcript */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" /> Recording & Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              {(call as any).voice_status === 'webrtc_ready' &&
                !['completed', 'ended', 'failed', 'missed'].includes(String(call.call_status || '').toLowerCase()) && (
                  <div className="p-4 border-b bg-muted/10 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      WebRTC test call — answer right here to talk to the agent as this customer.
                    </div>
                    <WebRtcCallPanel callId={call._id} />
                  </div>
                )}
              {(call as any).call_brief && (
                <details className="border-b bg-muted/10">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                    Pre-call brief — what the agent knew going in
                  </summary>
                  <div className="px-4 pb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    {Object.entries((call as any).call_brief as Record<string, any>)
                      .filter(([k, v]) => v !== '' && v != null && !['room_name', 'voice_call_id', 'call_doc_id', 'gharsoch_api_base', 'transport'].includes(k))
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2 min-w-0">
                          <span className="text-muted-foreground shrink-0">{k.replace(/_/g, ' ')}:</span>
                          <span className="truncate" title={String(v)}>{String(v)}</span>
                        </div>
                      ))}
                  </div>
                </details>
              )}
              {(call as any).recording_url && (
                <div className="p-4 border-b bg-muted/10">
                  <audio controls src={(call as any).recording_url} className="w-full h-10" />
                </div>
              )}
              
              <div className="p-6 bg-muted/5 min-h-[400px] max-h-[600px] overflow-y-auto">
                {transcriptSegments.length > 0 ? (
                  <div className="space-y-4">
                    {transcriptSegments.map((seg, idx) => {
                      const isCustomer = /customer|cust|lead|buyer|client|user/i.test(seg.speaker)
                      return (
                        <div key={idx} className={`flex flex-col max-w-[85%] ${!isCustomer ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                          <div className="text-[11px] text-muted-foreground mb-1 px-1 font-medium uppercase tracking-wider">
                            {!isCustomer ? 'AI Agent' : (call.lead_name || 'Customer')}
                          </div>
                          <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${!isCustomer ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border text-card-foreground rounded-tl-sm'}`}>
                            {seg.text}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                    No transcript available for this call.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Insights & Details */}
        <div className="space-y-6">
          <Card className={isAnalyzed ? "border-primary/20 bg-primary/5" : ""}>
            <CardHeader className="bg-muted/30 border-b py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <BrainCircuit className="w-4 h-4" /> AI Analysis
              </CardTitle>
              {!isAnalyzed ? (
                <span className="text-xs text-muted-foreground animate-pulse">Analyzing automatically...</span>
              ) : (
                <button 
                  onClick={handleReanalyze} 
                  disabled={isReanalyzing}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
                </button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {isAnalyzed ? (
                <div className="space-y-6">
                  {/* Sentiment */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sentiment</h4>
                    <Badge variant="outline" className={`capitalize ${getSentimentColor(call.sentiment_label)}`}>
                      {call.sentiment_label || 'Neutral'} {call.sentiment_score ? `(${call.sentiment_score}/10)` : ''}
                    </Badge>
                  </div>

                  {/* Summary */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {call.call_summary || 'No summary generated.'}
                    </p>
                  </div>

                  {/* Objections */}
                  {call.objections_logged && call.objections_logged.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Objections</h4>
                      <div className="space-y-2">
                        {call.objections_logged.map((obj, idx) => (
                          <div key={idx} className="p-3 border rounded-md bg-background text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              {obj.resolved ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-destructive" />}
                              <span className="font-semibold capitalize text-xs">{obj.category.replace('_', ' ')}</span>
                            </div>
                            <p className="text-muted-foreground">{obj.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {call.next_steps && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Steps</h4>
                      <p className="text-sm text-foreground leading-relaxed bg-background p-3 border rounded-md">
                        {call.next_steps}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Skeleton className="h-3 w-20 mb-3" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-20 mb-3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-24 mb-3" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What Agent Did */}
          <ToolActivityPanel events={(call as any).tool_events || []} />

          {/* Action Items List */}
          <ActionItemsList callId={call._id} leadId={call.lead_id || ''} />

          <Card>
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-sm text-muted-foreground">Call Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" /> {call.duration || 0}s
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{call.lead_phone}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Disposition</span>
                  <span className="font-medium capitalize">{call.disposition || '—'}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground">Voice Call ID</span>
                  <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[150px]" title={(call as any).voice_call_id || (call as any).room_name || ''}>{(call as any).voice_call_id || (call as any).room_name || '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
