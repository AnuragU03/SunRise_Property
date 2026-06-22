'use client'

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import type { AgentDashboardSummary, HealthStripData } from '@/lib/services/agentDashboardService'

type StatCellBreakdown = {
  label: string
  value: string | number
}

type StatCell = {
  label?: string
  value?: string
  delta?: string
  empty?: boolean
  breakdown?: StatCellBreakdown[]
  breakdownNote?: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value)
}

function buildCells(health: HealthStripData, summaries?: AgentDashboardSummary[]): StatCell[] {
  const agentRunBreakdown = summaries?.map((s) => ({
    label: s.agent_name ?? s.agent_id,
    value: s.runs_24h ?? 0,
  })) ?? []

  const agentStatusBreakdown = summaries?.map((s) => ({
    label: s.agent_name ?? s.agent_id,
    value: `${s.success_rate ?? 0}%`,
  })) ?? []

  return [
    {
      label: 'Runs 24h',
      value: formatNumber(health.runs24h),
      delta: 'From agent_execution_logs',
      breakdown: agentRunBreakdown,
      breakdownNote: agentRunBreakdown.length === 0 ? 'No runs in last 24h' : undefined,
    },
    {
      label: 'Calls dialed',
      value: formatNumber(health.callsDialed),
      delta: 'Triggered in the last 24h',
      breakdownNote: 'Per-agent breakdown coming in v2',
    },
    {
      label: 'OpenAI tokens',
      value: formatNumber(health.openAiTokens),
      delta: 'Summed from openai_result usage',
      breakdownNote: 'Per-agent token tracking coming in v2',
    },
    {
      label: 'Voice minutes',
      value: formatNumber(health.vapiMinutes),
      delta: 'Call duration recorded in logs',
      breakdownNote: 'Per-agent minute tracking coming in v2',
    },
    {
      label: 'Mongo writes',
      value: formatNumber(health.mongoWrites),
      delta: 'Write actions traced by agents',
      breakdownNote: 'Per-collection breakdown coming in v2',
    },
    {
      label: 'System status',
      value: health.systemStatus,
      delta: 'Derived from recent run states',
      breakdown: agentStatusBreakdown,
      breakdownNote: agentStatusBreakdown.length === 0 ? 'No agent data' : undefined,
    },
  ]
}

export function StatStrip({
  health,
  cells,
  summaries,
}: {
  health?: HealthStripData
  cells?: StatCell[]
  summaries?: AgentDashboardSummary[]
}) {
  const resolvedCells = cells || (health ? buildCells(health, summaries) : [])

  return (
    <div className="strip">
      {resolvedCells.map((cell, index) => {
        if (cell.empty) {
          return <div className="stat" key={`empty-${index}`} style={{ visibility: 'hidden' }} />
        }

        const hasPopover = Boolean(cell.breakdown?.length || cell.breakdownNote)

        const content = (
          <>
            <div className="stat-label">{cell.label}</div>
            <div className="stat-value">{cell.value}</div>
            {cell.delta ? <div className="stat-delta">{cell.delta}</div> : null}
          </>
        )

        if (!hasPopover) {
          return (
            <div className="stat" key={cell.label || index}>
              {content}
            </div>
          )
        }

        return (
          <Popover key={cell.label || index}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="stat"
                style={{ cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                {content}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="border-hairline bg-surface shadow-[var(--shadow-2)]"
              style={{ minWidth: 220, maxWidth: 300 }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--ink-3)' }}>
                {cell.label} — breakdown
              </div>
              {cell.breakdown && cell.breakdown.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {cell.breakdown.map((b, j) => (
                    <li
                      key={j}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 0',
                        fontSize: 13,
                        borderBottom: '1px solid var(--hairline)',
                      }}
                    >
                      <span style={{ color: 'var(--ink-2)' }}>{b.label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{b.value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  {cell.breakdownNote ?? 'No breakdown available'}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )
      })}
    </div>
  )
}
