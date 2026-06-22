'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Activity, Info } from 'lucide-react'

export interface ToolEvent {
  tool_name: string
  occurred_at?: string
  success?: boolean
  result_summary?: string
  args_summary?: string
}

export function ToolActivityPanel({ events = [] }: { events?: ToolEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-muted/30 border-b py-4">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" /> What Agent Did
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
            <p className="text-sm italic">No automated actions recorded for this call.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort chronologically if occurred_at is present, otherwise keep order
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.occurred_at || !b.occurred_at) return 0
    return new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  })

  return (
    <Card>
      <CardHeader className="bg-muted/30 border-b py-4">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          <Activity className="w-4 h-4" /> What Agent Did
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {sortedEvents.map((evt, idx) => {
            const timeStr = evt.occurred_at 
              ? new Date(evt.occurred_at).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) 
              : '--:--:--'
            
            return (
              <div key={idx} className="p-4 flex gap-3 text-sm group hover:bg-muted/5">
                <div className="text-xs text-muted-foreground tabular-nums pt-0.5 shrink-0 w-16">
                  {timeStr}
                </div>
                <div className="shrink-0 pt-0.5">
                  {evt.success !== false ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{evt.tool_name}</span>
                    {evt.args_summary && (
                      <span title={evt.args_summary} className="cursor-help text-muted-foreground shrink-0">
                        <Info className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    {evt.result_summary || 'No details provided'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
