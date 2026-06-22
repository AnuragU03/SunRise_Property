
/**
 * POST /api/demo/load-leads
 *
 * Seeds a realistic mix of warm leads with ALL status types into MongoDB,
 * then returns ONLY the 'cold' leads — these are the ones eligible for calling.
 *
 * Status lifecycle: cold → contacted → follow_up / booked / dnd
 * The "Start Calling" button only dials cold leads.
 *
 * Does NOT trigger any voice calls.
 */
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function POST() {
  try {
    const leads = await getCollection('leads')
    const properties = await getCollection('properties')
    const brokerId = process.env.DEFAULT_BROKER_ID

    if (!brokerId) {
      return NextResponse.json({ ok: false, error: 'DEFAULT_BROKER_ID not set' }, { status: 500 })
    }

    // Find anchor properties by locality
    const findProp = async (regex: string) =>
      (await properties.findOne({ location: { $regex: regex, $options: 'i' }, status: 'available', is_deleted: { $ne: true } })) as any
    const powai = await findProp('powai')
    const andheri = await findProp('andheri')
    const thane = await findProp('thane|ghodbunder|majiwada')
    const bandra = await findProp('bandra')

    const now = new Date()
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
    const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

    const base = (o: any) => ({
      broker_id: brokerId,
      is_warm_lead: true,
      is_demo: true,
      is_deleted: false,
      dnd_status: o.status === 'dnd',
      preferred_language: 'hi',
      purpose: 'buy',
      qualification_status: 'qualified',
      source: 'demo_seed',
      email: '',
      assigned_agent_id: '',
      lead_score: 70,
      follow_up_count: 0,
      total_calls: o.total_calls || 0,
      first_call_completed: (o.total_calls || 0) > 0,
      timeline: '3-6 months',
      objections: '',
      last_reengage_attempted_at: null,
      created_at: now,
      updated_at: now,
      interest_level: o.interest_level || 'warm',
      next_follow_up_date: o.next_follow_up_date ?? null,
      last_contacted_at: o.last_contacted_at ?? null,
      ...o,
    })

    const SAMPLE_LEADS = [
      // ── COLD (will be called) ──
      base({
        name: 'Rajesh Mehra', phone: '+917001000001', status: 'cold', builder_interest: 'Lodha Group',
        location_pref: powai?.location || 'Powai', place: powai?.city || 'Mumbai',
        property_type: '2BHK', budget_range: '1.5-2 cr',
        matched_property_id: powai ? String(powai._id) : '', matched_property_title: powai?.title || 'Lodha Sterling',
        last_visit_property: powai?.title || 'Lodha Sterling', last_visit_date: daysAgo(30), last_visit_type: 'office_walkin',
        last_visit_summary: 'Visited Lodha Sterling, liked amenities, asked about 2BHK pricing.',
        notes: 'Interested in Lodha Group projects in Powai.', customer_requirements: '2BHK, 1.5-2 cr, Powai',
      }),
      base({
        name: 'Priya Sharma', phone: '+917001000002', status: 'cold', builder_interest: 'Godrej Properties',
        location_pref: andheri?.location || 'Andheri East', place: andheri?.city || 'Mumbai',
        property_type: '3BHK', budget_range: '2.5-3.5 cr',
        matched_property_id: andheri ? String(andheri._id) : '', matched_property_title: andheri?.title || 'Godrej Nest',
        last_visit_property: andheri?.title || 'Godrej Nest', last_visit_date: daysAgo(45), last_visit_type: 'site_visit',
        last_visit_summary: 'Visited Godrej site, interested in 3BHK, budget flexible.',
        notes: 'Interested in Godrej Properties.', customer_requirements: '3BHK, 2.5-3.5 cr, Andheri',
      }),
      base({
        name: 'Amit Patel', phone: '+917001000003', status: 'cold', builder_interest: 'Hiranandani',
        location_pref: thane?.location || 'Ghodbunder Road', place: thane?.city || 'Thane',
        property_type: '2BHK', budget_range: '90 lakhs-1.2 cr',
        matched_property_id: thane ? String(thane._id) : '', matched_property_title: thane?.title || 'Hiranandani Estate',
        last_visit_property: thane?.title || 'Hiranandani Estate', last_visit_date: daysAgo(20), last_visit_type: 'phone_enquiry',
        last_visit_summary: 'Enquired about 2BHK in Thane, wants good connectivity.',
        notes: 'Looking for ready-to-move in Thane.', customer_requirements: '2BHK, 90L-1.2cr, Thane',
      }),
      // ── CONTACTED ──
      base({
        name: 'Sneha Kulkarni', phone: '+917001000004', status: 'contacted', builder_interest: 'Oberoi Realty',
        location_pref: bandra?.location || 'Bandra West', place: 'Mumbai', property_type: '3BHK', budget_range: '4-5 cr',
        last_visit_date: daysAgo(10), last_visit_type: 'site_visit', total_calls: 1,
        last_call_summary: 'Spoke about Oberoi 3BHK, considering options.', notes: 'Contacted once, evaluating.',
        last_contacted_at: daysAgo(2),
      }),
      // ── FOLLOW_UP ──
      base({
        name: 'Vikram Singh', phone: '+917001000005', status: 'follow_up', builder_interest: 'Kalpataru',
        location_pref: 'Kandivali East', place: 'Mumbai', property_type: '2BHK', budget_range: '1.2-1.5 cr', total_calls: 1,
        last_call_summary: 'Busy, asked to call back next week.', followup_reason: 'Customer requested callback',
        notes: 'Follow-up scheduled.', last_contacted_at: daysAgo(3), next_follow_up_date: daysFromNow(4),
      }),
      // ── BOOKED ──
      base({
        name: 'Anjali Desai', phone: '+917001000006', status: 'booked', builder_interest: 'Runwal', interest_level: 'hot',
        location_pref: 'Mulund West', place: 'Mumbai', property_type: '3BHK', budget_range: '2-2.5 cr', total_calls: 2,
        last_call_summary: 'Booked site visit for this weekend.', notes: 'Appointment booked.', last_contacted_at: daysAgo(1),
      }),
      // ── DND ──
      base({
        name: 'Ramesh Iyer', phone: '+917001000007', status: 'dnd', builder_interest: 'Dosti Realty', interest_level: 'cold',
        location_pref: 'Chembur', place: 'Mumbai', property_type: '2BHK', budget_range: '1-1.3 cr', total_calls: 1,
        last_call_summary: 'Not looking to buy for at least 6 months. Requested DND.', notes: 'DND — not interested for 6 months.',
        last_contacted_at: daysAgo(5),
      }),
    ]

    // Clear existing demo leads and reseed the full lifecycle set
    const deleted = await leads.deleteMany({ is_demo: true })
    await leads.insertMany(SAMPLE_LEADS as any)

    // Return ONLY cold leads (eligible for calling)
    const coldLeads = await leads.find({
      is_demo: true, status: 'cold', is_deleted: { $ne: true },
    }).sort({ created_at: 1 }).toArray()

    return NextResponse.json({
      ok: true,
      deleted: deleted.deletedCount,
      totalSeeded: SAMPLE_LEADS.length,
      coldLeads: coldLeads.length,
      leads: coldLeads.map((l: any) => ({ _id: String(l._id), name: l.name, phone: l.phone, builder: l.builder_interest })),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
