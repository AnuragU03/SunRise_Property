/**
 * instrumentation.ts — Next.js startup hook entry point.
 *
 * The auto-call is DISABLED on startup for fast page loads.
 * Use the "Load from DB & Call" button in Leads Pipeline to trigger calls manually.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only seed leads (fast, no voice calls). Calls triggered manually via UI button.
    import('./instrumentation.node').then(({ onStart }) => onStart()).catch((err) => {
      console.warn('[startup] seed threw (non-fatal):', err?.message)
    })
  }
}
