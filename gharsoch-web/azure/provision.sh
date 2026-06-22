#!/usr/bin/env bash
#
# azure/provision.sh — idempotent provisioning of GharSoch's Azure footprint.
#
# Prereqs:  az login   (and `az account set --subscription <id>` if you have many)
# Run:      bash azure/provision.sh
#
# Re-runnable: every step is create-if-absent. It provisions infra and prints the
# secrets/IDs you still have to paste (connection strings, publish steps). It does
# NOT deploy code — deployment commands are printed at the end.
#
# Override any default via env, e.g.:  LOCATION=centralindia RG=gharsoch-prod bash azure/provision.sh
set -euo pipefail

# ── Config (override via env) ───────────────────────────────────────────────
RG="${RG:-gharsoch-rg}"
LOCATION="${LOCATION:-centralindia}"
STORAGE="${STORAGE:-gharsochstore$RANDOM}"   # must be globally unique, 3-24 lowercase alnum
WEBAPP="${WEBAPP:-gharsoch-app-primary}"
WEBAPP_PLAN="${WEBAPP_PLAN:-gharsoch-web-plan}"
FUNC_APP="${FUNC_APP:-gharsoch-cron}"         # one Function App hosts all 6 timers
CONTAINER_ENV="${CONTAINER_ENV:-gharsoch-aca-env}"
VOICE_APP="${VOICE_APP:-gharsoch-voice-worker}"
ACR="${ACR:-gharsochacr$RANDOM}"              # container registry for the voice image

echo "== GharSoch Azure provisioning =="
echo "   resource group : $RG ($LOCATION)"
echo "   storage        : $STORAGE"
echo "   web app        : $WEBAPP"
echo "   function app   : $FUNC_APP"
echo "   voice worker   : $VOICE_APP (Container Apps)"
echo

step() { echo; echo "── $1"; }

# ── 1. Resource group ───────────────────────────────────────────────────────
step "Resource group"
az group create -n "$RG" -l "$LOCATION" -o none

# ── 2. Storage account + containers (uploads, archives, recordings) ─────────
step "Storage account + blob containers"
az storage account create -n "$STORAGE" -g "$RG" -l "$LOCATION" \
  --sku Standard_LRS --kind StorageV2 -o none
STORAGE_CONN=$(az storage account show-connection-string -n "$STORAGE" -g "$RG" --query connectionString -o tsv)
for c in gharsoch-assets call-archives call-recordings; do
  az storage container create -n "$c" --connection-string "$STORAGE_CONN" -o none
  echo "   container ready: $c"
done

# ── 3. Web App (Linux, Node 20) for gharsoch-web ────────────────────────────
step "Web App (Next.js standalone, Node 20)"
az appservice plan create -n "$WEBAPP_PLAN" -g "$RG" --is-linux --sku B1 -o none
az webapp create -n "$WEBAPP" -g "$RG" -p "$WEBAPP_PLAN" --runtime "NODE:20-lts" -o none
az webapp config set -n "$WEBAPP" -g "$RG" --startup-file "node server.js" -o none
echo "   set Web App app settings (MONGODB_DB, LIVEKIT_*, SARVAM_*, AUTH/Google, CRON_SECRET, GHARSOCH_API_BASE, AZURE_STORAGE_CONNECTION_STRING) — see PROVISIONING.md"

# ── 4. Function App (consumption) hosting all 6 timer functions ─────────────
step "Function App (timers: followup/matchmaker/reengage/reminders/campaignsweep/archive)"
az functionapp create -n "$FUNC_APP" -g "$RG" \
  --storage-account "$STORAGE" --consumption-plan-location "$LOCATION" \
  --runtime node --runtime-version 20 --functions-version 4 --os-type Linux -o none
az functionapp config appsettings set -n "$FUNC_APP" -g "$RG" --settings \
  WEBSITE_TIME_ZONE="India Standard Time" \
  FOLLOWUP_SCHEDULE="0 0 * * * *" \
  MATCHMAKER_SCHEDULE="0 */30 * * * *" \
  REENGAGE_SCHEDULE="0 0 10 * * *" \
  REMINDERS_SCHEDULE="0 0 9 * * *" \
  CAMPAIGN_SWEEP_SCHEDULE="0 0,30 * * * *" \
  ARCHIVE_SCHEDULE="0 30 2 * * *" \
  -o none
echo "   timer schedules set. Still need: CRON_SECRET + GHARSOCH_API_BASE (point at the Web App URL)."

# ── 5. Voice worker — Container Registry + Container App ─────────────────────
step "Voice worker (ACR + Container Apps)"
az acr create -n "$ACR" -g "$RG" --sku Basic --admin-enabled true -o none
echo "   built image will be pushed to: $ACR.azurecr.io/gharsoch-voice-worker:latest"
az containerapp env create -n "$CONTAINER_ENV" -g "$RG" -l "$LOCATION" -o none
echo "   Container Apps environment ready: $CONTAINER_ENV"
echo "   (the app itself is created after the image is pushed — see deploy steps below)"

# ── Summary + next steps ────────────────────────────────────────────────────
cat <<EONEXT

═══════════════════════════════════════════════════════════════════════
Provisioned. SAVE this storage connection string (it enables blob uploads,
archives, AND call recordings):

AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONN"

── Deploy code ──────────────────────────────────────────────────────────
1. Web App (from gharsoch-web/):
     npm run build
     az webapp up -n $WEBAPP -g $RG --runtime "NODE:20-lts"
   Then set its app settings per azure/PROVISIONING.md (the env-var map).

2. Timer functions (from gharsoch-web/azure/functions/):
     npm install && npm run build
     func azure functionapp publish $FUNC_APP --typescript
   Set CRON_SECRET + GHARSOCH_API_BASE=https://<webapp-host> on the Function App.

3. Voice worker (from gharsoch-web/):
     az acr build -r $ACR -t gharsoch-voice-worker:latest -f azure/voice-worker.Dockerfile .
     az containerapp create -n $VOICE_APP -g $RG --environment $CONTAINER_ENV \\
       --image $ACR.azurecr.io/gharsoch-voice-worker:latest \\
       --registry-server $ACR.azurecr.io --min-replicas 1 --max-replicas 1 \\
       --secrets "(see PROVISIONING.md for the full --env-vars list)"

Full env-var map for all three: azure/PROVISIONING.md
═══════════════════════════════════════════════════════════════════════
EONEXT
