/**
 * Local Cron Runner
 * Replaces Azure Timer Functions for local development.
 * 
 * Usage: node scripts/local-cron.js
 * 
 * This script fires the same HTTP POST requests that the Azure Timer Functions
 * would fire in production. The actual business logic lives in the Next.js
 * API routes — these are just scheduled HTTP callers.
 */

const CRON_JOBS = [
  {
    name: 'matchmaker',
    route: '/api/cron/matchmaker',
    intervalMs: 15 * 60 * 1000,  // every 15 minutes
    description: 'Match leads with properties',
  },
  {
    name: 'follow-up',
    route: '/api/cron/follow-up',
    intervalMs: 2 * 60 * 60 * 1000,  // every 2 hours
    description: 'Process scheduled follow-ups',
  },
  {
    name: 'reminders',
    route: '/api/cron/reminders',
    intervalMs: 4 * 60 * 60 * 1000,  // every 4 hours
    description: 'Send appointment reminders',
  },
  {
    name: 're-engage',
    route: '/api/cron/re-engage',
    intervalMs: 24 * 60 * 60 * 1000,  // every 24 hours
    description: 'Re-engage cold leads',
  },
  {
    name: 'campaign-sweep',
    route: '/api/cron/campaign-sweep',
    intervalMs: 30 * 60 * 1000,  // every 30 minutes
    description: 'Re-queue deferred campaigns',
  },
  {
    name: 'archive',
    route: '/api/cron/archive',
    intervalMs: 24 * 60 * 60 * 1000,  // daily
    description: 'Archive calls older than 30 days to blob storage',
  },
]

// Load env
try {
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex)
          const value = trimmed.substring(eqIndex + 1)
          if (!process.env[key]) process.env[key] = value
        }
      }
    })
  }
} catch {}

const BASE = process.env.GHARSOCH_API_BASE || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET || ''

async function fireCronJob(job) {
  const url = `${BASE}${job.route}`
  const startedAt = new Date().toISOString()
  
  console.log(`\n⏰ [${startedAt}] Firing "${job.name}" → POST ${url}`)
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-cron-secret': CRON_SECRET,
        'content-type': 'application/json',
        'x-local-cron': 'true',
        'x-trigger-time': startedAt,
      },
      signal: AbortSignal.timeout(60_000),
    })
    
    const body = await res.text()
    const status = res.ok ? '✅' : '❌'
    console.log(`${status} [${job.name}] → ${res.status} ${body.slice(0, 300)}`)
  } catch (err) {
    console.error(`❌ [${job.name}] FAILED: ${err.message}`)
  }
}

// Parse CLI args
const args = process.argv.slice(2)
const singleJob = args.find(a => !a.startsWith('--'))
const runOnce = args.includes('--once')

if (singleJob) {
  // Fire a single job by name
  const job = CRON_JOBS.find(j => j.name === singleJob || j.route.includes(singleJob))
  if (!job) {
    console.error(`❌ Unknown job: "${singleJob}". Available: ${CRON_JOBS.map(j => j.name).join(', ')}`)
    process.exit(1)
  }
  fireCronJob(job).then(() => process.exit(0))
} else if (runOnce) {
  // Fire all jobs once
  console.log('🔄 Running all cron jobs once...\n')
  Promise.all(CRON_JOBS.map(fireCronJob)).then(() => {
    console.log('\n✅ All jobs fired.')
    process.exit(0)
  })
} else {
  // Scheduled mode — run on intervals
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║     🕐 GharSoch Local Cron Runner           ║')
  console.log('║     Replaces Azure Timer Functions           ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║  Base URL: ${BASE.padEnd(33)}║`)
  console.log(`║  Secret:   ${CRON_SECRET ? '***' + CRON_SECRET.slice(-4) : '(none)'}${''.padEnd(28 - (CRON_SECRET ? 7 : 6))}║`)
  console.log('╠══════════════════════════════════════════════╣')
  
  CRON_JOBS.forEach(job => {
    const mins = Math.round(job.intervalMs / 60000)
    const intervalStr = mins >= 60 ? `${Math.round(mins/60)}h` : `${mins}m`
    console.log(`║  ${job.name.padEnd(15)} every ${intervalStr.padEnd(5)} ${job.description.slice(0, 18).padEnd(18)}║`)
  })
  
  console.log('╚══════════════════════════════════════════════╝')
  console.log('\nPress Ctrl+C to stop.\n')

  // Fire all once on startup
  CRON_JOBS.forEach(job => fireCronJob(job))

  // Then schedule intervals
  CRON_JOBS.forEach(job => {
    setInterval(() => fireCronJob(job), job.intervalMs)
  })
}
