/**
 * G1 Commit 3 — Bidirectional lead field aliases
 *
 * One source of truth: `dnd_status` and `source` remain canonical in DB.
 * `dnc_flag` and `lead_source` are virtual read aliases surfaced by the serializer,
 * and write normalizers for ported Myra code that uses the alternate names.
 */

/**
 * Adds virtual alias fields to a serialized lead for API consumers.
 * - `dnc_flag` ← Boolean(dnd_status)
 * - `lead_source` ← source ?? null
 */
export function applyLeadAliases<T extends Record<string, any>>(lead: T): T & {
  dnc_flag: boolean
  lead_source: string | null
} {
  return {
    ...lead,
    dnc_flag: Boolean(lead.dnd_status),
    lead_source: lead.source ?? null,
  }
}

/**
 * Normalizes write input from ported Myra code that uses `dnc_flag`/`lead_source`.
 * Maps them to their canonical DB field names (`dnd_status`/`source`).
 * Only remaps if the canonical field is NOT already present in the input.
 */
export function normalizeLeadWrite(input: Record<string, any>): Record<string, any> {
  const out = { ...input }
  if ('dnc_flag' in out && !('dnd_status' in out)) {
    out.dnd_status = Boolean(out.dnc_flag)
    delete out.dnc_flag
  }
  if ('lead_source' in out && !('source' in out)) {
    out.source = out.lead_source
    delete out.lead_source
  }
  return out
}
