'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, Calendar, AlertCircle, PhoneOutgoing } from 'lucide-react'
import Link from 'next/link'

interface ReengagerStats {
  totals: { last_24h: number; last_7d: number; last_30d: number }
  conversion: {
    rate_pct: number
    conversions_30d: number
    total_calls_30d: number
  }
  reengaged_leads: number
  last_run: string | null
  recent_calls: Array<{
    _id: string
    lead_name: string
    lead_id: string
    created_at: string
    duration_sec: number
    outcome: string
  }>
}

const OUTCOME_STYLES: Record<string, string> = {
  appointment_booked: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  callback_requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  not_interested_now: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  hard_no: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  dnc_requested: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200',
  no_answer: 'bg-stone-100 text-stone-600 dark:bg-stone-800/30 dark:text-stone-400',
  pending: 'bg-stone-100 text-stone-600 dark:bg-stone-800/30 dark:text-stone-400',
  queued: 'bg-stone-100 text-stone-600 dark:bg-stone-800/30 dark:text-stone-400',
}

function formatDuration(sec: number) {
  if (!sec || sec < 1) return '0s'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function ReengagerPanel() {
  const [stats, setStats] = useState<ReengagerStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = () => {
    fetch('/api/agents/re-engager/dashboard')
      .then(r => r.json())
      .then(setStats)
      .catch(err => console.error('[ReengagerPanel] fetch error:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)' }}>
          Loading re-engager stats…
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="panel" style={{ borderColor: 'var(--amber-border, var(--hairline))' }}>
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: 'var(--amber-50, #fffbeb)', border: '1px solid var(--amber-200, #fde68a)' }}>
            <RefreshCw size={16} strokeWidth={1.8} style={{ color: 'var(--amber-600, #d97706)' }} />
          </span>
          <div>
            <div className="panel-title">The Re-engager</div>
            <div className="panel-sub">Agent #10 · Visit-data-aware re-engagement calls</div>
          </div>
        </div>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--hairline)', color: 'var(--ink-3)', fontWeight: 500 }}>
          {stats.last_run ? `Last run ${formatTime(stats.last_run)}` : 'No runs yet'}
        </span>
      </div>

      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Volume counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>24h</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>{stats.totals.last_24h}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>7 days</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>{stats.totals.last_7d}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>30 days</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>{stats.totals.last_30d}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>Re-engaged leads</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>{stats.reengaged_leads}</div>
          </div>
        </div>

        {/* Conversion card */}
        <div style={{ background: 'var(--amber-50, #fffbeb)', border: '1px solid var(--amber-200, #fde68a)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingUp size={14} strokeWidth={1.8} style={{ color: 'var(--amber-700, #b45309)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber-900, #78350f)' }}>Conversion (30d)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--amber-700, #b45309)' }}>{stats.conversion.rate_pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                {stats.conversion.conversions_30d} of {stats.conversion.total_calls_30d} calls → booked
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneOutgoing size={16} style={{ color: 'var(--amber-600, #d97706)' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{stats.conversion.total_calls_30d}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Total calls</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent calls */}
        {stats.recent_calls.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
              <Calendar size={14} strokeWidth={1.8} />
              Recent re-engage calls
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.recent_calls.map(call => (
                <Link
                  key={call._id}
                  href={`/calls/${call._id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--hairline)', background: 'var(--surface)', textDecoration: 'none', color: 'inherit', transition: 'background 150ms' }}
                  className="hover:bg-surface-2"
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{call.lead_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {formatDuration(call.duration_sec)} · {formatTime(call.created_at)}
                    </div>
                  </div>
                  <span
                    style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}
                    className={OUTCOME_STYLES[call.outcome] || OUTCOME_STYLES.pending}
                  >
                    {call.outcome.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {stats.recent_calls.length === 0 && stats.totals.last_30d === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, borderRadius: 10, background: 'var(--surface-2)', fontSize: 13, color: 'var(--ink-3)' }}>
            <AlertCircle size={14} />
            No re-engagement calls yet. Add a client with Previous Engagement data to trigger one.
          </div>
        )}
      </div>
    </div>
  )
}
