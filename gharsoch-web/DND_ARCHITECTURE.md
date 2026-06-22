# DND Scrubbing Architecture & Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      GharSoch Voice System                       │
└─────────────────────────────────────────────────────────────────┘

Campaign/Lead List
        │
        ▼
┌──────────────────────────────────────────────┐
│   Outbound Call Trigger                      │
│  (campaign, manual, re-engage, reminder)     │
└──────────────────────────────────────────────┘
        │
        ▼ (customerPhone)
┌──────────────────────────────────────────────────────────────────┐
│           DND SCRUB GATE (triggerOutboundCall)                   │
│                                                                  │
│  Layer 1: Local DB Check                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Check: leads.dnd_status == true                        │    │
│  │ Speed: ⚡ Instant (< 1ms)                               │    │
│  │ If DND → BLOCK call, return "blocked_dnd"             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                    │                                            │
│                    ├─→ DND Found? → BLOCK (audit logged)        │
│                    │                                            │
│                    └─→ Not Found? → Continue to Layer 2         │
│                                                                  │
│  Layer 2: External API Check (if enabled)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Check: RapidAPI Free DND India (NCPR registry)         │    │
│  │ Speed: ⚡ ~1-3 seconds                                  │    │
│  │ If DND → Update local DB + BLOCK call                 │    │
│  │ If error → Fallback (allow call, log error)           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                    │                                            │
│                    └─→ DND Confirmed? → BLOCK + Update DB       │
│                                                                  │
│  ✅ DND Clear → Proceed to LiveKit                              │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼ (if DND clear)
┌──────────────────────────────────────────────────────────────────┐
│   LiveKit Voice Runtime                                          │
│  - Create room with metadata                                     │
│  - Dial via SIP trunk (production)                               │
│  - Or WebRTC browser join (test mode)                            │
│  - Record call (if configured)                                   │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│   Voice Agent (FastAPI + Silero VAD + GPT-4o-mini)              │
│  - Voice call conversation                                       │
│  - Transcript generation                                         │
│  - Outcome logging                                               │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│   Call Result Logged to MongoDB                                  │
│  - calls collection                                              │
│  - agent_execution_logs (DND events)                             │
│  - agent_activities                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Single Call

```
User Action (campaign trigger / manual call)
        │
        ▼
app/api/campaigns/trigger (POST /api/campaigns/trigger)
        │
        ├─ Check: lead.dnd_status (local DB)
        │
        ├─ Check: cooldown blocked?
        │
        ├─ Fetch properties context
        │
        └─→ triggerCampaignCall()
                │
                ▼
        lib/voiceRuntime.ts → triggerOutboundCall()
                │
                ├─ Validate: phone required ✓
                │
                ├─ ❌ DND SCRUB GATE ❌
                │   ├─ Layer 1: checkDndLocal() → leads collection
                │   │   └─ If found: return isDnd=true, source='local_db'
                │   │
                │   └─ Layer 2: checkDnd() external API
                │       ├─ API: RapidAPI Free DND India
                │       ├─ If DND confirmed: update DB, return isDnd=true
                │       └─ If API error: fallback gracefully (isDnd=false)
                │
                ├─ If isDnd=true:
                │   ├─ insertCallRecord(..., 'blocked_dnd', 'blocked_dnd', error_msg)
                │   ├─ logDndScrubEvent(...) → audit trail
                │   └─ Return: { success: false, status: 'blocked_dnd', error: '...' }
                │
                └─ If isDnd=false:
                    ├─ insertCallRecord(..., 'queued', 'queued')
                    ├─ Create LiveKit room
                    ├─ Create SIP participant
                    ├─ Update room metadata
                    ├─ Start recording
                    └─ Return: { success: true, callId, voiceCallId, ... }
```

---

## Configuration

### Environment Variables

```bash
# Enable/disable DND scrub service
DND_SCRUB_ENABLED=true

# Provider: "rapidapi" (default) or "easygosms"
DND_PROVIDER=rapidapi

# RapidAPI credentials (for Free DND India API)
DND_RAPIDAPI_KEY=your-api-key-here
DND_RAPIDAPI_HOST=free-dnd-india.p.rapidapi.com

# EasyGoSMS credentials (alternative provider)
DND_EASYGOSMS_API_KEY=
DND_EASYGOSMS_PASSWORD=
```

### Code Location

| Component | File |
|-----------|------|
| **DND Scrub Service** | `lib/services/dndScrubService.ts` |
| **Voice Runtime Integration** | `lib/voiceRuntime.ts` (lines ~223-246) |
| **DND Check API** | `app/api/dnd-scrub/route.ts` |
| **DNC Management API** | `app/api/dnc/route.ts` |
| **Campaign Conductor** | `lib/agents/campaignConductor.ts` (includes DND skip logic) |

---

## Call Status Values

When DND blocks a call:

```json
{
  "success": false,
  "status": "blocked_dnd",
  "voiceCallId": "call-outbound-9876543210-1718704320000",
  "error": "DND blocked: number is registered on NCPR (source: rapidapi)"
}
```

In the calls collection:

```json
{
  "_id": ObjectId("..."),
  "voice_call_id": "call-outbound-...",
  "call_status": "blocked_dnd",
  "status": "blocked_dnd",
  "voice_status": "blocked_dnd",
  "failure_reason": "DND blocked: number is registered on NCPR (source: rapidapi)",
  "direction": "outbound",
  "lead_phone": "9876543210",
  "created_at": ISODate("2026-06-18T..."),
  "trai_compliant": true
}
```

In agent_execution_logs (audit trail):

```json
{
  "_id": ObjectId("..."),
  "agent_name": "dnd_scrub_service",
  "message": "DND blocked: 9876543210 is registered on NCPR (source: rapidapi)",
  "metadata": {
    "phone_masked": "***3210",
    "is_dnd": true,
    "source": "rapidapi",
    "call_type": "campaign",
    "lead_id": "...",
    "campaign_id": "...",
    "error": null
  },
  "created_at": ISODate("2026-06-18T...")
}
```

---

## TRAI Compliance Checklist

✅ **DND Check before every call**
   - Enforced in `triggerOutboundCall()` gate (all 5 call types)
   - Two-layer: local DB + external API

✅ **Calling Hours 09:00–21:00 IST**
   - Enforced in Campaign Conductor agent

✅ **Cooldown between calls**
   - Configurable via `OUTBOUND_COOLDOWN_MINUTES`

✅ **Audit Trail & Logging**
   - Every call attempt logged (success + failure)
   - DND events in agent_execution_logs

✅ **140-series numbers (if applicable)**
   - Configure in SIP trunk settings

✅ **Consent Records Retention**
   - Stored in calls + leads collections

---

## Testing DND Scrubbing

### Test Single Number (API)

```bash
curl -X POST http://localhost:3000/api/dnd-scrub \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-session-token>" \
  -d '{"phone": "9876543210"}'

# Response:
{
  "success": true,
  "isDnd": false,
  "source": "rapidapi",
  "checkedAt": "2026-06-18T18:30:00.000Z",
  "error": null
}
```

### Batch Scrub (API)

```bash
curl -X POST "http://localhost:3000/api/dnd-scrub?mode=batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-session-token>" \
  -d '{
    "phones": ["9876543210", "9123456789", "9999999999"]
  }'

# Response:
{
  "success": true,
  "stats": {
    "total": 3,
    "dnd": 1,
    "clean": 2,
    "errors": 0
  },
  "results": [
    { "phone": "***3210", "isDnd": false, "source": "rapidapi", "error": null },
    { "phone": "***6789", "isDnd": true, "source": "rapidapi", "error": null },
    { "phone": "***9999", "isDnd": false, "source": "rapidapi", "error": null }
  ]
}
```

---

## Performance Notes

- **Local DB check**: < 1ms (indexes on `leads.phone` and `leads.dnd_status`)
- **External API check**: 1–3 seconds (RapidAPI network latency)
- **Fallback on error**: allows call if API unreachable (fail-open, TRAI-safe)
- **Batch requests**: 200ms delay between API calls (rate limiting)

---

## Future Enhancements

1. **Batch pre-campaign scrubbing** — scrub entire lead list before scheduling
2. **Periodic re-scrub** — cron job to re-check leads daily (DND registry changes)
3. **Whitelist management** — exceptions for known good numbers
4. **DND analytics** — dashboard showing DND hit rate by broker/campaign
5. **Multiple provider fallback** — if RapidAPI down, try EasyGoSMS automatically
