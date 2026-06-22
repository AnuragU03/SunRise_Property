import { getDb } from '@/lib/mongodb'
import type { Appointment } from '@/models/Appointment'
import type { Campaign } from '@/models/Campaign'
import type { Lead } from '@/models/Lead'
import type { AgentDashboardRun } from '@/lib/services/agentDashboardService'

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export type DashboardLead = Omit<Lead, '_id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_follow_up_date'> & {
  _id: string
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  next_follow_up_date: string | null
}

export type DashboardAppointment = Omit<Appointment, '_id' | 'scheduled_at' | 'created_at' | 'updated_at'> & {
  _id: string
  scheduled_at: string
  created_at: string
  updated_at: string
}

export type DashboardCampaign = Omit<Campaign, '_id' | 'created_at' | 'updated_at' | 'start_date' | 'end_date' | 'started_at' | 'deferred_until'> & {
  _id: string
  created_at: string
  updated_at: string
  start_date: string | null
  end_date: string | null
  started_at?: string | null
  deferred_until?: string | null
  connected_count?: number
  booked_count?: number
}

export type DashboardData = {
  today: {
    calls_made: number
    appointments_today: number
    new_leads: number
    agent_runs: number
  }
  yesterday: {
    calls_made: number
    appointments_today: number
    new_leads: number
    agent_runs: number
  }
  urgent_leads: DashboardLead[]
  recent_runs: AgentDashboardRun[]
  upcoming_appointments: DashboardAppointment[]
  active_campaigns: DashboardCampaign[]
}

function istDayRange(date = new Date()) {
  const istNow = new Date(date.getTime() + IST_OFFSET_MS)
  const startIst = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate())
  const start = new Date(startIst - IST_OFFSET_MS)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end, startIso: start.toISOString(), endIso: end.toISOString() }
}

function previousRange(range: ReturnType<typeof istDayRange>) {
  const start = new Date(range.start.getTime() - 24 * 60 * 60 * 1000)
  const end = new Date(range.end.getTime() - 24 * 60 * 60 * 1000)
  return { start, end, startIso: start.toISOString(), endIso: end.toISOString() }
}

function dateRangeFilter(field: string, range: { start: Date; end: Date; startIso: string; endIso: string }) {
  return {
    $or: [
      { [field]: { $gte: range.start, $lt: range.end } },
      { [field]: { $gte: range.startIso, $lt: range.endIso } },
    ],
  }
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toStringId(value: unknown) {
  if (!value) return undefined
  return typeof value === 'string' ? value : String(value)
}

function serializeLead(lead: any): DashboardLead {
  return {
    ...lead,
    _id: String(lead._id),
    client_id: toStringId(lead.client_id),
    matched_property_id: toStringId(lead.matched_property_id),
    created_at: toIso(lead.created_at) || new Date().toISOString(),
    updated_at: toIso(lead.updated_at) || new Date().toISOString(),
    last_contacted_at: toIso(lead.last_contacted_at),
    next_follow_up_date: toIso(lead.next_follow_up_date),
  }
}

function serializeAppointment(appointment: any): DashboardAppointment {
  return {
    ...appointment,
    _id: String(appointment._id),
    scheduled_at: toIso(appointment.scheduled_at) || new Date().toISOString(),
    created_at: toIso(appointment.created_at) || new Date().toISOString(),
    updated_at: toIso(appointment.updated_at) || new Date().toISOString(),
  }
}

function serializeCampaign(campaign: any): DashboardCampaign {
  return {
    ...campaign,
    _id: String(campaign._id),
    created_at: toIso(campaign.created_at) || new Date().toISOString(),
    updated_at: toIso(campaign.updated_at) || new Date().toISOString(),
    start_date: toIso(campaign.start_date),
    end_date: toIso(campaign.end_date),
    started_at: toIso(campaign.started_at),
    deferred_until: toIso(campaign.deferred_until),
  }
}

function serializeRun(run: any): AgentDashboardRun {
  return {
    ...run,
    _id: run._id ? String(run._id) : undefined,
    agent_id: run.agent_id || 'unknown_agent',
    agent_name: run.agent_name || run.agent_id || 'Agent',
    started_at: toIso(run.started_at || run.created_at) || new Date().toISOString(),
    created_at: toIso(run.created_at) || new Date().toISOString(),
    updated_at: toIso(run.updated_at) || new Date().toISOString(),
    start_time: toIso(run.start_time || run.started_at || run.created_at) || new Date().toISOString(),
    end_time: toIso(run.end_time || run.completed_at),
    completed_at: toIso(run.completed_at || run.end_time),
    reasoning_steps: Array.isArray(run.reasoning_steps) ? run.reasoning_steps : [],
    actions: Array.isArray(run.actions) ? run.actions : [],
    errors: Array.isArray(run.errors) ? run.errors : [],
    input_data: run.input_data || {},
    output_data: run.output_data || {},
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const db = await getDb()
  const calls = db.collection('calls')
  const appointments = db.collection('appointments')
  const leads = db.collection('leads')
  const runs = db.collection('agent_execution_logs')
  const campaigns = db.collection('campaigns')

  const today = istDayRange()
  const yesterday = previousRange(today)
  const now = new Date()
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const [
    callsToday,
    appointmentsToday,
    newLeadsToday,
    agentRunsToday,
    callsYesterday,
    appointmentsYesterday,
    newLeadsYesterday,
    agentRunsYesterday,
    urgentLeadDocs,
    recentRunDocs,
    upcomingAppointmentDocs,
    activeCampaignDocs,
  ] = await Promise.all([
    calls.countDocuments(dateRangeFilter('created_at', today)),
    appointments.countDocuments(dateRangeFilter('scheduled_at', today)),
    leads.countDocuments(dateRangeFilter('created_at', today)),
    runs.countDocuments(dateRangeFilter('created_at', today)),
    calls.countDocuments(dateRangeFilter('created_at', yesterday)),
    appointments.countDocuments(dateRangeFilter('scheduled_at', yesterday)),
    leads.countDocuments(dateRangeFilter('created_at', yesterday)),
    runs.countDocuments(dateRangeFilter('created_at', yesterday)),
    leads
      .aggregate([
        {
          $match: {
            $or: [
              { status: 'hot' },
              { interest_level: 'hot' },
              { next_follow_up_date: { $lt: now } },
              { next_follow_up_date: { $lt: now.toISOString() } },
            ],
          },
        },
        {
          $addFields: {
            urgency_rank: {
              $cond: [{ $in: ['$interest_level', ['hot', 'Hot', 'HOT']] }, 1, 0],
            },
          },
        },
        { $sort: { urgency_rank: -1, next_follow_up_date: 1, updated_at: -1 } },
        { $limit: 5 },
      ])
      .toArray(),
    runs.find({}).sort({ started_at: -1, created_at: -1, updated_at: -1 }).limit(6).toArray(),
    appointments
      .find({
        $or: [
          { scheduled_at: { $gte: now, $lt: next24h } },
          { scheduled_at: { $gte: now.toISOString(), $lt: next24h.toISOString() } },
        ],
      })
      .sort({ scheduled_at: 1 })
      .limit(3)
      .toArray(),
    campaigns.find({ status: 'dialing' }).sort({ started_at: -1, created_at: -1, updated_at: -1 }).limit(3).toArray(),
  ])

  const urgent_leads = urgentLeadDocs.map(serializeLead)

  return {
    today: {
      calls_made: callsToday,
      appointments_today: appointmentsToday,
      new_leads: newLeadsToday,
      agent_runs: agentRunsToday,
    },
    yesterday: {
      calls_made: callsYesterday,
      appointments_today: appointmentsYesterday,
      new_leads: newLeadsYesterday,
      agent_runs: agentRunsYesterday,
    },
    urgent_leads,
    recent_runs: recentRunDocs.map(serializeRun),
    upcoming_appointments: upcomingAppointmentDocs.map(serializeAppointment),
    active_campaigns: activeCampaignDocs.map(serializeCampaign),
  }
}
