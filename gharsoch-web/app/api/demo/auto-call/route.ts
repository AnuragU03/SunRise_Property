/**
 * /api/demo/auto-call
 *
 * Called once on app startup (via instrumentation.ts) to:
 *  1. Ensure the two demo warm leads exist in the DB (idempotent seed)
 *  2. Trigger a re-engage voice call to each lead one after the other
 *     so the voice agent tries to fix an appointment with Ajit Jawlekar
 *
 * The call uses VOICE_TRANSPORT=webrtc (no SIP carrier needed), so each
 * triggered call creates a LiveKit room + a browser join URL logged in
 * the call record. The voice agent books appointments and updates call status.
 *
 * GET /api/demo/auto-call — status check
 * POST /api/demo/auto-call — seed + trigger (called by startup hook)
 */
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { triggerReengageCall } from '@/lib/voiceRuntime'

// In-memory guard so multiple hot-reloads don't re-trigger calls every time
let alreadyRan = false

export async function GET() {
  return NextResponse.json({ alreadyRan, status: 'ok' })
}

export async function POST() {
  if (alreadyRan) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already ran this session' })
  }

  try {
    const leads = await getCollection('leads')
    const properties = await getCollection('properties')
    const brokerId = process.env.DEFAULT_BROKER_ID
    const brokerName = process.env.VOICE_BROKER_NAME || 'Ajit Jawlekar'

    if (!brokerId) {
      return NextResponse.json({ ok: false, error: 'DEFAULT_BROKER_ID not set' }, { status: 500 })
    }

    // ── Step 1: Ensure demo leads exist ────────────────────────────────────
    const powaiProp = await properties.findOne({
      location: { $regex: 'powai', $options: 'i' },
      status: 'available',
      is_deleted: { $ne: true },
    })
    const andheriProp = await properties.findOne({
      location: { $regex: 'andheri', $options: 'i' },
      status: 'available',
      is_deleted: { $ne: true },
    })

    const now = new Date()
    const DEMO_LEADS = [
      {
        phone: '+917001000001',
        name: 'Rajesh Mehra',
        builder_interest: 'Lodha Group',
        location_pref: powaiProp?.location || 'Powai',
        place: (powaiProp as any)?.city || 'Mumbai',
        property_type: '2BHK',
        budget_range: '1.5-2 cr',
        matched_property_id: powaiProp ? String(powaiProp._id) : '',
        matched_property_title: (powaiProp as any)?.title || 'Lodha Sterling',
        notes: 'Interested in Lodha Group projects in Powai. Warm lead from builder event.',
        last_visit_property: (powaiProp as any)?.title || 'Lodha Sterling',
        last_visit_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        last_visit_summary: 'Visited Lodha Sterling, liked the amenities, asked about 2BHK pricing. Main objection was possession timeline.',
        last_visit_type: 'office_walkin' as const,
      },
      {
        phone: '+917001000002',
        name: 'Priya Sharma',
        builder_interest: 'Godrej Properties',
        location_pref: andheriProp?.location || 'Andheri East',
        place: (andheriProp as any)?.city || 'Mumbai',
        property_type: '3BHK',
        budget_range: '2.5-3.5 cr',
        matched_property_id: andheriProp ? String(andheriProp._id) : '',
        matched_property_title: (andheriProp as any)?.title || 'Godrej Nest',
        notes: 'Interested in Godrej Properties. Warm lead referred by existing client.',
        last_visit_property: (andheriProp as any)?.title || 'Godrej Nest',
        last_visit_date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        last_visit_summary: 'Visited Godrej site, interested in 3BHK, concerned about possession timeline. Budget flexible.',
        last_visit_type: 'site_visit' as const,
      },
    ]

    const seededLeadIds: string[] = []

    for (const demo of DEMO_LEADS) {
      const leadDoc = {
        name: demo.name,
        phone: demo.phone,
        broker_id: brokerId,
        status: 'warm',
        interest_level: 'warm',
        is_warm_lead: true,
        dnd_status: false,
        is_deleted: false,
        is_demo: true,
        preferred_language: 'hi',
        budget_range: demo.budget_range,
        property_type: demo.property_type,
        location_pref: demo.location_pref,
        place: demo.place,
        notes: demo.notes,
        builder_interest: demo.builder_interest,
        matched_property_id: demo.matched_property_id,
        matched_property_title: demo.matched_property_title,
        last_visit_type: demo.last_visit_type,
        last_visit_property: demo.last_visit_property,
        last_visit_date: demo.last_visit_date,
        last_visit_summary: demo.last_visit_summary,
        purpose: 'buy',
        qualification_status: 'qualified',
        source: 'demo_seed',
        email: '',
        assigned_agent_id: '',
        lead_score: 70,
        follow_up_count: 1,
        total_calls: 0,
        first_call_completed: false,
        customer_requirements: `${demo.property_type}, ${demo.budget_range}, ${demo.location_pref}`,
        timeline: '3-6 months',
        objections: '',
        followup_reason: 'Warm lead from builder event',
        last_contacted_at: demo.last_visit_date,
        next_follow_up_date: new Date(now.getTime() - 60 * 60 * 1000),
        last_reengage_attempted_at: null,
        updated_at: now,
      }

      const existing = await leads.findOne({ phone: demo.phone })
      let leadId: string
      if (existing) {
        await leads.updateOne({ phone: demo.phone }, { $set: leadDoc })
        leadId = String(existing._id)
      } else {
        const r = await leads.insertOne({ ...leadDoc, created_at: now })
        leadId = String(r.insertedId)
      }
      seededLeadIds.push(leadId)
    }

    // ── Step 2: Trigger re-engage voice calls one after the other ──────────
    const results = []
    for (let i = 0; i < DEMO_LEADS.length; i++) {
      const demo = DEMO_LEADS[i]
      const leadId = seededLeadIds[i]

      const result = await triggerReengageCall({
        phone: demo.phone,
        name: demo.name,
        visitType: demo.last_visit_type,
        lastVisitProperty: demo.matched_property_title,
        lastVisitDateHuman: demo.last_visit_date.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
        }),
        daysSinceVisit: Math.round((now.getTime() - demo.last_visit_date.getTime()) / (24 * 60 * 60 * 1000)),
        lastVisitSummary: demo.last_visit_summary,
        propertyType: demo.property_type,
        locationPref: demo.location_pref,
        budgetRange: demo.budget_range,
        brokerName,
        leadId,
      })

      // Stamp demo lead_id and builder interest on the call record
      if (result.success && result.voiceCallId) {
        const calls = await getCollection('calls')
        await calls.updateOne(
          { voice_call_id: result.voiceCallId },
          {
            $set: {
              lead_id: leadId,
              lead_name: demo.name,
              lead_phone: demo.phone,
              builder_interest: demo.builder_interest,
              is_demo_call: true,
              updated_at: now,
            },
          }
        )
      }

      results.push({
        lead: demo.name,
        phone: demo.phone,
        builder: demo.builder_interest,
        success: result.success,
        callId: result.voiceCallId,
        roomName: result.roomName,
        joinUrl: result.joinUrl,
        status: result.status,
        error: result.error,
      })

      // Small delay between calls to avoid simultaneous room creation issues
      if (i < DEMO_LEADS.length - 1) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    alreadyRan = true

    return NextResponse.json({
      ok: true,
      seededLeads: seededLeadIds.length,
      calls: results,
    })
  } catch (err: any) {
    console.error('[demo/auto-call] error:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
