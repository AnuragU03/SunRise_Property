# GharSoch

AI-powered real estate voice agent platform for brokers. GharSoch helps manage leads, properties, calls, campaigns, appointments, and automated follow-ups from one Next.js dashboard.

## What It Does

- Manages real estate leads, clients, builders, properties, calls, payments, and appointments.
- Runs AI-assisted workflows for matchmaker, re-engagement, follow-up, appointment reminders, campaigns, and price-drop alerts.
- Supports outbound and inbound voice-agent flows with LiveKit, Sarvam AI, and OpenAI.
- Books and updates appointments, with optional Google Calendar and WhatsApp/Twilio integration.
- Provides admin dashboards for pipeline tracking, call review, analytics, knowledge base, settings, and user management.

## Tech Stack

| Area | Technology |
| --- | --- |
| App | Next.js 14 App Router |
| Language | TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI |
| Database | MongoDB |
| Auth | NextAuth.js with Google OAuth |
| Voice | LiveKit Agents, LiveKit Cloud |
| AI | OpenAI, Sarvam AI |
| Calendar | Google Calendar API |
| Messaging | Twilio / WhatsApp integration |
| Deployment | Netlify-ready config included |

## Repository Structure

```text
.
+-- README.md
`-- gharsoch-web/
    |-- app/                 # Next.js routes, pages, API handlers
    |-- components/          # UI and feature components
    |-- hooks/               # React hooks
    |-- lib/                 # Services, agents, auth, integrations
    |-- models/              # MongoDB models
    |-- public/              # Static assets
    |-- scripts/             # Utility and seed scripts
    |-- voice-agent/         # LiveKit voice worker and call tooling
    |-- azure/               # Azure Functions/provisioning support
    |-- package.json
    `-- tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB connection string
- Google OAuth credentials for login
- OpenAI API key
- LiveKit and Sarvam AI credentials if using voice features

### Install

```bash
git clone https://github.com/AnuragU03/SunRise_Property.git
cd SunRise_Property/gharsoch-web
npm install --legacy-peer-deps
```

### Configure Environment

Create `gharsoch-web/.env` locally. Do not commit real secrets.

```env
DATABASE_URL=mongodb://...
MONGODB_DB=gharsoch

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-secure-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BOOTSTRAP_ADMIN_EMAIL=admin@example.com

OPENAI_API_KEY=...

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
SARVAM_API_KEY=...

VOICE_BROKER_NAME=Ajit Jawlekar
VOICE_TRANSPORT=webrtc
```

Optional integrations can also use:

```env
CRON_SECRET=...
VAPI_API_KEY=...
VAPI_WEBHOOK_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REFRESH_TOKEN=...
AZURE_STORAGE_CONNECTION_STRING=...
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

Run these from `gharsoch-web/`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000 |
| `npm run build` | Build the production app |
| `npm run lint` | Run Next.js linting |
| `npm run cron` | Run the local cron helper |
| `npm run seed:mumbai` | Seed Mumbai property data |
| `npm run voice:agent` | Start the LiveKit voice agent in dev mode |
| `npm run voice:test` | Start a browser-call test flow |
| `npm run voice:call` | Start a phone-call test flow |
| `npm run voice:gcal-token` | Mint a Google Calendar refresh token |

## Main App Areas

- Dashboard: overview metrics, agent status, and activity.
- Leads: list and workspace views for lead pipeline management.
- Calls: call logs, active calls, transcripts, and review tooling.
- Campaigns: outbound campaign setup and triggering.
- Properties: property inventory and matching data.
- Appointments: appointment lifecycle and calendar sync.
- Knowledge Base: upload/search support for builder and project information.
- Settings: users, roles, integrations, and system configuration.

## Voice Agent

The voice runtime lives in `gharsoch-web/voice-agent`. It can connect to LiveKit rooms, run STT/TTS, use AI prompts, call business tools, update MongoDB records, and write call outcomes.

Common voice commands:

```bash
npm run voice:agent
npm run voice:test
npm run voice:call
```

## Git Hygiene

The repository intentionally ignores local-only and sensitive files, including:

- `.env` and environment backups
- `node_modules`
- `.next` and build output
- local Azure settings
- local uploads, archives, recordings, and generated data
- private planning docs and prototype files
- runtime logs and PID files

Keep secrets in local environment files or deployment-provider secret settings.

## Deployment Notes

The app includes `netlify.toml` and can be deployed with environment variables configured in the hosting provider. Before deployment, make sure MongoDB, OAuth, OpenAI, and any enabled voice/calendar/messaging credentials are set.
