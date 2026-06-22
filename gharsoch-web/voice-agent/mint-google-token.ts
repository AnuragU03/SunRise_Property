/**
 * mint-google-token.ts — re-mint the Google Calendar refresh token when it
 * expires ("invalid_grant"). Google OAuth apps in "Testing" mode issue refresh
 * tokens that die after ~7 days; this regenerates one in under a minute.
 *
 * IMPORTANT: stop the Next dev server first — this script must listen on the
 * exact redirect URI registered in Google Cloud (http://localhost:3000/oauth-callback).
 *
 * Run:   npm run voice:gcal-token
 * Then:  log in with the BROKER's Google account in the opened URL.
 * The new refresh token is written into .env automatically.
 *
 * To stop the weekly expiry permanently: Google Cloud Console → APIs & Services →
 * OAuth consent screen → Publish app (Production). Unverified-app warning is fine
 * for your own broker account.
 */
import 'dotenv/config'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { google } from 'googleapis'

/** Best-effort: open the consent URL in the default browser (Win/mac/Linux). */
function openBrowser(target: string) {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${target}"`
      : process.platform === 'darwin'
        ? `open "${target}"`
        : `xdg-open "${target}"`
  exec(cmd, (err) => {
    if (err) console.log('(could not auto-open browser — copy the URL above manually)')
  })
}

async function main() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/oauth-callback'
  if (!clientId || !clientSecret) {
    console.error('GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET missing in .env')
    process.exit(1)
  }

  const url = new URL(redirectUri)
  const port = Number(url.port || 80)
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force a fresh refresh_token even if previously granted
    scope: ['https://www.googleapis.com/auth/calendar'],
  })

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', redirectUri)
      if (reqUrl.pathname !== url.pathname) {
        res.writeHead(404).end()
        return
      }
      const code = reqUrl.searchParams.get('code')
      if (!code) {
        res.writeHead(400).end('Missing ?code')
        return
      }

      const { tokens } = await oauth2.getToken(code)
      if (!tokens.refresh_token) {
        res.writeHead(500).end('No refresh_token returned — remove prior access at myaccount.google.com/permissions and retry.')
        console.error('\n✗ Google did not return a refresh_token. Revoke the app at https://myaccount.google.com/permissions and run again.')
        server.close()
        return
      }

      // Write it into .env
      const envPath = path.resolve(process.cwd(), '.env')
      let env = fs.readFileSync(envPath, 'utf8')
      if (/^GOOGLE_CALENDAR_REFRESH_TOKEN=/m.test(env)) {
        env = env.replace(/^GOOGLE_CALENDAR_REFRESH_TOKEN=.*$/m, `GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`)
      } else {
        env += `\nGOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}\n`
      }
      fs.writeFileSync(envPath, env)

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<h2>✓ Calendar reconnected.</h2>You can close this tab and restart the worker/dev server.')
      console.log('\n✓ New refresh token saved to .env (GOOGLE_CALENDAR_REFRESH_TOKEN).')
      console.log('  Restart the worker (npm run voice:agent) and dev server to pick it up.')
      server.close()
      setTimeout(() => process.exit(0), 500)
    } catch (err) {
      console.error('Token exchange failed:', (err as Error).message)
      res.writeHead(500).end('Token exchange failed — see terminal.')
      server.close()
      setTimeout(() => process.exit(1), 500)
    }
  })

  server.listen(port, () => {
    console.log(`Listening on ${redirectUri} for the OAuth callback…`)
    console.log('\nOpening your browser to log in with the BROKER Google account.')
    console.log('If it does not open, copy this URL manually:\n')
    console.log(authUrl)
    console.log('\n(If the Next dev server is running on this port, stop it first.)')
    openBrowser(authUrl)
  })
  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`\n✗ Port ${port} is in use — stop the Next dev server (npm run dev) and run this again.`)
      process.exit(1)
    }
    throw err
  })
}

main().catch((err) => {
  console.error('FAILED:', err?.message || err)
  process.exit(1)
})
