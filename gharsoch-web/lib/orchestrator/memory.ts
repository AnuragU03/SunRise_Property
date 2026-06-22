/**
 * lib/orchestrator/memory.ts — agent_conversations: cross-agent memory per lead.
 *
 * Every agent that learns something about a lead leaves a dated note here; every
 * agent that's about to CONTACT the lead reads the merged timeline first. This is
 * what makes call 2 sound like a continuation of call 1 even when a different
 * agent (matchmaker → re-engager → guardian) owns the dial — the PRD's
 * "agent_conversations memory" restored for the LiveKit era.
 *
 * Deliberately append-only and tiny: one collection, notes capped per read.
 */

import { getCollection } from '@/lib/mongodb'

export interface AgentNote {
  lead_id: string
  agent_id: string
  note: string
  call_id?: string
  meta?: Record<string, any>
  created_at: Date
}

/** Append one memory note for a lead. Never throws — memory must not break callers. */
export async function recordAgentNote(input: {
  leadId: string
  agentId: string
  note: string
  callId?: string
  meta?: Record<string, any>
}): Promise<void> {
  if (!input.leadId || !input.note?.trim()) return
  try {
    const col = await getCollection('agent_conversations')
    await col.insertOne({
      lead_id: String(input.leadId),
      agent_id: input.agentId,
      note: input.note.trim().slice(0, 600),
      call_id: input.callId || '',
      meta: input.meta || {},
      created_at: new Date(),
    } as any)
  } catch (err) {
    console.error('[orchestrator/memory] recordAgentNote failed:', (err as Error).message)
  }
}

/**
 * Merged note timeline for prompt hydration — newest first, formatted for the
 * voice agent's "what the team already knows" prompt block.
 */
export async function getLeadConversationContext(leadId: string, limit = 6): Promise<string> {
  if (!leadId) return ''
  try {
    const col = await getCollection('agent_conversations')
    const notes = await col
      .find({ lead_id: String(leadId) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    if (!notes.length) return ''
    return notes
      .map((n: any) => {
        const when = n.created_at
          ? new Date(n.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })
          : ''
        return `- [${when}] ${n.agent_id}: ${n.note}`
      })
      .join('\n')
  } catch (err) {
    console.error('[orchestrator/memory] getLeadConversationContext failed:', (err as Error).message)
    return ''
  }
}
