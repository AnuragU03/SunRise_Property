import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Clock, FileText, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import type { SerializedCall } from '@/lib/services/callService'

interface CallHistoryRowProps {
  call: SerializedCall & { sentiment_label?: string; transcript?: string; recording_url?: string }
  onAnalyzed: () => void
}

export function CallHistoryRow({ call, onAnalyzed }: CallHistoryRowProps) {
  const [expanded, setExpanded] = useState(false)

  const isAnalyzed = !!call.analyzed_at
  const sentiment = call.sentiment_label || 'neutral'
  
  const getSentimentColor = (s: string) => {
    switch(s.toLowerCase()) {
      case 'positive': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'negative': return 'bg-red-500/10 text-red-600 border-red-500/20'
      default: return 'bg-muted/50 text-muted-foreground border-border'
    }
  }

  return (
    <div className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="p-4 flex items-start justify-between bg-card hover:bg-muted/10 transition-colors">
        <div className="flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1">
            <Phone className="h-4 w-4" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {new Date(call.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </span>
              <Badge variant="outline" className="capitalize h-5 text-[10px]">
                {call.call_outcome?.replace(/_/g, ' ') || call.disposition}
              </Badge>
              {isAnalyzed && (
                <Badge variant="outline" className={`capitalize h-5 text-[10px] border ${getSentimentColor(sentiment)}`}>
                  {sentiment} Sentiment
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.round((call.duration || 0) / 60)} min {(call.duration || 0) % 60} sec
              </div>
            </div>

            <p className="text-sm text-foreground mt-2 line-clamp-2">
              {call.call_summary || 'No summary available.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
          <Link
            href={`/calls/${call._id}`}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            View full review
            <ArrowRight className="w-3 h-3" />
          </Link>
          {isAnalyzed && (
            <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
              <FileText className="h-4 w-4 mr-2" />
              {expanded ? 'Hide Details' : 'View Details'}
              {expanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-muted/20 border-t text-sm">
          {call.recording_url && (
            <div className="mb-4 flex items-center gap-3">
              <audio src={call.recording_url} controls className="h-8 w-full max-w-md opacity-80" />
            </div>
          )}
          {call.transcript && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transcript</h4>
              <div className="bg-background rounded-lg p-3 border font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                {call.transcript}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

