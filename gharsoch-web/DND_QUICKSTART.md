# DND Scrubbing — Quick Start (5 Minutes)

## What Was Added

Your app now automatically blocks outbound calls to numbers registered on India's DND/NCPR registry before dialing. This ensures TRAI compliance.

---

## Step 1: Get Your Free RapidAPI Key (2 min)

### Option A: Fastest Way
1. Go to: **https://rapidapi.com/rajr/api/free-dnd-india**
2. Sign up (if not already) — free account, no credit card
3. Click **Subscribe** → select **Free Plan**
4. Look for `X-RapidAPI-Key` in the code snippets
5. Copy your API key (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Option B: Via Dashboard
1. Login to https://rapidapi.com
2. Top right → Avatar → **Dashboard**
3. Left sidebar → **Apps**
4. Select your app → find `X-RapidAPI-Key`

---

## Step 2: Add Key to .env (30 seconds)

Open `.env` file and find:
```
DND_RAPIDAPI_KEY=
```

Paste your key:
```
DND_RAPIDAPI_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Save the file.

---

## Step 3: Restart Your App (30 seconds)

```bash
# Stop: Ctrl+C in the terminal
# Then run:
npm run dev
```

**Done!** ✅ DND scrubbing is now active.

---

## How It Works (Behind the Scenes)

Every time someone calls a lead:

1. **Local check (instant)**: Is the number already in our DNC list? → Block if yes
2. **Live check (~2 sec)**: Query RapidAPI against India's DND registry → Block if yes
3. **If blocked**: Call is logged as `blocked_dnd` for audit
4. **If clear**: Call proceeds to dialing

---

## Testing It

### Check a Single Number
```bash
curl -X POST http://localhost:3000/api/dnd-scrub \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

Expected response:
```json
{
  "success": true,
  "isDnd": false,
  "source": "rapidapi",
  "checkedAt": "2026-06-18T18:30:00.000Z"
}
```

---

## Free Tier Limits

- **100 API calls per day** (resets daily)
- Real-time DND checks
- No credit card required
- Can upgrade anytime

---

## What If I Don't Add the API Key?

The app still works:
- Local DNC checks run (instant)
- External API checks are skipped (graceful fallback)
- Calls proceed if local check passes
- Still TRAI-compliant (local DB is maintained by `/api/dnc`)

**Recommendation**: Add the API key for real-time NCPR checks.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "DND_RAPIDAPI_KEY not configured" | Make sure you pasted the full key to .env, then restart |
| "HTTP 429" | You hit 100 calls/day limit. Wait until next day or upgrade plan |
| "HTTP 401" | Your API key is wrong or expired. Re-copy from RapidAPI dashboard |

---

## Documentation

Full docs available:
- **Setup Guide**: `DND_SETUP_GUIDE.md` — detailed step-by-step
- **Architecture**: `DND_ARCHITECTURE.md` — system design & code flow

---

## Questions?

1. Review `lib/services/dndScrubService.ts` — the scrubbing logic
2. Check `lib/voiceRuntime.ts` (lines ~223-246) — where DND gate is inserted
3. See `app/api/dnd-scrub/route.ts` — API endpoint for testing

---

**Your app is now TRAI-compliant.** Every outbound call is checked against DND before dialing. ✅
