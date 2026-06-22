/**
 * POST /api/demo/load-and-call
 *
 * Called from the "Load from DB & Call" button in the Leads Pipeline.
 * Seeds/refreshes demo warm leads from MongoDB, then triggers sequential
 * re-engage voice calls. The voice agent books appointments and updates
 * call status — appointment section reflects the outcome automatically.
 *
 * Returns the call results (room names + join URLs) so the UI can show them.
 */
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { triggerReengageCall } from '@/lib/voiceRuntime'
import { callEventBus } from '@/lib/callEvents'
import type { CallCompletedEvent } from '@/lib/callEvents'

function waitForCallCompletion(voiceCallId: string, maxWaitMs = 10 * 60 * 1000): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false
    const onCompleted = (ev: CallCompletedEvent) => {
      if (ev.voiceCallId === voiceCallId || ev.roomName === voiceCallId) {
        cleanup()
        resolve()
      }
    }
    const timer = setTimeout(() => {
      if (!resolved) { cleanup(); resolve() }
    }, maxWaitMs)
    function cleanup() {
      if (resolved) return
      resolved = true
      clearTimeout(timer)
      callEventBus.off('call:completed', onCompleted)
    }
    callEventBus.on('call:completed', onCompleted)
  })
}

export async function POST() {
  try {
    const leads = await getCollection('leads')
    const properties = await getCollection('properties')
    const callsCollection = await getCollection('calls')
    const brokerId = process.env.DEFAULT_BROKER_ID
    const brokerName = process.env.VOICE_BROKER_NAME || 'Ajit Jawlekar'

    if (!brokerId) {
      return NextResponse.json({ ok: false, error: 'DEFAULT_BROKER_ID not set' }, { status: 500 })
    }

    // Find warm demo leads from DB (seeded by seed-demo-leads or auto-call startup)
    const demoLeads = await leads.find({
      is_demo: true,
      is_warm_lead: true,
      dnd_status: { $ne: true },
      is_deleted: { $ne: true },
    }).toArray()

    if (demoLeads.length === 0) {
      // No demo leads — seed them first
      const powaiProp: any = await properties.findOne({
        location: { $regex: 'powai', $options: 'i' }, status: 'available', is_deleted: { $ne: true },
      })
      const andheriProp: any = await properties.findOne({
        location: { $regex: 'andheri', $options: 'i' }, status: 'available', is_deleted: { $ne: true },
      })

      const now = new Date()
      const SEED = [
        {
          phone: '+917001000001', name: 'Rajesh Mehra', builder_interest: 'Lodha Group',
          location_pref: powaiProp?.location || 'Powai', place: powaiProp?.city || 'Mumbai',
          property_type: '2BHK', budget_range: '1.5-2 cr',
          matched_property_id: powaiProp ? String(powaiProp._id) : '',
          matched_property_title: powaiProp?.title || 'Lodha Sterling',
          last_visit_property: powaiProp?.title || 'Lodha Sterling',
          last_visit_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          last_visit_summary: 'Visited Lodha Sterling, liked amenities, asked about 2BHK pricing.',
          last_visit_type: 'office_walkin',
        },
        {
          phone: '+917001000002', name: 'Priya Sharma', builder_interest: 'Godrej Properties',
          location_pref: andheriProp?.location || 'Andheri East', place: andheriProp?.city || 'Mumbai',
          property_type: '3BHK', budget_range: '2.5-3.5 cr',
          matched_property_id: andheriProp ? String(andheriProp._id) : '',
          matched_property_title: andheriProp?.title || 'Godrej Nest',
          last_visit_property: andheriProp?.title || 'Godrej Nest',
          last_visit_date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          last_visit_summary: 'Visited Godrej site, interested in 3BHK, concerned about possession.',
          last_visit_type: 'site_visit',
        },
      ]

      for (const s of SEED) {
        await leads.updateOne(
          { phone: s.phone },
          {
            $set: {
              ...s, broker_id: brokerId, status: 'warm', interest_level: 'warm',
              is_warm_lead: true, dnd_status: false, is_deleted: false, is_demo: true,
              preferred_language: 'hi', purpose: 'buy', qualification_status: 'qualified',
              source: 'demo_seed', updated_at: now,
            },
            $setOnInsert: { created_at: now },
          },
          { upsert: true }
        )
      }

      // Re-fetch after seeding
      const freshLeads = await leads.find({
        is_demo: true, is_warm_lead: true, dnd_status: { $ne: true }, is_deleted: { $ne: true },
      }).toArray()
      demoLeads.push(...freshLeads)
    }

    // Trigger sequential voice calls
    const results: any[] = []
    for (let i = 0; i < demoLeads.length; i++) {
      const lead = demoLeads[i] as any
      const now = new Date()

      const result = await triggerReengageCall({
        phone: lead.phone,
        name: lead.name,
        visitType: lead.last_visit_type || 'office_walkin',
        lastVisitProperty: lead.matched_property_title || lead.last_visit_property || '',
        lastVisitDateHuman: (lead.last_visit_date || now).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
        }),
        daysSinceVisit: Math.round(
          (now.getTime() - new Date(lead.last_visit_date || now).getTime()) / (24 * 60 * 60 * 1000)
        ),
        lastVisitSummary: lead.last_visit_summary || '',
        propertyType: lead.property_type,
        locationPref: lead.location_pref,
        budgetRange: lead.budget_range,
        brokerName,
        leadId: String(lead._id),
      })

      if (result.success && result.voiceCallId) {
        await callsCollection.updateOne(
          { voice_call_id: result.voiceCallId },
          { $set: { lead_id: String(lead._id), lead_name: lead.name, lead_phone: lead.phone, builder_interest: lead.builder_interest, is_demo_call: true, updated_at: now } }
        )
      }

      results.push({
        lead: lead.name,
        phone: lead.phone,
        builder: lead.builder_interest || '',
        success: result.success,
        callId: result.voiceCallId,
        roomName: result.roomName,
        joinUrl: result.joinUrl,
        status: result.status,
        error: result.error,
      })

      // Wait for current call to complete before starting next
      if (result.success && result.voiceCallId && i < demoLeads.length - 1) {
        await waitForCallCompletion(result.voiceCallId)
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    return NextResponse.json({ ok: true, leadsFound: demoLeads.length, calls: results })
  } catch (err: any) {
    console.error('[demo/load-and-call] error:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
