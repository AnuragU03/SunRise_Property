import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiPhoneCall, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface LeadDetailsSheetProps {
  lead: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailsSheet({ lead, open, onOpenChange }: LeadDetailsSheetProps) {
  if (!lead) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-2xl">{lead.name || 'Unnamed'}</SheetTitle>
              </div>
              <SheetDescription className="text-sm mt-1 font-medium">{lead.phone}</SheetDescription>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Badge variant="outline" className="uppercase bg-background shadow-sm px-3 py-1">{lead.status?.replace('_', ' ')}</Badge>
              <Button asChild size="sm" variant="default" className="h-8 text-xs px-4 shadow-sm">
                <Link href={`/leads/${lead._id}`}>Open full page →</Link>
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            
            {/* AI Extracted Requirements */}
            <div className="bg-card p-5 rounded-xl border shadow-sm">
              <h3 className="text-xs font-bold mb-4 uppercase tracking-wider text-muted-foreground">AI Extracted Requirements</h3>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs mb-1.5 font-medium">Budget</span>
                  <span className="font-semibold">{lead.budget_range || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1.5 font-medium">Location</span>
                  <span className="font-semibold">{lead.location_pref || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1.5 font-medium">Property Type</span>
                  <span className="font-semibold">{lead.property_type || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1.5 font-medium">Timeline</span>
                  <span className="font-semibold">{lead.timeline || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground">Objections / Notes</h3>
              <div className="text-sm space-y-3">
                {lead.objections ? (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive/90 p-3 rounded-lg font-medium">
                    <span className="font-bold mr-2">Objection:</span> {lead.objections}
                  </div>
                ) : null}
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{lead.notes || 'No notes available.'}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium text-muted-foreground bg-muted/40 p-4 rounded-xl border">
              <div className="flex items-center gap-2"><FiMapPin className="text-primary/70" /> Source: {lead.source || 'Unknown'}</div>
              <div className="flex items-center gap-2"><FiCalendar className="text-primary/70" /> Next Follow-up: {lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString() : 'None'}</div>
              <div className="flex items-center gap-2"><FiPhoneCall className="text-primary/70" /> Total Calls: {lead.total_calls || 0}</div>
              <div className="flex items-center gap-2"><FiClock className="text-primary/70" /> Created: {new Date(lead.created_at).toLocaleDateString()}</div>
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
