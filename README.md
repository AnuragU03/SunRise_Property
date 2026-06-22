# GharSoch — AI-Powered Real Estate Voice Agent Platform

An end-to-end real estate broker assistant that uses AI voice agents to automatically call leads, qualify them, book property visits, and manage the entire customer lifecycle — from first contact to appointment confirmation.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Voice Agent](#voice-agent)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Demo Flow](#demo-flow)
- [Environment Variables](#environment-variables)

---

## Overview

GharSoch is a full-stack platform that automates real estate brokerage operations through AI voice calls. The system:

1. **Loads warm leads** from MongoDB (with builder interest — Lodha, Godrej, etc.)
2. **Auto-dials** each lead sequentially using LiveKit voice rooms
3. **Conducts natural Hindi/English conversations** via GPT-4o-mini + Sarvam AI (Indian language STT/TTS)
4. **Books appointments** directly into Google Calendar + sends WhatsApp confirmation
5. **Updates call status** and appointment details in the dashboard in real-time
6. **Records audio** and saves full transcripts locally

Broker name: **Ajit Jawlekar** | Agency: **GharSoch** | Market: Mumbai, Navi Mumbai, Thane

---

## Key Features

### 🎙️ Voice Agent (LiveKit + Sarvam AI)
- Real-time voice conversations in Hindi, Marathi, English, and Hinglish
- One agent handles all call types: re-engage, matchmaker, campaign, reminder, inbound
- Scenario-aware prompts adapted from real broker call corpus
- 15 business tools (book/reschedule/cancel appointments, search properties, calculate EMI, etc.)
- Proper 3-step closing ritual (check-in → outcome remark → goodbye)
- Audio recording saved to `data/audio_recordings/`
- Full transcript saved to `data/call_transcriptions/`

### 📊 Dashboard
- Real-time overview of leads, calls, appointments, and agent activity
- Stat strips with key metrics
- Live call monitoring

### 👥 Leads Pipeline
- Table + Kanban views with sorting, filtering, and search
- Multi-select + bulk delete
- "Load from DB & Call" button — seeds demo leads and triggers sequential voice calls
- Lead temperature scoring (hot/warm/cold)
- Agent ownership badges (Matchmaker, Re-engager, Follow-up, Guardian)

### 📞 Call Logs
- Complete call history with transcripts and outcomes
- Multi-select + Delete Selected / Delete All
- Call detail pages with tool events, state transitions
- Duration, status, disposition tracking

### 🏠 Property Inventory
- List view (table) + Grid view (cards) — togglable
- Multi-select + bulk delete + Delete All
- 100+ Mumbai-area synthetic listings (Lodha, Godrej, Hiranandani, Oberoi, etc.)
- Voice agent pitch fields (carpet area, floor, facing, close price band)

### 📅 Appointments
- Full update dialog: status, date/time, duration, notes
- Calendar sync (Google Calendar)
- WhatsApp confirmation on booking
- All appointments shown (removed property_id filter that hid office visits)
- Today + Upcoming + All views

### 🤖 Background AI Agents
- **Matchmaker** — pairs leads with properties via GPT-4o scoring
- **Re-engager** — contacts cold leads with past visit history
- **Follow-Up Agent** — handles promised callbacks
- **Appointment Guardian** — sends reminders, handles no-shows
- **Campaign Conductor** — orchestrates outbound campaigns
- **Price-Drop Negotiator** — alerts leads when prices change

### 🔐 Auth & Multi-tenancy
- Google OAuth via NextAuth.js v5
- Role-based access: Admin, Tech, Broker
- Admin bootstrap via `BOOTSTRAP_ADMIN_EMAIL`
- Pending approval flow for new signups

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js App (port 3000)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ Dashboard │  │ API Routes│  │ Instrumentation│  │ Cron Handlers │   │
│  │   (SSR)   │  │ /api/*   │  │ (startup hook) │  │ /api/cron/*  │   │
│  └──────────┘  └──────────┘  └──────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                │                │
         │                │                │
┌────────▼────────┐  ┌───▼────────┐  ┌───▼──────────────────────────┐
│  MongoDB Atlas   │  │  LiveKit    │  │  Voice Agent Worker (tsx)     │
│  (leads, calls,  │  │  Cloud      │  │  voice-agent/index.ts         │
│   appointments,  │  │  India West │  │  ├─ Silero VAD                │
│   properties)    │  │             │  │  ├─ Sarvam STT (Hindi/Marathi)│
│                  │  │             │  │  ├─ GPT-4o-mini (LLM)         │
└──────────────────┘  └─────────────┘  │  ├─ Sarvam TTS (Bulbul v3)   │
                                       │  ├─ 15 business tools         │
                                       │  └─ Audio recorder            │
                                       └────────────────────────────────┘
         │                                          │
    ┌────▼────┐                               ┌────▼────┐
    │ Google   │                               │ Twilio   │
    │ Calendar │                               │ SIP Trunk│
    └──────────┘                               └──────────┘
```

---

## Voice Agent

### How It Works

The voice agent is a **separate process** (`npm run voice:agent`) that connects to LiveKit Cloud as a worker. When a call room is created:

1. Worker dispatches a job runner into the room
2. Agent waits for the customer to join (WebRTC) or answers immediately (SIP)
3. Speaks a deterministic greeting (no LLM on turn 1)
4. Conducts a natural conversation using GPT-4o-mini
5. Uses business tools to book appointments, search properties, log outcomes
6. Follows a 3-step closing ritual before disconnecting
7. Writes transcript + outcome to MongoDB
8. Saves audio WAV + transcript TXT to `data/` folder
9. Emits `call:completed` event → next queued call starts

### Call Types

| Type | Trigger | Objective |
|------|---------|-----------|
| `reengage` | Cron / manual | Re-engage cold leads with new inventory |
| `matchmaker` | Matchmaker agent | Pitch a specific matched property |
| `campaign` | Campaign trigger | General outreach with a hook |
| `follow_up_callback` | Follow-up cron | Continue a prior conversation |
| `appointment_reminder` | Guardian cron | Confirm/reschedule upcoming visit |
| `inbound` | SIP dispatch rule | Answer customer's incoming call |

### Supported Languages

- Hindi (hi-IN) — default
- English (en-IN)
- Marathi (mr-IN)
- Hinglish (hi-EN) — Hindi-English code-switching
- Runtime switching via `switch_language` tool

### Business Tools (15)

| Tool | What it does |
|------|-------------|
| `book_appointment` | Book a site visit (→ Google Calendar + WhatsApp) |
| `check_availability` | Check free slots before proposing times |
| `search_properties` | Search live inventory by location/type/budget |
| `reschedule_appointment` | Move an existing appointment |
| `cancel_appointment` | Cancel with calendar cleanup |
| `confirm_appointment` | Mark attendance confirmed (reminder flow) |
| `calculate_affordability` | Deterministic EMI calculation |
| `log_objection` | Log customer objections for follow-up targeting |
| `flag_escalation` | Escalate to human broker |
| `request_callback` | Schedule a callback at customer's preferred time |
| `mark_wrong_number` | Log wrong number + auto-disconnect |
| `handle_dispute` | DNC + single apology + disconnect |
| `acknowledge_existing_customer` | Don't re-pitch existing clients |
| `initiate_closing` | Trigger the 3-step closing ritual |
| `save_conversation_summary` | Persist call memory for next contact |
| `log_call_outcome` | Final outcome → lead score update |
| `end_call` | Graceful disconnect (waits for TTS playout) |
| `switch_language` | Switch STT/TTS pipeline mid-call |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5.6 |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Database | MongoDB Atlas (Free Tier) |
| Voice Runtime | LiveKit Cloud (India West) |
| Voice Agent SDK | @livekit/agents 1.4.5 |
| STT | Sarvam AI Saaras v3 (Hindi/Marathi/English) |
| TTS | Sarvam AI Bulbul v3 |
| LLM | OpenAI GPT-4o-mini (voice), GPT-4o (matchmaker) |
| VAD | Silero VAD (ONNX) |
| Auth | NextAuth.js v5 (Google OAuth) |
| Calendar | Google Calendar API |
| WhatsApp | Twilio (dry_run mode for dev) |
| Telephony | Twilio SIP Trunk (via LiveKit) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas account (Free Tier works)
- LiveKit Cloud account (free for dev)
- Sarvam AI API key
- OpenAI API key
- Google OAuth credentials (for login)

### Installation

```bash
# Clone
git clone https://github.com/AnuragU03/GharSoch.git
cd GharSoch/gharsoch-web

# Install dependencies (uses --legacy-peer-deps for mongodb@5 compat)
npm install --legacy-peer-deps

# Apply LiveKit SDK patches for Windows
npm run postinstall
```

### Environment Setup

Copy `.env.example` → `.env` and fill in:

```env
# Core
DATABASE_URL=mongodb://...
MONGODB_DB=gharsoch
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# Auth (Google OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BOOTSTRAP_ADMIN_EMAIL=your-admin@email.com

# AI
OPENAI_API_KEY=sk-...

# Voice
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
SARVAM_API_KEY=...
VOICE_BROKER_NAME=Ajit Jawlekar
VOICE_TRANSPORT=webrtc  # or 'sip' for real phone calls

# VAPI (required by envCheck)
VAPI_API_KEY=...
VAPI_PHONE_NUMBER_ID=...
VAPI_ASSISTANT_OUTBOUND_ID=...
VAPI_ASSISTANT_REMINDER_ID=...
```

### Run

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Voice agent worker
npm run voice:agent
```

The app auto-seeds two demo leads (Rajesh Mehra → Lodha, Priya Sharma → Godrej) and triggers voice calls on startup.

Open http://localhost:3000 → Sign in with Google → See the dashboard.

### Seed Data

```bash
# Seed Mumbai properties (100+ listings)
npm run seed:mumbai

# Seed demo leads + broker user
node --env-file=.env scripts/seed-demo-leads.mjs
```

---

## Project Structure

```
gharsoch-web/
├── app/
│   ├── (admin)/           # Protected dashboard pages
│   │   ├── appointments/  # Appointment management
│   │   ├── calls/         # Call logs + detail
│   │   ├── campaigns/     # Campaign management
│   │   ├── clients/       # Client/prospect list
│   │   ├── leads/         # Lead pipeline (table/kanban)
│   │   ├── properties/    # Property inventory
│   │   ├── analytics/     # Charts & KPIs
│   │   ├── ai-operations/ # Agent monitoring
│   │   └── settings/      # System config
│   ├── api/               # REST API routes
│   │   ├── appointments/  # CRUD + calendar sync
│   │   ├── calls/         # Call records
│   │   ├── campaigns/     # Campaign CRUD + trigger
│   │   ├── cron/          # Scheduled agent runners
│   │   ├── demo/          # Demo seed + auto-call
│   │   ├── leads/         # Lead CRUD
│   │   ├── properties/    # Property CRUD
│   │   ├── vapi/          # VAPI webhook
│   │   └── voice/         # Voice tool router
│   ├── auth/              # Sign-in pages
│   └── sections/          # Client-side section components
├── voice-agent/           # LiveKit voice worker (separate process)
│   ├── index.ts           # Entrypoint (session, VAD, greeting, watchdogs)
│   ├── agent.ts           # 15+ business tools
│   ├── prompt.ts          # Scenario-aware system prompt
│   ├── recorder.ts        # Local audio WAV recording
│   ├── callLog.ts         # Transcript DB writes + file saving
│   ├── constants.ts       # Greetings, timeouts, goodbye phrases
│   ├── inbound.ts         # Inbound call context builder
│   ├── sarvam/stt.ts      # Sarvam Saaras STT plugin
│   ├── sarvam/tts.ts      # Sarvam Bulbul TTS plugin
│   └── call-corpus/       # Real broker call transcripts (training ref)
├── lib/
│   ├── agents/            # Background AI agents (matchmaker, follow-up, etc.)
│   ├── services/          # Data access layer (lead, call, appointment, etc.)
│   ├── orchestrator/      # Call state machine + post-call reconciler
│   ├── voice/             # Voice tool router + helpers
│   ├── demo/              # Demo auto-call startup logic
│   ├── callEvents.ts      # In-process event bus for sequential calls
│   ├── voiceRuntime.ts    # LiveKit room creation + SIP/WebRTC dispatch
│   ├── mongodb.ts         # MongoDB connection (self-healing)
│   └── auth.ts            # NextAuth.js v5 config
├── models/                # MongoDB document interfaces
├── components/            # React UI components
├── data/
│   ├── propertySeed.ts    # 100+ Mumbai property listings
│   ├── audio_recordings/  # WAV files from voice calls
│   └── call_transcriptions/ # TXT transcripts from voice calls
├── scripts/
│   ├── patch-livekit.js   # Postinstall SDK patches (Windows compat)
│   ├── seed-demo-leads.mjs # Seed two warm demo leads
│   ├── seed-mumbai-properties.ts # Seed property inventory
│   └── local-cron.js      # Run cron agents locally
├── instrumentation.ts     # Next.js startup hook (seeds + auto-calls)
├── middleware.ts          # Auth + role-based routing
└── next.config.js         # Next.js config (webpack, externals)
```

---

## Data Models

### Lead
Key fields: `name`, `phone`, `broker_id`, `status`, `interest_level`, `budget_range`, `location_pref`, `property_type`, `is_warm_lead`, `builder_interest`, `last_visit_property`, `last_visit_summary`, `next_follow_up_date`, `total_calls`, `dnd_status`

### Call
Key fields: `lead_id`, `lead_phone`, `direction`, `call_type`, `duration`, `call_status`, `call_outcome`, `call_summary`, `transcript`, `voice_call_id`, `room_name`, `tool_events[]`, `local_recording_path`

### Appointment
Key fields: `lead_id`, `property_id`, `scheduled_at`, `ends_at`, `duration_minutes`, `status`, `broker_id`, `calendar_event_id`, `booking_source`, `notes`

### Property
Key fields: `title`, `type`, `location`, `city`, `builder`, `price`, `area_sqft`, `carpet_area_sqft`, `floor`, `facing`, `status`, `bedrooms`

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST/PUT/DELETE | `/api/leads` | Lead CRUD |
| GET/POST/PUT/DELETE | `/api/appointments` | Appointment CRUD + calendar sync |
| GET/DELETE | `/api/calls` | Call logs |
| GET/POST/PUT/DELETE | `/api/properties` | Property inventory |
| GET/POST/DELETE | `/api/campaigns` | Campaign management |
| POST | `/api/demo/auto-call` | Seed leads + trigger voice calls |
| POST | `/api/demo/load-and-call` | Load from DB & call (button handler) |
| POST | `/api/calls/manual-trigger` | Broker-initiated outbound call |
| POST | `/api/vapi/webhook` | VAPI webhook (legacy) |
| GET | `/api/health` | Health check |

---

## Demo Flow

1. Start the app (`npm run dev`) and voice agent (`npm run voice:agent`)
2. On startup, `instrumentation.ts` auto-seeds two warm leads and triggers calls
3. Or click **"Load from DB & Call"** in the Leads Pipeline page
4. Open the WebRTC join URL to play the customer (browser mic required)
5. The agent greets in Hindi, pitches the property, and tries to book an appointment
6. If you agree to a visit → appointment appears in the Appointments page
7. Call recording saved to `data/audio_recordings/`
8. Transcript saved to `data/call_transcriptions/`
9. Call status updated in Call Logs

---

## Environment Variables

See `.env` file for all required variables. Key ones:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MongoDB connection string |
| `MONGODB_DB` | Database name (default: `gharsoch`) |
| `LIVEKIT_URL` | LiveKit Cloud WebSocket URL |
| `LIVEKIT_API_KEY` / `SECRET` | LiveKit credentials |
| `SARVAM_API_KEY` | Sarvam AI (STT + TTS) |
| `OPENAI_API_KEY` | GPT-4o / GPT-4o-mini |
| `VOICE_TRANSPORT` | `webrtc` (browser test) or `sip` (real phone) |
| `VOICE_BROKER_NAME` | Broker identity for voice calls |
| `DEFAULT_BROKER_ID` | MongoDB ObjectId of the broker user |
| `IMMEDIATE_CALL_AFTER_MATCH` | Trigger call immediately on match |

---

## License

MIT
#   S u n R i s e _ P r o p e r t y  
 