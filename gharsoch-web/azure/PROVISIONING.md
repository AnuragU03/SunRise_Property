# GharSoch — Azure Provisioning (item F)

Restores the Azure footprint the project ran on before the LiveKit migration, plus
the **one net-new piece** that era never had: hosting for the self-owned voice
worker. Three hosting targets:

| Component | Azure product | Why |
|-----------|---------------|-----|
| `gharsoch-web` (Next.js) | **Web App** (Linux, Node 20) | `output: standalone` → `node server.js` |
| 6 cron timers | **Function App** (Consumption, Node 20) | thin timer→HTTP forwarders in `azure/functions/` |
| Voice worker | **Container App** (1 replica) | persistent LiveKit WS sessions — can't be serverless |

> The old `gharsoc-app-primary` GitHub deploy workflow still lives in
> `.github/workflows/` — the Web App name below matches it on purpose.

## 1. Provision (one command, after `az login`)

```bash
bash azure/provision.sh
```

Idempotent. Creates: resource group, storage account + 3 containers
(`gharsoch-assets`, `call-archives`, `call-recordings`), the Web App, the Function
App (with all 6 timer schedules preset), an ACR, and the Container Apps
environment. It **prints the storage connection string** and the exact deploy
commands. It does not deploy code or set secrets — those are below.

## 2. Deploy code

```bash
# Web App  (from gharsoch-web/)
npm run build && az webapp up -n gharsoch-app-primary -g gharsoch-rg --runtime "NODE:20-lts"

# Timers   (from gharsoch-web/azure/functions/)
npm install && npm run build && func azure functionapp publish gharsoch-cron --typescript

# Voice worker (from gharsoch-web/)
az acr build -r <acr> -t gharsoch-voice-worker:latest -f azure/voice-worker.Dockerfile .
az containerapp create -n gharsoch-voice-worker -g gharsoch-rg \
  --environment gharsoch-aca-env --image <acr>.azurecr.io/gharsoch-voice-worker:latest \
  --min-replicas 1 --max-replicas 1
```

## 3. Env-var map (set as app settings, NOT committed)

### Web App `gharsoch-app-primary`
| Var | Value / source |
|-----|----------------|
| `DATABASE_URL` | MongoDB Atlas connection string (or Cosmos for Mongo — see §4) |
| `MONGODB_DB` | `test` in prod (Atlas), `gharsoch` locally |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | 32-byte random |
| `NEXTAUTH_URL` | `https://gharsoch-app-primary.azurewebsites.net` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app |
| `BOOTSTRAP_ADMIN_EMAIL` | your admin email |
| `CRON_SECRET` | 64-char random (MUST match the Function App's) |
| `GHARSOCH_API_BASE` | same as `NEXTAUTH_URL` |
| `AZURE_STORAGE_CONNECTION_STRING` | printed by `provision.sh` |
| `AZURE_RECORDINGS_CONTAINER` | `call-recordings` |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | LiveKit Cloud project |
| `SARVAM_API_KEY` | Sarvam |
| `GOOGLE_CALENDAR_CLIENT_ID/SECRET/REDIRECT_URI/REFRESH_TOKEN` | calendar OAuth |
| `WHATSAPP_MODE` + `WHATSAPP_*` | `twilio_sandbox` for demo |
| `VOICE_TRANSPORT` | `sip` in prod (real dialing) / `webrtc` for test |

### Function App `gharsoch-cron`
| Var | Value |
|-----|-------|
| `CRON_SECRET` | **same** value as the Web App |
| `GHARSOCH_API_BASE` | the Web App URL |
| `WEBSITE_TIME_ZONE` | `India Standard Time` (set by provision.sh) |
| `*_SCHEDULE` (6) | preset by provision.sh; override to change cadence |

### Voice worker container `gharsoch-voice-worker`
Needs the runtime + recording + provider creds (it imports `lib/**` directly):
`DATABASE_URL`, `MONGODB_DB`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`,
`SARVAM_API_KEY`, `SARVAM_TTS_SPEAKER`, `VOICE_DEFAULT_LANGUAGE`, `VOICE_TRANSPORT`,
`VOICE_RECORDING`, `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_RECORDINGS_CONTAINER`,
`SIP_OUTBOUND_TRUNK_ID`, `LIVEKIT_INBOUND_NUMBER`, `GHARSOCH_API_BASE`,
`GOOGLE_CALENDAR_*`, `OPENAI_API_KEY` (or `USE_SARVAM_LLM=true`),
`VOICE_BROKER_NAME`, `VOICE_BROKER_PHONE`, `VOICE_OFFICE_ADDRESS`, `WHATSAPP_BRAND_NAME`.

Set secrets via `az containerapp secret set` and reference them in `--env-vars`.

## 4. Open decision: Atlas vs Cosmos (Mongo API)

The app speaks the MongoDB wire protocol (native driver). Either works:
- **Stay on Atlas** — zero code change; just allowlist Azure egress IPs.
- **Cosmos DB for Mongo** — keeps data in-Azure; verify the unique indexes and
  `$regex` queries the app uses are supported on your Cosmos tier first.

Recommendation for the demo: **stay on Atlas** (already working), revisit Cosmos
only if data residency requires it.

## 5. Post-deploy smoke test
1. Web App loads + Google sign-in works.
2. `curl -XPOST https://<webapp>/api/cron/matchmaker -H "x-cron-secret: <secret>"` → 200.
3. Container App logs show `registered worker`.
4. Trigger a call from a lead page → worker answers → recording lands in
   `call-recordings` → playback works in Call Review.
