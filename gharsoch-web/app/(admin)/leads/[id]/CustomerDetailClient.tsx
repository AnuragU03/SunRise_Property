'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SerializedLead } from '@/lib/services/leadService'
import type { SerializedActionItem } from '@/lib/services/actionItemService'
import { ActionItemsTab } from '@/components/leads/ActionItemsTab'
import { PaymentsTab } from '@/components/leads/PaymentsTab'
import { CallHistoryTab } from '@/components/leads/CallHistoryTab'
import { deriveNextStep, lifecycleLabel, deriveLastContact } from '@/lib/ui/leadDerivations'
import { LiveCallModal } from '@/components/leads/LiveCallModal'
import { Info } from 'lucide-react'
import type { SerializedCall } from '@/lib/services/callService'
import { ProfileTab } from '@/components/leads/ProfileTab'
import { ManualOverrideDialog } from '@/components/leads/ManualOverrideDialog'
import { toast } from 'sonner'

export function CustomerDetailClient({ 
  initialLead, 
  initialActionItems,
  initialCalls = []
}: { 
  initialLead: SerializedLead
  initialActionItems: SerializedActionItem[]
  initialCalls?: SerializedCall[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams?.get('tab') || 'profile'
  
  const [lead, setLead] = useState(initialLead)
  const [actions, setActions] = useState(initialActionItems)
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false)
  const [activeCallId, setActiveCallId] = useState<string | undefined>()
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isAutoOpened, setIsAutoOpened] = useState(true)

  useEffect(() => {
    // Statuses that mean "a call is live or waiting to be answered right now".
    // webrtc_ready matters: in test transport the agent waits for a human to join,
    // so the modal must open BEFORE the call reaches in_progress.
    const ACTIVE_STATUSES = ['in_progress', 'in-progress', 'ringing', 'webrtc_ready', 'room_created', 'queued']

    const checkActiveCall = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const res = await fetch(`/api/calls/lead/${lead._id}`)
        const data = await res.json()
        const latest = data.data?.[0]
        const status = String(latest?.call_status || latest?.status || '').toLowerCase()
        // Only treat recent calls as active — a stale webrtc_ready from a dead room shouldn't reopen the modal.
        const ageMs = latest?.created_at ? Date.now() - new Date(latest.created_at).getTime() : Infinity
        if (latest && ACTIVE_STATUSES.includes(status) && ageMs < 15 * 60 * 1000) {
          if (!activeCallId) {
            setIsAutoOpened(true) // Assumed auto opened if detected by polling first
          }
          setActiveCallId(latest._id)
          setIsLiveCallOpen(true)
          setIsCallActive(true)
        } else {
          setIsLiveCallOpen(false)
          setActiveCallId(undefined)
          setIsCallActive(false)
        }
      } catch (e) {
        console.error('Failed to poll active calls', e)
      }
    }
    
    checkActiveCall()
    // Poll fast so the in-app call console appears promptly once the room is ready
    // (was 5s — felt laggy when answering a freshly-fired call).
    const interval = setInterval(checkActiveCall, 2000)
    return () => clearInterval(interval)
  }, [lead._id, activeCallId])

  const handleManualCall = async () => {
    try {
      const res = await fetch('/api/calls/manual-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead_id: lead._id,
          source: 'manual_broker_override'
        })
      })
      const data = await res.json()
      if (data.ok && data.call_id) {
        setIsAutoOpened(false)
        setActiveCallId(data.call_id)
        setIsLiveCallOpen(true)
        setIsCallActive(true)
      } else {
        toast.error(data.error || 'Manual call failed')
      }
    } catch (err) {
      toast.error('Network error initiating manual call')
    }
  }

  const handleTabChange = (val: string) => {
    router.replace(`/leads/${lead._id}?tab=${val}`, { scroll: false })
  }

  const handleLeadUpdate = async (patch: Partial<SerializedLead>) => {
    // Optimistic update
    setLead({ ...lead, ...patch })
    
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      const data = await res.json()
      if (data.success && data.data) {
        setLead(data.data) // Refresh with server's representation
        router.refresh() // To update SSR components (e.g. sidebar counts)
      } else {
        throw new Error('Failed to update lead')
      }
    } catch (e) {
      console.error(e)
      setLead(lead) // Revert optimistic update
    }
  }

  const nextStep = useMemo(() => deriveNextStep(lead, actions), [lead, actions])
  const lifecycle = useMemo(() => lifecycleLabel(lead, actions), [lead, actions])
  const lastContact = useMemo(() => deriveLastContact(lead, initialCalls), [lead, initialCalls])

  return (
    <div className="flex flex-col h-full space-y-4 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
        <Link href="/leads" className="hover:text-foreground flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to leads
        </Link>
      </div>

      {(lead.dnd_status || lead.dnc_flag) && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center">
          <span className="font-semibold mr-2">⚠️ Do Not Call</span> — customer requested no contact
        </div>
      )}

      {/* Header Card Scaffold */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-bold">{lead.name || 'Unnamed Lead'}</h1>
              <Badge variant="secondary" className="capitalize">{lead.status?.replace('_', ' ') || 'New'}</Badge>
            </div>
            <div className="text-muted-foreground text-sm flex items-center space-x-4 mb-4">
              <span>{lead.phone}</span>
              <span>•</span>
              <span>💰 {lead.budget_range || 'Unknown budget'}</span>
              <span>•</span>
              <span>📍 {lead.location_pref || lead.place || 'Unknown location'}</span>
            </div>
            
            <div className="text-sm font-medium space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">Lifecycle:</span> 
                <span>{lifecycle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">Next step:</span> 
                <span className={nextStep.urgency === 'high' ? 'text-destructive font-semibold' : ''}>
                  {nextStep.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">Last contact:</span> 
                <span className="flex items-center gap-1">
                  {lastContact.date ? new Date(lastContact.date).toLocaleDateString() : 'Never contacted'}
                  {lastContact.source === 'call_history' && (
                    <span title="Derived from call history" className="cursor-help text-muted-foreground">
                      <Info className="w-3 h-3" />
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-between h-full space-y-6">
            <div className="text-sm text-muted-foreground text-right">
              Total calls: <span className="font-medium text-foreground">{lead.total_calls || 0}</span>
            </div>
            <Button 
              size="lg" 
              className="rounded-full px-6 shadow-md" 
              disabled={lead.dnd_status || lead.dnc_flag || isCallActive}
              onClick={() => setShowOverrideDialog(true)}
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="calls">Call History</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-0">
          <div className="bg-card border rounded-lg p-6">
            <ProfileTab lead={lead} onUpdate={handleLeadUpdate} />
          </div>
        </TabsContent>
        <TabsContent value="calls" className="mt-0">
          <CallHistoryTab leadId={lead._id} />
        </TabsContent>
        <TabsContent value="payments" className="mt-0">
          <PaymentsTab leadId={lead._id} />
        </TabsContent>
        <TabsContent value="actions" className="mt-0">
          <ActionItemsTab leadId={lead._id} actions={actions} setActions={setActions} />
        </TabsContent>
      </Tabs>

      <LiveCallModal 
        open={isLiveCallOpen} 
        onOpenChange={setIsLiveCallOpen} 
        lead={lead}
        activeCallId={activeCallId}
        isAutoOpened={isAutoOpened}
      />

      <ManualOverrideDialog
        open={showOverrideDialog}
        lead={lead}
        onCancel={() => setShowOverrideDialog(false)}
        onConfirm={async () => {
          setShowOverrideDialog(false)
          await handleManualCall()
        }}
      />
    </div>
  )
}
