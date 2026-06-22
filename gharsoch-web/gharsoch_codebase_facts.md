- Extraction timestamp: 2026-05-20T09:08:00.2879308Z
- Total lines of code analyzed: 55411
- Total files analyzed: 338
- Tool/agent used to perform extraction: Antigravity AI + Codex GPT-5

## Section 1 — Repo structure
### Tree
```text
.env.example
.eslintrc.json
app/(admin)/ai-operations/page.tsx
app/(admin)/analytics/page.tsx
app/(admin)/appointments/page.tsx
app/(admin)/calls/page.tsx
app/(admin)/campaigns/[id]/page.tsx
app/(admin)/campaigns/page.tsx
app/(admin)/clients/page.tsx
app/(admin)/error.tsx
app/(admin)/help/page.tsx
app/(admin)/kb/page.tsx
app/(admin)/layout.tsx
app/(admin)/leads/page.tsx
app/(admin)/loading.tsx
app/(admin)/page.tsx
app/(admin)/properties/page.tsx
app/(admin)/settings/page.tsx
app/(admin)/settings/users/page.tsx
app/(public)/layout.tsx
app/actions/agents.ts
app/actions/appointments.ts
app/actions/campaigns.ts
app/actions/clients.ts
app/actions/costs.ts
app/actions/leads.ts
app/actions/properties.ts
app/actions/settings.ts
app/actions/users.ts
app/api/_archive_call-logs/route.ts
app/api/_archive_client-profiles/route.ts
app/api/_archive_property-assessments/route.ts
app/api/_archive_property-matches/route.ts
app/api/_archive_scheduled-meetings/route.ts
app/api/activities/route.ts
app/api/agent/[agentId]/executions
app/api/agent/builder-refiner/route.ts
app/api/agent/call-state-validator/route.ts
app/api/agent/campaign-conductor/route.ts
app/api/agent/events/route.ts
app/api/agent/matchmaker/route.ts
app/api/agent/price-drop/route.ts
app/api/agent/route.ts
app/api/agent/run/route.ts
app/api/agent/ws/route.ts
app/api/agent-activities/route.ts
app/api/appointments/[id]/route.ts
app/api/appointments/route.ts
app/api/archive/calls/route.ts
app/api/auth/[...nextauth]/route.ts
app/api/builders/route.ts
app/api/calls/[id]/route.ts
app/api/calls/lead/[id]
app/api/calls/route.ts
app/api/calls/sync/route.ts
app/api/campaigns/route.ts
app/api/campaigns/trigger/route.ts
app/api/clients/route.ts
app/api/cron/archive/route.ts
app/api/cron/campaign-sweep/route.ts
app/api/cron/follow-up/route.ts
app/api/cron/followups/route.ts
app/api/cron/matchmaker/route.ts
app/api/cron/re-engage/route.ts
app/api/cron/reminders/route.ts
app/api/dashboard/stats/route.ts
app/api/dnc/route.ts
app/api/follow-ups/execution-history/route.ts
app/api/follow-ups/route.ts
app/api/health/route.ts
app/api/kb/builder-queries/route.ts
app/api/kb/search/route.ts
app/api/leads/route.ts
app/api/leads/webhook/route.ts
app/api/properties/route.ts
app/api/rag/route.ts
app/api/scheduler/route.ts
app/api/seed/route.ts
app/api/system-config/route.ts
app/api/upload/route.ts
app/api/vapi/webhook/route.ts
app/auth/signin/page.tsx
app/auth/suspended/page.tsx
app/error.tsx
app/global-error.tsx
app/globals.css
app/layout.tsx
app/loading.tsx
app/not-found.tsx
app/sections/AffordabilitySection.tsx
app/sections/AgentStatusSection.tsx
app/sections/AIOperationsSection.tsx
app/sections/AnalyticsSection.tsx
app/sections/AppointmentsSection.tsx
app/sections/CallActivitySection.tsx
app/sections/CallCentreSection.tsx
app/sections/CallLogsSection.tsx
app/sections/CampaignDetailSection.tsx
app/sections/CampaignsSection.tsx
app/sections/ClientsSection.tsx
app/sections/DashboardSection.tsx
app/sections/HomeTruthSection.tsx
app/sections/KnowledgeBaseSection.tsx
app/sections/LeadPipelineSection.tsx
app/sections/LeadsSection.tsx
app/sections/PropertiesSection.tsx
app/sections/SettingsSection.tsx
app/sections/Sidebar.tsx
app/sections/UserManagementSection.tsx
app/sections/VoiceCallPanel.tsx
app/sections/VoiceSessionProvider.tsx
app/welcome/page.tsx
azure/functions/.azurite/__azurite_db_blob__.json
azure/functions/.azurite/__azurite_db_blob_extent__.json
azure/functions/.azurite/__azurite_db_queue__.json
azure/functions/.azurite/__azurite_db_queue_extent__.json
azure/functions/.azurite/__azurite_db_table__.json
azure/functions/followup/function.json
azure/functions/followup/index.ts
azure/functions/host.json
azure/functions/local.settings.json
azure/functions/local.settings.json.example
azure/functions/matchmaker/function.json
azure/functions/matchmaker/index.ts
azure/functions/package.json
azure/functions/package-lock.json
azure/functions/README.md
azure/functions/reengage/function.json
azure/functions/reengage/index.ts
azure/functions/reminders/function.json
azure/functions/reminders/index.ts
azure/functions/tsconfig.json
CLAUDE.md
components.json
components/AgentCard.tsx
components/AgentTransitionTimeline.tsx
components/AppointmentRow.tsx
components/CallRow.tsx
components/CallStateTransitionViewer.tsx
components/ClientProviders.tsx
components/ClientRow.tsx
components/CommandPalette.tsx
components/CostsTab.tsx
components/ErrorBoundary.tsx
components/HelpNav.tsx
components/HydrationGuard.tsx
components/IframeLoggerInit.tsx
components/KanbanColumn.tsx
components/KBBuilderCard.tsx
components/KnowledgeBaseUpload.tsx
components/LeadCard.tsx
components/LeadDetailsSheet.tsx
components/leads/LeadsFilterBar.tsx
components/leads/LeadsSearch.tsx
components/leads/LeadsTable.tsx
components/leads/LeadsViewToggle.tsx
components/leads/LeadsWorkspace.tsx
components/LiveActivityFeed.tsx
components/LivePulse.tsx
components/modals/NewCampaignModal.tsx
components/modals/NewClientModal.tsx
components/modals/NewPropertyModal.tsx
components/modals/PromoteToBrokerModal.tsx
components/Pill.tsx
components/PropertyCard.tsx
components/RunDetailDrawer.tsx
components/Sidebar.tsx
components/SidebarClient.tsx
components/StatStrip.tsx
components/SystemMap.tsx
components/ui/accordion.tsx
components/ui/alert.tsx
components/ui/alert-dialog.tsx
components/ui/aspect-ratio.tsx
components/ui/avatar.tsx
components/ui/badge.tsx
components/ui/breadcrumb.tsx
components/ui/button.tsx
components/ui/button-group.tsx
components/ui/calendar.tsx
components/ui/card.tsx
components/ui/carousel.tsx
components/ui/chart.tsx
components/ui/checkbox.tsx
components/ui/collapsible.tsx
components/ui/command.tsx
components/ui/ConfirmDialog.tsx
components/ui/context-menu.tsx
components/ui/dialog.tsx
components/ui/drawer.tsx
components/ui/dropdown-menu.tsx
components/ui/empty.tsx
components/ui/field.tsx
components/ui/form.tsx
components/ui/hover-card.tsx
components/ui/input.tsx
components/ui/input-group.tsx
components/ui/input-otp.tsx
components/ui/item.tsx
components/ui/kbd.tsx
components/ui/label.tsx
components/ui/menubar.tsx
components/ui/navigation-menu.tsx
components/ui/pagination.tsx
components/ui/popover.tsx
components/ui/progress.tsx
components/ui/radio-group.tsx
components/ui/resizable.tsx
components/ui/scroll-area.tsx
components/ui/select.tsx
components/ui/separator.tsx
components/ui/sheet.tsx
components/ui/sidebar.tsx
components/ui/skeleton.tsx
components/ui/slider.tsx
components/ui/sonner.tsx
components/ui/spinner.tsx
components/ui/switch.tsx
components/ui/table.tsx
components/ui/tabs.tsx
components/ui/textarea.tsx
components/ui/toggle.tsx
components/ui/toggle-group.tsx
components/ui/tooltip.tsx
data/demo-kb.json
data/propertySeed.ts
docs/AGENT_REASONING_AND_AUTOMATION_LOG.md
docs/AZURE_CRON_SETUP.md
docs/gharsoch_stage1_master_brief_for_opus.md
docs/MASTER_GAP_REPORT.md
docs/PHASE_11_AUTH_DESIGN.md
docs/PROJECT_STRUCTURE_AND_FILE_MAP.md
docs/VAPI_ASSISTANTS_SETUP.md
docs/VOICE_ARCHITECTURE.md
hooks/useAgent.ts
hooks/useLeadsViewPreference.ts
hooks/use-mobile.tsx
hooks/useRealtimeAgentMonitoring.ts
lib/agentExecutionEventBroadcaster.ts
lib/agentLogger.ts
lib/agentRegistry.ts
lib/agents/__tests__/matchmaker.test.ts
lib/agents/__tests__/matchmaker_logic.test.ts
lib/agents/campaignConductor.ts
lib/agents/clientLeadConverter.ts
lib/agents/matchmaker.ts
lib/agents/priceDropNegotiator.ts
lib/aiAgent.ts
lib/auth.config.ts
lib/auth.ts
lib/auth/requireBroker.ts
lib/auth/roles.ts
lib/auth/useUserRole.ts
lib/azureBlob.ts
lib/builderKBService.ts
lib/callArchiveService.ts
lib/clipboard.ts
lib/crudHandler.ts
lib/demoKb.ts
lib/download.ts
lib/envCheck.ts
lib/fetchWrapper.ts
lib/googleCalendar.ts
lib/hooks/useAgentEventStream.ts
lib/iframeLogger.ts
lib/jsonParser.ts
lib/mongodb.ts
lib/openaiClient.ts
lib/ragKnowledgeBase.ts
lib/reasoningSummaryGenerator.ts
lib/runAgent.ts
lib/scheduler.ts
lib/services/agentDashboardService.ts
lib/services/analyticsService.ts
lib/services/appointmentService.ts
lib/services/callService.ts
lib/services/campaignService.ts
lib/services/clientService.ts
lib/services/dashboardService.ts
lib/services/leadService.ts
lib/services/propertyService.ts
lib/services/sidebarCountsService.ts
lib/services/systemConfigService.ts
lib/services/userService.ts
lib/toast.ts
lib/ui/agentVisuals.tsx
lib/utils.ts
lib/vapi/callReportHandler.ts
lib/vapi/toolRouter.ts
lib/vapi/tools/bookAppointment.ts
lib/vapi/tools/calculateAffordability.ts
lib/vapi/tools/cancelAppointment.ts
lib/vapi/tools/confirmAppointment.ts
lib/vapi/tools/markDnd.ts
lib/vapi/tools/qualifyLead.ts
lib/vapi/tools/rescheduleAppointment.ts
lib/vapi/tools/scheduleCallback.ts
lib/vapi/tools/searchProperties.ts
lib/vapiClient.ts
middleware.ts
models/AgentExecutionLog.ts
models/Appointment.ts
models/Brokerage.ts
models/Builder.ts
models/Call.ts
models/CallArchive.ts
models/callLog.ts
models/Campaign.ts
models/Client.ts
models/clientProfile.ts
models/Lead.ts
models/LeadStateHistory.ts
models/Property.ts
models/propertyAssessment.ts
models/propertyMatch.ts
models/scheduledMeeting.ts
models/systemConfig.ts
models/User.ts
netlify.toml
next.config.js
next-env.d.ts
package.json
package-lock.json
pages/_document.tsx
pages/_error.tsx
postcss.config.js
scratch_reset_full.js
scripts/count_properties.js
scripts/create_indexes.js
scripts/diagnose_users.js
scripts/init_collections.js
scripts/mongo_dump.js
scripts/mongo_import.js
tailwind.config.ts
tsconfig.json
types/next-auth.d.ts
workflow.json
workflow_state.json
```
### Counts
- Total file count: 338
### Top 20 largest source files by line count
- `package-lock.json:1` - 10892 lines
- `docs/PHASE_11_AUTH_DESIGN.md:1` - 848 lines
- `app/globals.css:1` - 806 lines
- `components/ui/sidebar.tsx:1` - 770 lines
- `app/sections/AffordabilitySection.tsx:1` - 675 lines
- `app/sections/DashboardSection.tsx:1` - 633 lines
- `CLAUDE.md:1` - 608 lines
- `lib/services/agentDashboardService.ts:1` - 601 lines
- `lib/scheduler.ts:1` - 548 lines
- `components/ErrorBoundary.tsx:1` - 543 lines
- `docs/gharsoch_stage1_master_brief_for_opus.md:1` - 528 lines
- `docs/VAPI_ASSISTANTS_SETUP.md:1` - 514 lines
- `docs/MASTER_GAP_REPORT.md:1` - 510 lines
- `components/AgentCard.tsx:1` - 469 lines
- `lib/agentLogger.ts:1` - 456 lines
- `data/propertySeed.ts:1` - 419 lines
- `app/sections/AppointmentsSection.tsx:1` - 405 lines
- `app/api/calls/sync/route.ts:1` - 404 lines
- `lib/agents/campaignConductor.ts:1` - 402 lines
- `components/RunDetailDrawer.tsx:1` - 373 lines
### Languages breakdown
- `.ts`: 151
- `.tsx`: 142
- `.js`: 9
- `.jsx`: 0
- `.json`: 22
- `.md`: 10
- `.css`: 1

## Section 2 — package.json snapshot
```json
{
    "name":  "nextjs-project",
    "version":  "0.1.0",
    "engines":  null,
    "scripts":  {
                    "dev":  "next dev --turbo -p 3000",
                    "build":  "next build",
                    "start":  "node server.js",
                    "lint":  "next lint"
                },
    "dependencies":  {
                         "@auth/mongodb-adapter":  "^3.11.2",
                         "@azure/identity":  "^4.13.1",
                         "@azure/storage-blob":  "^12.31.0",
                         "@dnd-kit/core":  "^6.3.1",
                         "@hookform/resolvers":  "^3.10.0",
                         "@radix-ui/react-accordion":  "^1.2.12",
                         "@radix-ui/react-alert-dialog":  "^1.1.15",
                         "@radix-ui/react-aspect-ratio":  "^1.1.8",
                         "@radix-ui/react-avatar":  "^1.1.11",
                         "@radix-ui/react-checkbox":  "^1.3.3",
                         "@radix-ui/react-collapsible":  "^1.1.12",
                         "@radix-ui/react-context-menu":  "^2.2.16",
                         "@radix-ui/react-dialog":  "^1.1.15",
                         "@radix-ui/react-dropdown-menu":  "^2.1.16",
                         "@radix-ui/react-hover-card":  "^1.1.15",
                         "@radix-ui/react-label":  "^2.1.8",
                         "@radix-ui/react-menubar":  "^1.1.16",
                         "@radix-ui/react-navigation-menu":  "^1.2.14",
                         "@radix-ui/react-popover":  "^1.1.15",
                         "@radix-ui/react-progress":  "^1.1.8",
                         "@radix-ui/react-radio-group":  "^1.3.8",
                         "@radix-ui/react-scroll-area":  "^1.2.10",
                         "@radix-ui/react-select":  "^2.2.6",
                         "@radix-ui/react-separator":  "^1.1.8",
                         "@radix-ui/react-slider":  "^1.3.6",
                         "@radix-ui/react-slot":  "^1.2.4",
                         "@radix-ui/react-switch":  "^1.2.6",
                         "@radix-ui/react-tabs":  "^1.1.13",
                         "@radix-ui/react-toggle":  "^1.1.10",
                         "@radix-ui/react-toggle-group":  "^1.1.11",
                         "@radix-ui/react-tooltip":  "^1.2.8",
                         "@tanstack/react-table":  "^8.20.5",
                         "@vapi-ai/web":  "^2.5.2",
                         "class-variance-authority":  "^0.7.1",
                         "clsx":  "^2.1.1",
                         "cmdk":  "^1.1.1",
                         "date-fns":  "^3.6.0",
                         "embla-carousel-react":  "^8.6.0",
                         "googleapis":  "^171.4.0",
                         "input-otp":  "^1.4.2",
                         "jose":  "^6.2.2",
                         "lucide-react":  "^0.441.0",
                         "mongodb":  "^5.9.2",
                         "next":  "14.2.23",
                         "next-auth":  "^5.0.0-beta.31",
                         "next-themes":  "^0.4.6",
                         "openai":  "^6.34.0",
                         "puppeteer":  "^24.43.0",
                         "react":  "^18.3.1",
                         "react-day-picker":  "^9.13.0",
                         "react-dom":  "^18.3.1",
                         "react-hook-form":  "^7.71.1",
                         "react-icons":  "^5.3.0",
                         "react-resizable-panels":  "^4.5.3",
                         "recharts":  "^2.15.4",
                         "sonner":  "^1.7.4",
                         "tailwind-merge":  "^2.5.2",
                         "tailwindcss-animate":  "^1.0.7",
                         "vaul":  "^0.9.9",
                         "xlsx":  "^0.18.5",
                         "zod":  "^3.25.76"
                     },
    "devDependencies":  {
                            "@netlify/plugin-nextjs":  "^5.15.8",
                            "@types/node":  "^20.16.5",
                            "@types/react":  "^18.3.5",
                            "@types/react-dom":  "^18.3.0",
                            "autoprefixer":  "^10.4.20",
                            "dotenv":  "^17.4.2",
                            "eslint":  "^8.57.0",
                            "eslint-config-next":  "14.2.23",
                            "postcss":  "^8.4.47",
                            "tailwindcss":  "^3.4.11",
                            "typescript":  "^5.6.2"
                        }
}
```

## Section 3 — Environment variables
### Exact `src/` scan
NOT FOUND
### AUTH_*, NEXTAUTH_*
(empty - no matching files in repo)
### VAPI_*
- `VAPI_API_KEY` - `app/api/calls/sync/route.ts:8`
- `VAPI_ASSISTANT_CALLBACK_ID` - `app/api/cron/follow-up/route.ts:172`
- `VAPI_ASSISTANT_INBOUND_ID` - `app/(admin)/settings/users/page.tsx:23`
- `VAPI_ASSISTANT_OUTBOUND_ID` - `app/(admin)/settings/users/page.tsx:22`
- `VAPI_ASSISTANT_REMINDER_ID` - `app/(admin)/settings/users/page.tsx:24`
- `VAPI_PHONE_NUMBER_ID` - `lib/vapiClient.ts:31`
- `VAPI_WEBHOOK_SECRET` - `app/api/vapi/webhook/route.ts:36`
### MONGODB_*, COSMOS_*
(empty - no matching files in repo)
### CRON_*, SCHEDULE_*
- `CRON_SECRET` - `app/api/agent/campaign-conductor/route.ts:11`
### OPENAI_*, ANTHROPIC_*
- `OPENAI_API_KEY` - `app/api/agent/matchmaker/route.ts:18`
### Other
- `ARCHIVE_DAYS_OLD` - `app/api/cron/archive/route.ts:21`
- `AZURE_STORAGE_CONNECTION_STRING` - `app/api/upload/route.ts:10`
- `AZURE_STORAGE_CONTAINER_NAME` - `lib/azureBlob.ts:4`
- `BOOTSTRAP_ADMIN_EMAIL` - `lib/auth.ts:58`
- `DATABASE_URL` - `app/api/leads/webhook/route.ts:34`
- `DEFAULT_BROKER_ID` - `lib/auth/requireBroker.ts:13`
- `GOOGLE_CALENDAR_CLIENT_ID` - `lib/googleCalendar.ts:3`
- `GOOGLE_CALENDAR_CLIENT_SECRET` - `lib/googleCalendar.ts:4`
- `GOOGLE_CALENDAR_REDIRECT_URI` - `lib/googleCalendar.ts:5`
- `GOOGLE_CALENDAR_REFRESH_TOKEN` - `lib/googleCalendar.ts:8`
- `GOOGLE_CLIENT_ID` - `lib/auth.ts:37`
- `GOOGLE_CLIENT_SECRET` - `lib/auth.ts:38`
- `IMMEDIATE_CALL_AFTER_MATCH` - `lib/agents/matchmaker.ts:245`
- `IS_PAID_USER` - `app/layout.tsx:22`
- `NEXT_PHASE` - `lib/envCheck.ts:16`
- `NEXT_PUBLIC_AGENT_ID` - `hooks/useAgent.ts:128`
- `NEXT_PUBLIC_ENABLE_VOICE_ORCHESTRATOR` - `app/(admin)/ai-operations/page.tsx:62`
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID` - `app/sections/VoiceCallPanel.tsx:144`
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY` - `app/sections/VoiceCallPanel.tsx:46`
- `NODE_ENV` - `app/api/vapi/webhook/route.ts:64`
- `OUTBOUND_COOLDOWN_MINUTES` - `app/api/campaigns/trigger/route.ts:44`
### .env.example
```dotenv
# Environment Variables for GharSoch

# --- CORE ---
PORT=3333
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/gharsoch?retryWrites=true&w=majority
APP_JWT_SECRET=your-secure-jwt-secret-here

# --- AI ---
OPENAI_API_KEY=sk-proj-xxxxxxx

# --- TELEPHONY (VAPI + TWILIO) ---
VAPI_API_KEY=xxxxxxxx
VAPI_PHONE_NUMBER_ID=xxxxxxxx
NEXT_PUBLIC_VAPI_PUBLIC_KEY=xxxxxxxx

# Sunrise Property Voice Assistants (create in Vapi Dashboard, see docs/VAPI_ASSISTANTS_SETUP.md)
VAPI_ASSISTANT_OUTBOUND_ID=       # Sunrise Property-outbound assistant ID
VAPI_ASSISTANT_INBOUND_ID=        # Sunrise Property-inbound assistant ID
VAPI_ASSISTANT_REMINDER_ID=       # Sunrise Property-reminder assistant ID

# --- CRON / SECURITY ---
# Used to protect cron routes (Authorization: Bearer <CRON_SECRET>)
CRON_SECRET=xxxxxxxx

# Minutes between outbound calls to same lead. Default 240 (4h). 0 disables.
OUTBOUND_COOLDOWN_MINUTES=240

# --- PUBLIC URL ---
# Public base URL of the app (used for absolute links/webhooks if needed)
PUBLIC_APP_URL=https://gharsoch.tech

# Twilio (import into Vapi via Dashboard → Phone Numbers → Import Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx

# --- AZURE STORAGE ---
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=xxxx;AccountKey=xxxx;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME=gharsoch-assets

# --- EXTERNAL SERVICES ---
GOOGLE_CALENDAR_CLIENT_ID=xxxxxxxx
GOOGLE_CALENDAR_CLIENT_SECRET=xxxxxxxx
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3333/api/auth/callback/google
GOOGLE_CALENDAR_REFRESH_TOKEN=xxxxxxxx
#   B 1 1 :   W h e n   " t r u e " ,   m a t c h m a k e r   t r i g g e r s   a n   i m m e d i a t e   c a l l   r i g h t   a f t e r   w r i t i n g   a   p r o p e r t y   m a t c h . 
 
 I M M E D I A T E _ C A L L _ A F T E R _ M A T C H = f a l s e 
 
 D E F A U L T _ B R O K E R _ I D = 
 
 
```

## Section 4 — Mongo schema / models
### `lib/services/agentDashboardService.ts`
```ts
import { ObjectId } from 'mongodb'

import { getCollection } from '@/lib/mongodb'
import type { AgentAction, AgentExecutionTrace, ReasoningStep } from '@/lib/agentLogger'

const FOLLOW_UP_AGENT_LEGACY_ID = '69e8f709f89cad5d4b752d24'
const KNOWN_AGENT_NAMES: Record<string, string> = {
  matchmaker: 'The Matchmaker',
  follow_up_agent: 'The Follow-Up Agent',
  appointment_guardian: 'The Appointment Guardian',
  dead_lead_reengager: 'The Dead Lead Re-engager',
  price_drop_negotiator: 'The Price Drop Negotiator',
  voice_orchestrator: 'Voice Orchestrator',
}

export type AgentDashboardSummary = {
  agent_id: string
  agent_name: string
  last_run_at: string | null
  last_run_status: string | null
  runs_24h: number
  success_rate: number
  kb_hits_24h: number
  tool_calls_24h?: number
  search_props_24h?: number
  qualify_lead_24h?: number
  book_appt_24h?: number
  calls_in_flight?: number
  in_flight_runs?: VoiceInFlightRun[]
}

export type HealthStripData = {
  runs24h: number
  callsDialed: number
  openAiTokens: number
  vapiMinutes: number
  mongoWrites: number
  systemStatus: string
}

export type EnrichedMatchDetail = {
  client_id?: string
  client_name?: string
  property_id?: string
  property_title?: string
  builder_name?: string
  location?: string
  score?: number
  rationale?: string
  vapi_call_id?: string
  status?: string
}

export type AgentDashboardRun = Omit<AgentExecutionTrace, '_id'> & {
  _id?: string
  agent_id: string
  agent_name: string
  reasoning_steps: ReasoningStep[]
  actions: AgentAction[]
  reasoning_summary?: {
    summary: string
    confidence: number
    generated_at: string
  }
  summary_failed?: boolean
  summary_error?: string
  output_data?: Record<string, any> & {
    match_details?: EnrichedMatchDetail[]
  }
}

export type ActivityRunFilter =
  | 'all'
  | 'matchmaker'
  | 'follow_up_agent'
  | 'appointment_guardian'
  | 'dead_lead_reengager'
  | 'price_drop_negotiator'
  | 'voice_orchestrator'
  | 'client_lead_converter'

export type VoiceInFlightRun = {
  run_id: string
  started_at: string
  elapsed_ms: number
  call_id?: string
  webhook_type?: string
  tool_names: string[]
}

type EntityMap = Record<string, { name?: string; title?: string; builder_name?: string; location?: string }>

function canonicalizeAgentId(agentId: string | undefined | null) {
  if (!agentId) return 'unknown_agent'
  if (agentId === FOLLOW_UP_AGENT_LEGACY_ID) return 'follow_up_agent'
  return agentId
}

function canonicalizeAgentName(agentId: string, agentName?: string | null) {
  return agentName || KNOWN_AGENT_NAMES[agentId] || agentId
}

function isSuccessStatus(status: string | undefined | null) {
  return status === 'completed' || status === 'success'
}

function isFailureStatus(status: string | undefined | null) {
  return status === 'failed' || status === 'error'
}

function toObjectIds(ids: string[]) {
  return ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function extractKbHits(run: Pick<AgentExecutionTrace, 'actions'>) {
  return run.actions.filter((action) => action.action_type.toLowerCase().includes('kb')).length
}

function extractToolDispatches(run: Pick<AgentExecutionTrace, 'actions'>) {
  return run.actions.filter((action) => action.action_type === 'tool_dispatch')
}

function extractToolDispatchCount(run: Pick<AgentExecutionTrace, 'actions'>, toolName: string) {
  return extractToolDispatches(run).filter(
    (action) => action.parameters?.tool_name === toolName
  ).length
}

function extractOpenAiTokens(run: Pick<AgentExecutionTrace, 'actions'>) {
  return run.actions.reduce((total, action) => {
    const usage = action.result?.usage
    return total + safeNumber(usage?.total_tokens)
  }, 0)
}

function extractVapiMinutes(run: Pick<AgentExecutionTrace, 'actions'>) {
  const totalSeconds = run.actions.reduce((total, action) => {
    const result = action.result || {}
    const seconds =
      safeNumber(result.duration_seconds) ||
      safeNumber(result.durationSeconds) ||
      safeNumber(result.duration) ||
      safeNumber(result.duration_sec)
    const minutes = safeNumber(result.duration_minutes) || safeNumber(result.minutes)

    if (seconds > 0) {
      return total + seconds
    }

    if (minutes > 0) {
      return total + minutes * 60
    }

    return total
  }, 0)

  return Number((totalSeconds / 60).toFixed(1))
}

function extractCallsDialed(run: Pick<AgentExecutionTrace, 'actions' | 'output_data'>) {
  const explicitCalls = safeNumber(run.output_data?.triggered_calls)
  if (explicitCalls > 0) {
    return explicitCalls
  }

  return run.actions.filter((action) => {
    const type = action.action_type.toLowerCase()
    if (!type.includes('vapi')) return false
    return Boolean(action.result?.callId || action.result?.vapi_call_id || action.parameters?.phone)
  }).length
}

function extractMongoWrites(run: Pick<AgentExecutionTrace, 'actions'>) {
  return run.actions.filter((action) => action.action_type === 'mongo_write').length
}

async function fetchEntityMap(
  collectionName: string,
  ids: string[],
  projection: Record<string, 1>
) {
  if (ids.length === 0) {
    return {} as EntityMap
  }

  const collection = await getCollection(collectionName)
  const docs = await collection.find(
    { _id: { $in: toObjectIds(ids) } },
    { projection }
  ).toArray()

  return docs.reduce<EntityMap>((acc, doc: any) => {
    acc[String(doc._id)] = {
      name: doc.name,
      title: doc.title,
      builder_name: doc.builder_name || doc.builder,
      location: doc.location || doc.location_pref,
    }
    return acc
  }, {})
}

async function enrichRuns(rawRuns: AgentExecutionTrace[]): Promise<AgentDashboardRun[]> {
  const clientIds = new Set<string>()
  const propertyIds = new Set<string>()
  const callIds = new Set<string>()

  rawRuns.forEach((run) => {
    const matchDetails = Array.isArray(run.output_data?.match_details) ? run.output_data.match_details : []
    matchDetails.forEach((detail: any) => {
      if (typeof detail.client_id === 'string') clientIds.add(detail.client_id)
      if (typeof detail.property_id === 'string') propertyIds.add(detail.property_id)
    })

    const propertyId = run.output_data?.property?.id
    if (typeof propertyId === 'string') {
      propertyIds.add(propertyId)
    }

    const callId =
      typeof run.input_data?.call_id === 'string'
        ? run.input_data.call_id
        : typeof run.output_data?.callId === 'string'
          ? run.output_data.callId
          : typeof run.output_data?.call_id === 'string'
            ? run.output_data.call_id
            : undefined
    if (callId) {
      callIds.add(callId)
    }
  })

  const [clientsMap, leadsMap, propertiesMap, callsMap] = await Promise.all([
    fetchEntityMap('clients', [...clientIds], { name: 1 }),
    fetchEntityMap('leads', [...clientIds], { name: 1 }),
    fetchEntityMap('properties', [...propertyIds], { title: 1, builder_name: 1, builder: 1, location: 1 }),
    (async () => {
      if (callIds.size === 0) {
        return {} as Record<string, any>
      }

      const calls = await getCollection('calls')
      const docs = await calls
        .find(
          { vapi_call_id: { $in: [...callIds] } },
          {
            projection: {
              vapi_call_id: 1,
              transcript: 1,
              recording_url: 1,
              duration_seconds: 1,
              ended_reason: 1,
              call_status: 1,
            },
          }
        )
        .toArray()

      return docs.reduce<Record<string, any>>((acc, doc: any) => {
        if (doc.vapi_call_id) {
          acc[String(doc.vapi_call_id)] = doc
        }
        return acc
      }, {})
    })(),
  ])

  return rawRuns.map((run) => {
    const agent_id = canonicalizeAgentId(run.agent_id)
    let output_data = run.output_data ? { ...run.output_data } : undefined

    if (Array.isArray(output_data?.match_details)) {
      output_data.match_details = output_data.match_details.map((detail: any) => {
        const client = (detail.client_id && (clientsMap[detail.client_id] || leadsMap[detail.client_id])) || {}
        const property = (detail.property_id && propertiesMap[detail.property_id]) || {}

        return {
          ...detail,
          client_name: client.name,
          property_title: property.title,
          builder_name: property.builder_name,
          location: property.location,
        }
      })
    }

    if (output_data?.property?.id && !output_data?.property?.title) {
      const property = propertiesMap[output_data.property.id]
      if (property?.title) {
        output_data.property = {
          ...output_data.property,
          title: property.title,
        }
      }
    }

    const linkedCallId =
      typeof run.input_data?.call_id === 'string'
        ? run.input_data.call_id
        : typeof output_data?.callId === 'string'
          ? output_data.callId
          : typeof output_data?.call_id === 'string'
            ? output_data.call_id
            : undefined
    const linkedCall = linkedCallId ? callsMap[linkedCallId] : null

    if (linkedCall) {
      const nextOutput = output_data || {}
      if (!nextOutput.transcript && !nextOutput.transcript_excerpt && linkedCall.transcript) {
        nextOutput.transcript_excerpt = linkedCall.transcript
      }
      if (!nextOutput.recording_url && linkedCall.recording_url) {
        nextOutput.recording_url = linkedCall.recording_url
      }
      if (!nextOutput.duration_seconds && linkedCall.duration_seconds) {
        nextOutput.duration_seconds = linkedCall.duration_seconds
      }
      if (!nextOutput.ended_reason && linkedCall.ended_reason) {
        nextOutput.ended_reason = linkedCall.ended_reason
      }
      if (!nextOutput.call_status && linkedCall.call_status) {
        nextOutput.call_status = linkedCall.call_status
      }
      output_data = nextOutput
    }

    return {
      ...run,
      _id: run._id ? String(run._id) : undefined,
      agent_id,
      agent_name: canonicalizeAgentName(agent_id, run.agent_name),
      output_data,
    }
  })
}

async function getLast24hRuns() {
  const collection = await getCollection<AgentExecutionTrace>('agent_execution_logs')
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const runs = await collection
    .find(
      { started_at: { $gte: cutoff } },
      {
        projection: {
          _id: 1,
          run_id: 1,
          agent_id: 1,
          agent_name: 1,
          start_time: 1,
          started_at: 1,
          end_time: 1,
          completed_at: 1,
          execution_time_ms: 1,
          status: 1,
          input_data: 1,
          reasoning_steps: 1,
          actions: 1,
          output_data: 1,
          reasoning_summary: 1,
          summary_failed: 1,
          summary_error: 1,
          errors: 1,
          metadata: 1,
          created_at: 1,
          updated_at: 1,
        },
      }
    )
    .toArray()

  return runs.sort((a, b) => new Date(b.started_at || b.created_at || 0).getTime() - new Date(a.started_at || a.created_at || 0).getTime())
}

async function getVoiceInFlightRuns(): Promise<VoiceInFlightRun[]> {
  const collection = await getCollection<AgentExecutionTrace>('agent_execution_logs')
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const runs = await collection
    .find(
      {
        agent_id: 'voice_orchestrator',
        status: 'started',
        started_at: { $gte: cutoff },
      },
      {
        projection: {
          run_id: 1,
          started_at: 1,
          created_at: 1,
          input_data: 1,
        },
      }
    )
    .sort({ started_at: -1 })
    .toArray()

  return runs.map((run: any) => {
    const startedAt = run.started_at || run.created_at || new Date().toISOString()
    return {
      run_id: run.run_id,
      started_at: startedAt,
      elapsed_ms: Math.max(0, Date.now() - Date.parse(startedAt)),
      call_id: run.input_data?.call_id,
      webhook_type: run.input_data?.webhook_type,
      tool_names: Array.isArray(run.input_data?.tool_names) ? run.input_data.tool_names : [],
    }
  })
}

export async function getAgentSummaries(): Promise<AgentDashboardSummary[]> {
  const [runs, voiceInFlightRuns] = await Promise.all([getLast24hRuns(), getVoiceInFlightRuns()])
  const grouped = new Map<string, AgentDashboardSummary & { successful_runs: number }>()

  runs.forEach((run) => {
    const agent_id = canonicalizeAgentId(run.agent_id)
    const existing = grouped.get(agent_id)
    const voiceMetrics = agent_id === 'voice_orchestrator'
      ? {
          tool_calls_24h: extractToolDispatches(run).length,
          search_props_24h: extractToolDispatchCount(run, 'search_properties'),
          qualify_lead_24h: extractToolDispatchCount(run, 'qualify_lead'),
          book_appt_24h: extractToolDispatchCount(run, 'book_appointment'),
        }
      : {}

    if (!existing) {
      grouped.set(agent_id, {
        agent_id,
        agent_name: canonicalizeAgentName(agent_id, run.agent_name),
        last_run_at: run.started_at || run.created_at,
        last_run_status: run.status,
        runs_24h: 1,
        success_rate: 0,
        kb_hits_24h: extractKbHits(run),
        successful_runs: isSuccessStatus(run.status) ? 1 : 0,
        ...voiceMetrics,
      })
      return
    }

    existing.runs_24h += 1
    existing.kb_hits_24h += extractKbHits(run)
    existing.successful_runs += isSuccessStatus(run.status) ? 1 : 0

    if (agent_id === 'voice_orchestrator') {
      existing.tool_calls_24h = (existing.tool_calls_24h ?? 0) + extractToolDispatches(run).length
      existing.search_props_24h = (existing.search_props_24h ?? 0) + extractToolDispatchCount(run, 'search_properties')
      existing.qualify_lead_24h = (existing.qualify_lead_24h ?? 0) + extractToolDispatchCount(run, 'qualify_lead')
      existing.book_appt_24h = (existing.book_appt_24h ?? 0) + extractToolDispatchCount(run, 'book_appointment')
    }
  })

  return [...grouped.values()].map((summary) => ({
    agent_id: summary.agent_id,
    agent_name: summary.agent_name,
    last_run_at: summary.last_run_at,
    last_run_status: summary.last_run_status,
    runs_24h: summary.runs_24h,
    success_rate: summary.runs_24h > 0 ? Math.round((summary.successful_runs / summary.runs_24h) * 100) : 0,
    kb_hits_24h: summary.kb_hits_24h,
    tool_calls_24h: summary.agent_id === 'voice_orchestrator' ? summary.tool_calls_24h ?? 0 : undefined,
    search_props_24h: summary.agent_id === 'voice_orchestrator' ? summary.search_props_24h ?? 0 : undefined,
    qualify_lead_24h: summary.agent_id === 'voice_orchestrator' ? summary.qualify_lead_24h ?? 0 : undefined,
    book_appt_24h: summary.agent_id === 'voice_orchestrator' ? summary.book_appt_24h ?? 0 : undefined,
    calls_in_flight: summary.agent_id === 'voice_orchestrator' ? voiceInFlightRuns.length : undefined,
    in_flight_runs: summary.agent_id === 'voice_orchestrator' ? voiceInFlightRuns : undefined,
  }))
}

export async function getRecentRuns(limit: number = 8): Promise<AgentDashboardRun[]> {
  const collection = await getCollection<AgentExecutionTrace>('agent_execution_logs')
  const runs = await collection
    .find(
      {},
      {
        projection: {
          _id: 1,
          run_id: 1,
          agent_id: 1,
          agent_name: 1,
          start_time: 1,
          started_at: 1,
          end_time: 1,
          completed_at: 1,
          execution_time_ms: 1,
          status: 1,
          input_data: 1,
          reasoning_steps: 1,
          actions: 1,
          output_data: 1,
          reasoning_summary: 1,
          summary_failed: 1,
          summary_error: 1,
          errors: 1,
          metadata: 1,
          created_at: 1,
          updated_at: 1,
        },
      }
    )
    .toArray()

  const ordered = runs
    .sort((a, b) => new Date(b.started_at || b.created_at || 0).getTime() - new Date(a.started_at || a.created_at || 0).getTime())
    .slice(0, limit)

  return enrichRuns(ordered)
}

export async function listActivityRuns(options: {
  limit?: number
  skip?: number
  agentId?: ActivityRunFilter | string
} = {}): Promise<{ runs: AgentDashboardRun[]; total: number }> {
  const collection = await getCollection<AgentExecutionTrace>('agent_execution_logs')
  const rawRuns = await collection.find({}).toArray()
  const normalizedAgentId =
    options.agentId && options.agentId !== 'all'
      ? canonicalizeAgentId(options.agentId)
      : null

  const filtered = rawRuns
    .map((run) => ({
      ...run,
      agent_id: canonicalizeAgentId(run.agent_id),
      agent_name: canonicalizeAgentName(canonicalizeAgentId(run.agent_id), run.agent_name),
    }))
    .filter((run) => (normalizedAgentId ? run.agent_id === normalizedAgentId : true))
    .sort((a, b) => new Date(b.started_at || b.created_at || 0).getTime() - new Date(a.started_at || a.created_at || 0).getTime())

  const total = filtered.length
  const paginated = filtered.slice(options.skip || 0, (options.skip || 0) + (options.limit || 50))
  return {
    runs: await enrichRuns(paginated),
    total,
  }
}

export async function getRunDetail(runId: string): Promise<AgentDashboardRun | null> {
  const collection = await getCollection<AgentExecutionTrace>('agent_execution_logs')
  const run = await collection.findOne(
    { run_id: runId },
    {
      projection: {
        _id: 1,
        run_id: 1,
        agent_id: 1,
        agent_name: 1,
        start_time: 1,
        started_at: 1,
        end_time: 1,
        completed_at: 1,
        execution_time_ms: 1,
        status: 1,
        input_data: 1,
        reasoning_steps: 1,
        actions: 1,
        output_data: 1,
        reasoning_summary: 1,
        summary_failed: 1,
        summary_error: 1,
        errors: 1,
        metadata: 1,
        created_at: 1,
        updated_at: 1,
      },
    }
  )

  if (!run) {
    return null
  }

  const [enrichedRun] = await enrichRuns([run])
  return enrichedRun ?? null
}
```
### `lib/services/analyticsService.ts`
```ts
/**
 * Analytics Service
 * Aggregates real data from MongoDB for the analytics dashboard.
 * Phase 12 wires Vapi/OpenAI billing APIs; for now, all values are derived from existing collections.
 */

import { getCollection } from '@/lib/mongodb'

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  const raw = (num / den) * 100;
  return Math.min(100, Math.round(raw * 10) / 10);
}


export type AnalyticsRange = '7d' | '30d' | '90d'

export type AnalyticsKPIs = {
  lead_to_call_pct: number
  call_to_booking_pct: number
  booking_to_close_pct: number
  avg_response_min: number
  cost_per_lead_inr: number
  revenue_inferred_inr: number
}

export type AnalyticsFunnel = {
  clients: number
  converted_to_lead: number
  matched_to_property: number
  vapi_call_connected: number
  site_visit_booked: number
}

export type CallsPerAgentPoint = {
  date: string
  matchmaker: number
  follow_up: number
  re_engager: number
  guardian: number
  voice: number
}

export type TopPerformingAgent = {
  agent_id: string
  agent_name: string
  conversion_rate_pct: number
  cost_per_call_inr: number
  roi_multiplier: number
}

function cutoffDate(range: AnalyticsRange): Date {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateLabel(d: Date): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }).format(d)
}

export async function getKPIs(range: AnalyticsRange = '7d'): Promise<AnalyticsKPIs> {
  try {
    const cutoff = cutoffDate(range)
    const [leadsCol, callsCol, appointmentsCol] = await Promise.all([
      getCollection('leads'),
      getCollection('calls'),
      getCollection('appointments'),
    ])

    const [totalLeads, distinctLeadsCalled, bookings, closes, totalCalls] = await Promise.all([
      leadsCol.countDocuments({ is_deleted: { $ne: true }, created_at: { $gte: cutoff } }),
      callsCol.distinct('lead_id', { created_at: { $gte: cutoff }, direction: 'outbound' }).then(res => res.length),
      appointmentsCol.countDocuments({ is_deleted: { $ne: true }, created_at: { $gte: cutoff } }),
      leadsCol.countDocuments({ is_deleted: { $ne: true }, status: { $in: ['closed', 'won'] }, updated_at: { $gte: cutoff } }),
      callsCol.countDocuments({ created_at: { $gte: cutoff } })
    ])

    // Avg response: time from lead creation to first call (sampled, simplified)
    const recentLeads = await leadsCol
      .find({ is_deleted: { $ne: true }, created_at: { $gte: cutoff }, first_contact_at: { $exists: true } })
      .project({ created_at: 1, first_contact_at: 1 })
      .limit(50)
      .toArray()

    let avgResponseMin = 0
    if (recentLeads.length > 0) {
      const diffs = recentLeads
        .map((l: any) => {
          const created = new Date(l.created_at).getTime()
          const contacted = new Date(l.first_contact_at).getTime()
          return (contacted - created) / 60000
        })
        .filter((d) => d > 0 && d < 1440) // ignore outliers > 24h
      avgResponseMin = diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0
    }

    const lead_to_call_pct = pct(distinctLeadsCalled, totalLeads)
    const call_to_booking_pct = pct(bookings, distinctLeadsCalled)
    const booking_to_close_pct = pct(closes, bookings)

    // Phase 12: real billing. For now use flat â‚¹15/call estimate
    const cost_per_lead_inr = totalLeads > 0 ? Math.round((totalCalls * 15) / Math.max(totalLeads, 1)) : 0
    // Revenue inferred: bookings Ã— avg ticket (â‚¹80L placeholder, Phase 12 will compute from property prices)
    const revenue_inferred_inr = bookings * 8000000

    return {
      lead_to_call_pct,
      call_to_booking_pct,
      booking_to_close_pct,
      avg_response_min: avgResponseMin,
      cost_per_lead_inr,
      revenue_inferred_inr,
    }
  } catch (err) {
    console.error('[analyticsService] getKPIs error:', err)
    return {
      lead_to_call_pct: 0,
      call_to_booking_pct: 0,
      booking_to_close_pct: 0,
      avg_response_min: 0,
      cost_per_lead_inr: 0,
      revenue_inferred_inr: 0,
    }
  }
}

export async function getFunnel(range: AnalyticsRange = '7d'): Promise<AnalyticsFunnel> {
  try {
    const cutoff = cutoffDate(range)
    const [clientsCol, leadsCol, callsCol, appointmentsCol] = await Promise.all([
      getCollection('clients').catch(() => null),
      getCollection('leads'),
      getCollection('calls'),
      getCollection('appointments'),
    ])

    const [clients, leads, connected, visits, allLeads] = await Promise.all([
      clientsCol ? clientsCol.countDocuments({ is_deleted: { $ne: true }, created_at: { $gte: cutoff } }) : Promise.resolve(0),
      leadsCol.countDocuments({ is_deleted: { $ne: true }, created_at: { $gte: cutoff } }),
      callsCol.countDocuments({ created_at: { $gte: cutoff }, call_status: { $in: ['completed', 'connected'] } }),
      appointmentsCol.countDocuments({ is_deleted: { $ne: true }, created_at: { $gte: cutoff } }),
      leadsCol.countDocuments({ is_deleted: { $ne: true }, created_at: { $gte: cutoff }, matched_property_id: { $exists: true } }),
    ])

    return {
      clients,
      converted_to_lead: leads,
      matched_to_property: allLeads,
      vapi_call_connected: connected,
      site_visit_booked: visits,
    }
  } catch (err) {
    console.error('[analyticsService] getFunnel error:', err)
    return { clients: 0, converted_to_lead: 0, matched_to_property: 0, vapi_call_connected: 0, site_visit_booked: 0 }
  }
}

export async function getCallsPerAgent(range: AnalyticsRange = '7d'): Promise<CallsPerAgentPoint[]> {
  try {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cutoff = cutoffDate(range)

    const execCollection = await getCollection('agent_execution_logs')
    const runs = await execCollection
      .find({
        $or: [{ started_at: { $gte: cutoff } }, { created_at: { $gte: cutoff } }],
        agent_id: { $in: ['matchmaker', 'follow_up_agent', 'dead_lead_reengager', 'appointment_guardian', 'voice_orchestrator'] },
      })
      .project({ agent_id: 1, started_at: 1, created_at: 1 })
      .limit(5000)
      .toArray()

    // Build day-keyed buckets
    const buckets: Record<string, Record<string, number>> = {}
    const agentKeys = ['matchmaker', 'follow_up', 're_engager', 'guardian', 'voice']

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = formatDateLabel(d)
      buckets[key] = { matchmaker: 0, follow_up: 0, re_engager: 0, guardian: 0, voice: 0 }
    }

    const AGENT_MAP: Record<string, string> = {
      matchmaker: 'matchmaker',
      follow_up_agent: 'follow_up',
      dead_lead_reengager: 're_engager',
      appointment_guardian: 'guardian',
      voice_orchestrator: 'voice',
    }

    for (const run of runs) {
      const ts = run.started_at || run.created_at
      if (!ts) continue
      const date = new Date(ts)
      const dayKey = formatDateLabel(date)
      if (!buckets[dayKey]) continue
      const agentKey = AGENT_MAP[run.agent_id as string]
      if (agentKey) {
        buckets[dayKey][agentKey] = (buckets[dayKey][agentKey] || 0) + 1
      }
    }

    return Object.entries(buckets).map(([date, counts]) => ({
      date,
      ...counts,
    })) as CallsPerAgentPoint[]
  } catch (err) {
    console.error('[analyticsService] getCallsPerAgent error:', err)
    return []
  }
}

export async function getTopPerformingAgent(range: AnalyticsRange = '7d'): Promise<TopPerformingAgent | null> {
  try {
    const cutoff = cutoffDate(range)
    const execCollection = await getCollection('agent_execution_logs')

    const runs = await execCollection
      .find({
        $or: [{ started_at: { $gte: cutoff } }, { created_at: { $gte: cutoff } }],
      })
      .project({ agent_id: 1, agent_name: 1, status: 1 })
      .limit(2000)
      .toArray()

    if (runs.length === 0) return null

    // Group by agent
    const agentGroups: Record<string, { name: string; total: number; success: number }> = {}
    for (const run of runs) {
      const id = String(run.agent_id || 'unknown')
      if (!agentGroups[id]) agentGroups[id] = { name: run.agent_name || id, total: 0, success: 0 }
      agentGroups[id].total += 1
      if (run.status === 'completed' || run.status === 'success') agentGroups[id].success += 1
    }

    // Find agent with highest success rate (min 3 runs)
    const best = Object.entries(agentGroups)
      .filter(([, g]) => g.total >= 3)
      .sort(([, a], [, b]) => b.success / b.total - a.success / a.total)[0]

    if (!best) return null

    const [agent_id, group] = best
    const conversion_rate_pct = Math.round((group.success / group.total) * 100)

    return {
      agent_id,
      agent_name: group.name,
      conversion_rate_pct,
      cost_per_call_inr: 15, // Phase 12: real billing
      roi_multiplier: conversion_rate_pct > 50 ? parseFloat((conversion_rate_pct / 20).toFixed(1)) : 1.0,
    }
```
### `lib/services/appointmentService.ts`
```ts
import { ObjectId } from 'mongodb'

const DB_NAME = 'test'
const COLLECTION = 'appointments'
const IST_TIMEZONE = 'Asia/Kolkata'

export type SerializedAppointment = Omit<Appointment, '_id' | 'scheduled_at' | 'created_at' | 'updated_at'> & {
  _id: string
  scheduled_at: string
  created_at: string
  updated_at: string
}

export type AppointmentDetail = SerializedAppointment & {
  lead?: {
    _id: string
    name: string
    phone: string
    email?: string
    interest_level?: string
    status?: string
  } | null
  property?: {
    _id: string
    title: string
    builder?: string
    location?: string
    price?: number
    status?: string
  } | null
  related_runs: Array<{
    run_id: string
    agent_id: string
    agent_name: string
    status: string
    started_at: string
    summary?: string
  }>
}

export type AppointmentStripData = {
  total: number
  confirmed: number
  scheduled: number
  rescheduled: number
  awaiting: number
  completed: number
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function serializeAppointment(appointment: any): SerializedAppointment {
  return {
    ...appointment,
    _id: String(appointment._id),
    scheduled_at: toIso(appointment.scheduled_at) || new Date().toISOString(),
    created_at: toIso(appointment.created_at) || new Date().toISOString(),
    updated_at: toIso(appointment.updated_at) || new Date().toISOString(),
  }
}

function byScheduledAtAscending(a: any, b: any) {
  return new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
}

function getIstDateKey(value: Date | string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Appointment>(COLLECTION)
}

async function listAllAppointments() {
  const collection = await getCollection()
  return (await collection.find({
    lead_id: { $exists: true, $nin: ['', null] },
    property_id: { $exists: true, $nin: ['', null] },
    is_deleted: { $ne: true },
  }).toArray()).sort(byScheduledAtAscending)
}

export const appointmentService = {
  async listToday(): Promise<SerializedAppointment[]> {
    const todayKey = getIstDateKey(new Date())
    const appointments = await listAllAppointments()

    return appointments
      .filter((appointment) => getIstDateKey(appointment.scheduled_at) === todayKey)
      .map(serializeAppointment)
  },

  async listUpcoming(days: number = 7): Promise<SerializedAppointment[]> {
    const todayKey = getIstDateKey(new Date())
    const appointments = await listAllAppointments()

    return appointments
      .filter((appointment) => {
        const key = getIstDateKey(appointment.scheduled_at)
        return key > todayKey
      })
      .slice(0, Math.max(days * 12, 50))
      .map(serializeAppointment)
  },

  async get(id: string): Promise<AppointmentDetail | null> {
    const collection = await getCollection()
    const appointment = await collection.findOne({ _id: new ObjectId(id) })

    if (!appointment) {
      return null
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)

    const [lead, property, rawRuns] = await Promise.all([
      appointment.lead_id ? db.collection('leads').findOne({ _id: new ObjectId(appointment.lead_id), is_deleted: { $ne: true } }) : null,
      appointment.property_id ? db.collection('properties').findOne({ _id: new ObjectId(appointment.property_id), is_deleted: { $ne: true } }) : null,
      db.collection('agent_execution_logs').find({}).limit(200).toArray(),
    ])

    const related_runs = rawRuns
      .filter((run: any) => {
        const leadId = appointment.lead_id
        const propertyId = appointment.property_id
        const input = run.input_data || {}
        const output = run.output_data || {}
        const matches = Array.isArray(output.match_details) ? output.match_details : []

        return (
          input.lead_id === leadId ||
          input.client_id === leadId ||
          input.property_id === propertyId ||
          output.lead_id === leadId ||
          output.property_id === propertyId ||
          matches.some((match: any) => match.client_id === leadId || match.property_id === propertyId)
        )
      })
      .sort((a: any, b: any) => new Date(b.started_at || b.created_at || 0).getTime() - new Date(a.started_at || a.created_at || 0).getTime())
      .slice(0, 8)
      .map((run: any) => ({
        run_id: run.run_id,
        agent_id: run.agent_id,
        agent_name: run.agent_name,
        status: run.status,
        started_at: toIso(run.started_at || run.created_at) || new Date().toISOString(),
        summary:
          run.reasoning_summary?.summary ||
          run.output_data?.summary ||
          run.reasoning_steps?.[run.reasoning_steps.length - 1]?.content ||
          '',
      }))

    return {
      ...serializeAppointment(appointment),
      lead: lead
        ? {
            _id: String(lead._id),
            name: lead.name || appointment.lead_name,
            phone: lead.phone || appointment.lead_phone,
            email: lead.email,
            interest_level: lead.interest_level,
            status: lead.status,
          }
        : null,
      property: property
        ? {
            _id: String(property._id),
            title: property.title || appointment.property_title,
            builder: property.builder || property.builder_name,
            location: property.location || appointment.property_location,
            price: property.price,
            status: property.status,
          }
        : null,
      related_runs,
    }
  },

  async update(id: string, patch: Partial<Appointment>) {
    const collection = await getCollection()
    const updateDoc: Record<string, any> = {
      ...patch,
      updated_at: new Date(),
    }

    if (patch.scheduled_at) {
      updateDoc.scheduled_at = new Date(patch.scheduled_at)
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc })
  },

  async create(input: {
    lead_id: string
    property_id: string
    scheduled_at: string
    status?: string
    notes?: string
  }) {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const [lead, property] = await Promise.all([
      db.collection('leads').findOne({ _id: new ObjectId(input.lead_id), is_deleted: { $ne: true } }),
      db.collection('properties').findOne({ _id: new ObjectId(input.property_id), is_deleted: { $ne: true } }),
    ])

    if (!lead || !property) {
      throw new Error('Lead or property not found for manual booking.')
    }

    const collection = await getCollection()
    const now = new Date()
    const document: Omit<Appointment, '_id'> = {
      lead_id: input.lead_id,
      property_id: input.property_id,
      agent_id: '',
      scheduled_at: new Date(input.scheduled_at),
      status: input.status || 'scheduled',
      reminder_sent: false,
      notes: input.notes || '',
      lead_name: lead.name || '',
      lead_phone: lead.phone || '',
      property_title: property.title || '',
      property_location: property.location || '',
      created_at: now,
      updated_at: now,
    }

    const result = await collection.insertOne(document)
    return serializeAppointment({ ...document, _id: result.insertedId })
  },

  async getStripData(): Promise<AppointmentStripData> {
    const appointments = await listAllAppointments()
    const todayKey = getIstDateKey(new Date())

    // B19: Count cards must match list semantics â€” today + upcoming only.
    // Past appointments excluded from cards (also invisible in lists).
    const relevant = appointments.filter((item: any) => {
      const key = getIstDateKey(item.scheduled_at)
      return key >= todayKey
    })

    return {
      total: relevant.length,
      confirmed: relevant.filter((item: any) => item.status === 'confirmed').length,
      scheduled: relevant.filter((item: any) => item.status === 'scheduled').length,
      rescheduled: relevant.filter((item: any) => item.status === 'rescheduled').length,
      awaiting: relevant.filter((item: any) => item.status === 'awaiting_reply' || item.status === 'awaiting').length,
      completed: relevant.filter((item: any) => item.status === 'completed').length,
    }
  },
}
```
### `lib/services/callService.ts`
```ts
import { ObjectId } from 'mongodb'

const DB_NAME = 'test'
const COLLECTION = 'calls'

export type SerializedCall = Omit<Call, '_id' | 'created_at' | 'updated_at' | 'follow_up_date'> & {
  _id: string
  created_at: string
  updated_at: string
  follow_up_date: string | null
}

export type CallDetail = SerializedCall & {
  linked_lead?: {
    _id: string
    name: string
    phone: string
    status?: string
    interest_level?: string
  } | null
  linked_property?: {
    _id: string
    title: string
    location?: string
    builder?: string
  } | null
  linked_run?: {
    run_id: string
    agent_id: string
    agent_name: string
    status: string
    started_at: string
    reasoning_summary?: {
      summary: string
      confidence: number
      generated_at?: string
    }
    input_data?: Record<string, any>
    output_data?: Record<string, any>
    reasoning_steps?: any[]
    actions?: any[]
  } | null
  tool_dispatches: Array<{
    run_id: string
    agent_id: string
    agent_name: string
    status: string
    started_at: string
    tool_name: string
    reasoning_summary?: {
      summary: string
      confidence: number
      generated_at?: string
    }
    input_data?: Record<string, any>
    output_data?: Record<string, any>
    reasoning_steps?: any[]
    actions?: any[]
  }>
}

export type CallStripData = {
  callsToday: number
  connected: number
  avgDuration: string
  booked: number
  dncMarked: number
  vapiMinutes: number
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function serializeCall(call: any): SerializedCall {
  return {
    ...call,
    _id: String(call._id),
    created_at: toIso(call.created_at) || new Date().toISOString(),
    updated_at: toIso(call.updated_at) || new Date().toISOString(),
    follow_up_date: toIso(call.follow_up_date),
  }
}

function byRecentTimestamp(a: any, b: any) {
  return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime()
}

function isMissedCall(call: any) {
  const disposition = String(call.disposition || '').toLowerCase()
  const status = String(call.call_status || '').toLowerCase()
  return disposition === 'missed' || status === 'missed'
}

function isVoicemail(call: any) {
  const disposition = String(call.disposition || '').toLowerCase()
  const outcome = String(call.call_outcome || '').toLowerCase()
  return disposition === 'voicemail' || outcome.includes('voicemail')
}

function isConnected(call: any) {
  const status = String(call.call_status || '').toLowerCase()
  return status === 'completed' || status === 'connected'
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Call>(COLLECTION)
}

export async function phoneHasRecentOutboundCall(phone: string, withinMinutes = 240): Promise<boolean> {
  if (!phone || withinMinutes <= 0) return false

  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
  const collection = await getCollection()
  const count = await collection.countDocuments({
    direction: 'outbound',
    superseded: { $ne: true },
    created_at: { $gte: cutoff },
    $or: [
      { customer_number: phone } as any,
      { to_number: phone } as any,
      { lead_phone: phone } as any,
    ],
  })

  return count > 0
}

export async function leadHasRecentOutboundCall(
  leadId: ObjectId, 
  withinMinutes = 240,
  options?: { source?: 'matchmaker' | 'campaign' | 'follow_up_callback' | 'appointment_reminder' | 're_engager'; floor?: Date }
): Promise<boolean> {
  const source = options?.source || 'matchmaker'

  if (source === 'follow_up_callback' || source === 'appointment_reminder') {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000)
    const effectiveCutoff = options?.floor && options.floor > cutoff ? options.floor : cutoff
    const callsCol = await getCollection()
    const recentSameSource = await callsCol.countDocuments({
      lead_id: { $in: [leadId, leadId.toString()] } as any,
      direction: 'outbound',
      call_type: source,
      superseded: { $ne: true },
      created_at: { $gte: effectiveCutoff }
    })
    return recentSameSource > 0
  }

  if (withinMinutes <= 0) return false

  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
  const effectiveCutoff = options?.floor && options.floor > cutoff ? options.floor : cutoff
  const callsCollection = await getCollection()
  const leadCount = await callsCollection.countDocuments({
    lead_id: { $in: [leadId, leadId.toString()] } as any,
    direction: 'outbound',
    superseded: { $ne: true },
    created_at: { $gte: effectiveCutoff },
  })

  if (leadCount > 0) {
    return true
  }

  const client = await clientPromise
  const leadsCollection = client.db(DB_NAME).collection('leads')
  const lead = await leadsCollection.findOne(
    { _id: leadId },
    { projection: { phone: 1 } }
  )

  if (lead?.phone) {
    return phoneHasRecentOutboundCall(String(lead.phone), withinMinutes)
  }

  return false
}

function extractToolName(run: any) {
  const input = run.input_data || {}
  const output = run.output_data || {}
  const actions = Array.isArray(run.actions) ? run.actions : []
  const toolNames = Array.isArray(input.tool_names) ? input.tool_names.filter(Boolean) : []
  const outputTool = output.results?.[0]?.toolCallId
  const dispatched = actions.find((action: any) => action.action_type === 'tool_dispatch')
  return (
    input.tool_name ||
    input.function_name ||
    toolNames[0] ||
    dispatched?.parameters?.tool_name ||
    outputTool ||
    input.webhook_type ||
    'voice_event'
  )
}

export const callService = {
  async list(options: {
    direction?: string
    status?: string
    limit?: number
  } = {}): Promise<SerializedCall[]> {
    const collection = await getCollection()
    const calls = (await collection.find({}).toArray()).sort(byRecentTimestamp)

    const filtered = calls.filter((call: any) => {
      if (options.direction && call.direction !== options.direction) return false
      if (!options.status) return true

      if (options.status === 'missed') return isMissedCall(call)
      if (options.status === 'voicemail') return isVoicemail(call)
      if (options.status === 'connected') return isConnected(call)

      return String(call.call_status || '').toLowerCase() === options.status.toLowerCase()
    })

    return filtered.slice(0, options.limit || 50).map(serializeCall)
  },

  async get(id: string): Promise<CallDetail | null> {
    const collection = await getCollection()
    const call = await collection.findOne({ _id: new ObjectId(id) })

    if (!call) {
      return null
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const [lead, rawRuns, toolDispatchDocs, matchedProperty] = await Promise.all([
      call.lead_id ? db.collection('leads').findOne({ _id: new ObjectId(call.lead_id) }) : null,
      db.collection('agent_execution_logs').find({}).limit(250).toArray(),
      call.vapi_call_id
        ? db.collection('agent_execution_logs')
            .find({
              agent_id: 'voice_orchestrator',
              $or: [
                { 'input_data.vapi_call_id': call.vapi_call_id },
                { 'input_data.call_id': call.vapi_call_id },
                { 'output_data.callId': call.vapi_call_id },
                { 'output_data.call_id': call.vapi_call_id },
                { 'output_data.vapi_call_id': call.vapi_call_id },
              ],
            })
            .sort({ created_at: 1 })
            .limit(50)
            .toArray()
        : [],
      (async () => {
        if (!call.lead_id || !ObjectId.isValid(call.lead_id)) {
          return null
        }
        const matchingAppointment = await db
          .collection('appointments')
          .find({ lead_id: call.lead_id })
          .toArray()
        const appointment = matchingAppointment.sort(byRecentTimestamp)[0]
        if (!appointment?.property_id || !ObjectId.isValid(appointment.property_id)) {
          return null
        }
        return db.collection('properties').findOne({ _id: new ObjectId(appointment.property_id), is_deleted: { $ne: true } })
      })(),
    ])

    const linkedRun = rawRuns
      .filter((run: any) => {
        const input = run.input_data || {}
        const output = run.output_data || {}
        const matches = Array.isArray(output.match_details) ? output.match_details : []

        return (
          input.call_id === call.vapi_call_id ||
          input.lead_id === call.lead_id ||
          output.callId === call.vapi_call_id ||
          output.call_id === call.vapi_call_id ||
          output.vapi_call_id === call.vapi_call_id ||
          matches.some((match: any) => match.vapi_call_id === call.vapi_call_id)
        )
      })
      .sort((a: any, b: any) => new Date(b.started_at || b.created_at || 0).getTime() - new Date(a.started_at || a.created_at || 0).getTime())[0]

    return {
      ...serializeCall(call),
      linked_lead: lead
        ? {
            _id: String(lead._id),
            name: lead.name || call.lead_name,
            phone: lead.phone || call.lead_phone,
            status: lead.status,
            interest_level: lead.interest_level,
          }
        : null,
      linked_property: matchedProperty
        ? {
            _id: String(matchedProperty._id),
            title: matchedProperty.title,
            location: matchedProperty.location,
            builder: matchedProperty.builder || matchedProperty.builder_name,
          }
        : null,
      linked_run: linkedRun
        ? {
            run_id: linkedRun.run_id,
            agent_id: linkedRun.agent_id,
            agent_name: linkedRun.agent_name,
            status: linkedRun.status,
            started_at: toIso(linkedRun.started_at || linkedRun.created_at) || new Date().toISOString(),
            reasoning_summary: linkedRun.reasoning_summary,
            input_data: linkedRun.input_data,
            output_data: linkedRun.output_data,
            reasoning_steps: linkedRun.reasoning_steps,
            actions: linkedRun.actions,
          }
        : null,
      tool_dispatches: toolDispatchDocs.map((run: any) => ({
        run_id: run.run_id,
        agent_id: run.agent_id,
        agent_name: run.agent_name,
        status: run.status,
        started_at: toIso(run.started_at || run.created_at) || new Date().toISOString(),
        tool_name: extractToolName(run),
        reasoning_summary: run.reasoning_summary,
        input_data: run.input_data,
        output_data: run.output_data,
        reasoning_steps: run.reasoning_steps,
        actions: run.actions,
      })),
    }
  },

  async getStripData(): Promise<CallStripData> {
    const calls = (await (await getCollection()).find({}).toArray()).sort(byRecentTimestamp)
    const today = new Date().toDateString()
    const todaysCalls = calls.filter((call: any) => new Date(call.created_at).toDateString() === today)
    const connected = todaysCalls.filter(isConnected).length
    const booked = todaysCalls.filter((call: any) => String(call.call_outcome || '').toLowerCase().includes('book')).length
    const dncMarked = todaysCalls.filter((call: any) => {
      const disposition = String(call.disposition || '').toLowerCase()
      const summary = String(call.call_summary || '').toLowerCase()
      return disposition === 'dnd' || summary.includes('dnc')
    }).length
    const totalDuration = todaysCalls.reduce((sum: number, call: any) => sum + Number(call.duration || 0), 0)
    const avgSeconds = connected > 0 ? Math.round(totalDuration / connected) : 0

    return {
      callsToday: todaysCalls.length,
      connected,
      avgDuration: avgSeconds === 0 ? '0s' : avgSeconds < 60 ? `${avgSeconds}s` : `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`,
      booked,
      dncMarked,
      vapiMinutes: Number((totalDuration / 60).toFixed(1)),
    }
  },
}
```
### `lib/services/campaignService.ts`
```ts
import { runCampaignConductor } from '@/lib/agents/campaignConductor'

const DB_NAME = 'test'
const COLLECTION = 'campaigns'

export type SerializedCampaign = Omit<
  Campaign,
  '_id' | 'created_at' | 'updated_at' | 'start_date' | 'end_date' | 'started_at' | 'deferred_until'
> & {
  _id: string
  created_at: string
  updated_at: string
  start_date: string | null
  end_date: string | null
  started_at: string | null
  deferred_until: string | null
}

export type CampaignInput = {
  name: string
  description: string
  voice_assistant: string
  script_template: string
  start_date?: string | null
  end_date?: string | null
  target_filter?: string
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function serializeCampaign(campaign: any): SerializedCampaign {
  return {
    ...campaign,
    _id: String(campaign._id),
    created_at: toIso(campaign.created_at) || new Date().toISOString(),
    updated_at: toIso(campaign.updated_at) || new Date().toISOString(),
    start_date: toIso(campaign.start_date),
    end_date: toIso(campaign.end_date),
    started_at: toIso(campaign.started_at),
    deferred_until: toIso(campaign.deferred_until),
  }
}

function byRecentTimestamp(a: any, b: any) {
  const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
  const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
  return bTime - aTime
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Campaign>(COLLECTION)
}

async function resolveTargetLeadIds(targetFilter?: string) {
  if (!targetFilter) return []

  const client = await clientPromise
  const leads = client.db(DB_NAME).collection('leads')
  const regex = { $regex: targetFilter, $options: 'i' }
  const matches = await leads
    .find({
      $or: [
        { name: regex },
        { place: regex },
        { location_pref: regex },
        { property_type: regex },
        { budget_range: regex },
        { status: regex },
      ],
      dnd_status: { $ne: true },
    })
    .limit(100)
    .toArray()

  return matches.map((lead) => String(lead._id))
}

export const campaignService = {
  async listActive(): Promise<SerializedCampaign[]> {
    const collection = await getCollection()
    const statuses: CampaignStatus[] = ['active', 'queued', 'paused', 'dialing', 'deferred']
    const campaigns = (await collection
      .find({ status: { $in: statuses } })
      .toArray()).sort(byRecentTimestamp)
    return campaigns.map(serializeCampaign)
  },

  async listDrafts(): Promise<SerializedCampaign[]> {
    const collection = await getCollection()
    const campaigns = (
      await collection.find({ status: 'draft' }).toArray()
    ).sort(byRecentTimestamp)
    return campaigns.map(serializeCampaign)
  },

  async listCompleted(): Promise<SerializedCampaign[]> {
    const collection = await getCollection()
    const statuses: CampaignStatus[] = ['completed', 'cancelled']
    const campaigns = (await collection
      .find({ status: { $in: statuses } })
      .toArray()).sort(byRecentTimestamp)
    return campaigns.map(serializeCampaign)
  },

  async create(input: CampaignInput) {
    const collection = await getCollection()
    const now = new Date()
    const targetLeadIds = await resolveTargetLeadIds(input.target_filter)

    const document: any = {
      name: input.name,
      description: input.description,
      voice_assistant: input.voice_assistant,
      script_template: input.script_template,
      target_filter: input.target_filter || '',
      target_lead_ids: targetLeadIds,
      status: 'draft',
      assigned_agent_ids: [],
      start_date: input.start_date ? new Date(input.start_date) : null,
      end_date: input.end_date ? new Date(input.end_date) : null,
      calls_made: 0,
      calls_connected: 0,
      appointments_booked: 0,
      dnc_count: 0,
      callback_count: 0,
      created_at: now,
      updated_at: now,
    }

    const result = await collection.insertOne(document)
    return serializeCampaign({ ...document, _id: result.insertedId })
  },

  async launch(id: string) {
    const collection = await getCollection()
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'queued', updated_at: new Date() } }
    )
    // Fire-and-forget: Conductor runs async, HTTP response returns immediately.
    // runAgent catches all errors internally â€” no unhandled rejection.
    queueMicrotask(() => {
      void runCampaignConductor(id).catch((err) => {
        console.error('[campaignService.launch] Conductor error for campaign', id, err)
      })
    })
  },

  async pause(id: string) {
    const collection = await getCollection()
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'paused', updated_at: new Date() } }
    )
    // Conductor checks campaign.status before each dial batch.
    // A running batch will finish its current lead; the next sweep
    // will see 'paused' and abort â€” acceptable for Phase 9.5.
  },

  async resume(id: string) {
    const collection = await getCollection()
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'queued', updated_at: new Date() } }
    )
    // Re-fire Conductor for the resumed campaign.
    queueMicrotask(() => {
      void runCampaignConductor(id).catch((err) => {
        console.error('[campaignService.resume] Conductor error for campaign', id, err)
      })
    })
  },
}
```
### `lib/services/clientService.ts`
```ts
import clientPromise, { getCollection } from '@/lib/mongodb';
import { Client } from '@/models/Client';
import { ObjectId } from 'mongodb';

const DB_NAME = 'test';
const COLLECTION = 'clients';

export interface CreateClientInput extends Omit<Client, '_id' | 'created_at' | 'updated_at' | 'conversion_status'> {
  broker_id: string;
}

export const clientService = {
  async createClient(data: CreateClientInput): Promise<Client> {
    if (!data.broker_id || typeof data.broker_id !== 'string' || data.broker_id.trim() === '') {
      throw new Error('createClient: valid non-empty broker_id is required');
    }
    const mongo = await clientPromise;
    const db = mongo.db(DB_NAME);
    const collection = db.collection<Client>(COLLECTION);

    const newClient: Client = {
      ...data,
      conversion_status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      broker_id: data.broker_id,
    };

    const result = await collection.insertOne(newClient as any);
    newClient._id = result.insertedId;

    return newClient;
  },

  async getClient(id: string): Promise<Client | null> {
    const mongo = await clientPromise;
    const db = mongo.db(DB_NAME);
    const collection = db.collection<Client>(COLLECTION);
    
    return collection.findOne({ _id: new ObjectId(id) });
  },

  async updateClient(id: string, patch: Partial<Client>): Promise<void> {
    const mongo = await clientPromise;
    const db = mongo.db(DB_NAME);
    const collection = db.collection<Client>(COLLECTION);

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...patch,
          updated_at: new Date() 
        } 
      }
    );
  },

  async listClients(options: { status?: string; source?: string; limit?: number } = {}): Promise<Client[]> {
    const mongo = await clientPromise;
    const db = mongo.db(DB_NAME);
    const collection = db.collection<Client>(COLLECTION);

    const query: any = {
      is_deleted: { $ne: true }, // B16: canonical soft-delete filter
    };
    if (options.status) query.conversion_status = options.status;
    if (options.source) query.source = options.source;

    return collection.find(query)
      .sort({ created_at: -1 })
      .limit(options.limit || 50)
      .toArray();
  },

  async deleteClient(id: string): Promise<void> {
    const mongo = await clientPromise;
    const db = mongo.db(DB_NAME);
    const collection = db.collection<Client>(COLLECTION);

    await collection.deleteOne({ _id: new ObjectId(id) });
  },
};

/**
 * B14: Cascade soft-delete a client and all its dependent records.
 * Canonical soft-delete convention:
 *   - WRITES set BOTH is_deleted: true AND deleted_at: new Date() (audit timestamp)
 *   - READS use is_deleted: { $ne: true } (handles undefined/missing field)
 * Cascade order is important â€” leads are soft-deleted FIRST so cron stops
 * processing them before we touch dependent records.
 * Returns counts so caller can verify expected impact and surface to UI.
 */
export async function softDeleteClientCascade(
  clientId: string,
  brokerId: string
): Promise<{
  ok: boolean;
  leads_deleted: number;
  appointments_deleted: number;
  calls_superseded: number;
  error?: string;
}> {
  if (!brokerId || typeof brokerId !== 'string' || brokerId.trim() === '') {
    throw new Error('softDeleteClientCascade: brokerId required');
  }
  if (!ObjectId.isValid(clientId)) {
    return { ok: false, leads_deleted: 0, appointments_deleted: 0, calls_superseded: 0, error: 'invalid_client_id' };
  }

  const now = new Date();
  const clientObjId = new ObjectId(clientId);

  const clientsCol = await getCollection('clients');
  const leadsCol = await getCollection('leads');
  const appointmentsCol = await getCollection('appointments');
  const callsCol = await getCollection('calls');

  // First â€” find all leads belonging to this client (so we know what to cascade to)
  const leads = await leadsCol.find({
    client_id: clientObjId,
    broker_id: brokerId,
    is_deleted: { $ne: true }
  }).project({ _id: 1 }).toArray();

  // If no leads exist, also try string match (in case client_id stored as string)
  if (leads.length === 0) {
    const stringIdLeads = await leadsCol.find({
      client_id: clientId,           // string match for legacy data
      broker_id: brokerId,
      is_deleted: { $ne: true }
    }).project({ _id: 1 }).toArray();
    leads.push(...stringIdLeads);
  }

  // Build $in array with BOTH ObjectId and string representations (Z12 lesson)
  const leadIdsObj = leads.map(l => l._id);
  const leadIdsStr = leads.map(l => l._id.toString());
  const leadIdsAny = [...leadIdsObj, ...leadIdsStr];

  // STEP 1: Soft-delete LEADS first (stops cron processing immediately)
  const leadsResult = await leadsCol.updateMany(
    { _id: { $in: leadIdsObj }, broker_id: brokerId, is_deleted: { $ne: true } },
    { $set: { is_deleted: true, deleted_at: now, updated_at: now } }
  );

  // STEP 2: Soft-delete APPOINTMENTS for these leads
  let appointmentsResult = { modifiedCount: 0 };
  if (leadIdsAny.length > 0) {
    appointmentsResult = await appointmentsCol.updateMany(
      { lead_id: { $in: leadIdsAny }, is_deleted: { $ne: true } },
      { $set: { is_deleted: true, deleted_at: now, status: 'cancelled', updated_at: now } }
```
### `lib/services/dashboardService.ts`
```ts
export async function getDashboardData(): Promise<DashboardData> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  const calls = db.collection('calls')
  const appointments = db.collection('appointments')
  const leads = db.collection('leads')
  const runs = db.collection('agent_execution_logs')
  const campaigns = db.collection('campaigns')

  const today = istDayRange()
  const yesterday = previousRange(today)
  const now = new Date()
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const [
    callsToday,
    appointmentsToday,
    newLeadsToday,
    agentRunsToday,
    callsYesterday,
    appointmentsYesterday,
    newLeadsYesterday,
    agentRunsYesterday,
    urgentLeadDocs,
    recentRunDocs,
    upcomingAppointmentDocs,
    activeCampaignDocs,
  ] = await Promise.all([
    calls.countDocuments(dateRangeFilter('created_at', today)),
    appointments.countDocuments(dateRangeFilter('scheduled_at', today)),
    leads.countDocuments(dateRangeFilter('created_at', today)),
    runs.countDocuments(dateRangeFilter('created_at', today)),
    calls.countDocuments(dateRangeFilter('created_at', yesterday)),
    appointments.countDocuments(dateRangeFilter('scheduled_at', yesterday)),
    leads.countDocuments(dateRangeFilter('created_at', yesterday)),
    runs.countDocuments(dateRangeFilter('created_at', yesterday)),
    leads
      .find({
        $or: [
          { status: 'hot' },
          { interest_level: 'hot' },
          { next_follow_up_date: { $lt: now } },
          { next_follow_up_date: { $lt: now.toISOString() } },
```
### `lib/services/leadService.ts`
```ts
import { ObjectId } from 'mongodb'

const DB_NAME = 'test'
const COLLECTION = 'leads'

export type LeadPipelineStage = 'new' | 'contacted' | 'site_visit' | 'negotiation' | 'closed'

export type SerializedLead = Omit<
  Lead,
  '_id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_follow_up_date'
> & {
  _id: string
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  next_follow_up_date: string | null
  matched_property_id?: string
  match_score?: number
  match_rationale?: string
  notes_history?: string[]
}

export type LeadPipelineStats = {
  total: number
  hot: number
  warm: number
  cold: number
  dnc: number
  conversionPct: number
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function serializeLead(lead: any): SerializedLead {
  return {
    ...lead,
    _id: String(lead._id),
    created_at: toIso(lead.created_at) || new Date().toISOString(),
    updated_at: toIso(lead.updated_at) || new Date().toISOString(),
    last_contacted_at: toIso(lead.last_contacted_at),
    next_follow_up_date: toIso(lead.next_follow_up_date),
  }
}

function byRecentTimestamp(a: any, b: any) {
  const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
  const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
  return bTime - aTime
}

function normalizeStage(lead: any): LeadPipelineStage {
  const status = String(lead.status || '').toLowerCase()

  if (status === 'contacted' || status === 'qualified' || status === 'follow_up') return 'contacted'
  if (status === 'site_visit' || status === 'site visit' || status === 'visit_scheduled') return 'site_visit'
  if (status === 'negotiation' || status === 'negotiating') return 'negotiation'
  if (status === 'closed' || status === 'won' || status === 'lost' || status === 'not_interested') return 'closed'

  return 'new'
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Lead>(COLLECTION)
}

export const leadService = {
  async listByStage(): Promise<Record<LeadPipelineStage, SerializedLead[]>> {
    const collection = await getCollection()
    const leads = (await collection.find({ is_deleted: { $ne: true } }).toArray()).sort(byRecentTimestamp)

    const grouped: Record<LeadPipelineStage, SerializedLead[]> = {
      new: [],
      contacted: [],
      site_visit: [],
      negotiation: [],
      closed: [],
    }

    for (const lead of leads) {
      grouped[normalizeStage(lead)].push(serializeLead(lead))
    }

    return grouped
  },

  async listAll(): Promise<SerializedLead[]> {
    const collection = await getCollection()
    const leads = await collection
      .find({ is_deleted: { $ne: true } })
      .sort({ next_follow_up_date: 1, created_at: -1 })
      .toArray()
    return leads.map(serializeLead)
  },

  async getStats(): Promise<LeadPipelineStats> {
    const collection = await getCollection()
    const leads = await collection.find({ is_deleted: { $ne: true } }).toArray()
    const total = leads.length
    const hot = leads.filter((lead) => String((lead as any).interest_level || '').toLowerCase() === 'hot').length
    const warm = leads.filter((lead) => String((lead as any).interest_level || '').toLowerCase() === 'warm').length
    const cold = leads.filter((lead) => String((lead as any).interest_level || '').toLowerCase() === 'cold').length
    const dnc = leads.filter((lead) => (lead as any).dnd_status === true).length
    const converted = leads.filter((lead) => {
      const score = Number((lead as any).lead_score || 0)
      const qualification = String((lead as any).qualification_status || '').toLowerCase()
      return score > 0 || ['qualified', 'matched'].includes(qualification)
    }).length

    return {
      total,
      hot,
      warm,
      cold,
      dnc,
      conversionPct: total === 0 ? 0 : Math.round((converted / total) * 100),
    }
  },

  async moveToStage(leadId: string, newStage: LeadPipelineStage) {
    const collection = await getCollection()
    const _id = new ObjectId(leadId)
    await collection.updateOne(
      { _id },
      {
        $set: {
          status: newStage,
          updated_at: new Date(),
        },
      }
    )
  },
}

export interface CreateLeadInput {
  broker_id: string;          // REQUIRED â€” never optional
  name: string;
  phone: string;
  email?: string;
  location_pref?: string;
  property_type?: string;
  budget_range?: string;
  notes?: string;
  source?: string;
  client_id?: string | ObjectId;
  next_follow_up_date?: Date | string | null;
  [key: string]: any;
}

export interface CreateLeadResult {
  ok: boolean;
  lead_id?: ObjectId | string;
  lead?: any;
  reason?: "duplicate_phone" | "missing_broker_id";
  existing_lead?: any;
}

/**
 * Single source of truth for creating leads.
 * Always stamps broker_id, normalizes phone, applies defaults, sets timestamps.
 * Used by /api/leads/route.ts AND lib/agents/clientLeadConverter.ts.
 */
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  if (!input.broker_id || typeof input.broker_id !== "string" || input.broker_id.trim() === "") {
    throw new Error("createLead: valid non-empty broker_id is required");
  }

  const leads = await getCollection();
  const normalizedPhone = (input.phone || '').replace(/[^0-9+]/g, '');
  const normalizedLocation = (input.location_pref || '').trim();

  // Dedup check (B5)
  if (normalizedPhone) {
    const existing = await leads.findOne({
      phone: normalizedPhone,
      broker_id: input.broker_id,
      is_deleted: { $ne: true }
    });
    
    if (existing) {
      return { ok: false, reason: "duplicate_phone", existing_lead: existing };
    }
  }

  const { broker_id, ...restInput } = input;

  const leadDoc = {
    ...DEFAULT_LEAD,
    ...restInput,
    phone: normalizedPhone,
    location_pref: normalizedLocation,
    next_follow_up_date: input.next_follow_up_date ? new Date(input.next_follow_up_date) : null,
    broker_id: input.broker_id,    // last to ensure it cannot be overridden
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const result = await leads.insertOne(leadDoc as any);
  return { 
    ok: true, 
    lead_id: result.insertedId, 
    lead: { ...leadDoc, _id: result.insertedId } 
```
### `lib/services/propertyService.ts`
```ts
import { ObjectId } from 'mongodb'

const DB_NAME = 'test'
const COLLECTION = 'properties'

export type SerializedProperty = Omit<Property, '_id' | 'created_at' | 'updated_at'> & {
  _id: string
  created_at: string
  updated_at: string
  last_price?: number
  price_drop_pct?: number
  price_drop_at?: string | null
}

export type PropertyStatusFilter = 'available' | 'negotiation' | 'sold'

export type PropertyInput = {
  title: string
  builder: string
  type: string
  city: string
  location: string
  price: number
  area_sqft: number
  bedrooms: number
  status: string
  description: string
  amenities?: string[]
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function serializeProperty(property: any): SerializedProperty {
  return {
    ...property,
    _id: String(property._id),
    created_at: toIso(property.created_at) || new Date().toISOString(),
    updated_at: toIso(property.updated_at) || new Date().toISOString(),
    price_drop_at: toIso(property.price_drop_at),
  }
}

function byRecentTimestamp(a: any, b: any) {
  const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
  const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
  return bTime - aTime
}

function normalizeStatus(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value === 'in negotiation' || value === 'in_negotiation') return 'negotiation'
  return value || 'available'
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Property>(COLLECTION)
}

export const propertyService = {
  async list(options: {
    status?: PropertyStatusFilter
    location?: string
    builder?: string
    type?: string
    limit?: number
  } = {}): Promise<SerializedProperty[]> {
    const collection = await getCollection()
    const filter: Record<string, any> = {
      is_deleted: { $ne: true }, // X2: hide soft-deleted properties
    }

    if (options.status && options.status !== 'available') {
      filter.status =
        options.status === 'negotiation'
          ? { $in: ['negotiation', 'in negotiation', 'in_negotiation'] }
          : options.status
    } else if (options.status === 'available') {
      filter.status = 'available'
    }

    if (options.location) filter.location = { $regex: options.location, $options: 'i' }
    if (options.builder) filter.builder = { $regex: options.builder, $options: 'i' }
    if (options.type) filter.type = options.type

    const properties = (await collection.find(filter).toArray())
      .sort(byRecentTimestamp)
      .slice(0, options.limit || 60)

    return properties.map(serializeProperty)
  },

  async get(id: string): Promise<SerializedProperty | null> {
    const collection = await getCollection()
    const property = await collection.findOne({ _id: new ObjectId(id), is_deleted: { $ne: true } })
    return property ? serializeProperty(property) : null
  },

  async create(input: PropertyInput) {
    const collection = await getCollection()
    const now = new Date()
    const document: any = {
      ...input,
      status: normalizeStatus(input.status),
      amenities: input.amenities || [],
      images: [],
      created_at: now,
      updated_at: now,
      last_price: input.price,
      price_drop_pct: 0,
      price_drop_at: null,
    }

    const result = await collection.insertOne(document)
    const created = { ...document, _id: result.insertedId }

    queueMicrotask(() => {
      void runMatchmaker().catch((error) => {
        console.error('[PROPERTY SERVICE] Matchmaker trigger failed after create:', error)
      })
    })

    return serializeProperty(created)
  },

  async update(id: string, patch: Partial<PropertyInput>) {
    const collection = await getCollection()
    const existing = await collection.findOne({ _id: new ObjectId(id), is_deleted: { $ne: true } })

    if (!existing) {
      throw new Error('Property not found')
    }

    const nextPrice = patch.price !== undefined ? Number(patch.price) : Number(existing.price || 0)
    const currentPrice = Number(existing.price || 0)
    const priceDropped = Number.isFinite(nextPrice) && nextPrice > 0 && currentPrice > 0 && nextPrice < currentPrice

    const updateDoc: Record<string, any> = {
      ...patch,
      updated_at: new Date(),
    }

    if (patch.status) updateDoc.status = normalizeStatus(patch.status)
    if (patch.price !== undefined) updateDoc.price = nextPrice
    if (patch.area_sqft !== undefined) updateDoc.area_sqft = Number(patch.area_sqft)
    if (patch.bedrooms !== undefined) updateDoc.bedrooms = Number(patch.bedrooms)

    if (priceDropped) {
      updateDoc.last_price = currentPrice
      updateDoc.price_drop_pct = Number((((currentPrice - nextPrice) / currentPrice) * 100).toFixed(1))
      updateDoc.price_drop_at = new Date()
    }

    await collection.updateOne({ _id: existing._id }, { $set: updateDoc })

    if (priceDropped) {
      queueMicrotask(() => {
        void runPriceDropNegotiator({
          property_id: id,
          old_price: currentPrice,
          new_price: nextPrice,
        }).catch((error) => {
          console.error('[PROPERTY SERVICE] Price-drop trigger failed after update:', error)
        })
      })
    }

    const updated = await collection.findOne({ _id: existing._id })
    if (!updated) throw new Error('Property not found after update')
    return serializeProperty(updated)
  },

  async delete(id: string) {
    throw new Error('propertyService.delete() is deprecated â€” use softDeletePropertyCascade(id) instead');
  },
}

/**
 * B14-properties: Cascade soft-delete a property + reset orphan lead matches.
 * Canonical convention: is_deleted: true + deleted_at: Date set together on writes.
 * Reads use is_deleted: { $ne: true }.
 * Order: leads first ($unset matched_property_id so matchmaker re-matches them),
 * property last.
 */
export async function softDeletePropertyCascade(
  propertyId: string
): Promise<{ ok: boolean; leads_unmatched: number; error?: string }> {
  if (!ObjectId.isValid(propertyId)) {
    return { ok: false, leads_unmatched: 0, error: 'invalid_property_id' };
  }

  const now = new Date();
  const propertyObjId = new ObjectId(propertyId);
  const propertyIdStr = propertyId;

  const client = await clientPromise;
  const db = client.db('test');
  const propertiesCol = db.collection('properties');
  const leadsCol = db.collection('leads');

  // Step 1: $unset matched_property_id on leads pointing to this property
  // (handles BOTH ObjectId and string lead.matched_property_id storage variants)
  const leadsResult = await leadsCol.updateMany(
    {
      $or: [
        { matched_property_id: propertyIdStr },
        { matched_property_id: propertyObjId },
      ],
      is_deleted: { $ne: true },
    },
    {
      $unset: { matched_property_id: '', matched_property_title: '' },
      $set: { updated_at: now },
    }
  );

  // Step 2: Soft-delete the property
  const propertyResult = await propertiesCol.updateOne(
    { _id: propertyObjId, is_deleted: { $ne: true } },
    { $set: { is_deleted: true, deleted_at: now, updated_at: now } }
  );

  if (propertyResult.matchedCount === 0) {
    return {
      ok: false,
      leads_unmatched: leadsResult.modifiedCount,
      error: 'property_not_found_or_already_deleted',
    };
  }

  return { ok: true, leads_unmatched: leadsResult.modifiedCount };
}
```
### `lib/services/sidebarCountsService.ts`
```ts
import { getCollection } from '@/lib/mongodb'
import { startOfDay } from 'date-fns'

export async function getSidebarCounts(): Promise<{
  leads: number
  clients: number
  appointments: number
  pendingUsers: number
}> {
  try {
    const leadsCollection = await getCollection('leads')
    const clientsCollection = await getCollection('clients')
    const appointmentsCollection = await getCollection('appointments')
    const usersCollection = await getCollection('users')

    const todayStart = new Date()
    // Convert to IST offset loosely or just use local startOfDay if running on server
    // For safety, let's just use startOfDay. Actually, the prompt says "today (IST)".
    // Vercel server runs in UTC. Let's do a simple IST adjustment:
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffset)
    istNow.setUTCHours(0, 0, 0, 0) // start of IST day in UTC representation
    const startOfIstDay = new Date(istNow.getTime() - istOffset)
    
    const istTomorrow = new Date(istNow.getTime() + 24 * 60 * 60 * 1000)
    const endOfIstDay = new Date(istTomorrow.getTime() - istOffset)

    const [leads, clients, appointments, pendingUsers] = await Promise.all([
      leadsCollection.countDocuments({ is_deleted: { $ne: true }, status: { $nin: ['closed', 'lost', 'won'] } }),
      clientsCollection.countDocuments({ is_deleted: { $ne: true }, conversion_status: { $in: ['pending', 'converting'] } }),
      appointmentsCollection.countDocuments({
        is_deleted: { $ne: true },
        appointment_date: {
          $gte: startOfIstDay.toISOString(),
          $lt: endOfIstDay.toISOString(),
        },
      }),
      usersCollection.countDocuments({ status: 'pending_approval' }),
    ])

    return { leads, clients, appointments, pendingUsers }
  } catch (error) {
    console.error('[SidebarCountsService] Error fetching counts:', error)
    return { leads: 0, clients: 0, appointments: 0, pendingUsers: 0 }
  }
}
```
### `lib/services/systemConfigService.ts`
```ts
/**
 * System Config Service
 * Reads/writes system configuration from the `system_config` Mongo collection.
 * Phase 11 adds per-user config; Phase 3 uses a single global config doc.
 */

import { getCollection } from '@/lib/mongodb'

export type ConfigKey =
  | 'matchmaker_on_new_client'
  | 'price_drop_on_patch'
  | 'auto_call_hot_leads'
  | 'reasoning_summaries_enabled'
  | 'dnc_enforcement'

export type IntegrationStatus = {
  name: string
  status: 'connected' | 'error' | 'unconfigured'
  meta: string
}

export type SystemConfig = {
  matchmaker_on_new_client: boolean
  price_drop_on_patch: boolean
  auto_call_hot_leads: boolean
  reasoning_summaries_enabled: boolean
  dnc_enforcement: boolean
  trai_window_start: string // "09:00"
  trai_window_end: string   // "21:00"
  data_retention_days: number
  integrations: IntegrationStatus[]
  updated_at: string | null
}

const DEFAULTS: SystemConfig = {
  matchmaker_on_new_client: true,
  price_drop_on_patch: true,
  auto_call_hot_leads: false,
  reasoning_summaries_enabled: true,
  dnc_enforcement: true,
  trai_window_start: '09:00',
  trai_window_end: '21:00',
  data_retention_days: 90,
  integrations: [
    { name: 'Vapi (Telephony)', status: 'connected', meta: 'Outbound voice calls Â· Webhooks active' },
    { name: 'Twilio / Exotel', status: 'connected', meta: 'SMS fallback Â· Number masking' },
    { name: 'MongoDB Atlas', status: 'connected', meta: 'Primary datastore Â· test database' },
    { name: 'Google Calendar', status: 'unconfigured', meta: 'Appointment sync â€” Phase 12' },
  ],
  updated_at: null,
}

export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const col = await getCollection('system_config')
    const doc = await col.findOne({}, { projection: { _id: 0 } })

    if (!doc) return { ...DEFAULTS }

    // Merge with defaults so new keys always exist
    return {
      ...DEFAULTS,
      ...doc,
      integrations: doc.integrations || DEFAULTS.integrations,
    } as SystemConfig
  } catch (err) {
    console.error('[systemConfigService] getSystemConfig error:', err)
    return { ...DEFAULTS }
  }
}

export async function updateSystemConfig(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const col = await getCollection('system_config')
    await col.updateOne(
      {},
      {
        $set: {
          [key]: value,
          updated_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    )
    return { ok: true }
  } catch (err: any) {
    console.error('[systemConfigService] updateSystemConfig error:', err)
    return { ok: false, error: err.message }
  }
}
```
### `lib/services/userService.ts`
```ts
import { ObjectId } from 'mongodb'

import { getCollection } from '@/lib/mongodb'
import type { UserRole, UserStatus } from '@/models/User'

export type SerializedBrokerage = {
  _id: string
  name: string
  city: string
  vapi_assistant_id: string
  notes?: string
  created_at: string
  updated_at: string
}

export type SerializedUser = {
  _id: string
  email: string
  name: string
  image?: string | null
  role: UserRole
  status: UserStatus
  brokerage_id?: string | null
  brokerage?: SerializedBrokerage | null
  created_at: string
  last_login_at: string
  promoted_by_user_id?: string | null
  promoted_at?: string | null
}

export type BrokerageInput = {
  name: string
  city: string
  vapi_assistant_id: string
  notes?: string
}

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid user id')
  }

  return new ObjectId(id)
}

function toOptionalObjectId(id?: string | null) {
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null
}

function dateToIso(value: unknown) {
  if (!value) return ''
  return new Date(value as string | Date).toISOString()
}

function serializeBrokerage(doc: any): SerializedBrokerage | null {
  if (!doc) return null

  return {
    _id: doc._id.toString(),
    name: doc.name || '',
    city: doc.city || '',
    vapi_assistant_id: doc.vapi_assistant_id || '',
    notes: doc.notes || '',
    created_at: dateToIso(doc.created_at),
    updated_at: dateToIso(doc.updated_at),
  }
}

function serializeUser(doc: any, brokerage?: any): SerializedUser {
  return {
    _id: doc._id.toString(),
    email: doc.email || '',
    name: doc.name || doc.email || 'Unknown user',
    image: doc.image ?? null,
    role: doc.role || 'broker',
    status: doc.status || 'pending_approval',
    brokerage_id: doc.brokerage_id?.toString?.() ?? null,
    brokerage: serializeBrokerage(brokerage),
    created_at: dateToIso(doc.created_at),
    last_login_at: dateToIso(doc.last_login_at),
    promoted_by_user_id: doc.promoted_by_user_id?.toString?.() ?? null,
    promoted_at: doc.promoted_at ? dateToIso(doc.promoted_at) : null,
  }
}

async function loadBrokeragesById(ids: ObjectId[]) {
  if (ids.length === 0) return new Map<string, any>()

  const brokerages = await getCollection('brokerages')
  const rows = await brokerages.find({ _id: { $in: ids } }).toArray()
  return new Map(rows.map((row) => [row._id.toString(), row]))
}

async function getOrCreateBrokerage(input: BrokerageInput) {
  const brokerages = await getCollection('brokerages')
  const now = new Date()
  const name = input.name.trim()
  const name_key = name.toLowerCase()

  let brokerage = await brokerages.findOne({ name_key })
  if (!brokerage) {
    brokerage = await brokerages.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    })
  }

  if (brokerage) {
    await brokerages.updateOne(
      { _id: brokerage._id },
      {
        $set: {
          name_key,
          city: input.city.trim(),
          vapi_assistant_id: input.vapi_assistant_id,
          notes: input.notes?.trim() || brokerage.notes || '',
          updated_at: now,
        },
      }
    )

    return brokerage._id as ObjectId
  }

  const result = await brokerages.insertOne({
    name,
    name_key,
    city: input.city.trim(),
    vapi_assistant_id: input.vapi_assistant_id,
    notes: input.notes?.trim() || '',
    created_at: now,
    updated_at: now,
  })

  return result.insertedId
}

async function stampUserChange(
  userId: string,
  adminUserId: string,
  patch: Record<string, unknown>
) {
  const users = await getCollection('users')
  const now = new Date()

  await users.updateOne(
    { _id: toObjectId(userId) },
    {
      $set: {
        ...patch,
        promoted_by_user_id: toOptionalObjectId(adminUserId),
        promoted_at: now,
        updated_at: now,
      },
    }
  )
}

export const userService = {
  async listUsers({
    status,
    role,
    limit = 50,
  }: {
    status?: UserStatus
    role?: UserRole
    limit?: number
  } = {}): Promise<SerializedUser[]> {
    const users = await getCollection('users')
    const query: Record<string, unknown> = {}

    if (status) query.status = status
    if (role) query.role = role

    const rows = await users.find(query).limit(Math.min(limit, 100)).toArray()
    rows.sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime()
      const bTime = new Date(b.created_at || 0).getTime()
      return bTime - aTime
    })

    const brokerageIds = rows
      .map((row) => row.brokerage_id)
      .filter((id): id is ObjectId => id instanceof ObjectId)
    const brokeragesById = await loadBrokeragesById(brokerageIds)

    return rows.map((row) =>
      serializeUser(
        row,
        row.brokerage_id ? brokeragesById.get(row.brokerage_id.toString()) : null
      )
    )
  },

  async listBrokerages(): Promise<SerializedBrokerage[]> {
    const brokerages = await getCollection('brokerages')
    const rows = await brokerages.find({}).limit(100).toArray()
    rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    return rows.map((row) => serializeBrokerage(row)).filter(Boolean) as SerializedBrokerage[]
  },

  async countPendingUsers(): Promise<number> {
    const users = await getCollection('users')
    return users.countDocuments({ status: 'pending_approval' })
  },

  async promoteToBroker(userId: string, brokerageInput: BrokerageInput, adminUserId: string) {
    const brokerageId = await getOrCreateBrokerage(brokerageInput)

    await stampUserChange(userId, adminUserId, {
      role: 'broker',
      status: 'active',
      brokerage_id: brokerageId,
    })
  },

  async promoteToTech(userId: string, adminUserId: string) {
    await stampUserChange(userId, adminUserId, {
      role: 'tech',
      status: 'active',
      brokerage_id: null,
    })
  },

  async promoteToAdmin(userId: string, adminUserId: string) {
    await stampUserChange(userId, adminUserId, {
      role: 'admin',
      status: 'active',
      brokerage_id: null,
    })
  },

  async suspendUser(userId: string, adminUserId: string) {
    await stampUserChange(userId, adminUserId, { status: 'suspended' })
  },

  async reinstateUser(userId: string, adminUserId: string) {
    await stampUserChange(userId, adminUserId, { status: 'active' })
```
### `models/Appointment.ts`
```ts
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getAppointmentCollection() {
  return await getCollection('appointments')
}

export interface Appointment {
  _id?: ObjectId
  lead_id: string
  property_id: string
  agent_id: string
  scheduled_at: Date
  status: string
  reminder_sent: boolean
  notes: string
  lead_name: string
  lead_phone: string
  property_title: string
  property_location: string
  created_at: Date
  updated_at: Date
}

export const DEFAULT_APPOINTMENT: Omit<Appointment, '_id'> = {
  lead_id: '',
  property_id: '',
  agent_id: '',
  scheduled_at: new Date(),
  status: 'scheduled',
  reminder_sent: false,
  notes: '',
  lead_name: '',
  lead_phone: '',
  property_title: '',
  property_location: '',
  created_at: new Date(),
  updated_at: new Date(),
}
```
### `models/Builder.ts`
```ts
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getBuilderCollection() {
  return await getCollection('builders')
}

export interface Builder {
  _id?: ObjectId
  name: string
  city: string
  notable_projects: string[]
  description: string
  website: string
  created_at: Date
  updated_at: Date
}

export const CITIES = ['Ahmedabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai'] as const
export type City = typeof CITIES[number]

// Top 5 builders per city â€” useful context for the voice agent
export const SEED_BUILDERS: Omit<Builder, '_id'>[] = [
  // Ahmedabad
  {
    city: 'Ahmedabad',
    name: 'Adani Realty',
    notable_projects: ['Shantigram', 'Adani Samsara', 'Adani Oyster Grande'],
    description: 'One of the largest developers in Ahmedabad with integrated townships and luxury residential projects.',
    website: 'https://www.adanirealty.com',
    created_at: new Date(), updated_at: new Date(),
  },
  {
    city: 'Ahmedabad',
    name: 'Safal Group',
    notable_projects: ['Safal Parisar', 'Safal Solitaire', 'Safal Prelude'],
    description: 'Prominent Ahmedabad builder known for affordable and mid-segment housing across the city.',
    website: 'https://www.safalgroup.com',
    created_at: new Date(), updated_at: new Date(),
  },
```
### `models/Call.ts`
```ts
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getCallCollection() {
  return await getCollection('calls')
}

export interface Call {
  _id?: ObjectId
  lead_id: string
  lead_name: string
  lead_phone: string
  agent_name: string
  agent_id: string
  campaign_id: string
  direction: string
  call_type: string
  duration: number
  disposition: string
  call_outcome: string
  call_summary: string
  customer_availability: string
  preferred_callback_time: string
  preferred_callback_days: string[]
  customer_interest_level: string
  follow_up_required: boolean
  follow_up_date: Date | null
  follow_up_notes: string
  key_requirements: string
  customer_objections: string
  next_steps: string
  recording_url: string
  transcript: string
  trai_compliant: boolean
  call_status: string
  vapi_call_id: string
  created_at: Date
  updated_at: Date
}

```
### `models/callLog.ts`
```ts
import { getCollection } from '@/lib/mongodb'

export default async function getCallLogModel() {
  return await getCollection('call_logs')
}

export interface CallLog {
  id: string
  client_id: string
  direction: 'inbound' | 'outbound'
  duration: number
  timestamp: string
  sentiment_score: number
  objection_types: string[]
  affordability_signal: string
  financial_discussed: boolean
  transcript_summary: string
  agent_assigned: string
  escalation_triggered: boolean
}
```
### `models/Campaign.ts`
```ts
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getCampaignCollection() {
  return await getCollection('campaigns')
}

export type CampaignStatus =
  | 'draft'
  | 'queued'
  | 'dialing'
  | 'paused'
  | 'completed'
  | 'deferred'
  | 'cancelled'
  | 'active' // legacy â€” kept for backward compat with existing Mongo documents

export interface Campaign {
  _id?: ObjectId
  name: string
  description: string
  script_template: string
  voice_assistant?: string

  /** Resolved lead IDs stored at creation time */
  target_lead_ids: string[]
  /** Human-readable filter string e.g. "status=warm AND budget_min>=1.2Cr" */
  target_filter?: string

  status: CampaignStatus
  assigned_agent_ids: string[]

  start_date: Date | null
  end_date: Date | null

  // counters
  calls_made: number
  calls_connected: number
  appointments_booked: number
  dnc_count?: number
```
### `models/clientProfile.ts`
```ts
import { getCollection } from '@/lib/mongodb'

export default async function getClientProfileModel() {
  return await getCollection('client_profiles')
}

export interface ClientProfile {
  id: string
  name: string
  phone: string
  email: string
  budget: number
  timeline: string
  location_prefs: string[]
  property_type: string
  monthly_income: number
  additional_income_sources: { type: string; amount: number }[]
  existing_emis: number
  rent: number
  household_expenses: number
  other_commitments: number
  down_payment_capacity: number
  lead_temperature: 'Hot' | 'Warm' | 'Cold'
  tc_consent: boolean
  tc_consent_date: string
  do_not_call: boolean
}
```
### `models/Lead.ts`
```ts
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getLeadCollection() {
  return await getCollection('leads')
}

export interface Lead {
  _id?: ObjectId
  broker_id: string
  name: string
  phone: string
  email: string
  source: string
  status: string
  budget_range: string
  location_pref: string
  property_type: string
  assigned_agent_id: string
  dnd_status: boolean
  place: string
  notes: string
  preferred_contact_time: string
  availability_window: string
  availability_days: string[]
  interest_level: string
  qualification_status: string
  lead_score: number
  last_contacted_at: Date | null
  next_follow_up_date: Date | null
  follow_up_count: number
  total_calls: number
  first_call_completed: boolean
  customer_requirements: string
  timeline: string
  objections: string
  followup_reason: string
  created_at: Date
  updated_at: Date
}
```
### `models/Property.ts`
```ts
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getPropertyCollection() {
  return await getCollection('properties')
}

export interface Property {
  _id?: ObjectId
  title: string
  type: string
  city: string
  location: string
  price: number
  area_sqft: number
  bedrooms: number
  status: string
  builder: string
  images: string[]
  description: string
  amenities: string[]
  created_at: Date
  updated_at: Date
}

export const DEFAULT_PROPERTY: Omit<Property, '_id'> = {
  title: '',
  type: '',
  city: '',
  location: '',
  price: 0,
  area_sqft: 0,
  bedrooms: 0,
  status: 'available',
  builder: '',
  images: [],
  description: '',
  amenities: [],
  created_at: new Date(),
  updated_at: new Date(),
```
### `models/propertyAssessment.ts`
```ts
import { getCollection } from '@/lib/mongodb'

export default async function getPropertyAssessmentModel() {
  return await getCollection('property_assessments')
}

export interface PropertyAssessment {
  id: string
  client_id: string
  property_name: string
  builder_name?: string
  cost_mode: 'lump_sum' | 'itemised'
  base_price: number
  parking?: number
  club?: number
  plc?: number
  other_charges?: number
  gst_pct: number
  stamp_duty_pct: number
  registration: number
  total_cost: number
  property_type: 'UC' | 'RTM'
  possession_date: string
  funding_method: string
  loan_amount: number
  interest_rate: number
  tenure: number
  emi_type: 'Pre-EMI' | 'Full EMI'
  emi_amount: number
  tranches: string // JSON string for now
  affordability_signal: 'Go' | 'Reconsider' | 'No-Go'
  excess_ratio: number
  recommendations: string
  report_paid: boolean
  created_at: string
}
```
### `models/propertyMatch.ts`
```ts
import { getCollection } from '@/lib/mongodb'

export default async function getPropertyMatchModel() {
  return await getCollection('property_matches')
}

export interface PropertyMatch {
  id: string
  client_id: string
  property_id: string
  match_score: number
  match_criteria: string[]
  alert_sent: boolean
  broker_approved: boolean
  created_at: string
}
```
### `models/scheduledMeeting.ts`
```ts
import { getCollection } from '@/lib/mongodb'

export default async function getScheduledMeetingModel() {
  return await getCollection('scheduled_meetings')
}

export interface ScheduledMeeting {
  id: string
  client_id: string
  agent_id: string
  datetime: string
  property_address: string
  meeting_type: string
  status: 'scheduled' | 'cancelled' | 'completed'
  created_at: string
}
```
### `models/systemConfig.ts`
```ts
import { getCollection } from '@/lib/mongodb'

export default async function getSystemConfigModel() {
  return await getCollection('system_config')
}

export interface SystemConfig {
  config_key: string
  config_value: string
  updated_by?: string
  updated_at?: string
}
```

## Section 5 — API route map (App Router)
### `app/api/_archive_call-logs/route.ts`
- Route path: `/api/_archive_call-logs`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### PUT handler first 15 lines
```ts
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived call logs by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
### `app/api/_archive_client-profiles/route.ts`
- Route path: `/api/_archive_client-profiles`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### PUT handler first 15 lines
```ts
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived client profiles by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
### `app/api/_archive_property-assessments/route.ts`
- Route path: `/api/_archive_property-assessments`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### PUT handler first 15 lines
```ts
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property assessments by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
### `app/api/_archive_property-matches/route.ts`
- Route path: `/api/_archive_property-matches`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### PUT handler first 15 lines
```ts
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived property matches by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
### `app/api/_archive_scheduled-meetings/route.ts`
- Route path: `/api/_archive_scheduled-meetings`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### PUT handler first 15 lines
```ts
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: filter archived scheduled meetings by session.user.brokerage_id. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
### `app/api/activities/route.ts`
- Route path: `/api/activities`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter activities by session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET() {
  try {
    await requireSession()
    // Phase 11.5: filter activities by session.user.brokerage_id.
    const [leads, calls, appointments, campaigns] = await Promise.all([
      getCollection('leads'),
      getCollection('calls'),
      getCollection('appointments'),
      getCollection('campaigns'),
    ])

    const activities: any[] = []

    // Recent leads (last 20)
    const recentLeads = await leads.find({ is_deleted: { $ne: true } }).sort({ created_at: -1 }).limit(20).toArray()
```
### `app/api/agent/[agentId]/executions/route.ts`
- Route path: `/api/agent/[agentId]/executions`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter execution traces by session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    await requireSession()
    // Phase 11.5: filter execution traces by session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('run_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = parseInt(searchParams.get('skip') || '0')
    const includeStats = searchParams.get('include_stats') === 'true'

    const agentId = params.agentId

```
### `app/api/agent/builder-refiner/route.ts`
- Route path: `/api/agent/builder-refiner`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify property matches belong to session.user.brokerage_id.
        { success: false, error: 'property_matches or matches array is required' },
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify property matches belong to session.user.brokerage_id.
    const body = await request.json()
    const { property_matches, matches, client_profile, builder_preferences } = body

    // Support both property_matches and matches parameter names
    const propertiesToRefine = property_matches || matches || []

    if (!Array.isArray(propertiesToRefine) || propertiesToRefine.length === 0) {
      return NextResponse.json(
        { success: false, error: 'property_matches or matches array is required' },
        { status: 400 }
      )
```
### `app/api/agent/call-state-validator/route.ts`
- Route path: `/api/agent/call-state-validator`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify call and lead belong to session.user.brokerage_id.
        { success: false, error: 'call_data and lead_state are required' },
- Follow-up Required: ${call_data.follow_up_required !== undefined ? call_data.follow_up_required : 'unknown'}
- Follow-up Required: ${lead_state.follow_up_required !== undefined ? lead_state.follow_up_required : 'unknown'}
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify call and lead belong to session.user.brokerage_id.
    const body = await request.json()
    const { call_data, lead_state } = body

    if (!call_data || !lead_state) {
      return NextResponse.json(
        { success: false, error: 'call_data and lead_state are required' },
        { status: 400 }
      )
    }

    const agentConfig = getAgentConfig('69e8f70b1234567890abcde0') // State Validator ID
```
### `app/api/agent/campaign-conductor/route.ts`
- Route path: `/api/agent/campaign-conductor`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
// Secured by x-cron-secret header (same token as cron routes).
import { authErrorResponse, requireRole } from '@/lib/auth'
const CRON_SECRET = process.env.CRON_SECRET ?? ''
  const incomingSecret =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    const isCronAuthorized = Boolean(CRON_SECRET && incomingSecret === CRON_SECRET)
    if (!isCronAuthorized) {
      await requireRole(['admin', 'tech'])
    // Phase 11.5: verify campaign belongs to session.user.brokerage_id when manually triggered.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
        { success: false, error: 'campaign_id is required' },
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  const incomingSecret =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    ''

  try {
    const isCronAuthorized = Boolean(CRON_SECRET && incomingSecret === CRON_SECRET)
    if (!isCronAuthorized) {
      await requireRole(['admin', 'tech'])
    }
    // Phase 11.5: verify campaign belongs to session.user.brokerage_id when manually triggered.
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
### `app/api/agent/events/route.ts`
- Route path: `/api/agent/events`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { requireSession } from '@/lib/auth'
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter agent event streams by session.user.brokerage_id.
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(req.url)
  const agentId = url.searchParams.get('agentId')
  const runId = url.searchParams.get('runId')

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
```
### `app/api/agent/matchmaker/route.ts`
- Route path: `/api/agent/matchmaker`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)
    if (!isCronAuthorized) {
      await requireRole(['admin', 'tech'])
    // Phase 11.5: filter matchmaker candidate leads/properties by session.user.brokerage_id.
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)
    if (!isCronAuthorized) {
      await requireRole(['admin', 'tech'])
    }
    // Phase 11.5: filter matchmaker candidate leads/properties by session.user.brokerage_id.
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
```
### `app/api/agent/price-drop/route.ts`
- Route path: `/api/agent/price-drop`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
    const cronSecret = process.env.CRON_SECRET
    const isCronAuthorized = Boolean(cronSecret && request.headers.get('x-cron-secret') === cronSecret)
    if (!isCronAuthorized) {
      await requireRole(['admin', 'tech'])
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const isCronAuthorized = Boolean(cronSecret && request.headers.get('x-cron-secret') === cronSecret)
    if (!isCronAuthorized) {
      await requireRole(['admin', 'tech'])
    }
    // Phase 11.5: attach actor brokerage_id to price-drop runs when multi-tenant lands.
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    throw error
  }

  let body: Record<string, any> = {}
```
### `app/api/agent/route.ts`
- Route path: `/api/agent`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
    await requireRole(['admin', 'tech'])
    const { message, agent_id, context, user_id, session_id } = body
      sessionId: session_id,
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: attach actor brokerage_id to manual agent runs when multi-tenant lands.
    const body = await request.json()
    const { message, agent_id, context, user_id, session_id } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const agentConfig = getAgentConfig(agent_id)
```
### `app/api/agent/run/route.ts`
- Route path: `/api/agent/run`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
import { GET as runFollowUpRoute } from '@/app/api/cron/follow-up/route'
import { POST as runReEngageRoute } from '@/app/api/cron/re-engage/route'
import { POST as runRemindersRoute } from '@/app/api/cron/reminders/route'
  reminders: async () => routeToJson(runRemindersRoute, 'POST', { 'x-cron-secret': process.env.CRON_SECRET || '' }),
  're-engage': async () => routeToJson(runReEngageRoute, 'POST', { 'x-cron-secret': process.env.CRON_SECRET || '' }),
  'follow-up': async () => routeToJson(runFollowUpRoute, 'GET', { authorization: `Bearer ${process.env.CRON_SECRET || ''}` }),
    await requireRole(['admin', 'tech'])
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: attach actor brokerage_id to manual agent runs when multi-tenant lands.
    const { agent_id } = await request.json()

    if (agent_id === 'price-drop') {
      return NextResponse.json(
        {
          success: false,
          message: 'Run Price Drop from a property row so the property and new price are included.',
        },
        { status: 400 }
      )
    }
```
### `app/api/agent/ws/route.ts`
- Route path: `/api/agent/ws`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter websocket/SSE events by session.user.brokerage_id.
    return new Response('Unauthorized', { status: 401 })
  // This endpoint requires WebSocket upgrade
  // In Next.js 13+, WebSocket support requires a custom server or middleware
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter websocket/SSE events by session.user.brokerage_id.
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const runId = searchParams.get('run_id')
  const agentId = searchParams.get('agent_id')

  // This endpoint requires WebSocket upgrade
  // In Next.js 13+, WebSocket support requires a custom server or middleware
  // For now, return polling-friendly SSE (Server-Sent Events) as alternative
```
### `app/api/agent-activities/route.ts`
- Route path: `/api/agent-activities`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter agent activity by session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(request: Request) {
  try {
    await requireSession()
    // Phase 11.5: filter agent activity by session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100)
    const skip = Number(searchParams.get('skip') || '0')
    const agentId = searchParams.get('agentId') || 'all'
    const result = await listActivityRuns({ limit, skip, agentId })

    return NextResponse.json({
      success: true,
      data: result.runs,
      total: result.total,
      hasMore: skip + result.runs.length < result.total,
```
### `app/api/appointments/[id]/route.ts`
- Route path: `/api/appointments/[id]`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: verify appointment belongs to session.user.brokerage_id.
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession()
    // Phase 11.5: verify appointment belongs to session.user.brokerage_id.
    const detail = await appointmentService.get(params.id)
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: detail })
  } catch (err: any) {
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```
### `app/api/appointments/route.ts`
- Route path: `/api/appointments`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter appointments by session.user.brokerage_id via linked lead/property.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify lead/property belongs to session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter appointments by session.user.brokerage_id via linked lead/property.
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const leadId = searchParams.get('leadId')
    const today = searchParams.get('today')
    const upcoming = searchParams.get('upcoming')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    const appointments = await getCollection('appointments')
    const filter: Record<string, any> = { is_deleted: { $ne: true } }

```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify lead/property belongs to session.user.brokerage_id.
    const body = await request.json()
    const appointments = await getCollection('appointments')

    const appointment = {
      ...DEFAULT_APPOINTMENT,
      ...body,
      scheduled_at: new Date(body.scheduled_at),
      created_at: new Date(),
      updated_at: new Date(),
    }

```
#### PUT handler first 15 lines
```ts
export async function PUT(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify appointment belongs to session.user.brokerage_id.
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json({ success: false, error: '_id is required' }, { status: 400 })
    }

    const appointments = await getCollection('appointments')
    if (updates.scheduled_at) updates.scheduled_at = new Date(updates.scheduled_at)

    const result = await appointments.updateOne(
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify appointment belongs to session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    const appointments = await getCollection('appointments')

    // Delete all
    if (all === 'true') {
      const result = await appointments.deleteMany({})
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }
```
### `app/api/archive/calls/route.ts`
- Route path: `/api/archive/calls`
- HTTP methods exported: `GET, POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter call archives by session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    // Phase 11.5: archive only calls visible to session.user.brokerage_id.
        { success: false, error: 'start_date and end_date are required' },
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter call archives by session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const archives = await callArchiveService.getRecentArchives(limit)

    return NextResponse.json({
      success: true,
      data: {
        archives,
        count: archives.length,
      },
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: archive only calls visible to session.user.brokerage_id.
    const body = await request.json()
    const { start_date, end_date, filters } = body

    if (!start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(start_date)
```
### `app/api/auth/[...nextauth]/route.ts`
- Route path: `/api/auth/[...nextauth]`
- HTTP methods exported: ``
- Auth/middleware checks at top: `FOUND`
```ts
 * app/api/auth/[...nextauth]/route.ts
 * NextAuth v5 catch-all route handler.
 * Handles: /api/auth/signin, /api/auth/signout, /api/auth/callback/google,
 *          /api/auth/session, /api/auth/csrf, /api/auth/providers
import { handlers } from '@/lib/auth'
```
### `app/api/builders/route.ts`
- Route path: `/api/builders`
- HTTP methods exported: `GET, POST, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
    await requireSession()
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    // Phase 11.5: stamp custom builders with session.user.brokerage_id if KB becomes tenant-scoped.
      return NextResponse.json({ success: false, error: 'name and city are required' }, { status: 400 })
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: decide if builders are global or brokerage-scoped.
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    const builders = await getCollection('builders')
    const filter: Record<string, any> = {}
    if (city) filter.city = city

    const items = await builders.find(filter).toArray()
    items.sort((a, b) => {
      const cityCompare = String(a.city || '').localeCompare(String(b.city || ''))
      if (cityCompare !== 0) return cityCompare
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: stamp custom builders with session.user.brokerage_id if KB becomes tenant-scoped.
    const body = await request.json()
    const { name, city, notable_projects, description, website } = body

    if (!name || !city) {
      return NextResponse.json({ success: false, error: 'name and city are required' }, { status: 400 })
    }

    const builders = await getCollection('builders')
    const builder: Omit<Builder, '_id'> = {
      name,
      city,
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify custom builder belongs to session.user.brokerage_id if tenant-scoped.
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    const builders = await getCollection('builders')

    if (all === 'true') {
      const result = await builders.deleteMany({})
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }

```
### `app/api/calls/[id]/route.ts`
- Route path: `/api/calls/[id]`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: verify call belongs to session.user.brokerage_id.
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession()
    // Phase 11.5: verify call belongs to session.user.brokerage_id.
    const detail = await callService.get(params.id)
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: detail })
  } catch (err: any) {
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```
### `app/api/calls/lead/[id]/route.ts`
- Route path: `/api/calls/lead/[id]`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: verify lead belongs to session.user.brokerage_id.
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 })
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession()
    // Phase 11.5: verify lead belongs to session.user.brokerage_id.
    const leadId = params.id
    
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 })
    }

    const callsCollection = await getCollection('calls')
    
```
### `app/api/calls/route.ts`
- Route path: `/api/calls`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter calls by session.user.brokerage_id through linked leads.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    // Phase 11.5: stamp calls with session.user.brokerage_id or verify linked lead ownership.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter calls by session.user.brokerage_id through linked leads.
    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction')
    const disposition = searchParams.get('disposition')
    const leadId = searchParams.get('leadId')
    const campaignId = searchParams.get('campaignId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    const calls = await getCollection('calls')
    const filter: Record<string, any> = {}
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: stamp calls with session.user.brokerage_id or verify linked lead ownership.
    const body = await request.json()
    const calls = await getCollection('calls')

    const call = {
      ...DEFAULT_CALL,
      ...body,
      duration: Number(body.duration) || 0,
      created_at: new Date(),
      updated_at: new Date(),
    }

```
#### PUT handler first 15 lines
```ts
export async function PUT(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify call belongs to session.user.brokerage_id.
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json({ success: false, error: '_id is required' }, { status: 400 })
    }

    const calls = await getCollection('calls')
    const result = await calls.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updates, updated_at: new Date() } }
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify deleted calls belong to session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    const calls = await getCollection('calls')

    // Delete all
    if (all === 'true') {
      const result = await calls.deleteMany({})
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }
```
### `app/api/calls/sync/route.ts`
- Route path: `/api/calls/sync`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
          - key_requirements: what the customer wants (string)
          - follow_up_required: boolean
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: sync only calls visible to session.user.brokerage_id.
    let body: any = {}
    try { body = await request.json() } catch {}

    const calls = await getCollection('calls')
    const leads = await getCollection('leads')

    // Find calls that need syncing
    const filter: any = body.callId
      ? { vapi_call_id: body.callId }
      : { call_status: { $in: ['in-progress', 'queued', 'ringing'] } }

```
### `app/api/campaigns/route.ts`
- Route path: `/api/campaigns`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter campaigns by session.user.brokerage_id when multi-tenant lands.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    // Phase 11.5: stamp campaign with session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify campaign belongs to session.user.brokerage_id.
      return NextResponse.json({ success: false, error: '_id is required' }, { status: 400 })
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter campaigns by session.user.brokerage_id when multi-tenant lands.
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    const campaigns = await getCollection('campaigns')
    const filter: Record<string, any> = {}

    if (status) filter.status = status
    if (search) {
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: stamp campaign with session.user.brokerage_id.
    const body = await request.json()
    const campaigns = await getCollection('campaigns')

    const campaign = {
      ...DEFAULT_CAMPAIGN,
      ...body,
      start_date: body.start_date ? new Date(body.start_date) : null,
      end_date: body.end_date ? new Date(body.end_date) : null,
      created_at: new Date(),
      updated_at: new Date(),
    }
```
#### PUT handler first 15 lines
```ts
export async function PUT(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify campaign belongs to session.user.brokerage_id.
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json({ success: false, error: '_id is required' }, { status: 400 })
    }

    const campaigns = await getCollection('campaigns')
    if (updates.start_date) updates.start_date = new Date(updates.start_date)
    if (updates.end_date) updates.end_date = new Date(updates.end_date)

```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify deleted campaigns belong to session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    const campaigns = await getCollection('campaigns')

    // Delete all
    if (all === 'true') {
      const result = await campaigns.deleteMany({})
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }
```
### `app/api/campaigns/trigger/route.ts`
- Route path: `/api/campaigns/trigger`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
import { auth } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
    await requireRole(['admin', 'tech'])
    const session = await auth()
      brokerId = requireBrokerId(session);
    // Phase 11.5: verify campaign/lead belongs to session.user.brokerage_id.
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    const session = await auth()
    
    let brokerId: string;
    try {
      brokerId = requireBrokerId(session);
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) {
        return NextResponse.json(
          { error: "broker_scope_missing", message: "Your account is not provisioned for a brokerage. Contact admin." },
          { status: 403 }
        );
      }
```
### `app/api/clients/route.ts`
- Route path: `/api/clients`
- HTTP methods exported: `GET, POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { auth, authErrorResponse, requireRole, requireSession } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
    await requireSession()
    // Phase 11.5: filter clients by session.user.brokerage_id when multi-tenant lands.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    const session = await auth()
      brokerId = requireBrokerId(session)
    // Phase 11.5: stamp new clients with session.user.brokerage_id.
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 })
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter clients by session.user.brokerage_id when multi-tenant lands.

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const source = searchParams.get('source') || undefined

    const data = await clientService.listClients({ status, source })
    return NextResponse.json({ success: true, clients: data })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Clients] GET Error:', error)
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    const session = await auth()
    
    let brokerId: string
    try {
      brokerId = requireBrokerId(session)
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) {
        return NextResponse.json(
          { error: 'broker_scope_missing', message: 'Your account is not provisioned for a brokerage. Contact admin.' },
          { status: 403 }
        )
      }
```
### `app/api/cron/archive/route.ts`
- Route path: `/api/cron/archive`
- HTTP methods exported: `GET, POST`
- Auth/middleware checks at top: `FOUND`
```ts
 * Automatic Call Archive Cron Job
async function handleArchiveCron(request: NextRequest) {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    console.error('[API/Cron/Archive] Error:', error)
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  return handleArchiveCron(request)
}

export async function POST(request: NextRequest) {
  return handleArchiveCron(request)
}
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  return handleArchiveCron(request)
}
```
### `app/api/cron/campaign-sweep/route.ts`
- Route path: `/api/cron/campaign-sweep`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
// Campaign Sweep Cron â€” Phase 9.5
// POST /api/cron/campaign-sweep  |  Secured by x-cron-secret header
// NCRONTAB: "0 0,30 * * * *" â€” requires WEBSITE_TIME_ZONE=India Standard Time
const CRON_SECRET = process.env.CRON_SECRET ?? ''
  // Auth: x-cron-secret header or Authorization Bearer
  const incomingSecret =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      trigger: 'cron',
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  // Auth: x-cron-secret header or Authorization Bearer
  const incomingSecret =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    ''

  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAgent<
      { triggered_at: string },
      { re_queued: number; campaign_ids: string[]; summary: string }
```
### `app/api/cron/follow-up/route.ts`
- Route path: `/api/cron/follow-up`
- HTTP methods exported: `GET, POST`
- Auth/middleware checks at top: `FOUND`
```ts
async function handleFollowupCron(request: NextRequest) {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      trigger: 'cron',
        cron_job: 'follow-up',
      metadata: { cron_type: 'scheduled', frequency: 'hourly' },
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  return handleFollowupCron(request)
}

export async function POST(request: NextRequest) {
  return handleFollowupCron(request)
}
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  return handleFollowupCron(request)
}
```
### `app/api/cron/followups/route.ts`
- Route path: `/api/cron/followups`
- HTTP methods exported: `GET, POST`
- Auth/middleware checks at top: `FOUND`
```ts
async function handleFollowupsCron(request: NextRequest) {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      console.log(`[Followup Cron] Triggering follow-up for lead ${lead.name} (${lead.phone})`)
        '[FOLLOWUP CRON] Calling lead',
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  return handleFollowupsCron(request)
}

export async function POST(request: NextRequest) {
  return handleFollowupsCron(request)
}
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  return handleFollowupsCron(request)
}
```
### `app/api/cron/matchmaker/route.ts`
- Route path: `/api/cron/matchmaker`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
 * POST /api/cron/matchmaker
 * The Matchmaker â€” cron sweep every 30 min (Phase 3.5 will promote to event).
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    console.error('[Cron/Matchmaker] Error:', error)
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runMatchmaker()

    return NextResponse.json({
      success: true,
      runId,
      matches_found: (output as any)?.matches_found ?? 0,
      calls_triggered: (output as any)?.calls_triggered ?? 0,
```
### `app/api/cron/re-engage/route.ts`
- Route path: `/api/cron/re-engage`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
 * POST /api/cron/re-engage
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      trigger: 'cron',
        cron_job: 're-engage',
      metadata: { cron_type: 'scheduled', frequency: 'daily_10_IST' },
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAgent({
      agentId: 'dead_lead_reengager',
      agentName: 'The Dead Lead Re-engager',
      trigger: 'cron',
      input: {
        cron_job: 're-engage',
        trigger_time: new Date().toISOString(),
```
### `app/api/cron/reminders/route.ts`
- Route path: `/api/cron/reminders`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
 * POST /api/cron/reminders
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      trigger: 'cron',
        cron_job: 'reminders',
      metadata: { cron_type: 'scheduled', frequency: 'daily_09_IST' },
            ? 'No appointments require reminders in the next 24 h. Exiting cleanly.'
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAgent({
      agentId: 'appointment_guardian',
      agentName: 'The Appointment Guardian',
      trigger: 'cron',
      input: {
        cron_job: 'reminders',
        trigger_time: new Date().toISOString(),
```
### `app/api/dashboard/stats/route.ts`
- Route path: `/api/dashboard/stats`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter dashboard stats by session.user.brokerage_id.
```
#### GET handler first 15 lines
```ts
export async function GET() {
  try {
    await requireSession()
    // Phase 11.5: filter dashboard stats by session.user.brokerage_id.
    const [leads, calls, appointments, campaigns] = await Promise.all([
      getCollection('leads'),
      getCollection('calls'),
      getCollection('appointments'),
      getCollection('campaigns'),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
```
### `app/api/dnc/route.ts`
- Route path: `/api/dnc`
- HTTP methods exported: `GET, POST, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter DNC rows by session.user.brokerage_id through linked leads.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    // Phase 11.5: only mark DNC for leads in session.user.brokerage_id.
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 })
        customer_requirements: '',
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter DNC rows by session.user.brokerage_id through linked leads.
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const leads = await getCollection('leads')
    const filter: Record<string, any> = { dnd_status: true }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: only mark DNC for leads in session.user.brokerage_id.
    const { phone, reason } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 })
    }

    const leads = await getCollection('leads')
    const result = await leads.updateMany(
      { phone },
      { $set: { dnd_status: true, notes: `DNC: ${reason || 'Customer requested'}`, updated_at: new Date() } }
    )
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: only remove DNC for leads in session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const all = searchParams.get('all')

    const leads = await getCollection('leads')

    // Remove all from DNC
    if (all === 'true') {
      await leads.updateMany(
        { dnd_status: true },
        { $set: { dnd_status: false, updated_at: new Date() } }
```
### `app/api/follow-ups/execution-history/route.ts`
- Route path: `/api/follow-ups/execution-history`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
 * Retrieves detailed execution traces for follow-up cron jobs
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter execution history by session.user.brokerage_id.
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter execution history by session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = parseInt(searchParams.get('skip') || '0')
    const includeStats = searchParams.get('include_stats') === 'true'

    const followupAgentId = '69e8f709f89cad5d4b752d24' // Follow-Up Agent ID

    // Get execution history for the Follow-Up Agent
    const executions = await agentLogger.getAgentExecutionHistory(
      followupAgentId,
      limit,
```
### `app/api/follow-ups/route.ts`
- Route path: `/api/follow-ups`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter follow-ups by session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET() {
  try {
    await requireSession()
    // Phase 11.5: filter follow-ups by session.user.brokerage_id.
    const leads = await getCollection('leads')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const followUps = await leads.find({
      next_follow_up_date: { $lte: tomorrow },
      dnd_status: { $ne: true },
      status: { $nin: ['closed', 'lost'] },
```
### `app/api/health/route.ts`
- Route path: `/api/health`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `NOT FOUND`
#### GET handler first 15 lines
```ts
export function GET() {
  return NextResponse.json({ status: 'ok' })
}
```
### `app/api/kb/builder-queries/route.ts`
- Route path: `/api/kb/builder-queries`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter builder query history by session.user.brokerage_id.
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter builder query history by session.user.brokerage_id.
  } catch (err) {
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
    throw err
  }
  const name = req.nextUrl.searchParams.get('name') || ''
  if (!name) return NextResponse.json({ data: [] })

  try {
    const queries = await builderKBService.getBuilderRecentQueries(name)
    return NextResponse.json({ data: queries })
```
### `app/api/kb/search/route.ts`
- Route path: `/api/kb/search`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter KB search results by session.user.brokerage_id where applicable.
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter KB search results by session.user.brokerage_id where applicable.
    const body = await req.json()
    const query = typeof body?.query === 'string' ? body.query : ''
    const city = typeof body?.city === 'string' ? body.city : undefined
    const maxPriceInr = typeof body?.maxPriceInr === 'number' ? body.maxPriceInr : undefined
    const limit = typeof body?.limit === 'number' ? body.limit : undefined

    const results = await searchDemoListings({ query, city, maxPriceInr, limit })
    return NextResponse.json({
      success: true,
      results: results.map(r => ({
        score: r.score,
```
### `app/api/leads/route.ts`
- Route path: `/api/leads`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
import { auth } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
    await requireSession()
    // Phase 11.5: filter leads by session.user.brokerage_id when multi-tenant lands.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    await requireRole(['admin', 'tech'])
    const session = await auth()
      brokerId = requireBrokerId(session);
    // Phase 11.5: stamp lead with session.user.brokerage_id.
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter leads by session.user.brokerage_id when multi-tenant lands.
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const qualification = searchParams.get('qualification')
    const interest = searchParams.get('interest')
    const place = searchParams.get('place')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    const leads = await getCollection('leads')
    const filter: Record<string, any> = { is_deleted: { $ne: true } }
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    const session = await auth()
    
    let brokerId: string;
    try {
      brokerId = requireBrokerId(session);
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) {
        return NextResponse.json(
          { error: "broker_scope_missing", message: "Your account is not provisioned for a brokerage. Contact admin." },
          { status: 403 }
        );
      }
```
#### PUT handler first 15 lines
```ts
export async function PUT(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify lead belongs to session.user.brokerage_id.
    const body = await request.json()
    const { _id, ...updates } = body

    if (updates.next_follow_up_date) {
      updates.next_follow_up_date = new Date(updates.next_follow_up_date)
    } else if (updates.next_follow_up_date === '') {
      updates.next_follow_up_date = null
    }

    if (!_id) {
      return NextResponse.json({ success: false, error: '_id is required' }, { status: 400 })
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify deleted leads belong to session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    const leads = await getCollection('leads')

    // Delete all
    if (all === 'true') {
      const result = await leads.deleteMany({})
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }
```
### `app/api/leads/webhook/route.ts`
- Route path: `/api/leads/webhook`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth';
import { auth } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
    await requireRole(['admin', 'tech'])
    const session = await auth()
      brokerId = requireBrokerId(session);
    // Phase 11.5: stamp ingested leads with session.user.brokerage_id.
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 });
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    const session = await auth()
    
    let brokerId: string;
    try {
      brokerId = requireBrokerId(session);
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) {
        return NextResponse.json(
          { error: "broker_scope_missing", message: "Your account is not provisioned for a brokerage. Contact admin." },
          { status: 403 }
        );
      }
```
### `app/api/properties/route.ts`
- Route path: `/api/properties`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
    await requireSession()
    // Phase 11.5: filter properties by session.user.brokerage_id when multi-tenant lands.
      await requireRole(['admin', 'tech'])
      // Phase 11.5: seed only the current session.user.brokerage_id inventory.
```
#### GET handler first 15 lines
```ts
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter properties by session.user.brokerage_id when multi-tenant lands.
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const builder = searchParams.get('builder')
    const city = searchParams.get('city')
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: stamp property with session.user.brokerage_id.
    const body = await request.json()
    const properties = await getCollection('properties')

    const property = {
      ...DEFAULT_PROPERTY,
      ...body,
      price: Number(body.price) || 0,
      area_sqft: Number(body.area_sqft) || 0,
      bedrooms: Number(body.bedrooms) || 0,
      created_at: new Date(),
      updated_at: new Date(),
```
#### PUT handler first 15 lines
```ts
export async function PUT(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify property belongs to session.user.brokerage_id.
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json({ success: false, error: '_id is required' }, { status: 400 })
    }

    const properties = await getCollection('properties')
    if (updates.price) updates.price = Number(updates.price)
    if (updates.area_sqft) updates.area_sqft = Number(updates.area_sqft)
    if (updates.bedrooms) updates.bedrooms = Number(updates.bedrooms)
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify deleted properties belong to session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    const properties = await getCollection('properties')

    // Delete all
    if (all === 'true') {
      const confirm = searchParams.get('confirm')
      if (confirm !== 'DESTROY-ALL') {
        return NextResponse.json({ 
```
### `app/api/rag/route.ts`
- Route path: `/api/rag`
- HTTP methods exported: `POST, DELETE, PATCH`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth';
      await requireSession()
      await requireRole(['admin', 'tech'])
    // Phase 11.5: scope RAG documents/vector stores to session.user.brokerage_id.
    // Note: openai.files.create requires a ReadStream, but NextRequest provides a Buffer.
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      await requireSession()
    } else {
      await requireRole(['admin', 'tech'])
    }
    // Phase 11.5: scope RAG documents/vector stores to session.user.brokerage_id.
    // If it's a JSON request with just ragId, it's a GET request for documents (because frontend uses POST for getDocuments)
    
    if (contentType.includes('application/json')) {
      const { ragId } = await request.json();
      
      if (!process.env.OPENAI_API_KEY) {
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify RAG documents belong to session.user.brokerage_id.
    const { ragId, documentNames } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      // Remove from mock
      const namesToDelete = new Set(documentNames);
      for (let i = MOCK_DOCUMENTS.length - 1; i >= 0; i--) {
        if (namesToDelete.has(MOCK_DOCUMENTS[i].fileName)) {
          MOCK_DOCUMENTS.splice(i, 1);
        }
      }
      return NextResponse.json({ success: true, deletedCount: documentNames.length, ragId });
```
#### PATCH handler first 15 lines
```ts
export async function PATCH(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify crawled KB source belongs to session.user.brokerage_id.
    const { ragId, url } = await request.json();
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully crawled ${url}`,
      url,
      ragId 
    });
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
### `app/api/scheduler/route.ts`
- Route path: `/api/scheduler`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth';
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify scheduled event belongs to session.user.brokerage_id.
        return NextResponse.json({ success: false, error: 'timeMin and timeMax are required' }, { status: 400 });
        return NextResponse.json({ success: false, error: 'summary, startTime, and endTime are required' }, { status: 400 });
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify scheduled event belongs to session.user.brokerage_id.
    const body = await request.json();
    const { action, timeMin, timeMax, summary, description, startTime, endTime, attendees } = body;

    if (action === 'check_availability') {
      if (!timeMin || !timeMax) {
        return NextResponse.json({ success: false, error: 'timeMin and timeMax are required' }, { status: 400 });
      }
      const result = await checkAvailability(timeMin, timeMax);
      return NextResponse.json(result);
    } 
    
```
### `app/api/seed/route.ts`
- Route path: `/api/seed`
- HTTP methods exported: `GET`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth'
    await requireRole(['admin', 'tech'])
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### GET handler first 15 lines
```ts
export async function GET() {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: seed only brokerage-scoped demo data when multi-tenant lands.
    const properties = await getCollection('properties')
    
    // Clear existing properties
    await properties.deleteMany({})
    
    // Insert new properties
    const result = await properties.insertMany(SEED_PROPERTIES)
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.insertedCount} properties`,
```
### `app/api/system-config/route.ts`
- Route path: `/api/system-config`
- HTTP methods exported: `GET, POST, PUT, DELETE`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
```
#### GET handler first 15 lines
```ts
export async function GET(req: NextRequest) {
  try { await requireSession(); return handleGet(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### POST handler first 15 lines
```ts
export async function POST(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handlePost(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### PUT handler first 15 lines
```ts
export async function PUT(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handlePut(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
#### DELETE handler first 15 lines
```ts
export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin', 'tech']); /* Phase 11.5: decide whether system_config remains global or becomes brokerage-scoped. */ return handleDelete(await getCol(), req) } catch (e: any) { const authResponse = authErrorResponse(e); if (authResponse) return authResponse; return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
```
### `app/api/upload/route.ts`
- Route path: `/api/upload`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
import { authErrorResponse, requireRole } from '@/lib/auth';
    await requireRole(['admin', 'tech'])
    // Phase 11.5: associate uploaded assets with session.user.brokerage_id.
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: associate uploaded assets with session.user.brokerage_id.
    // Graceful failure if environment variables are not set (as requested)
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      return NextResponse.json(
        {
          success: false,
          message: 'Azure Storage is not configured. Upload simulated successfully for UI demonstration.',
          asset_ids: ['mock-asset-id'],
          files: [{ file_name: 'mock-file.pdf', success: true }],
        },
        { status: 200 } // Return 200 so the UI doesn't crash during demo mode
      );
```
### `app/api/vapi/webhook/route.ts`
- Route path: `/api/vapi/webhook`
- HTTP methods exported: `POST`
- Auth/middleware checks at top: `FOUND`
```ts
  const secret = process.env.VAPI_WEBHOOK_SECRET
  if (secret && signature) {
    const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedB64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
  if (secret && !signature) {
    console.warn('[VAPI WEBHOOK] VAPI_WEBHOOK_SECRET set but no x-vapi-signature header. Accepting request â€” disable this once Vapi sends signatures.')
  if (!secret && signature) {
    console.warn('[VAPI WEBHOOK] x-vapi-signature header present but VAPI_WEBHOOK_SECRET unset. Configure secret to enable validation.')
    console.warn('[VAPI WEBHOOK] No signature validation â€” VAPI_WEBHOOK_SECRET unset')
```
#### POST handler first 15 lines
```ts
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    const signatureError = validateVapiSignature(request, rawBody)
    if (signatureError) return signatureError

    const parsed = parseWebhookPayload(rawBody)
    const toolNames = summarizeToolCalls(parsed.toolCalls)

    console.log('[VAPI WEBHOOK] type:', parsed.raw?.message?.type || parsed.raw?.type)
    if (parsed.type === 'end-of-call-report') {
      console.log('[VAPI WEBHOOK] end-of-call payload (first 2000 chars):', rawBody.substring(0, 2000))
    }

```

## Section 6 — Page route map (App Router)
### `app/(admin)/ai-operations/page.tsx`
- URL path: `/ai-operations`
- Default export name: `export default function Page({`
- Component mode: `server component`
- File size: 81 lines
#### Top-level component imports
```tsx
import { Suspense } from 'react'
import { AIOperationsSection } from '@/app/sections/AIOperationsSection'
import { Skeleton } from '@/components/ui/skeleton'
```
### `app/(admin)/analytics/page.tsx`
- URL path: `/analytics`
- Default export name: `export default async function AnalyticsPage({`
- Component mode: `server component`
- File size: 30 lines
#### Top-level component imports
```tsx
import { getKPIs, getFunnel, getCallsPerAgent, getTopPerformingAgent } from '@/lib/services/analyticsService'
import { AnalyticsSection } from '@/app/sections/AnalyticsSection'
import type { AnalyticsRange } from '@/lib/services/analyticsService'
```
### `app/(admin)/appointments/page.tsx`
- URL path: `/appointments`
- Default export name: `export default async function AppointmentsPage() {`
- Component mode: `server component`
- File size: 41 lines
#### Top-level component imports
```tsx
import clientPromise from '@/lib/mongodb'
import { appointmentService } from '@/lib/services/appointmentService'
import { AppointmentsSection } from '@/app/sections/AppointmentsSection'
```
### `app/(admin)/calls/page.tsx`
- URL path: `/calls`
- Default export name: `export default async function CallsPage() {`
- Component mode: `server component`
- File size: 13 lines
#### Top-level component imports
```tsx
import { callService } from '@/lib/services/callService'
import { CallLogsSection } from '@/app/sections/CallLogsSection'
```
### `app/(admin)/campaigns/[id]/page.tsx`
- URL path: `/campaigns/[id]`
- Default export name: `export default async function CampaignDetailPage({ params }: Props) {`
- Component mode: `server component`
- File size: 151 lines
#### Top-level component imports
```tsx
import { notFound } from 'next/navigation'
import { ObjectId } from 'mongodb'
import { requireSession } from '@/lib/auth'
import { getCollection } from '@/lib/mongodb'
import { CampaignDetailSection } from '@/app/sections/CampaignDetailSection'
```
### `app/(admin)/campaigns/page.tsx`
- URL path: `/campaigns`
- Default export name: `export default async function CampaignsPage() {`
- Component mode: `server component`
- File size: 20 lines
#### Top-level component imports
```tsx
import { CampaignsSection } from '@/app/sections/CampaignsSection'
import { campaignService } from '@/lib/services/campaignService'
```
### `app/(admin)/clients/page.tsx`
- URL path: `/clients`
- Default export name: `export default async function ClientsPage({`
- Component mode: `server component`
- File size: 17 lines
#### Top-level component imports
```tsx
import { clientService } from '@/lib/services/clientService';
import { ClientsSection } from '@/app/sections/ClientsSection';
```
### `app/(admin)/help/page.tsx`
- URL path: `/help`
- Default export name: `export default async function HelpPage() {`
- Component mode: `server component`
- File size: 88 lines
#### Top-level component imports
```tsx
import { PlatformShortcut } from '@/components/HelpNav'
import { auth } from '@/lib/auth'
```
### `app/(admin)/kb/page.tsx`
- URL path: `/kb`
- Default export name: `export default async function KBPage() {`
- Component mode: `server component`
- File size: 9 lines
#### Top-level component imports
```tsx
import { builderKBService } from '@/lib/builderKBService'
import { KnowledgeBaseSection } from '@/app/sections/KnowledgeBaseSection'
```
### `app/(admin)/leads/page.tsx`
- URL path: `/leads`
- Default export name: `export default async function LeadsPage() {`
- Component mode: `server component`
- File size: 20 lines
#### Top-level component imports
```tsx
import { LeadsWorkspace } from '@/components/leads/LeadsWorkspace'
import { leadService } from '@/lib/services/leadService'
```
### `app/(admin)/page.tsx`
- URL path: `/`
- Default export name: `export default async function AdminDashboardPage() {`
- Component mode: `server component`
- File size: 10 lines
#### Top-level component imports
```tsx
import { DashboardSection } from '@/app/sections/DashboardSection'
import { getDashboardData } from '@/lib/services/dashboardService'
```
### `app/(admin)/properties/page.tsx`
- URL path: `/properties`
- Default export name: `export default async function PropertiesPage({`
- Component mode: `server component`
- File size: 17 lines
#### Top-level component imports
```tsx
import { PropertiesSection } from '@/app/sections/PropertiesSection'
import { propertyService, type PropertyStatusFilter } from '@/lib/services/propertyService'
```
### `app/(admin)/settings/page.tsx`
- URL path: `/settings`
- Default export name: `export default async function SettingsPage() {`
- Component mode: `server component`
- File size: 9 lines
#### Top-level component imports
```tsx
import { getSystemConfig } from '@/lib/services/systemConfigService'
import { SettingsSection } from '@/app/sections/SettingsSection'
```
### `app/(admin)/settings/users/page.tsx`
- URL path: `/settings/users`
- Default export name: `export default async function UserManagementPage({`
- Component mode: `server component`
- File size: 51 lines
#### Top-level component imports
```tsx
import { requireRole } from '@/lib/auth'
import { userService } from '@/lib/services/userService'
import { UserManagementSection } from '@/app/sections/UserManagementSection'
```
### `app/auth/signin/page.tsx`
- URL path: `/auth/signin`
- Default export name: `export default async function SignInPage({`
- Component mode: `server component`
- File size: 237 lines
#### Top-level component imports
```tsx
import { auth, signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDefaultLanding } from '@/lib/auth/roles'
import type { UserRole } from '@/models/User'
```
### `app/auth/suspended/page.tsx`
- URL path: `/auth/suspended`
- Default export name: `export default async function SuspendedPage() {`
- Component mode: `server component`
- File size: 219 lines
#### Top-level component imports
```tsx
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
```
### `app/welcome/page.tsx`
- URL path: `/welcome`
- Default export name: `export default async function WelcomePage() {`
- Component mode: `server component`
- File size: 224 lines
#### Top-level component imports
```tsx
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getDefaultLanding } from '@/lib/auth/roles'
import type { UserRole } from '@/models/User'
```

## Section 7 — Service layer
### `lib/services/agentDashboardService.ts`
- `lib/services/agentDashboardService.ts:415`
```ts
export async function getAgentSummaries(): Promise<AgentDashboardSummary[]> {
```
- `lib/services/agentDashboardService.ts:475`
```ts
export async function getRecentRuns(limit: number = 8): Promise<AgentDashboardRun[]> {
```
- `lib/services/agentDashboardService.ts:515`
```ts
export async function listActivityRuns(options: {
```
- `lib/services/agentDashboardService.ts:544`
```ts
export async function getRunDetail(runId: string): Promise<AgentDashboardRun | null> {
```
- `lib/services/agentDashboardService.ts:583`
```ts
export async function getHealthStrip(): Promise<HealthStripData> {
```
### `lib/services/analyticsService.ts`
- `lib/services/analyticsService.ts:64`
```ts
export async function getKPIs(range: AnalyticsRange = '7d'): Promise<AnalyticsKPIs> {
```
- `lib/services/analyticsService.ts:130`
```ts
export async function getFunnel(range: AnalyticsRange = '7d'): Promise<AnalyticsFunnel> {
```
- `lib/services/analyticsService.ts:161`
```ts
export async function getCallsPerAgent(range: AnalyticsRange = '7d'): Promise<CallsPerAgentPoint[]> {
```
- `lib/services/analyticsService.ts:218`
```ts
export async function getTopPerformingAgent(range: AnalyticsRange = '7d'): Promise<TopPerformingAgent | null> {
```
### `lib/services/appointmentService.ts`
- `lib/services/appointmentService.ts:95`
```ts
export const appointmentService = {
```
### `lib/services/callService.ts`
- `lib/services/callService.ts:115`
```ts
export async function phoneHasRecentOutboundCall(phone: string, withinMinutes = 240): Promise<boolean> {
```
- `lib/services/callService.ts:134`
```ts
export async function leadHasRecentOutboundCall(
  leadId: ObjectId,
  withinMinutes = 240,
  options?: { source?: 'matchmaker' | 'campaign' | 'follow_up_callback' | 'appointment_reminder' | 're_engager'; floor?: Date }
): Promise<boolean> {
```
- `lib/services/callService.ts:203`
```ts
export const callService = {
```
### `lib/services/campaignService.ts`
- `lib/services/campaignService.ts:86`
```ts
export const campaignService = {
```
### `lib/services/clientService.ts`
- `lib/services/clientService.ts:12`
```ts
export const clientService = {
```
- `lib/services/clientService.ts:94`
```ts
export async function softDeleteClientCascade(
  clientId: string,
  brokerId: string
): Promise<{
```
### `lib/services/dashboardService.ts`
- `lib/services/dashboardService.ts:145`
```ts
export async function getDashboardData(): Promise<DashboardData> {
```
### `lib/services/leadService.ts`
- `lib/services/leadService.ts:74`
```ts
export const leadService = {
```
- `lib/services/leadService.ts:170`
```ts
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
```
### `lib/services/propertyService.ts`
- `lib/services/propertyService.ts:68`
```ts
export const propertyService = {
```
- `lib/services/propertyService.ts:193`
```ts
export async function softDeletePropertyCascade(
  propertyId: string
): Promise<{ ok: boolean; leads_unmatched: number; error?: string }> {
```
### `lib/services/sidebarCountsService.ts`
- `lib/services/sidebarCountsService.ts:4`
```ts
export async function getSidebarCounts(): Promise<{
```
### `lib/services/systemConfigService.ts`
- `lib/services/systemConfigService.ts:53`
```ts
export async function getSystemConfig(): Promise<SystemConfig> {
```
- `lib/services/systemConfigService.ts:72`
```ts
export async function updateSystemConfig(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
```
### `lib/services/userService.ts`
- `lib/services/userService.ts:158`
```ts
export const userService = {
```
### Full body `leadHasRecentOutboundCall` - `lib/services/callService.ts:134`
```ts
export async function leadHasRecentOutboundCall(
  leadId: ObjectId, 
  withinMinutes = 240,
  options?: { source?: 'matchmaker' | 'campaign' | 'follow_up_callback' | 'appointment_reminder' | 're_engager'; floor?: Date }
```
### Full body `phoneHasRecentOutboundCall` - `lib/services/callService.ts:115`
```ts
export async function phoneHasRecentOutboundCall(phone: string, withinMinutes = 240): Promise<boolean> {
  if (!phone || withinMinutes <= 0) return false

  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
  const collection = await getCollection()
  const count = await collection.countDocuments({
    direction: 'outbound',
    superseded: { $ne: true },
    created_at: { $gte: cutoff },
    $or: [
      { customer_number: phone } as any,
      { to_number: phone } as any,
      { lead_phone: phone } as any,
    ],
  })

  return count > 0
}
```
### Full body `listAll` - `lib/services/leadService.ts:94`
```ts
  async listAll(): Promise<SerializedLead[]> {
    const collection = await getCollection()
    const leads = await collection
      .find({ is_deleted: { $ne: true } })
      .sort({ next_follow_up_date: 1, created_at: -1 })
      .toArray()
    return leads.map(serializeLead)
  },
```

## Section 8 — Vapi integration layer
### `app/api/vapi/webhook/route.ts`
- Export `app/api/vapi/webhook/route.ts:10`
```ts
export const dynamic = 'force-dynamic'

type VapiToolCall = {
```
- Export `app/api/vapi/webhook/route.ts:203`
```ts
export async function POST(request: NextRequest) {
```
### `docs/VAPI_ASSISTANTS_SETUP.md`
### `lib/vapi/callReportHandler.ts`
- Export `lib/vapi/callReportHandler.ts:101`
```ts
export async function handleEndOfCallReport(payload: any, ctx: AgentRunContext) {
```
#### Vapi references
```ts
    assistantId: call?.assistantId || msg?.assistantId || payload?.assistantId || '',
      const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
  const { callId, assistantId, customerPhone, customerName, duration, endedReason } = extractCallData(payload)
    agent_id: assistantId || '',
```
### `lib/vapi/toolRouter.ts`
- Export `lib/vapi/toolRouter.ts:12`
```ts
export async function dispatchTool(
  toolName: string,
  args: Record<string, any>,
  ctx: AgentRunContext
) {
```
### `lib/vapi/tools/bookAppointment.ts`
- Export `lib/vapi/tools/bookAppointment.ts:107`
```ts
export async function bookAppointmentTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/calculateAffordability.ts`
- Export `lib/vapi/tools/calculateAffordability.ts:3`
```ts
export async function calculateAffordabilityTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/cancelAppointment.ts`
- Export `lib/vapi/tools/cancelAppointment.ts:5`
```ts
export async function appointmentCancelTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/confirmAppointment.ts`
- Export `lib/vapi/tools/confirmAppointment.ts:5`
```ts
export async function appointmentConfirmTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/markDnd.ts`
- Export `lib/vapi/tools/markDnd.ts:3`
```ts
export async function markDndTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/qualifyLead.ts`
- Export `lib/vapi/tools/qualifyLead.ts:18`
```ts
export async function qualifyLeadTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/rescheduleAppointment.ts`
- Export `lib/vapi/tools/rescheduleAppointment.ts:16`
```ts
export async function appointmentRescheduleTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/scheduleCallback.ts`
- Export `lib/vapi/tools/scheduleCallback.ts:81`
```ts
export async function scheduleCallbackTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapi/tools/searchProperties.ts`
- Export `lib/vapi/tools/searchProperties.ts:10`
```ts
export async function searchPropertiesTool(args: Record<string, any>, ctx: AgentRunContext) {
```
### `lib/vapiClient.ts`
- Export `lib/vapiClient.ts:65`
```ts
export async function triggerOutboundCall(
  params: TriggerCallParams,
  opts?: { logHook?: VapiLogHook }
): Promise<VapiCallResponse> {
```
- Export `lib/vapiClient.ts:215`
```ts
export async function triggerCampaignCall(lead: {
```
- Export `lib/vapiClient.ts:252`
```ts
export async function triggerReminderCall(params: {
```
- Export `lib/vapiClient.ts:275`
```ts
export async function triggerCallbackCall(params: {
```
- Export `lib/vapiClient.ts:301`
```ts
export async function getCallDetails(callId: string, opts?: { logHook?: VapiLogHook }) {
```
#### Vapi references
```ts
  assistantId: string
 * Uses assistantId to reference a pre-configured Vapi assistant (NOT inline assistant).
  const endpoint = 'https://api.vapi.ai/call/phone'
  if (!params.assistantId) {
      error: { message: 'assistantId is missing', name: 'ValidationError' },
      assistantId: params.assistantId,
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
    const finalVariableValues = {
    body.assistantOverrides = {
      variableValues: finalVariableValues,
        assistantId: params.assistantId,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
      if (errorText.includes('assistantId must be a UUID')) {
  const assistantId = process.env.VAPI_ASSISTANT_OUTBOUND_ID
  if (!assistantId) {
    assistantId,
  const assistantId = process.env.VAPI_ASSISTANT_REMINDER_ID
  if (!assistantId) {
    assistantId,
  const assistantId = callbackId || reminderId
  if (!assistantId) {
    assistantId,
  const endpoint = `https://api.vapi.ai/call/${callId}`
```
### Webhook handler full body
```ts
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import type { AgentRunContext } from '@/lib/runAgent'
import { getCollection } from '@/lib/mongodb'
import { runAgent } from '@/lib/runAgent'
import { handleEndOfCallReport } from '@/lib/vapi/callReportHandler'
import { dispatchTool } from '@/lib/vapi/toolRouter'

export const dynamic = 'force-dynamic'

type VapiToolCall = {
  id?: string
  function?: {
    name?: string
    arguments?: string | Record<string, any>
  }
}

type ParsedWebhookPayload = {
  raw: any
  type: string
  toolCalls: VapiToolCall[]
  callId?: string
}

const RUN_LOGGABLE_EVENTS = new Set(['function-call', 'tool-calls', 'end-of-call-report'])

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer)
}

function validateVapiSignature(request: NextRequest, rawBody: string) {
  const secret = process.env.VAPI_WEBHOOK_SECRET
  const signature = request.headers.get('x-vapi-signature')

  if (secret && signature) {
    const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedB64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
    const sigStripped = signature.trim().replace(/^sha256=/, '')
    const matchesHex = safeCompare(sigStripped, expectedHex)
    const matchesB64 = safeCompare(sigStripped, expectedB64)

    if (!matchesHex && !matchesB64) {
      console.error('[VAPI WEBHOOK] Signature mismatch â€” rejecting request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    return null
  }

  if (secret && !signature) {
    console.warn('[VAPI WEBHOOK] VAPI_WEBHOOK_SECRET set but no x-vapi-signature header. Accepting request â€” disable this once Vapi sends signatures.')
    return null
  }

  if (!secret && signature) {
    console.warn('[VAPI WEBHOOK] x-vapi-signature header present but VAPI_WEBHOOK_SECRET unset. Configure secret to enable validation.')
    return null
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[VAPI WEBHOOK] No signature validation â€” VAPI_WEBHOOK_SECRET unset')
  }

  return null
}

function normalizeType(payload: any) {
  const rawType = payload?.type || payload?.message?.type || ''
  if (rawType === 'tool-calls') return 'function-call'
  return String(rawType)
}

function extractCallId(payload: any) {
  return (
    payload?.callId ||
    payload?.call?.id ||
    payload?.message?.callId ||
    payload?.message?.call?.id ||
    payload?.message?.artifact?.callId ||
    payload?.artifact?.callId ||
    undefined
  )
}

function parseWebhookPayload(rawBody: string): ParsedWebhookPayload {
  const payload = JSON.parse(rawBody)
  return {
    raw: payload,
    type: normalizeType(payload),
    toolCalls: payload?.toolCalls || payload?.message?.toolCalls || [],
    callId: extractCallId(payload),
  }
}

function summarizeToolCalls(toolCalls: VapiToolCall[]) {
  return toolCalls
    .map((toolCall) => toolCall.function?.name)
    .filter((name): name is string => Boolean(name))
}

async function handleTranscriptEvent(ctx: AgentRunContext, payload: any) {
  const callId = extractCallId(payload)
  const transcript =
    payload?.transcript ||
    payload?.message?.transcript ||
    payload?.artifact?.transcript ||
    payload?.message?.artifact?.transcript

  await ctx.think('evaluation', `Received transcript event for ${callId || 'unknown_call'}.`)

  if (!callId || !transcript) {
    return { success: true, message: 'Transcript event acknowledged' }
  }

  const existingCall = await ctx.db.findOne('calls', { vapi_call_id: callId })
  if (existingCall?._id) {
    await ctx.db.updateOne(
      'calls',
      { _id: existingCall._id },
      { $set: { transcript, updated_at: new Date() } }
    )
    await ctx.act('transcript_saved', `Updated transcript for call ${callId}`, {
      parameters: { call_id: callId },
      result: { transcript_saved: true },
    })
  }

  return { success: true, message: 'Transcript processed' }
}

async function handleStatusUpdateEvent(ctx: AgentRunContext, payload: any) {
  const callId = extractCallId(payload)
  const status =
    payload?.status ||
    payload?.message?.status ||
    payload?.call?.status ||
    payload?.message?.call?.status

  await ctx.think('evaluation', `Received status update ${status || 'unknown'} for ${callId || 'unknown_call'}.`)

  if (!callId || !status) {
    return { success: true, message: 'Status update acknowledged' }
  }

  const existingCall = await ctx.db.findOne('calls', { vapi_call_id: callId })
  if (existingCall?._id) {
    await ctx.db.updateOne(
      'calls',
      { _id: existingCall._id },
      { $set: { call_status: status, updated_at: new Date() } }
    )
    await ctx.act('status_updated', `Updated call ${callId} to ${status}`, {
      parameters: { call_id: callId, status },
      result: { call_status: status },
    })
  }

  return { success: true, message: 'Status update processed' }
}

async function persistStatusUpdateWithoutRun(payload: any) {
  const callId = extractCallId(payload)
  const status =
    payload?.status ||
    payload?.message?.status ||
    payload?.call?.status ||
    payload?.message?.call?.status

  if (!callId || !status) {
    return
  }

  const calls = await getCollection('calls')
  await calls.updateOne(
    { vapi_call_id: callId },
    { $set: { call_status: status, updated_at: new Date() } }
  )
}

async function persistTranscriptWithoutRun(payload: any) {
  const callId = extractCallId(payload)
  const transcript =
    payload?.transcript ||
    payload?.message?.transcript ||
    payload?.artifact?.transcript ||
    payload?.message?.artifact?.transcript

  if (!callId || !transcript) {
    return
  }

  const calls = await getCollection('calls')
  await calls.updateOne(
    { vapi_call_id: callId },
    { $set: { transcript, updated_at: new Date() } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    const signatureError = validateVapiSignature(request, rawBody)
    if (signatureError) return signatureError

    const parsed = parseWebhookPayload(rawBody)
    const toolNames = summarizeToolCalls(parsed.toolCalls)

    console.log('[VAPI WEBHOOK] type:', parsed.raw?.message?.type || parsed.raw?.type)
    if (parsed.type === 'end-of-call-report') {
      console.log('[VAPI WEBHOOK] end-of-call payload (first 2000 chars):', rawBody.substring(0, 2000))
    }

    if (!RUN_LOGGABLE_EVENTS.has(parsed.type)) {
      console.log('[VAPI EVENT]', parsed.type, parsed.callId)

      if (parsed.type === 'status-update') {
        await persistStatusUpdateWithoutRun(parsed.raw)
        return NextResponse.json({ success: true, message: 'Status update processed' })
      }

      if (parsed.type === 'transcript') {
        await persistTranscriptWithoutRun(parsed.raw)
        return NextResponse.json({ success: true, message: 'Transcript processed' })
      }

      return NextResponse.json({ success: true, message: `Unhandled webhook type: ${parsed.type || 'unknown'}` })
    }

    const { output } = await runAgent({
      agentId: 'voice_orchestrator',
      agentName: 'Voice Orchestrator',
      trigger: 'event',
      input: {
        webhook_type: parsed.type,
        call_id: parsed.callId,
        tool_names: toolNames,
      },
      metadata: {
        source: 'vapi_webhook',
        webhook_type: parsed.type,
      },
      handler: async (ctx) => {
        await ctx.think(
          'evaluation',
          `Routing Vapi webhook type ${parsed.type || 'unknown'} for ${parsed.callId || 'unknown_call'}.`,
          { metadata: { tool_count: parsed.toolCalls.length } }
        )

        switch (parsed.type) {
          case 'function-call': {
            await ctx.think(
              'decision',
              toolNames.length > 0
                ? `Dispatching ${toolNames.length} tool call(s): ${toolNames.join(', ')}.`
                : 'Function-call event received with no tool calls.'
            )

            const results = []
            for (const toolCall of parsed.toolCalls) {
              const toolName = toolCall.function?.name || 'unknown_tool'
              let result: Record<string, any>

              try {
                const args = typeof toolCall.function?.arguments === 'string'
                  ? JSON.parse(toolCall.function.arguments)
                  : toolCall.function?.arguments || {}
                const argsWithCallContext = {
                  ...args,
                  __vapi_call_id: parsed.callId,
                }

                await ctx.act('tool_dispatch', `Dispatching Vapi tool ${toolName}`, {
                  parameters: { tool_name: toolName, tool_call_id: toolCall.id, args: argsWithCallContext },
                })

                result = await dispatchTool(toolName, argsWithCallContext, ctx)
              } catch (toolError: any) {
                const message = typeof toolError?.message === 'string' ? toolError.message : `Tool ${toolName} failed`
                await ctx.act('tool_dispatch_failed', `Vapi tool ${toolName} failed`, {
                  parameters: { tool_name: toolName, tool_call_id: toolCall.id },
                  error: message,
                })
                result = { error: message }
              }

              results.push({
                toolCallId: toolCall.id || toolName,
                result,
              })
            }

            return { results }
          }

          case 'end-of-call-report': {
            await ctx.think('decision', 'Processing end-of-call-report and persisting call artifacts.')
            return await handleEndOfCallReport(parsed.raw, ctx)
          }

          case 'status-update':
            return await handleStatusUpdateEvent(ctx, parsed.raw)

          case 'transcript':
            return await handleTranscriptEvent(ctx, parsed.raw)

          default:
            await ctx.think('result_analysis', `Unhandled Vapi webhook type ${parsed.type || 'unknown'} acknowledged.`)
            return { success: true, message: `Unhandled webhook type: ${parsed.type || 'unknown'}` }
        }
      },
    })

    return NextResponse.json(output || { success: true })
  } catch (error: any) {
    console.error('[VAPI WEBHOOK] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: typeof error?.message === 'string' ? error.message : 'Vapi webhook failed',
        runId: error?.runId,
      },
      { status: 500 }
    )
  }
}
```
### Vapi voice tool endpoints
NOT FOUND

## Section 9 — Cron entry points (web side)
### `app/api/cron/archive/route.ts`
- Auth-check pattern: `Bearer token`
#### Service/function call references
```ts
 * Automatic Call Archive Cron Job
 * Runs daily to archive calls older than 30 days
import { callArchiveService } from '@/lib/callArchiveService'
async function handleArchiveCron(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    const archiveDaysOld = parseInt(process.env.ARCHIVE_DAYS_OLD || '30')
    const archive = await callArchiveService.archiveClosedCalls(archiveDaysOld)
    if (!archive) {
        agent_name: 'Call Archive Service',
        action: `Scan complete. No calls older than ${archiveDaysOld} days found.`,
        message: 'No calls to archive',
        archived_count: 0,
      agent_name: 'Call Archive Service',
      action: `Automatically archived ${archive.metadata.total_calls} calls to blob storage.`,
        archive_id: archive.archive_id,
        blob_url: archive.blob_info.blob_url,
        total_calls: archive.metadata.total_calls,
      message: 'Archive created successfully',
      archived_count: archive.metadata.total_calls,
      archive_id: archive.archive_id,
      blob_url: archive.blob_info.blob_url,
    console.error('[API/Cron/Archive] Error:', error)
      agent_name: 'Call Archive Service',
      action: `Archive job failed: ${errorMsg}`,
  return handleArchiveCron(request)
  return handleArchiveCron(request)
```
#### Full handler body
```ts
/**
 * Automatic Call Archive Cron Job
 * Runs daily to archive calls older than 30 days
 */

import { NextRequest, NextResponse } from 'next/server'
import { callArchiveService } from '@/lib/callArchiveService'
import { getCollection } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

async function handleArchiveCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const archiveDaysOld = parseInt(process.env.ARCHIVE_DAYS_OLD || '30')

    const archive = await callArchiveService.archiveClosedCalls(archiveDaysOld)

    if (!archive) {
      const agentLogsCollection = await getCollection('agent_logs')
      await agentLogsCollection.insertOne({
        agent_name: 'Call Archive Service',
        action: `Scan complete. No calls older than ${archiveDaysOld} days found.`,
        status: 'success',
        created_at: new Date(),
      })

      return NextResponse.json({
        success: true,
        message: 'No calls to archive',
        archived_count: 0,
      })
    }

    const agentLogsCollection = await getCollection('agent_logs')
    await agentLogsCollection.insertOne({
      agent_name: 'Call Archive Service',
      action: `Automatically archived ${archive.metadata.total_calls} calls to blob storage.`,
      status: 'success',
      created_at: new Date(),
      details: {
        archive_id: archive.archive_id,
        blob_url: archive.blob_info.blob_url,
        total_calls: archive.metadata.total_calls,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Archive created successfully',
      archived_count: archive.metadata.total_calls,
      archive_id: archive.archive_id,
      blob_url: archive.blob_info.blob_url,
    })
  } catch (error) {
    console.error('[API/Cron/Archive] Error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Server error'

    const agentLogsCollection = await getCollection('agent_logs')
    await agentLogsCollection.insertOne({
      agent_name: 'Call Archive Service',
      action: `Archive job failed: ${errorMsg}`,
      status: 'failed',
      created_at: new Date(),
    })

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleArchiveCron(request)
}

export async function POST(request: NextRequest) {
  return handleArchiveCron(request)
}
```
### `app/api/cron/campaign-sweep/route.ts`
- Auth-check pattern: `Bearer token`
#### Service/function call references
```ts
// Campaign Sweep Cron â€” Phase 9.5
// POST /api/cron/campaign-sweep  |  Secured by x-cron-secret header
const CRON_SECRET = process.env.CRON_SECRET ?? ''
      { triggered_at: string },
      agentId: 'campaign_sweeper',
      agentName: 'Campaign Sweeper',
      trigger: 'cron',
      input: { triggered_at: new Date().toISOString() },
          // Fire Conductor (fire-and-forget â€” same pattern as campaignService.launch)
              console.error('[campaign-sweep] Conductor error for campaign', id, err)
    console.error('[campaign-sweep] Fatal error:', message)
```
#### Full handler body
```ts
// Campaign Sweep Cron â€” Phase 9.5
// POST /api/cron/campaign-sweep  |  Secured by x-cron-secret header
//
// Finds campaigns with status='deferred' AND deferred_until <= now,
// resets each to 'queued', then fires runCampaignConductor for each.
//
// Phase 12 Azure schedule: every 30 min
// NCRONTAB: "0 0,30 * * * *" â€” requires WEBSITE_TIME_ZONE=India Standard Time


import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/runAgent'
import { runCampaignConductor } from '@/lib/agents/campaignConductor'
import type { CampaignStatus } from '@/models/Campaign'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function POST(req: NextRequest) {
  // Auth: x-cron-secret header or Authorization Bearer
  const incomingSecret =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    ''

  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAgent<
      { triggered_at: string },
      { re_queued: number; campaign_ids: string[]; summary: string }
    >({
      agentId: 'campaign_sweeper',
      agentName: 'Campaign Sweeper',
      trigger: 'cron',
      input: { triggered_at: new Date().toISOString() },

      handler: async (ctx) => {
        // â”€â”€ 1. Find deferred campaigns whose window has passed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await ctx.think(
          'evaluation',
          `Scanning for deferred campaigns with deferred_until <= ${new Date().toISOString()}`
        )

        const now = new Date()
        // Note: ctx.db.findMany passes the filter directly to MongoDB.
        // We access the campaigns collection via ctx.db for full audit logging.
        const deferredCampaigns = await ctx.db.findMany('campaigns', {
          status: 'deferred',
          deferred_until: { $lte: now },
        })

        await ctx.think(
          'decision',
          `Found ${deferredCampaigns.length} deferred campaign(s) ready to re-queue.`
        )

        if (deferredCampaigns.length === 0) {
          return {
            re_queued: 0,
            campaign_ids: [],
            summary: 'No deferred campaigns ready to re-queue.',
          }
        }

        // â”€â”€ 2. Reset each to 'queued' and fire Conductor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const reQueued: string[] = []

        for (const campaign of deferredCampaigns) {
          const id = String((campaign as any)._id)

          // Reset status to 'queued' and clear deferred_until in one atomic update.
          // ctx.db.updateOne passes the update document directly to MongoDB,
          // so $set + $unset compound ops are fully supported.
          await ctx.db.updateOne(
            'campaigns',
            { _id: (campaign as any)._id },
            {
              $set: {
                status: 'queued' as CampaignStatus,
                updated_at: new Date(),
              },
              $unset: { deferred_until: '' },
            }
          )

          // Fire Conductor (fire-and-forget â€” same pattern as campaignService.launch)
          queueMicrotask(() => {
            void runCampaignConductor(id).catch((err) => {
              console.error('[campaign-sweep] Conductor error for campaign', id, err)
            })
          })

          reQueued.push(id)
        }

        await ctx.think(
          'result_analysis',
          `Re-queued and fired Conductor for ${reQueued.length} campaign(s): [${reQueued.join(', ')}]`
        )

        return {
          re_queued: reQueued.length,
          campaign_ids: reQueued,
          summary: `Re-queued ${reQueued.length} deferred campaign(s) and fired Campaign Conductor for each.`,
        }
      },
    })

    return NextResponse.json({
      success: true,
      runId,
      re_queued: output?.re_queued ?? 0,
      campaign_ids: output?.campaign_ids ?? [],
      summary: output?.summary ?? '',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[campaign-sweep] Fatal error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
```
### `app/api/cron/follow-up/route.ts`
- Auth-check pattern: `Bearer token`
#### Service/function call references
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
async function handleFollowupCron(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
      agentName: 'The Follow-Up Agent',
      trigger: 'cron',
        cron_job: 'follow-up',
        trigger_time: new Date().toISOString(),
        await ctx.think('evaluation', `Scanning for due follow-ups. Current time: ${now.toISOString()}`, {
        const dueFollowUps = await ctx.db.findMany('leads', {
          status: 'follow_up',
          next_follow_up_date: { $lte: now },
        await ctx.think('evaluation', `Found ${dueFollowUps.length} leads due for follow-up`, {
          metadata: { leads_count: dueFollowUps.length },
        if (dueFollowUps.length === 0) {
            agent_name: 'The Follow-Up Agent',
            action: 'Scan complete. No follow-ups are due at this time.',
          return { triggered_calls: 0, total_scanned: 0, message: 'No due follow-ups' }
        let triggeredCount = 0
        for (const lead of dueFollowUps as any[]) {
            follow_up_count: lead.follow_up_count || 0,
          const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
          if (await leadHasRecentOutboundCall(new ObjectId(leadEvaluation.lead_id), cooldownMins, { source: 'follow_up_callback' })) {
            await ctx.act('cooldown_skip', `Skipping follow-up call for ${lead.name}`, {
            '[FOLLOWUP CRON] Calling lead',
            process.env.VAPI_ASSISTANT_REMINDER_ID?.substring(0, 8),
          // The matchmaker stores lead_id on calls as a string (not ObjectId),
            console.warn(`[follow-up cron] No matched_property_id found for lead ${lead._id} â€” callback will lack property context`)
          const result = await ctx.vapi.triggerCallbackCall({
            await ctx.act('outbound_call_trigger', `Triggered follow-up call for ${lead.name}`, {
              result: { vapi_call_id: result.callId, call_triggered: true },
              agent_name: 'Follow-Up Callback',
              agent_id: process.env.VAPI_ASSISTANT_CALLBACK_ID || process.env.VAPI_ASSISTANT_REMINDER_ID || 'system',
              campaign_id: 'auto-follow-up',
              call_type: 'follow_up_callback',
                $unset: { next_follow_up_date: '' },
              status: 'triggered',
            triggeredCount++
            await ctx.act('outbound_call_trigger', `Failed to trigger follow-up call for ${lead.name}`, {
              error: 'VAPI call trigger failed',
              reason: 'VAPI call trigger failed',
          `Successfully triggered ${triggeredCount} out of ${dueFollowUps.length} follow-up calls`,
          { confidence: 0.95, metadata: { triggered: triggeredCount, total: dueFollowUps.length } }
          agent_name: 'The Follow-Up Agent',
          action: `Scanned ${dueFollowUps.length} due follow-ups. Triggered ${triggeredCount} calls.`,
          triggered_calls: triggeredCount,
          total_scanned: dueFollowUps.length,
          message: `Triggered ${triggeredCount} follow-up calls`,
    if ((output as any)?.triggered_calls === 0 && (output as any)?.total_scanned === 0) {
      return NextResponse.json({ success: true, message: 'No due follow-ups found', triggered: 0, run_id: runId })
      triggered: (output as any).triggered_calls,
    console.error('[API/Cron/FollowUp] GET Error:', error)
    const runId = (error as any)?.runId
      { success: false, error: 'Failed to execute follow-up cron job', run_id: runId },
  return handleFollowupCron(request)
  return handleFollowupCron(request)
```
#### Full handler body
```ts
import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

async function handleFollowupCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }


    const { runId, output } = await runAgent({
      agentId: '69e8f709f89cad5d4b752d24',
      agentName: 'The Follow-Up Agent',
      trigger: 'cron',
      input: {
        cron_job: 'follow-up',
        trigger_time: new Date().toISOString(),
      },
      metadata: { cron_type: 'scheduled', frequency: 'hourly' },
      handler: async (ctx) => {
        const now = new Date()

        await ctx.think('evaluation', `Scanning for due follow-ups. Current time: ${now.toISOString()}`, {
          confidence: 1.0,
        })

        const dueFollowUps = await ctx.db.findMany('leads', {
          status: 'follow_up',
          dnd_status: { $ne: true },
          is_deleted: { $ne: true },
          next_follow_up_date: { $lte: now },
        })

        await ctx.think('evaluation', `Found ${dueFollowUps.length} leads due for follow-up`, {
          confidence: 1.0,
          metadata: { leads_count: dueFollowUps.length },
        })

        if (dueFollowUps.length === 0) {
          await ctx.db.insertOne('agent_logs', {
            agent_name: 'The Follow-Up Agent',
            action: 'Scan complete. No follow-ups are due at this time.',
            status: 'success',
            created_at: new Date(),
          })

          return { triggered_calls: 0, total_scanned: 0, message: 'No due follow-ups' }
        }

        let triggeredCount = 0
        const lead_details: any[] = []

        for (const lead of dueFollowUps as any[]) {
          const leadEvaluation = {
            lead_id: lead._id?.toString?.() || String(lead._id),
            lead_name: lead.name,
            status: lead.status,
            interest_level: lead.interest_level,
            budget_range: lead.budget_range,
            location_pref: lead.location_pref,
            follow_up_count: lead.follow_up_count || 0,
          }

          await ctx.think('evaluation', `Evaluating lead: ${lead.name} (ID: ${leadEvaluation.lead_id})`, {
            confidence: 0.95,
            metadata: leadEvaluation,
          })

          const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
          if (await leadHasRecentOutboundCall(new ObjectId(leadEvaluation.lead_id), cooldownMins, { source: 'follow_up_callback' })) {
            await ctx.act('cooldown_skip', `Skipping follow-up call for ${lead.name}`, {
              parameters: {
                lead_id: leadEvaluation.lead_id,
                reason: `Lead contacted within ${cooldownMins}m cooldown window`,
              },
            })
            lead_details.push({
              lead_id: leadEvaluation.lead_id,
              lead_name: lead.name,
              status: 'cooldown_skipped',
              reason: `Lead contacted within ${cooldownMins}m cooldown window`,
            })
            continue
          }

          console.log(
            '[FOLLOWUP CRON] Calling lead',
            lead._id?.toString?.() || String(lead._id),
            'with REMINDER assistant',
            process.env.VAPI_ASSISTANT_REMINDER_ID?.substring(0, 8),
          )

          const callsCol = await getCollection('calls')
          const propsCol = await getCollection('properties')

          // Z12: Resolve matched_property_id from multiple sources.
          // The matchmaker stores lead_id on calls as a string (not ObjectId),
          // so a direct query with lead._id (ObjectId) silently returns 0 results.
          // Defense-in-depth: try call inheritance with $or for both types,
          // then fall back to reading lead.matched_property_id directly.
          let inheritedPropertyId: string | null = null
          let inheritedPropertyTitle: string | null = null

          // Source 1: Look up most recent prior call's matched_property_id
          const priorCall = await callsCol.findOne(
            {
              $or: [
                { lead_id: lead._id },
                { lead_id: lead._id?.toString?.() || String(lead._id) },
              ],
              direction: 'outbound',
              matched_property_id: { $exists: true, $ne: null }
            },
            { sort: { created_at: -1 } }
          )

          if (priorCall) {
            inheritedPropertyId = priorCall.matched_property_id
            inheritedPropertyTitle = priorCall.matched_property_title || null
          }

          // Source 2 (fallback): Read directly from lead document
          if (!inheritedPropertyId && lead.matched_property_id) {
            inheritedPropertyId = lead.matched_property_id
            inheritedPropertyTitle = lead.matched_property_title || null
          }

          if (!inheritedPropertyId) {
            console.warn(`[follow-up cron] No matched_property_id found for lead ${lead._id} â€” callback will lack property context`)
          }

          // Fetch full property for location context
          const inheritedProperty = inheritedPropertyId
            ? await propsCol.findOne({ _id: new ObjectId(inheritedPropertyId.toString()), is_deleted: { $ne: true } })
            : null

          const result = await ctx.vapi.triggerCallbackCall({
            phone: lead.phone,
            name: lead.name,
            variables: {
              call_purpose: 'callback',
              customer_name: lead.name || 'there',
              property_type: lead.property_type || 'properties',
              location_pref: lead.location_pref || 'your preferred area',
              budget_range: lead.budget_range || '',
              prior_topic: lead.notes || 'properties you discussed earlier',
              matched_property_id: inheritedPropertyId || '',
              matched_property_title: inheritedPropertyTitle || inheritedProperty?.title || '',
              matched_property_location: inheritedProperty?.location || '',
            }
          })

          if (result.success) {
            await ctx.act('outbound_call_trigger', `Triggered follow-up call for ${lead.name}`, {
              parameters: { lead_id: leadEvaluation.lead_id, phone: lead.phone },
              result: { vapi_call_id: result.callId, call_triggered: true },
            })

            await ctx.db.insertOne('calls', {
              lead_id: leadEvaluation.lead_id,
              lead_name: lead.name,
              lead_phone: lead.phone,
              agent_name: 'Follow-Up Callback',
              agent_id: process.env.VAPI_ASSISTANT_CALLBACK_ID || process.env.VAPI_ASSISTANT_REMINDER_ID || 'system',
              campaign_id: 'auto-follow-up',
              direction: 'outbound',
              call_type: 'follow_up_callback',
              matched_property_id: inheritedPropertyId || null,
              matched_property_title: inheritedPropertyTitle || inheritedProperty?.title || null,
              duration: 0,
              disposition: 'queued',
              call_outcome: 'pending',
              vapi_call_id: result.callId,
              created_at: new Date(),
            })

            await ctx.db.updateOne(
              'leads',
              { _id: lead._id },
              {
                $set: { status: 'contacted', updated_at: new Date() },
                $unset: { next_follow_up_date: '' },
              }
            )

            lead_details.push({
              lead_id: leadEvaluation.lead_id,
              lead_name: lead.name,
              status: 'triggered',
              recommendation: 'Call queued for immediate execution',
            })

            triggeredCount++
          } else {
            await ctx.act('outbound_call_trigger', `Failed to trigger follow-up call for ${lead.name}`, {
              parameters: { lead_id: leadEvaluation.lead_id, phone: lead.phone },
              error: 'VAPI call trigger failed',
            })

            lead_details.push({
              lead_id: leadEvaluation.lead_id,
              lead_name: lead.name,
              status: 'failed',
              reason: 'VAPI call trigger failed',
            })
          }

          // Delay slightly between calls to avoid hitting Vapi rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        await ctx.think(
          'result_analysis',
          `Successfully triggered ${triggeredCount} out of ${dueFollowUps.length} follow-up calls`,
          { confidence: 0.95, metadata: { triggered: triggeredCount, total: dueFollowUps.length } }
        )

        await ctx.db.insertOne('agent_logs', {
          agent_name: 'The Follow-Up Agent',
          action: `Scanned ${dueFollowUps.length} due follow-ups. Triggered ${triggeredCount} calls.`,
          status: 'success',
          created_at: new Date(),
          details: lead_details,
        })

        return {
          triggered_calls: triggeredCount,
          total_scanned: dueFollowUps.length,
          lead_details,
          message: `Triggered ${triggeredCount} follow-up calls`,
        }
      },
    })

    if ((output as any)?.triggered_calls === 0 && (output as any)?.total_scanned === 0) {
      return NextResponse.json({ success: true, message: 'No due follow-ups found', triggered: 0, run_id: runId })
    }

    return NextResponse.json({
      success: true,
      message: (output as any).message,
      triggered: (output as any).triggered_calls,
      total_due: (output as any).total_scanned,
      run_id: runId,
    })

  } catch (error) {
    console.error('[API/Cron/FollowUp] GET Error:', error)

    const runId = (error as any)?.runId

    return NextResponse.json(
      { success: false, error: 'Failed to execute follow-up cron job', run_id: runId },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleFollowupCron(request)
}

export async function POST(request: NextRequest) {
  return handleFollowupCron(request)
}
```
### `app/api/cron/followups/route.ts`
- Auth-check pattern: `Bearer token`
#### Service/function call references
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { triggerCallbackCall } from '@/lib/vapiClient'
async function handleFollowupsCron(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    // Find leads where next_follow_up_date is in the past, and not yet contacted for this follow-up
    // We'll reset the next_follow_up_date once triggered so we don't spam them.
    const pendingFollowups = await leadsCollection.find({
      next_follow_up_date: { $lte: now, $ne: null }
    let triggeredCount = 0
    if (pendingFollowups.length === 0) {
        agent_name: 'The Follow-Up Agent',
        action: 'Scan complete. No pending followups are due at this time.',
      return NextResponse.json({ success: true, triggered: 0, message: 'No pending followups found.' })
    for (const lead of pendingFollowups) {
      console.log(`[Followup Cron] Triggering follow-up for lead ${lead.name} (${lead.phone})`)
      const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
      if (await leadHasRecentOutboundCall(lead._id, cooldownMins, { source: 'follow_up_callback' })) {
          agent_name: 'The Follow-Up Agent',
        '[FOLLOWUP CRON] Calling lead',
        process.env.VAPI_ASSISTANT_REMINDER_ID?.substring(0, 8),
      // The matchmaker stores lead_id on calls as a string (not ObjectId),
        console.warn(`[followups cron] No matched_property_id found for lead ${lead._id} â€” callback will lack property context`)
      const res = await triggerCallbackCall({
        triggeredCount++
        // Reset next_follow_up_date to prevent duplicate calls
          { $set: { next_follow_up_date: null, followup_reason: '' }, $inc: { follow_up_count: 1 } }
              call_type: 'follow_up_callback',
              agent_name: 'Follow-Up Callback',
              agent_id: process.env.VAPI_ASSISTANT_CALLBACK_ID || process.env.VAPI_ASSISTANT_REMINDER_ID || 'system',
              triggered_by: 'cron_followup',
            console.error('[CRON FOLLOWUP] Failed to log call:', (err as Error).message, 'lead_id:', lead._id.toString())
        console.error(`[Followup Cron] Failed to trigger call for ${lead.phone}: ${res.error}`)
      agent_name: 'The Follow-Up Agent',
      action: `Checked ${pendingFollowups.length} pending followups. Triggered ${triggeredCount} calls.`,
    return NextResponse.json({ success: true, triggered: triggeredCount, message: `Checked followups. Triggered ${triggeredCount} calls.` })
    console.error('[Followup Cron] Error:', error)
  return handleFollowupsCron(request)
  return handleFollowupsCron(request)
```
#### Full handler body
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { triggerCallbackCall } from '@/lib/vapiClient'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

async function handleFollowupsCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const leadsCollection = await getCollection('leads')
    const agentLogsCollection = await getCollection('agent_logs')
    const callsCol = await getCollection('calls')
    const now = new Date()

    // Find leads where next_follow_up_date is in the past, and not yet contacted for this follow-up
    // We'll reset the next_follow_up_date once triggered so we don't spam them.
    const pendingFollowups = await leadsCollection.find({
      is_deleted: { $ne: true },
      next_follow_up_date: { $lte: now, $ne: null }
    }).toArray()

    let triggeredCount = 0

    if (pendingFollowups.length === 0) {
      await agentLogsCollection.insertOne({
        agent_name: 'The Follow-Up Agent',
        action: 'Scan complete. No pending followups are due at this time.',
        status: 'success',
        created_at: new Date()
      })
      return NextResponse.json({ success: true, triggered: 0, message: 'No pending followups found.' })
    }

    for (const lead of pendingFollowups) {
      console.log(`[Followup Cron] Triggering follow-up for lead ${lead.name} (${lead.phone})`)
      const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
      if (await leadHasRecentOutboundCall(lead._id, cooldownMins, { source: 'follow_up_callback' })) {
        await agentLogsCollection.insertOne({
          agent_name: 'The Follow-Up Agent',
          action: `Cooldown skip for ${lead.name}: Lead contacted within ${cooldownMins}m cooldown window.`,
          status: 'success',
          created_at: new Date(),
        })
        continue
      }
      
      console.log(
        '[FOLLOWUP CRON] Calling lead',
        lead._id?.toString?.() || String(lead._id),
        'with REMINDER assistant',
        process.env.VAPI_ASSISTANT_REMINDER_ID?.substring(0, 8),
      )

      const propsCol = await getCollection('properties')

      // Z12: Resolve matched_property_id from multiple sources.
      // The matchmaker stores lead_id on calls as a string (not ObjectId),
      // so a direct query with lead._id (ObjectId) silently returns 0 results.
      // Defense-in-depth: try call inheritance with $or for both types,
      // then fall back to reading lead.matched_property_id directly.
      let inheritedPropertyId: string | null = null
      let inheritedPropertyTitle: string | null = null

      // Source 1: Look up most recent prior call's matched_property_id
      const priorCall = await callsCol.findOne(
        {
          $or: [
            { lead_id: lead._id },
            { lead_id: lead._id?.toString?.() || String(lead._id) },
          ],
          direction: 'outbound',
          matched_property_id: { $exists: true, $ne: null }
        },
        { sort: { created_at: -1 } }
      )

      if (priorCall) {
        inheritedPropertyId = priorCall.matched_property_id
        inheritedPropertyTitle = priorCall.matched_property_title || null
      }

      // Source 2 (fallback): Read directly from lead document
      if (!inheritedPropertyId && lead.matched_property_id) {
        inheritedPropertyId = lead.matched_property_id
        inheritedPropertyTitle = lead.matched_property_title || null
      }

      if (!inheritedPropertyId) {
        console.warn(`[followups cron] No matched_property_id found for lead ${lead._id} â€” callback will lack property context`)
      }

      // Fetch full property for location context
      const inheritedProperty = inheritedPropertyId
        ? await propsCol.findOne({ _id: new ObjectId(inheritedPropertyId.toString()), is_deleted: { $ne: true } })
        : null

      const res = await triggerCallbackCall({
        phone: lead.phone,
        name: lead.name,
        variables: {
          call_purpose: 'callback',
          customer_name: lead.name || 'there',
          property_type: lead.property_type || 'properties',
          location_pref: lead.location_pref || 'your preferred area',
          budget_range: lead.budget_range || '',
          prior_topic: lead.notes || 'properties you discussed earlier',
          matched_property_id: inheritedPropertyId || '',
          matched_property_title: inheritedPropertyTitle || inheritedProperty?.title || '',
          matched_property_location: inheritedProperty?.location || '',
        }
      })

      if (res.success) {
        triggeredCount++
        // Reset next_follow_up_date to prevent duplicate calls
        await leadsCollection.updateOne(
          { _id: lead._id },
          { $set: { next_follow_up_date: null, followup_reason: '' }, $inc: { follow_up_count: 1 } }
        )

        const resWithId = res as typeof res & { id?: string }
        const vapiCallId = res.callId || resWithId.id
        if (vapiCallId) {
          try {
            await callsCol.insertOne({
              lead_id: lead._id,
              lead_phone: lead.phone,
              vapi_call_id: vapiCallId,
              direction: 'outbound',
              call_type: 'follow_up_callback',
              matched_property_id: inheritedPropertyId || null,
              matched_property_title: inheritedPropertyTitle || inheritedProperty?.title || null,
              status: 'initiated',
              agent_name: 'Follow-Up Callback',
              agent_id: process.env.VAPI_ASSISTANT_CALLBACK_ID || process.env.VAPI_ASSISTANT_REMINDER_ID || 'system',
              triggered_by: 'cron_followup',
              created_at: new Date(),
              updated_at: new Date(),
            })
          } catch (err) {
            console.error('[CRON FOLLOWUP] Failed to log call:', (err as Error).message, 'lead_id:', lead._id.toString())
          }
        }
      } else {
        console.error(`[Followup Cron] Failed to trigger call for ${lead.phone}: ${res.error}`)
      }
    }

    await agentLogsCollection.insertOne({
      agent_name: 'The Follow-Up Agent',
      action: `Checked ${pendingFollowups.length} pending followups. Triggered ${triggeredCount} calls.`,
      status: 'success',
      created_at: new Date()
    })

    return NextResponse.json({ success: true, triggered: triggeredCount, message: `Checked followups. Triggered ${triggeredCount} calls.` })
  } catch (error) {
    console.error('[Followup Cron] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleFollowupsCron(request)
}

export async function POST(request: NextRequest) {
  return handleFollowupsCron(request)
}
```
### `app/api/cron/matchmaker/route.ts`
- Auth-check pattern: `x-cron-secret`
#### Service/function call references
```ts
import { runMatchmaker } from '@/lib/agents/matchmaker'
 * POST /api/cron/matchmaker
 * The Matchmaker â€” cron sweep every 30 min (Phase 3.5 will promote to event).
  const cronSecret = process.env.CRON_SECRET
    const { runId, output } = await runMatchmaker()
      calls_triggered: (output as any)?.calls_triggered ?? 0,
    console.error('[Cron/Matchmaker] Error:', error)
        runId: error?.runId,
        run_id: error?.runId,
        error: 'Matchmaker run failed',
```
#### Full handler body
```ts
import { NextRequest, NextResponse } from 'next/server'
import { runMatchmaker } from '@/lib/agents/matchmaker'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/matchmaker
 * The Matchmaker â€” cron sweep every 30 min (Phase 3.5 will promote to event).
 */
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runMatchmaker()

    return NextResponse.json({
      success: true,
      runId,
      matches_found: (output as any)?.matches_found ?? 0,
      calls_triggered: (output as any)?.calls_triggered ?? 0,
      summary: (output as any)?.summary ?? '',
    })

  } catch (error: any) {
    console.error('[Cron/Matchmaker] Error:', error)
    return NextResponse.json(
      {
        success: false,
        runId: error?.runId,
        run_id: error?.runId,
        error: 'Matchmaker run failed',
        detail: typeof error?.message === 'string' ? error.message : undefined,
      },
      { status: 200 }
    )
  }
}
```
### `app/api/cron/re-engage/route.ts`
- Auth-check pattern: `x-cron-secret`
#### Service/function call references
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
 * transcript, then triggers a Vapi outbound call.
  const cronSecret = process.env.CRON_SECRET
      trigger: 'cron',
        trigger_time: new Date().toISOString(),
            triggered_calls: 0,
        let triggeredCount = 0
          const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
          // Trigger Vapi outbound call via ctx.vapi
          const result = await ctx.vapi.triggerCampaignCall(
              agent_id: process.env.VAPI_ASSISTANT_OUTBOUND_ID || 'system',
            await ctx.act('reengagement_call_triggered', `Re-engagement call queued for ${lead.name}`, {
            lead_details.push({ lead_id: leadId, lead_name: lead.name, status: 'triggered', vapi_call_id: result.callId })
            triggeredCount++
          `Processed ${batch.length} dead leads. Successfully triggered ${triggeredCount} re-engagement call(s). ${batch.length - triggeredCount} failed or were skipped.`,
          { confidence: 0.95, metadata: { triggered: triggeredCount, total: batch.length } }
          triggered_calls: triggeredCount,
          summary: `Triggered ${triggeredCount} re-engagement call(s) for ${batch.length} dormant lead(s).`,
      triggered: (output as any)?.triggered_calls ?? 0,
      { success: false, error: 'Dead Lead Re-engager run failed', run_id: error?.runId },
```
#### Full handler body
```ts
import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/re-engage
 * The Dead Lead Re-engager â€” daily 10:00 IST
 * Finds leads with status 'cold' or 'not_interested' not contacted in 60+ days,
 * uses GPT-4o to build a personalised re-engagement context from the last call
 * transcript, then triggers a Vapi outbound call.
 */
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAgent({
      agentId: 'dead_lead_reengager',
      agentName: 'The Dead Lead Re-engager',
      trigger: 'cron',
      input: {
        cron_job: 're-engage',
        trigger_time: new Date().toISOString(),
      },
      metadata: { cron_type: 'scheduled', frequency: 'daily_10_IST' },

      handler: async (ctx) => {
        const now = new Date()
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        // â”€â”€ Step 1: evaluation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await ctx.think('evaluation',
          `Scanning for leads with status 'cold' or 'not_interested' whose last contact was on or before ${sixtyDaysAgo.toISOString()}. Limit 50 per run to stay within Vapi rate limits.`,
          { confidence: 1.0, metadata: { cutoff_date: sixtyDaysAgo.toISOString() } }
        )

        // Query uses last_contacted_at per spec; falls back to updated_at via
        // the $or so leads with neither field don't escape the net.
        const deadLeads = await ctx.db.findMany('leads', {
          dnd_status: { $ne: true },
          is_deleted: { $ne: true },
          status: { $in: ['cold', 'not_interested'] },
          $or: [
            { last_contacted_at: { $lte: sixtyDaysAgo } },
            { last_contacted_at: { $exists: false }, updated_at: { $lte: sixtyDaysAgo } },
          ],
        })

        // Slice in handler since ctx.db.findMany doesn't expose .limit()
        const batch = (deadLeads as any[]).slice(0, 50)

        // â”€â”€ Step 2: decision â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await ctx.think('decision',
          batch.length === 0
            ? 'No leads qualify for re-engagement today. Exiting cleanly.'
            : `Found ${batch.length} cold/not-interested lead(s) dormant for 60+ days. Will fetch last transcript for each and build GPT-4o re-engagement context before dialling.`,
          { confidence: 1.0, metadata: { leads_found: batch.length } }
        )

        if (batch.length === 0) {
          return {
            triggered_calls: 0,
            total_scanned: 0,
            summary: 'No dead leads eligible for re-engagement today.',
          }
        }

        let triggeredCount = 0
        const lead_details: Array<Record<string, any>> = []

        for (const lead of batch) {
          const leadId = String(lead._id)
          const leadObjectId = new ObjectId(leadId)

          // Fetch the last call transcript for this lead (most recent call first)
          const lastCallResults = await ctx.db.findMany('calls', {
            lead_id: leadId,
            transcript: { $exists: true, $ne: null },
          })

          const lastCall = (lastCallResults as any[]).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

          const transcriptSnippet = lastCall?.transcript
            ? String(lastCall.transcript).slice(0, 1200)
            : null

          // Build personalised re-engagement context via GPT-4o
          let reEngageContext = 'General friendly check-in â€” acknowledge previous conversation and ask if they are back in the market.'

          if (transcriptSnippet) {
            const gptResult = await ctx.openai.chat({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `You are a real-estate sales coach. Given a past call transcript, write a SHORT (2-3 sentence) re-engagement talking-point for a sales agent to use when calling this dormant lead again. Acknowledge their previous concern, note that circumstances may have changed, and keep tone warm and non-pushy. Return plain text only.`,
                },
                {
                  role: 'user',
                  content: `Lead name: ${lead.name}\nPrevious status: ${lead.status}\nLast call transcript excerpt:\n${transcriptSnippet}`,
                },
              ],
              temperature: 0.4,
              max_tokens: 200,
            })
            reEngageContext = gptResult.content.trim()
          }

          await ctx.act('context_built', `Re-engagement context ready for ${lead.name}`, {
            parameters: { lead_id: leadId, has_transcript: !!transcriptSnippet },
            result: { context_preview: reEngageContext.slice(0, 120) },
          })

          const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
          if (await leadHasRecentOutboundCall(leadObjectId, cooldownMins)) {
            await ctx.act('cooldown_skip', `Skipping re-engagement call for ${lead.name}`, {
              parameters: {
                lead_id: leadId,
                reason: `Lead contacted within ${cooldownMins}m cooldown window`,
              },
            })
            lead_details.push({
              lead_id: leadId,
              lead_name: lead.name,
              status: 'cooldown_skipped',
              reason: `Lead contacted within ${cooldownMins}m cooldown window`,
            })
            continue
          }

          // Trigger Vapi outbound call via ctx.vapi
          const result = await ctx.vapi.triggerCampaignCall(
            {
              phone: lead.phone,
              name: lead.name,
              budget_range: lead.budget_range,
              location_pref: lead.location_pref,
              property_type: lead.property_type,
              notes: lead.notes,
            },
            {
              campaign_name: 'Dead Lead Re-engagement',
              script_template: reEngageContext,
            }
          )

          if (result.success) {
            // Log the call record
            await ctx.db.insertOne('calls', {
              lead_id: leadId,
              lead_name: lead.name,
              lead_phone: lead.phone,
              agent_name: 'The Dead Lead Re-engager',
              agent_id: process.env.VAPI_ASSISTANT_OUTBOUND_ID || 'system',
              campaign_id: 'auto-re-engage',
              direction: 'outbound',
              call_type: 're_engagement',
              duration: 0,
              disposition: 'queued',
              call_outcome: 'pending',
              vapi_call_id: result.callId,
              created_at: new Date(),
            })

            // Stamp last_contacted_at so this lead doesn't re-qualify tomorrow
            await ctx.db.updateOne('leads', { _id: lead._id }, {
              $set: {
                last_contacted_at: now,
                updated_at: now,
                status: 'contacted',
              },
            })

            await ctx.act('reengagement_call_triggered', `Re-engagement call queued for ${lead.name}`, {
              parameters: { lead_id: leadId, phone: lead.phone },
              result: { vapi_call_id: result.callId },
            })

            lead_details.push({ lead_id: leadId, lead_name: lead.name, status: 'triggered', vapi_call_id: result.callId })
            triggeredCount++
          } else {
            await ctx.act('reengagement_call_failed', `Vapi call failed for ${lead.name}`, {
              parameters: { lead_id: leadId },
              error: result.error || 'vapi_error',
            })
            lead_details.push({ lead_id: leadId, lead_name: lead.name, status: 'failed', error: result.error })
          }

          // Rate-limit guard
          await new Promise((r) => setTimeout(r, 1000))
        }

        // â”€â”€ Step 3: result_analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await ctx.think('result_analysis',
          `Processed ${batch.length} dead leads. Successfully triggered ${triggeredCount} re-engagement call(s). ${batch.length - triggeredCount} failed or were skipped.`,
          { confidence: 0.95, metadata: { triggered: triggeredCount, total: batch.length } }
        )

        return {
          triggered_calls: triggeredCount,
          total_scanned: batch.length,
          lead_details,
          summary: `Triggered ${triggeredCount} re-engagement call(s) for ${batch.length} dormant lead(s).`,
        }
      },
    })

    return NextResponse.json({
      success: true,
      runId,
      triggered: (output as any)?.triggered_calls ?? 0,
      total_due: (output as any)?.total_scanned ?? 0,
      summary: (output as any)?.summary ?? '',
    })

  } catch (error: any) {
    console.error('[Cron/ReEngage] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Dead Lead Re-engager run failed', run_id: error?.runId },
      { status: 500 }
    )
  }
}
```
### `app/api/cron/reminders/route.ts`
- Auth-check pattern: `x-cron-secret`
#### Service/function call references
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
 * Finds appointments in the next 24 h with reminder_sent=false, triggers
  const cronSecret = process.env.CRON_SECRET
      trigger: 'cron',
        trigger_time: new Date().toISOString(),
            : `Found ${dueAppointments.length} appointment(s) requiring reminder calls. Will process each, skipping DND leads.`,
            triggered_calls: 0,
        let triggeredCount = 0
          // Trigger reminder call through ctx.vapi (auto-logged)
          const result = await ctx.vapi.triggerReminderCall({
              agent_id: process.env.VAPI_ASSISTANT_REMINDER_ID || 'system',
            await ctx.act('reminder_call_triggered', `Reminder call queued for ${lead.name} re: ${property.title}`, {
              result: { vapi_call_id: result.callId, call_triggered: true },
            call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'triggered', vapi_call_id: result.callId })
            triggeredCount++
          `Processed ${dueAppointments.length} appointments. Triggered ${triggeredCount} reminder calls. Skipped ${skippedDnd} DND leads.`,
          { confidence: 0.95, metadata: { triggered: triggeredCount, skipped_dnd: skippedDnd, total: dueAppointments.length } }
          triggered_calls: triggeredCount,
          summary: `Triggered ${triggeredCount} reminder call(s) out of ${dueAppointments.length} due appointment(s).`,
      triggered: (output as any)?.triggered_calls ?? 0,
      { success: false, error: 'Appointment Guardian run failed', run_id: error?.runId },
```
#### Full handler body
```ts
import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/runAgent'
import { ObjectId } from 'mongodb'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'

export const dynamic = 'force-dynamic'

function formatDateIST(d: Date): string {
  return new Date(d).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

function formatTimeIST(d: Date): string {
  return new Date(d).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * POST /api/cron/reminders
 * The Appointment Guardian â€” daily 09:00 IST
 * Finds appointments in the next 24 h with reminder_sent=false, triggers
 * the Vapi reminder assistant, then marks reminder_sent=true.
 */
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAgent({
      agentId: 'appointment_guardian',
      agentName: 'The Appointment Guardian',
      trigger: 'cron',
      input: {
        cron_job: 'reminders',
        trigger_time: new Date().toISOString(),
      },
      metadata: { cron_type: 'scheduled', frequency: 'daily_09_IST' },

      handler: async (ctx) => {
        const now = new Date()
        const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        // â”€â”€ Step 1: evaluation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await ctx.think('evaluation',
          `Scanning appointments between ${now.toISOString()} and ${windowEnd.toISOString()} where reminder_sent is false.`,
          { confidence: 1.0, metadata: { window_hours: 24 } }
        )

        const dueAppointments = await ctx.db.findMany('appointments', {
          status: 'scheduled',
          reminder_sent: { $ne: true },
          is_deleted: { $ne: true },
          scheduled_at: { $gte: now, $lte: windowEnd },
        })

        // â”€â”€ Step 2: decision â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await ctx.think('decision',
          dueAppointments.length === 0
            ? 'No appointments require reminders in the next 24 h. Exiting cleanly.'
            : `Found ${dueAppointments.length} appointment(s) requiring reminder calls. Will process each, skipping DND leads.`,
          { confidence: 1.0, metadata: { appointments_found: dueAppointments.length } }
        )

        if (dueAppointments.length === 0) {
          return {
            triggered_calls: 0,
            total_scanned: 0,
            summary: 'No upcoming appointments needed reminders.',
          }
        }

        let triggeredCount = 0
        let skippedDnd = 0
        const call_details: Array<Record<string, any>> = []
        const skippedReminders: Array<{ lead_id: string; reason: string }> = []

        for (const appt of dueAppointments as any[]) {
          // Fetch linked lead and property via ctx.db (logged automatically)
          const lead = appt.lead_id
            ? await ctx.db.findOne('leads', { _id: new ObjectId(String(appt.lead_id)) })
            : null
          const property = appt.property_id
            ? await ctx.db.findOne('properties', { _id: new ObjectId(String(appt.property_id)) })
            : null

          if (!lead || !property) {
            await ctx.act('reminder_skip', `Skipping appt ${appt._id} â€” missing lead or property`, {
              parameters: { appt_id: String(appt._id) },
              error: 'missing_lead_or_property',
            })
            call_details.push({ appt_id: String(appt._id), status: 'skipped', reason: 'missing_ref' })
            continue
          }

          if (lead.dnd_status === true) {
            skippedDnd++
            call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'skipped', reason: 'dnd' })
            continue
          }

          // Z14b: prevent duplicate reminder calls (30-min loop-prevention)
          const recentReminder = await leadHasRecentOutboundCall(
            lead._id,
            30,
            { source: 'appointment_reminder' }
          )
          if (recentReminder) {
            skippedReminders.push({
              lead_id: lead._id.toString(),
              reason: 'recent_reminder_within_30min'
            })
            continue  // skip to next lead in the loop
          }

          // Trigger reminder call through ctx.vapi (auto-logged)
          const result = await ctx.vapi.triggerReminderCall({
            phone: lead.phone,
            name: lead.name,
            variables: {
              call_purpose: 'appointment_reminder',
              customer_name: lead.name || 'there',
              property_title: property.title || 'the property',
              property_location: property.location || 'the address we shared',
              appointment_date: formatDateIST(appt.scheduled_at),
              appointment_time: formatTimeIST(appt.scheduled_at),
            }
          })

          if (result.success) {
            // Mark reminder sent
            await ctx.db.updateOne('appointments', { _id: appt._id }, {
              $set: { reminder_sent: true, reminder_call_id: result.callId, updated_at: new Date() },
            })

            // Log the call record
            await ctx.db.insertOne('calls', {
              lead_id: String(lead._id),
              lead_name: lead.name,
              lead_phone: lead.phone,
              agent_name: 'The Appointment Guardian',
              agent_id: process.env.VAPI_ASSISTANT_REMINDER_ID || 'system',
              campaign_id: 'auto-reminders',
              direction: 'outbound',
              call_type: 'appointment_reminder',
              duration: 0,
              disposition: 'queued',
              call_outcome: 'pending',
              vapi_call_id: result.callId,
              appointment_id: String(appt._id),
              created_at: new Date(),
            })

            await ctx.act('reminder_call_triggered', `Reminder call queued for ${lead.name} re: ${property.title}`, {
              parameters: { lead_id: String(lead._id), appt_id: String(appt._id) },
              result: { vapi_call_id: result.callId, call_triggered: true },
            })

            call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'triggered', vapi_call_id: result.callId })
            triggeredCount++
          } else {
            await ctx.act('reminder_call_failed', `Vapi call failed for ${lead.name}`, {
              parameters: { lead_id: String(lead._id) },
              error: result.error || 'vapi_error',
            })
            call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'failed', error: result.error })
          }

          // Rate-limit guard: 1 s between Vapi calls
          await new Promise((r) => setTimeout(r, 1000))
        }

        // â”€â”€ Step 3: result_analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await ctx.think('result_analysis',
          `Processed ${dueAppointments.length} appointments. Triggered ${triggeredCount} reminder calls. Skipped ${skippedDnd} DND leads.`,
          { confidence: 0.95, metadata: { triggered: triggeredCount, skipped_dnd: skippedDnd, total: dueAppointments.length } }
        )

        return {
          triggered_calls: triggeredCount,
          total_scanned: dueAppointments.length,
          skipped_dnd: skippedDnd,
          skipped_reminders: skippedReminders,
          call_details,
          summary: `Triggered ${triggeredCount} reminder call(s) out of ${dueAppointments.length} due appointment(s).`,
        }
      },
    })

    return NextResponse.json({
      success: true,
      runId,
      triggered: (output as any)?.triggered_calls ?? 0,
      total_due: (output as any)?.total_scanned ?? 0,
      skipped_reminders: (output as any)?.skipped_reminders ?? [],
      summary: (output as any)?.summary ?? '',
    })

  } catch (error: any) {
    console.error('[Cron/Reminders] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Appointment Guardian run failed', run_id: error?.runId },
      { status: 500 }
    )
  }
}
```

## Section 10 — Function App (Azure cron)
### `azure/functions/followup/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%FOLLOWUP_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/followup/index.js"
}

```
### `azure/functions/followup/index.ts`
```ts
import { AzureFunction, Context } from "@azure/functions";

const ROUTE = "/api/cron/follow-up";

const timer: AzureFunction = async (context: Context): Promise<void> => {
  const base = process.env.GHARSOCH_API_BASE!;
  const secret = process.env.CRON_SECRET!;

  if (!base || !secret) {
    context.log.error("[followup] Missing GHARSOCH_API_BASE or CRON_SECRET");
    throw new Error("Missing required environment variables");
  }

  const url = `${base}${ROUTE}`;
  const startedAt = new Date().toISOString();

  context.log(`[followup] Firing POST ${url} at ${startedAt}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
        "content-type": "application/json",
        "x-azure-function": context.executionContext.functionName,
        "x-trigger-time": startedAt,
      },
      signal: AbortSignal.timeout(60_000),
    });

    const body = await res.text();
    context.log(`[followup] POST ${url} â†’ ${res.status} ${body.slice(0, 500)}`);

    if (!res.ok) {
      throw new Error(`Non-2xx response: ${res.status} â€” ${body.slice(0, 200)}`);
    }
  } catch (err: any) {
    context.log.error(`[followup] Failed to call ${url}: ${err.message}`);
    throw err;
  }
};

export default timer;
```
### `azure/functions/host.json`
```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "functionTimeout": "00:05:00",
  "retry": {
    "strategy": "exponentialBackoff",
    "maxRetryCount": 3,
    "minimumInterval": "00:00:10",
    "maximumInterval": "00:01:00"
  }
}
```
### `azure/functions/matchmaker/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%MATCHMAKER_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/matchmaker/index.js"
}

```
### `azure/functions/matchmaker/index.ts`
```ts
import { AzureFunction, Context } from "@azure/functions";

const ROUTE = "/api/cron/matchmaker";

const timer: AzureFunction = async (context: Context): Promise<void> => {
  const base = process.env.GHARSOCH_API_BASE!;
  const secret = process.env.CRON_SECRET!;

  if (!base || !secret) {
    context.log.error("[matchmaker] Missing GHARSOCH_API_BASE or CRON_SECRET");
    throw new Error("Missing required environment variables");
  }

  const url = `${base}${ROUTE}`;
  const startedAt = new Date().toISOString();

  context.log(`[matchmaker] Firing POST ${url} at ${startedAt}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
        "content-type": "application/json",
        "x-azure-function": context.executionContext.functionName,
        "x-trigger-time": startedAt,
      },
      signal: AbortSignal.timeout(60_000),
    });

    const body = await res.text();
    context.log(`[matchmaker] POST ${url} â†’ ${res.status} ${body.slice(0, 500)}`);

    if (!res.ok) {
      throw new Error(`Non-2xx response: ${res.status} â€” ${body.slice(0, 200)}`);
    }
  } catch (err: any) {
    context.log.error(`[matchmaker] Failed to call ${url}: ${err.message}`);
    throw err;
  }
};

export default timer;
```
### `azure/functions/reengage/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%REENGAGE_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/reengage/index.js"
}

```
### `azure/functions/reengage/index.ts`
```ts
import { AzureFunction, Context } from "@azure/functions";

const ROUTE = "/api/cron/re-engage";

const timer: AzureFunction = async (context: Context): Promise<void> => {
  const base = process.env.GHARSOCH_API_BASE!;
  const secret = process.env.CRON_SECRET!;

  if (!base || !secret) {
    context.log.error("[reengage] Missing GHARSOCH_API_BASE or CRON_SECRET");
    throw new Error("Missing required environment variables");
  }

  const url = `${base}${ROUTE}`;
  const startedAt = new Date().toISOString();

  context.log(`[reengage] Firing POST ${url} at ${startedAt}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
        "content-type": "application/json",
        "x-azure-function": context.executionContext.functionName,
        "x-trigger-time": startedAt,
      },
      signal: AbortSignal.timeout(60_000),
    });

    const body = await res.text();
    context.log(`[reengage] POST ${url} â†’ ${res.status} ${body.slice(0, 500)}`);

    if (!res.ok) {
      throw new Error(`Non-2xx response: ${res.status} â€” ${body.slice(0, 200)}`);
    }
  } catch (err: any) {
    context.log.error(`[reengage] Failed to call ${url}: ${err.message}`);
    throw err;
  }
};

export default timer;
```
### `azure/functions/reminders/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%REMINDERS_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/reminders/index.js"
}

```
### `azure/functions/reminders/index.ts`
```ts
import { AzureFunction, Context } from "@azure/functions";

const ROUTE = "/api/cron/reminders";

const timer: AzureFunction = async (context: Context): Promise<void> => {
  const base = process.env.GHARSOCH_API_BASE!;
  const secret = process.env.CRON_SECRET!;

  if (!base || !secret) {
    context.log.error("[reminders] Missing GHARSOCH_API_BASE or CRON_SECRET");
    throw new Error("Missing required environment variables");
  }

  const url = `${base}${ROUTE}`;
  const startedAt = new Date().toISOString();

  context.log(`[reminders] Firing POST ${url} at ${startedAt}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
        "content-type": "application/json",
        "x-azure-function": context.executionContext.functionName,
        "x-trigger-time": startedAt,
      },
      signal: AbortSignal.timeout(60_000),
    });

    const body = await res.text();
    context.log(`[reminders] POST ${url} â†’ ${res.status} ${body.slice(0, 500)}`);

    if (!res.ok) {
      throw new Error(`Non-2xx response: ${res.status} â€” ${body.slice(0, 200)}`);
    }
  } catch (err: any) {
    context.log.error(`[reminders] Failed to call ${url}: ${err.message}`);
    throw err;
  }
};

export default timer;
```

## Section 11 — Cooldown system
### Full body `leadHasRecentOutboundCall` - `app/api/campaigns/trigger/route.ts:6`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
```
### Full body `leadHasRecentOutboundCall` - `app/api/cron/follow-up/route.ts:3`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
```
### Full body `leadHasRecentOutboundCall` - `app/api/cron/followups/route.ts:3`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
```
### Full body `leadHasRecentOutboundCall` - `app/api/cron/re-engage/route.ts:3`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
```
### Full body `leadHasRecentOutboundCall` - `app/api/cron/reminders/route.ts:4`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
```
### Full body `leadHasRecentOutboundCall` - `lib/agents/campaignConductor.ts:11`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
```
### Full body `leadHasRecentOutboundCall` - `lib/agents/matchmaker.ts:2`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService';
```
### Full body `leadHasRecentOutboundCall` - `lib/agents/priceDropNegotiator.ts:2`
```ts
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
```
### Full body `leadHasRecentOutboundCall` - `lib/services/callService.ts:134`
```ts
export async function leadHasRecentOutboundCall(
  leadId: ObjectId, 
  withinMinutes = 240,
  options?: { source?: 'matchmaker' | 'campaign' | 'follow_up_callback' | 'appointment_reminder' | 're_engager'; floor?: Date }
```
### Full body `phoneHasRecentOutboundCall` - `lib/services/callService.ts:115`
```ts
export async function phoneHasRecentOutboundCall(phone: string, withinMinutes = 240): Promise<boolean> {
  if (!phone || withinMinutes <= 0) return false

  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
  const collection = await getCollection()
  const count = await collection.countDocuments({
    direction: 'outbound',
    superseded: { $ne: true },
    created_at: { $gte: cutoff },
    $or: [
      { customer_number: phone } as any,
      { to_number: phone } as any,
      { lead_phone: phone } as any,
    ],
  })

  return count > 0
}
```
### Full body `Cooldown` - `app/api/campaigns/trigger/route.ts:48`
```ts
          error: 'cooldown',
          message: `Lead contacted within ${cooldownMins}m cooldown window`,
```
### Full body `Cooldown` - `app/api/cron/follow-up/route.ts:82`
```ts
                reason: `Lead contacted within ${cooldownMins}m cooldown window`,
```
### Full body `Cooldown` - `app/api/cron/followups/route.ts:48`
```ts
          action: `Cooldown skip for ${lead.name}: Lead contacted within ${cooldownMins}m cooldown window.`,
```
### Full body `Cooldown` - `app/api/cron/re-engage/route.ts:127`
```ts
                reason: `Lead contacted within ${cooldownMins}m cooldown window`,
```
### Full body `Cooldown` - `lib/agents/campaignConductor.ts:314`
```ts
              reason: `Lead contacted within ${cooldownMins}m cooldown window`,
```
### Full body `Cooldown` - `lib/agents/matchmaker.ts:232`
```ts
                reason: `Lead contacted within ${cooldownMins}m cooldown window`,
```
### Full body `Cooldown` - `lib/agents/priceDropNegotiator.ts:106`
```ts
              reason: `Lead contacted within ${cooldownMins}m cooldown window`,
```
### Full body `Cooldown` - `lib/services/clientService.ts:156`
```ts
  // STEP 3: Mark CALLS as superseded (cooldown bypass for any future re-add)
  let callsResult = { modifiedCount: 0 };
```

## Section 12 — Agent / orchestrator code
### `app/actions/agents.ts`
- `app/actions/agents.ts:7`
```ts
export async function forceRunAgent(agent: string) {
```
#### Core logic excerpt
```ts
import { runMatchmaker } from '@/lib/agents/matchmaker'
import { requireRole } from '@/lib/auth'
// Note: we can import other agents here as needed

export async function forceRunAgent(agent: string) {
  await requireRole(['admin', 'tech'])
  // Phase 11.5: scope manual agent runs to session.user.brokerage_id when multi-tenant lands.
  if (agent === 'matchmaker') {
    await runMatchmaker()
  } else {
    // Other agents could be wired here
    console.log('Force run not implemented for agent:', agent)
  }
}
```
### `app/api/agent/[agentId]/executions/route.ts`
- `app/api/agent/[agentId]/executions/route.ts:11`
```ts
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
```
#### Core logic excerpt
```ts
 * Agent Execution Details Endpoint
 * GET: Retrieve detailed execution traces for a specific agent or run
 * Supports filtering by run_id, status, date range
 */

import { NextRequest, NextResponse } from 'next/server'
import { agentLogger } from '@/lib/agentLogger'
import { authErrorResponse, requireSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    await requireSession()
    // Phase 11.5: filter execution traces by session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('run_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = parseInt(searchParams.get('skip') || '0')
```
### `app/api/agent/builder-refiner/route.ts`
- `app/api/agent/builder-refiner/route.ts:14`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
 * Re-ranks property matches based on builder knowledge from KB
 * Phase 4 update: Now queries KB for builder data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAgentConfig } from '@/lib/agentRegistry'
import { runAgent } from '@/lib/runAgent'
import { authErrorResponse, requireRole } from '@/lib/auth'

const AGENT_ID = '69e8f70b2234567890abcde1'

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify property matches belong to session.user.brokerage_id.
    const body = await request.json()
    const { property_matches, matches, client_profile, builder_preferences } = body

    // Support both property_matches and matches parameter names
    const propertiesToRefine = property_matches || matches || []
```
### `app/api/agent/call-state-validator/route.ts`
- `app/api/agent/call-state-validator/route.ts:12`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
import { getAgentConfig } from '@/lib/agentRegistry'
import { runAgent } from '@/lib/runAgent'
import { authErrorResponse, requireRole } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: verify call and lead belong to session.user.brokerage_id.
    const body = await request.json()
    const { call_data, lead_state } = body

    if (!call_data || !lead_state) {
      return NextResponse.json(
        { success: false, error: 'call_data and lead_state are required' },
        { status: 400 }
      )
    }

    const agentConfig = getAgentConfig('69e8f70b1234567890abcde0') // State Validator ID
    if (!agentConfig) {
```
### `app/api/agent/campaign-conductor/route.ts`
- `app/api/agent/campaign-conductor/route.ts:13`
```ts
export async function POST(req: NextRequest) {
```
#### Core logic excerpt
```ts
// POST /api/agent/campaign-conductor
// Manual trigger route for the Campaign Conductor agent.
// Accepts { campaign_id } in body.
// Secured by x-cron-secret header (same token as cron routes).
// Used for: admin force-run, Gate 9.5 verification, and future /ai-operations "Force Run" button.

import { NextRequest, NextResponse } from 'next/server'
import { runCampaignConductor } from '@/lib/agents/campaignConductor'
import { authErrorResponse, requireRole } from '@/lib/auth'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function POST(req: NextRequest) {
  const incomingSecret =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    ''

  try {
    const isCronAuthorized = Boolean(CRON_SECRET && incomingSecret === CRON_SECRET)
```
### `app/api/agent/events/route.ts`
- `app/api/agent/events/route.ts:7`
```ts
export const dynamic = 'force-dynamic'

type StreamEvent =
  | { type: 'connected'; timestamp: string }
  | { type: 'heartbeat'; timestamp: string }
  | {
```
- `app/api/agent/events/route.ts:184`
```ts
export async function GET(req: NextRequest) {
```
#### Core logic excerpt
```ts
import type { AgentExecutionTrace } from '@/lib/agentLogger'
import { getCollection } from '@/lib/mongodb'
import { requireSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type StreamEvent =
  | { type: 'connected'; timestamp: string }
  | { type: 'heartbeat'; timestamp: string }
  | {
      type: 'execution_started' | 'thinking' | 'action' | 'execution_completed' | 'execution_error'
      run_id: string
      agent_id: string
      agent_name: string
      timestamp: string
      data: Record<string, any>
    }

type KnownRunState = {
  startedSent: boolean
```
### `app/api/agent/matchmaker/route.ts`
- `app/api/agent/matchmaker/route.ts:6`
```ts
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
```
- `app/api/agent/matchmaker/route.ts:8`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
    // Phase 11.5: filter matchmaker candidate leads/properties by session.user.brokerage_id.
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const leadsCollection = await getCollection('leads')
    const propertiesCollection = await getCollection('properties')

    // Fetch unmatched clients (status: new or qualification_status: unqualified)
    const clients = await leadsCollection.find({
      status: 'new',
      dnd_status: { $ne: true },
      is_deleted: { $ne: true }
    }).toArray()

    if (clients.length === 0) {
```
### `app/api/agent/price-drop/route.ts`
- `app/api/agent/price-drop/route.ts:6`
```ts
export const dynamic = 'force-dynamic'

/**
 * POST /api/agent/price-drop
 * The Price Drop Negotiator - trigger: 'event'
 * Fired in-process from property updates when a price decreases.
 */
export async function POST(request: NextRequest) {
```
- `app/api/agent/price-drop/route.ts:13`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
import { runPriceDropNegotiator } from '@/lib/agents/priceDropNegotiator'
import { authErrorResponse, requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agent/price-drop
 * The Price Drop Negotiator - trigger: 'event'
 * Fired in-process from property updates when a price decreases.
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const isCronAuthorized = Boolean(cronSecret && request.headers.get('x-cron-secret') === cronSecret)
    if (!isCronAuthorized) {
      await requireRole(['admin', 'tech'])
    }
    // Phase 11.5: attach actor brokerage_id to price-drop runs when multi-tenant lands.
  } catch (error) {
    const authResponse = authErrorResponse(error)
```
### `app/api/agent/route.ts`
- `app/api/agent/route.ts:6`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
import { getAgentConfig } from '@/lib/agentRegistry'
import { runAgent } from '@/lib/runAgent'
import { authErrorResponse, requireRole } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])
    // Phase 11.5: attach actor brokerage_id to manual agent runs when multi-tenant lands.
    const body = await request.json()
    const { message, agent_id, context, user_id, session_id } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const agentConfig = getAgentConfig(agent_id)
    if (!agentConfig) {
```
### `app/api/agent/run/route.ts`
- `app/api/agent/run/route.ts:8`
```ts
export const dynamic = 'force-dynamic'

const AGENT_RUNNERS = {
```
- `app/api/agent/run/route.ts:55`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
import { runMatchmaker } from '@/lib/agents/matchmaker'
import { authErrorResponse, requireRole } from '@/lib/auth'
import { GET as runFollowUpRoute } from '@/app/api/cron/follow-up/route'
import { POST as runReEngageRoute } from '@/app/api/cron/re-engage/route'
import { POST as runRemindersRoute } from '@/app/api/cron/reminders/route'

export const dynamic = 'force-dynamic'

const AGENT_RUNNERS = {
  matchmaker: async () => {
    const data = await runMatchmaker()
    return { success: true, status: 200, message: data?.summary || 'Matchmaker run completed.', data }
  },
  reminders: async () => routeToJson(runRemindersRoute, 'POST', { 'x-cron-secret': process.env.CRON_SECRET || '' }),
  're-engage': async () => routeToJson(runReEngageRoute, 'POST', { 'x-cron-secret': process.env.CRON_SECRET || '' }),
  'follow-up': async () => routeToJson(runFollowUpRoute, 'GET', { authorization: `Bearer ${process.env.CRON_SECRET || ''}` }),
} as const

type AgentId = keyof typeof AGENT_RUNNERS

```
### `app/api/agent/ws/route.ts`
- `app/api/agent/ws/route.ts:18`
```ts
export async function GET(request: NextRequest) {
```
- `app/api/agent/ws/route.ts:85`
```ts
export async function OPTIONS(request: NextRequest) {
```
#### Core logic excerpt
```ts
 * Agent Execution WebSocket Endpoint
 * Enables real-time monitoring of agent runs as they execute
 * Clients can subscribe to specific agents or runs
 */

import { NextRequest } from 'next/server'
import { executionEventBroadcaster, AgentExecutionEvent } from '@/lib/agentExecutionEventBroadcaster'
import { requireSession } from '@/lib/auth'

/**
 * WebSocket upgrade handler for real-time agent monitoring
 * Usage:
 *   ws://localhost:3000/api/agent/ws?run_id=uuid
 *   or
 *   ws://localhost:3000/api/agent/ws?agent_id=123abc
 */
export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter websocket/SSE events by session.user.brokerage_id.
```
### `app/api/agent-activities/route.ts`
- `app/api/agent-activities/route.ts:5`
```ts
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
```
- `app/api/agent-activities/route.ts:7`
```ts
export async function GET(request: Request) {
```
#### Core logic excerpt
```ts
import { listActivityRuns } from '@/lib/services/agentDashboardService'
import { authErrorResponse, requireSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireSession()
    // Phase 11.5: filter agent activity by session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100)
    const skip = Number(searchParams.get('skip') || '0')
    const agentId = searchParams.get('agentId') || 'all'
    const result = await listActivityRuns({ limit, skip, agentId })

    return NextResponse.json({
      success: true,
      data: result.runs,
      total: result.total,
      hasMore: skip + result.runs.length < result.total,
```
### `app/api/cron/follow-up/route.ts`
- `app/api/cron/follow-up/route.ts:7`
```ts
export const dynamic = 'force-dynamic'

async function handleFollowupCron(request: NextRequest) {
```
- `app/api/cron/follow-up/route.ts:267`
```ts
export async function GET(request: NextRequest) {
```
- `app/api/cron/follow-up/route.ts:271`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

async function handleFollowupCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }


    const { runId, output } = await runAgent({
      agentId: '69e8f709f89cad5d4b752d24',
      agentName: 'The Follow-Up Agent',
```
### `app/api/cron/followups/route.ts`
- `app/api/cron/followups/route.ts:7`
```ts
export const dynamic = 'force-dynamic'

async function handleFollowupsCron(request: NextRequest) {
```
- `app/api/cron/followups/route.ts:171`
```ts
export async function GET(request: NextRequest) {
```
- `app/api/cron/followups/route.ts:175`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
async function handleFollowupsCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const leadsCollection = await getCollection('leads')
    const agentLogsCollection = await getCollection('agent_logs')
    const callsCol = await getCollection('calls')
    const now = new Date()

    // Find leads where next_follow_up_date is in the past, and not yet contacted for this follow-up
    // We'll reset the next_follow_up_date once triggered so we don't spam them.
    const pendingFollowups = await leadsCollection.find({
      is_deleted: { $ne: true },
      next_follow_up_date: { $lte: now, $ne: null }
    }).toArray()
```
### `app/api/cron/matchmaker/route.ts`
- `app/api/cron/matchmaker/route.ts:4`
```ts
export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/matchmaker
 * The Matchmaker â€” cron sweep every 30 min (Phase 3.5 will promote to event).
 */
export async function POST(request: NextRequest) {
```
- `app/api/cron/matchmaker/route.ts:10`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
import { runMatchmaker } from '@/lib/agents/matchmaker'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/matchmaker
 * The Matchmaker â€” cron sweep every 30 min (Phase 3.5 will promote to event).
 */
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runMatchmaker()

    return NextResponse.json({
      success: true,
```
### `app/api/cron/re-engage/route.ts`
- `app/api/cron/re-engage/route.ts:6`
```ts
export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/re-engage
 * The Dead Lead Re-engager â€” daily 10:00 IST
 * Finds leads with status 'cold' or 'not_interested' not contacted in 60+ days,
 * uses GPT-4o to build a personalised re-engagement context from the last call
 * transcript, then triggers a Vapi outbound call.
 */
```
- `app/api/cron/re-engage/route.ts:15`
```ts
export async function POST(request: NextRequest) {
```
#### Core logic excerpt
```ts
import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/re-engage
 * The Dead Lead Re-engager â€” daily 10:00 IST
 * Finds leads with status 'cold' or 'not_interested' not contacted in 60+ days,
 * uses GPT-4o to build a personalised re-engagement context from the last call
 * transcript, then triggers a Vapi outbound call.
 */
export async function POST(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

```
### `app/api/follow-ups/execution-history/route.ts`
- `app/api/follow-ups/execution-history/route.ts:11`
```ts
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
```
- `app/api/follow-ups/execution-history/route.ts:13`
```ts
export async function GET(request: NextRequest) {
```
#### Core logic excerpt
```ts
 * Follow-up Agent Execution History Endpoint
 * Retrieves detailed execution traces for follow-up cron jobs
 * Includes per-lead reasoning and decision rationale
 */

import { NextRequest, NextResponse } from 'next/server'
import { agentLogger } from '@/lib/agentLogger'
import { authErrorResponse, requireSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireSession()
    // Phase 11.5: filter execution history by session.user.brokerage_id.
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = parseInt(searchParams.get('skip') || '0')
    const includeStats = searchParams.get('include_stats') === 'true'

```
### `app/api/follow-ups/route.ts`
- `app/api/follow-ups/route.ts:5`
```ts
export const dynamic = 'force-dynamic'

export async function GET() {
```
- `app/api/follow-ups/route.ts:7`
```ts
export async function GET() {
```
#### Core logic excerpt
```ts
    // Phase 11.5: filter follow-ups by session.user.brokerage_id.
    const leads = await getCollection('leads')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const followUps = await leads.find({
      next_follow_up_date: { $lte: tomorrow },
      dnd_status: { $ne: true },
      status: { $nin: ['closed', 'lost'] },
    }).toArray()

    followUps.sort((a, b) => {
      const aTime = a.next_follow_up_date ? new Date(a.next_follow_up_date).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.next_follow_up_date ? new Date(b.next_follow_up_date).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })

```
### `app/sections/AgentStatusSection.tsx`
- `app/sections/AgentStatusSection.tsx:100`
```tsx
export default function AgentStatusSection({ sampleMode }: AgentStatusProps) {
```
#### Core logic excerpt
```tsx
import { callAIAgent } from '@/lib/aiAgent'

interface AgentStatusProps {
  sampleMode: boolean
}

const AGENTS = [
  {
    id: '69e8f73cd8820b5d0188ed99',
    name: 'Voice Conversation Orchestrator',
    role: 'Manages live voice calls, routes buyer intent to specialists, handles escalation and voicemail',
    type: 'voice',
    model: 'gpt-4o-mini',
    provider: 'OpenAI',
  },
  {
    id: '69e8f707f89cad5d4b752d22',
    name: 'Lead Qualification & Objection Agent',
    role: 'Analyzes and qualifies leads, handles buyer objections with data-driven responses',
    type: 'json',
```
### `azure/functions/followup/function.json`
#### Core logic excerpt
```json
      "schedule": "%FOLLOWUP_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/followup/index.js"
}

```
### `azure/functions/followup/index.ts`
#### Core logic excerpt
```ts
const ROUTE = "/api/cron/follow-up";

const timer: AzureFunction = async (context: Context): Promise<void> => {
  const base = process.env.GHARSOCH_API_BASE!;
  const secret = process.env.CRON_SECRET!;

  if (!base || !secret) {
    context.log.error("[followup] Missing GHARSOCH_API_BASE or CRON_SECRET");
    throw new Error("Missing required environment variables");
  }

  const url = `${base}${ROUTE}`;
  const startedAt = new Date().toISOString();

  context.log(`[followup] Firing POST ${url} at ${startedAt}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
```
### `azure/functions/matchmaker/function.json`
#### Core logic excerpt
```json
      "schedule": "%MATCHMAKER_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/matchmaker/index.js"
}

```
### `azure/functions/matchmaker/index.ts`
#### Core logic excerpt
```ts
const ROUTE = "/api/cron/matchmaker";

const timer: AzureFunction = async (context: Context): Promise<void> => {
  const base = process.env.GHARSOCH_API_BASE!;
  const secret = process.env.CRON_SECRET!;

  if (!base || !secret) {
    context.log.error("[matchmaker] Missing GHARSOCH_API_BASE or CRON_SECRET");
    throw new Error("Missing required environment variables");
  }

  const url = `${base}${ROUTE}`;
  const startedAt = new Date().toISOString();

  context.log(`[matchmaker] Firing POST ${url} at ${startedAt}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
```
### `azure/functions/reengage/function.json`
#### Core logic excerpt
```json
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/reengage/index.js"
}

```
### `azure/functions/reengage/index.ts`
### `components/AgentCard.tsx`
- `components/AgentCard.tsx:169`
```tsx
export function AgentCard({
```
#### Core logic excerpt
```tsx
import { forceRunAgent } from '@/app/actions/agents'
import { LivePulse } from '@/components/LivePulse'
import { Pill, type PillVariant } from '@/components/Pill'
import { useAgentEventStream } from '@/lib/hooks/useAgentEventStream'
import { useUserRole } from '@/lib/auth/useUserRole'
import { toast } from '@/lib/toast'
import type {
  AgentDashboardRun,
  AgentDashboardSummary,
  EnrichedMatchDetail,
  VoiceInFlightRun,
} from '@/lib/services/agentDashboardService'

type Counter = {
  label: string
  value: string
}

type MatchRow = {
  key: string
```
### `components/AgentTransitionTimeline.tsx`
- `components/AgentTransitionTimeline.tsx:33`
```tsx
export function AgentTransitionTimeline({
```
#### Core logic excerpt
```tsx
export type AgentTransitionItem = {
  id: string
  label: string
  status: string
  timestamp: string
  description?: string
  details?: unknown
}

function toneForStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('fail') || normalized.includes('error')) return '#d94b4b'
  if (normalized.includes('partial') || normalized.includes('warn')) return '#c98916'
  return '#2f9e66'
}

function offsetLabel(timestamp: string, baseTimestamp?: string) {
  const time = new Date(timestamp).getTime()
  const base = baseTimestamp ? new Date(baseTimestamp).getTime() : NaN

```
### `docs/AGENT_REASONING_AND_AUTOMATION_LOG.md`
#### Core logic excerpt
```md
# Agent Reasoning and Automation Log

**Last updated:** 2026-05-07

This document explains how the GharSoch agent system works today, what each automation is responsible for, how reasoning and execution traces are captured, and what has been completed so far. It is intentionally written as an operational log so future updates can extend it instead of starting over.

## 1. What This System Is Doing

GharSoch is not just a dashboard with a few API routes. It is a multi-agent execution system for real estate lead handling, call orchestration, follow-up automation, post-call analysis, and builder-aware property ranking.

The main goals are:

- make each AI decision traceable,
- make background automations visible in real time,
- keep call and lead state synchronized,
- use builder knowledge only from the knowledge base,
- avoid silent failures when one secondary feature breaks,
- keep the core response path fast and reliable.

The current architecture separates the system into three layers:
```
### `hooks/useAgent.ts`
- `hooks/useAgent.ts:62`
```ts
export const setGlobalErrorCallback = (callback: (error: ErrorDetails | null) => void) => {
```
- `hooks/useAgent.ts:66`
```ts
export const clearGlobalError = () => {
```
- `hooks/useAgent.ts:120`
```ts
export const useAgent = (options: UseAgentOptions = {}) => {
```
- `hooks/useAgent.ts:266`
```ts
export const callAgentAPI = async (
  message: string,
  agentId: string,
  options?: { userId?: string; sessionId?: string }
): Promise<UseAgentResult> => {
```
#### Core logic excerpt
```ts
 * useAgent Hook
 *
 * React hook for calling AI agents with error handling and iframe communication.
 * Uses the same normalized response structure as callAIAgent.
 *
 * @example
 * ```tsx
 * const { callAgent, loading, error, response } = useAgent({ agentId: 'xxx' })
 *
 * // response is NormalizedAgentResponse:
 * // { status: 'success', result: {...}, message?: string }
 * ```
 */

import { useState, useCallback } from 'react'
import { isInIframe, sendErrorToParent, requestFixFromParent } from '@/components/ErrorBoundary'
import { callAIAgent, NormalizedAgentResponse, AIAgentResponse } from '@/lib/aiAgent'

// =============================================================================
// Types
```
### `hooks/useRealtimeAgentMonitoring.ts`
- `hooks/useRealtimeAgentMonitoring.ts:28`
```ts
export function useRealtimeAgentMonitoring({
```
#### Core logic excerpt
```ts
 * useRealtimeAgentMonitoring Hook
 * Client-side hook for subscribing to real-time agent execution events
 * Uses Server-Sent Events (SSE) for browser compatibility
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface AgentExecutionEvent {
  type: 'execution_started' | 'thinking' | 'action' | 'execution_completed' | 'execution_error' | 'connected'
  run_id?: string
  agent_id?: string
  agent_name?: string
  timestamp?: string
  data?: Record<string, any>
  message?: string
}

interface UseRealtimeAgentMonitoringOptions {
```
### `lib/agentExecutionEventBroadcaster.ts`
- `lib/agentExecutionEventBroadcaster.ts:193`
```ts
export const executionEventBroadcaster = AgentExecutionEventBroadcaster.getInstance()
```
#### Core logic excerpt
```ts
 * Agent Execution Event Broadcaster
 * Emits real-time events during agent execution for WebSocket clients
 * Phase 7: Real-time agent monitoring
 */

import { EventEmitter } from 'events'

export interface AgentExecutionEvent {
  type: 'execution_started' | 'thinking' | 'action' | 'execution_completed' | 'execution_error'
  run_id: string
  agent_id: string
  agent_name: string
  timestamp: string
  data: Record<string, any>
}

class AgentExecutionEventBroadcaster extends EventEmitter {
  private static instance: AgentExecutionEventBroadcaster

  private constructor() {
```
### `lib/agentLogger.ts`
- `lib/agentLogger.ts:456`
```ts
export const agentLogger = new AgentLogger()
```
#### Core logic excerpt
```ts
 * Enhanced Agent Execution Logger
 * Tracks: input â†’ reasoning steps â†’ actions â†’ results with full traceability
 * Stores in MongoDB collection: agent_execution_logs
 *
 * W2: All timestamps stored as BSON Date objects (not ISO strings).
 */

import { v4 as uuidv4 } from 'uuid'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

function sanitizeMongoKeys(value: any): any {
  if (value === null || value === undefined) return value

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeMongoKeys(v))
  }

  if (value instanceof Date) return value

```
### `lib/agentRegistry.ts`
- `lib/agentRegistry.ts:10`
```ts
export const AGENT_REGISTRY: Record<string, AgentConfig> = {
```
- `lib/agentRegistry.ts:162`
```ts
export function getAgentConfig(agentId: string): AgentConfig | undefined {
```
#### Core logic excerpt
```ts
export interface AgentConfig {
  id: string
  name: string
  role: string
  systemPrompt: string
  model: string
  provider: string
}

export const AGENT_REGISTRY: Record<string, AgentConfig> = {
  '69e8f73cd8820b5d0188ed99': {
    id: '69e8f73cd8820b5d0188ed99',
    name: 'Voice Conversation Orchestrator',
    role: 'Manager',
    model: 'gpt-4o-mini',
    provider: 'OpenAI',
    systemPrompt: `You are the Voice Conversation Orchestrator for GharSoch, an AI-powered real estate financial advisory platform.
Your goal is to coordinate live voice calls, routing buyer intent to specialist sub-agents.
You manage the conversational state, handle objections, and trigger escalations (human transfer) when necessary.
Be professional, empathetic, and keep the luxury-dark brand aesthetic in mind.
```
### `lib/agents/__tests__/matchmaker.test.ts`
#### Core logic excerpt
```ts
import { normalizeLocation } from '../matchmaker';

describe('Matchmaker Utility', () => {
  describe('normalizeLocation', () => {
    it('should extract the first part of a location and lowercase it', () => {
      expect(normalizeLocation('Whitefield, Bangalore')).toBe('whitefield');
      expect(normalizeLocation('Whitefield')).toBe('whitefield');
      expect(normalizeLocation(' Indiranagar ')).toBe('indiranagar');
      expect(normalizeLocation('Hennur Road, Bangalore')).toBe('hennur road');
    });

    it('should handle empty or null values', () => {
      expect(normalizeLocation('')).toBe('');
      expect(normalizeLocation(undefined)).toBe('');
    });
  });
});
```
### `lib/agents/__tests__/matchmaker_logic.test.ts`
#### Core logic excerpt
```ts
import { runMatchmaker } from '../matchmaker';
import { runAgent } from '@/lib/runAgent';
import { ObjectId } from 'mongodb';

// Mock the runAgent function to capture and call the handler
jest.mock('@/lib/runAgent', () => ({
  runAgent: jest.fn(),
}));

describe('Matchmaker Agent Logic', () => {
  it('B12 part 2: returns zero matches and skips GPT call when no exact-location properties exist', async () => {
    // 1. Setup mock data
    const mockLeads = [
      { _id: new ObjectId(), name: 'Anurag', location_pref: 'Indiranagar', budget_range: '1.5 Cr', status: 'new' },
    ];
    const mockProperties = [
      { _id: new ObjectId(), title: 'Whitefield House', location: 'Whitefield, Bangalore', status: 'available' },
    ];

    // 2. Mock runAgent implementation to execute the handler
```
### `lib/agents/campaignConductor.ts`
- `lib/agents/campaignConductor.ts:175`
```ts
export async function runCampaignConductor(
  campaignId: string
): Promise<CampaignConductorResult> {
```
#### Core logic excerpt
```ts
 * Campaign Conductor Agent â€” Phase 9.5
 *
 * Picks up a campaign in `queued` status, resolves target leads,
 * enforces the TRAI calling window (09:00â€“21:00 IST), dials up to 30
 * leads per run via Vapi, and logs every action through the Â§4 runAgent
 * contract so every step appears in agent_execution_logs and /ai-operations.
 */

import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'
import type { Campaign } from '@/models/Campaign'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current hour in IST (24-hour, 0â€“23).
 */
```
### `lib/agents/clientLeadConverter.ts`
- `lib/agents/clientLeadConverter.ts:5`
```ts
export async function runClientLeadConverter(clientId: string): Promise<{ runId: string; lead_id?: string; rejected?: boolean; reason?: string; score?: number; rationale?: string }> {
```
#### Core logic excerpt
```ts
import { runAgent } from '@/lib/runAgent'
import { createLead } from '@/lib/services/leadService'
import { ObjectId } from 'mongodb'

export async function runClientLeadConverter(clientId: string): Promise<{ runId: string; lead_id?: string; rejected?: boolean; reason?: string; score?: number; rationale?: string }> {
  const { runId, output } = await runAgent({
    agentId: 'client_lead_converter',
    agentName: 'Client â†’ Lead Converter',
    trigger: 'event',
    input: { client_id: clientId },
    handler: async (ctx) => {
      await ctx.think('evaluation', `Loading client ${clientId} for qualification`)
      const client = await ctx.db.findOne('clients', { _id: new ObjectId(clientId) })
      if (!client) throw new Error('Client not found')

      // Quality gates
      const missingFields: string[] = []
      if (!client.phone) missingFields.push('phone')
      if (!client.budget_range && !client.location_pref) missingFields.push('budget_or_location')
      if (missingFields.length) {
```
### `lib/agents/matchmaker.ts`
- `lib/agents/matchmaker.ts:5`
```ts
export function normalizeLocation(loc?: string): string {
```
- `lib/agents/matchmaker.ts:10`
```ts
export async function runMatchmaker(leadId?: string): Promise<any> {
```
- `lib/agents/matchmaker.ts:332`
```ts
export async function runMatchmakerForLead(leadId: string) {
```
#### Core logic excerpt
```ts
import { runAgent } from '@/lib/runAgent';
import { leadHasRecentOutboundCall } from '@/lib/services/callService';
import { ObjectId } from 'mongodb';

export function normalizeLocation(loc?: string): string {
  if (!loc) return '';
  return loc.split(',')[0].toLowerCase().trim();
}

export async function runMatchmaker(leadId?: string): Promise<any> {
  const { runId, output } = await runAgent({
    agentId: 'matchmaker',
    agentName: 'The Matchmaker',
    trigger: leadId ? 'event' : 'cron',
    input: leadId ? { lead_id: leadId } : { cron_job: 'matchmaker', trigger_time: new Date().toISOString() },
    metadata: leadId ? { trigger_type: 'event' } : { cron_type: 'scheduled', frequency: 'every_30_min' },

    handler: async (ctx) => {
      // â”€â”€ Step 1: evaluation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      await ctx.think('evaluation',
```
### `lib/agents/priceDropNegotiator.ts`
- `lib/agents/priceDropNegotiator.ts:12`
```ts
export async function runPriceDropNegotiator(input: PriceDropInput) {
```
#### Core logic excerpt
```ts
import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'

type PriceDropInput = {
  property_id: string
  new_price?: number
  new_price_lakhs?: number
  old_price?: number | null
}

export async function runPriceDropNegotiator(input: PriceDropInput) {
  const { property_id, old_price } = input
  const parsedLakhs = Number(input.new_price_lakhs)
  const parsedRaw = Number(input.new_price)
  const priceForMessage =
    Number.isFinite(parsedLakhs) && parsedLakhs > 0
      ? parsedLakhs
      : Number.isFinite(parsedRaw) && parsedRaw > 0
        ? Math.round(parsedRaw / 100_000)
```
### `lib/aiAgent.ts`
- `lib/aiAgent.ts:36`
```ts
export async function callAIAgent(
  message: string,
  agent_id: string,
  options?: { user_id?: string; session_id?: string; assets?: string[] }
): Promise<AIAgentResponse> {
```
- `lib/aiAgent.ts:85`
```ts
export function useAIAgent() {
```
- `lib/aiAgent.ts:123`
```ts
export function extractText(response: NormalizedAgentResponse): string {
```
#### Core logic excerpt
```ts
 * AI Agent Client Utility (OpenAI Implementation)
 */

import { useState } from 'react'
import fetchWrapper from '@/lib/fetchWrapper'

export interface NormalizedAgentResponse {
  status: 'success' | 'error'
  result: Record<string, any>
  message?: string
  metadata?: {
    agent_name?: string
    timestamp?: string
    [key: string]: any
  }
}

export interface AIAgentResponse {
  success: boolean
  response: NormalizedAgentResponse
```
### `lib/hooks/useAgentEventStream.ts`
- `lib/hooks/useAgentEventStream.ts:109`
```ts
export function useAgentEventStream({ agentId, runId, onEvent }: StreamOpts) {
```
#### Core logic excerpt
```ts
  agentId?: string
  runId?: string
  onEvent: (event: any) => void
}

type KnownExecutionState = {
  startedSent: boolean
  actionCount: number
  terminalStatus?: string
}

function isTerminalStatus(status: string | undefined | null) {
  return status === 'success' || status === 'completed' || status === 'failed' || status === 'error'
}

function buildSyntheticEvents(executions: any[], knownStates: Map<string, KnownExecutionState>) {
  const events: any[] = []
  const nowMs = Date.now()

  const ordered = [...executions].sort((a, b) => {
```
### `lib/runAgent.ts`
#### Core logic excerpt
```ts
import { agentLogger, type ReasoningStep } from '@/lib/agentLogger'
import { executionEventBroadcaster } from '@/lib/agentExecutionEventBroadcaster'
import { getCollection } from '@/lib/mongodb'
import { openaiChatCompletion, type OpenAIChatMessage } from '@/lib/openaiClient'
import { reasoningSummaryGenerator } from '@/lib/reasoningSummaryGenerator'
import {
  triggerCampaignCall,
  triggerCallbackCall,
  triggerOutboundCall,
  triggerReminderCall,
  getCallDetails,
} from '@/lib/vapiClient'
import { builderKBService } from '@/lib/builderKBService'

export type AgentTrigger = 'manual' | 'cron' | 'event'

export type AgentRunContext = {
  runId: string
  agentId: string
  agentName: string
```
### `lib/services/agentDashboardService.ts`
- `lib/services/agentDashboardService.ts:415`
```ts
export async function getAgentSummaries(): Promise<AgentDashboardSummary[]> {
```
- `lib/services/agentDashboardService.ts:475`
```ts
export async function getRecentRuns(limit: number = 8): Promise<AgentDashboardRun[]> {
```
- `lib/services/agentDashboardService.ts:515`
```ts
export async function listActivityRuns(options: {
```
- `lib/services/agentDashboardService.ts:544`
```ts
export async function getRunDetail(runId: string): Promise<AgentDashboardRun | null> {
```
- `lib/services/agentDashboardService.ts:583`
```ts
export async function getHealthStrip(): Promise<HealthStripData> {
```
#### Core logic excerpt
```ts
import type { AgentAction, AgentExecutionTrace, ReasoningStep } from '@/lib/agentLogger'

const FOLLOW_UP_AGENT_LEGACY_ID = '69e8f709f89cad5d4b752d24'
const KNOWN_AGENT_NAMES: Record<string, string> = {
  matchmaker: 'The Matchmaker',
  follow_up_agent: 'The Follow-Up Agent',
  appointment_guardian: 'The Appointment Guardian',
  dead_lead_reengager: 'The Dead Lead Re-engager',
  price_drop_negotiator: 'The Price Drop Negotiator',
  voice_orchestrator: 'Voice Orchestrator',
}

export type AgentDashboardSummary = {
  agent_id: string
  agent_name: string
  last_run_at: string | null
  last_run_status: string | null
  runs_24h: number
  success_rate: number
  kb_hits_24h: number
```
### `lib/ui/agentVisuals.tsx`
- `lib/ui/agentVisuals.tsx:21`
```tsx
export const AGENT_VISUALS: Record<string, AgentVisual> = {
```
- `lib/ui/agentVisuals.tsx:36`
```tsx
export function getAgentVisual(agentId: string): AgentVisual {
```
#### Core logic excerpt
```tsx
export interface AgentVisual {
  icon: LucideIcon
  tone: string
  label: string
}

export const AGENT_VISUALS: Record<string, AgentVisual> = {
  matchmaker: { icon: Target, tone: 'sky', label: 'The Matchmaker' },
  campaign_conductor: { icon: Megaphone, tone: 'orange', label: 'Campaign Conductor' },
  follow_up_agent: { icon: RotateCw, tone: 'green', label: 'Follow-Up Agent' },
  follow_up: { icon: RotateCw, tone: 'green', label: 'Follow-Up Agent' },
  followup: { icon: RotateCw, tone: 'green', label: 'Follow-Up Agent' },
  appointment_guardian: { icon: CalendarClock, tone: 'amber', label: 'Appointment Guardian' },
  re_engager: { icon: Zap, tone: 'rose', label: 'Re-engager' },
  dead_lead_reengager: { icon: Zap, tone: 'rose', label: 'Re-engager' },
  price_drop_negotiator: { icon: TrendingDown, tone: 'red', label: 'Price Drop Negotiator' },
  voice_orchestrator: { icon: Mic, tone: 'violet', label: 'Voice Orchestrator' },
  client_lead_converter: { icon: Sparkles, tone: 'blue', label: 'Lead Converter' },
  builder_reputation_refiner: { icon: Building2, tone: 'stone', label: 'Builder Refiner' },
}
```
### `models/AgentExecutionLog.ts`
- `models/AgentExecutionLog.ts:71`
```ts
export const DEFAULT_AGENT_EXECUTION_LOG: Omit<AgentExecutionLog, '_id'> = {
```
#### Core logic excerpt
```ts
 * Agent Execution Log Model
 * Stores detailed execution traces for debugging and observability
 */

import { ObjectId } from 'mongodb'

export interface ReasoningStep {
  timestamp: string
  step_type: string
  content: string
  confidence?: number
  metadata?: Record<string, any>
}

export interface AgentAction {
  timestamp: string
  action_type: string
  description: string
  parameters?: Record<string, any>
  result?: Record<string, any>
```

## Section 13 — UI: LeadsWorkspace and friends
### `components/leads/LeadsFilterBar.tsx`
- File line count: 207
#### Exports/components
```tsx
export const EMPTY_FILTERS: LeadsFilters = {
const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'negotiating', 'appointment_set', 'won', 'lost']
export function LeadsFilterBar({
  const activeCount =
  function toggleArrayValue(
    const current = filters[field]
    const next = current.includes(value)
  function clearAll() {
```
#### Props interfaces
```tsx
type Props = {
  filters: LeadsFilters
  onChange: (f: LeadsFilters) => void
  availableCities: string[]
  availablePropertyTypes: string[]
  availableSources: string[]
}

export function LeadsFilterBar({
  filters,
  onChange,
  availableCities,
  availablePropertyTypes,
  availableSources,
}: Props) {
  const activeCount =
    filters.status.length +
    filters.cities.length +
    filters.propertyTypes.length +
    filters.sources.length +
    (filters.dnd !== 'all' ? 1 : 0)

  function toggleArrayValue(
    field: 'status' | 'cities' | 'propertyTypes' | 'sources',
    value: string
  ) {
    const current = filters[field]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [field]: next })
```
#### Imports of other components
```tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
```
#### Hooks used
NOT FOUND
### `components/leads/LeadsSearch.tsx`
- File line count: 39
#### Exports/components
```tsx
export function LeadsSearch({ value, onChange, debounceMs = 300 }: Props) {
    const t = setTimeout(() => {
```
#### Props interfaces
```tsx
type Props = {
  value: string
  onChange: (v: string) => void
  debounceMs?: number
}

export function LeadsSearch({ value, onChange, debounceMs = 300 }: Props) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => clearTimeout(t)
  }, [local, value, onChange, debounceMs])

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search by name, phone, email, city..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-8 h-9"
      />
    </div>
```
#### Imports of other components
```tsx
import { Input } from '@/components/ui/input'
```
#### Hooks used
- `useEffect`
- `useState`
### `components/leads/LeadsTable.tsx`
- File line count: 264
#### Exports/components
```tsx
function formatRelative(dateStr: string | null | undefined): string {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const past = diff > 0
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
function formatBudget(range: string | undefined): string {
function getTemperature(lead: SerializedLead): 'hot' | 'warm' | 'cold' {
  const lastContacted = lead.last_contacted_at ? new Date(lead.last_contacted_at).getTime() : 0
  const hoursSinceContact = lastContacted ? (Date.now() - lastContacted) / 3_600_000 : Infinity
  const calls = lead.total_calls ?? 0
function temperatureColor(t: 'hot' | 'warm' | 'cold'): string {
function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' {
export function LeadsTable({ leads, onRowClick }: Props) {
  const sortedLeads = useMemo(() => {
    const copy = [...leads]
      const aVal = (a as any)[sortKey]
      const bVal = (b as any)[sortKey]
        const aTime = new Date(aVal).getTime()
        const bTime = new Date(bVal).getTime()
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
  function toggleSort(key: SortKey) {
  function SortIcon({ k }: { k: SortKey }) {
            const temp = getTemperature(lead)
```
#### Props interfaces
```tsx
type Props = {
  leads: SerializedLead[]
  onRowClick: (lead: SerializedLead) => void
}

// Format helpers
function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return 'â€”'
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const past = diff > 0
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (mins < 1) return past ? 'just now' : 'in <1m'
  if (mins < 60) return past ? `${mins}m ago` : `in ${mins}m`
  if (hours < 24) return past ? `${hours}h ago` : `in ${hours}h`
  if (days < 7) return past ? `${days}d ago` : `in ${days}d`
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function formatBudget(range: string | undefined): string {
  if (!range) return 'â€”'
  return range
}

// Hot/Warm/Cold dot â€” Commit 2 will compute real temperature.
// For Commit 1 placeholder: derive a quick heuristic from total_calls + last_contacted_at.
function getTemperature(lead: SerializedLead): 'hot' | 'warm' | 'cold' {
```
#### Imports of other components
```tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
```
#### Hooks used
- `useMemo`
- `useState`
### `components/leads/LeadsViewToggle.tsx`
- File line count: 50
#### Exports/components
```tsx
export function LeadsViewToggle({ value, onChange }: Props) {
```
#### Props interfaces
```tsx
type Props = {
  value: LeadsView
  onChange: (view: LeadsView) => void
}

export function LeadsViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
      <Button
        type="button"
        variant={value === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('table')}
        className="h-7 px-2"
      >
        <List className="h-3.5 w-3.5 mr-1" />
        Table
      </Button>
      <Button
        type="button"
        variant={value === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        className="h-7 px-2"
        disabled
        title="Grid view coming in next commit"
      >
        <LayoutGrid className="h-3.5 w-3.5 mr-1" />
        Grid
      </Button>
      <Button
```
#### Imports of other components
```tsx
import { Button } from '@/components/ui/button'
```
#### Hooks used
NOT FOUND
### `components/leads/LeadsWorkspace.tsx`
- File line count: 195
#### Exports/components
```tsx
export function LeadsWorkspace({ allLeads, initialColumns, stats }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const filters: LeadsFilters = useMemo(() => {
    const parseArr = (key: string): string[] => {
      const v = searchParams.get(key)
    const dndRaw = searchParams.get('dnd')
    const dnd: 'all' | 'hide' | 'only' =
  const updateUrl = useCallback(
      const params = new URLSearchParams()
      const qs = params.toString()
  const handleSearchChange = useCallback(
  const handleFiltersChange = useCallback(
  const availableCities = useMemo(() => {
    const set = new Set<string>()
      const c = (l.place || l.location_pref || '').trim()
  const availablePropertyTypes = useMemo(() => {
    const set = new Set<string>()
  const availableSources = useMemo(() => {
    const set = new Set<string>()
  const filteredLeads = useMemo(() => {
        const c = (l.place || l.location_pref || '').trim()
      const q = search.trim().toLowerCase()
        const haystack = [l.name, l.phone, l.email, l.place, l.location_pref]
  function handleRowClick(lead: SerializedLead) {
```
#### Props interfaces
```tsx
type Props = {
  allLeads: SerializedLead[]
  initialColumns: Record<LeadPipelineStage, SerializedLead[]>
  stats: LeadPipelineStats
}

export function LeadsWorkspace({ allLeads, initialColumns, stats }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useLeadsViewPreference()

  // Parse search + filters from URL
  const search = searchParams.get('q') ?? ''
  const filters: LeadsFilters = useMemo(() => {
    const parseArr = (key: string): string[] => {
      const v = searchParams.get(key)
      return v ? v.split(',').filter(Boolean) : []
    }
    const dndRaw = searchParams.get('dnd')
    const dnd: 'all' | 'hide' | 'only' =
      dndRaw === 'hide' || dndRaw === 'only' ? dndRaw : 'all'
    return {
      status: parseArr('status'),
      cities: parseArr('cities'),
      propertyTypes: parseArr('types'),
      sources: parseArr('sources'),
      dnd,
    }
  }, [searchParams])

  // URL update helper
```
#### Imports of other components
```tsx
import { LeadsTable } from './LeadsTable'
import { LeadsSearch } from './LeadsSearch'
import { LeadsFilterBar, type LeadsFilters } from './LeadsFilterBar'
import { LeadsViewToggle } from './LeadsViewToggle'
import { LeadDetailsSheet } from '@/components/LeadDetailsSheet'
```
#### Hooks used
- `useCallback`
- `useLeadsViewPreference`
- `useMemo`
- `useRouter`
- `useSearchParams`
- `useState`

## Section 14 — Auth setup
### `middleware.ts`
```ts
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const ADMIN_ONLY_ROUTES = ['/ai-operations', '/settings/users']

export default auth((req) => {
  const token = req.auth?.user
  const pathname = req.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')

  if (pathname === '/agent-activity') {
    return NextResponse.redirect(new URL('/ai-operations?tab=activity', req.nextUrl.origin))
  }

  // 1. No token = unauthenticated
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'NO_SESSION' },
        { status: 401 }
      )
    }

    const signInUrl = new URL('/auth/signin', req.nextUrl.origin)
    return NextResponse.redirect(signInUrl)
  }

  // 2. Suspended users get a branded page in the UI and JSON for APIs.
  if (token.status === 'suspended' && !pathname.startsWith('/auth/suspended')) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'ACCOUNT_SUSPENDED' },
        { status: 403 }
      )
    }

    const suspendedUrl = new URL('/auth/suspended', req.nextUrl.origin)
    return NextResponse.redirect(suspendedUrl)
  }

  // 3. Pending approval users get the welcome page in the UI and JSON for APIs.
  if (token.status === 'pending_approval' && pathname !== '/welcome') {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'PENDING_APPROVAL' },
        { status: 403 }
      )
    }

    const welcomeUrl = new URL('/welcome', req.nextUrl.origin)
    return NextResponse.redirect(welcomeUrl)
  }

  // 4. Role-based route gating
  const role = token.role

  if (role === 'broker' && ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    const leadsUrl = new URL('/leads', req.nextUrl.origin)
    return NextResponse.redirect(leadsUrl)
  }

  if (role === 'tech' && pathname.startsWith('/settings/users')) {
    const rootUrl = new URL('/', req.nextUrl.origin)
    return NextResponse.redirect(rootUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - /api/auth/*      (NextAuth endpoints)
     * - /api/cron/*      (secured by x-cron-secret)
     * - /api/vapi/*      (secured by Vapi signature in Phase 12)
     * - /api/health      (public health check)
     * - /auth/*          (signin/signup pages)
     * - /_next/*         (Next.js internals)
     * - /favicon.ico, /robots.txt, etc.
     */
    '/((?!api/auth|api/cron|api/vapi|api/health|auth/signin|_next|favicon.ico|robots.txt).*)',
  ],
}
```
### `lib/auth/requireBroker.ts`
```ts
import type { Session } from "next-auth";

export class BrokerScopeMissingError extends Error {
  code = "BROKER_SCOPE_MISSING" as const;
  constructor() {
    super("No broker_id on session and no DEFAULT_BROKER_ID env var set.");
    this.name = "BrokerScopeMissingError";
  }
}

/**
 * Returns the broker_id for the current request.
 * Priority: session.user.broker_id > process.env.DEFAULT_BROKER_ID > throw.
 *
 * Single-broker company today; will become per-broker scoping in Phase 7E.
 */
export function requireBrokerId(session: Session | null | undefined): string {
  const fromSession = (session?.user as any)?.broker_id;
  const fromEnv = process.env.DEFAULT_BROKER_ID;
  const id = fromSession || fromEnv;
  if (!id) throw new BrokerScopeMissingError();
  return id;
}
```
### `lib/auth/roles.ts`
```ts
export type Role = 'admin' | 'tech' | 'broker'

const BASE_NAV = [
  '/',
  '/leads',
  '/clients',
  '/properties',
  '/campaigns',
  '/appointments',
  '/calls',
  '/ai-operations',
  '/kb',
  '/analytics',
  '/settings',
]

const ADMIN_NAV = [...BASE_NAV, '/settings/users']

// Brokers cannot see AI Ops (full reasoning traces, system internals)
const BROKER_NAV = [
  '/',
  '/leads',
  '/clients',
  '/properties',
  '/campaigns',
  '/appointments',
  '/calls',
  '/kb',
  '/analytics',
  '/settings',
]

export const VISIBILITY: Record<
  Role,
  {
    nav: string[]
    canForceRun: boolean
    canViewReasoning: boolean
    canViewCosts: boolean
    canManageUsers: boolean
    canManageSettings: boolean
  }
> = {
  admin: {
    nav: ADMIN_NAV,
    canForceRun: true,
    canViewReasoning: true,
    canViewCosts: true,
    canManageUsers: true,
    canManageSettings: true,
  },
  tech: {
    nav: BASE_NAV,
    canForceRun: true,
    canViewReasoning: true,
    canViewCosts: true,
    canManageUsers: false,
    canManageSettings: true,
  },
  broker: {
    nav: BROKER_NAV,
    canForceRun: false,
    canViewReasoning: false,
    canViewCosts: false,
    canManageUsers: false,
    canManageSettings: false,
  },
}

export function getDefaultLanding(role: Role): string {
  switch (role) {
    case 'admin':
      return '/'
    case 'tech':
      return '/ai-operations'
    case 'broker':
      return '/leads'
  }
}
```
### `lib/auth/useUserRole.ts`
```ts
'use client'

import { useSession } from 'next-auth/react'
import { VISIBILITY, type Role } from './roles'

const EMPTY_VISIBILITY = {
  nav: [],
  canForceRun: false,
  canViewReasoning: false,
  canViewCosts: false,
  canManageUsers: false,
  canManageSettings: false,
}

export function useUserRole() {
  let sessionState: ReturnType<typeof useSession> | null = null

  try {
    sessionState = useSession()
  } catch {
    sessionState = null
  }

  const session = sessionState?.data ?? null
  const status = sessionState?.status ?? 'unauthenticated'

  const isLoading = status === 'loading'
  const rawRole = session?.user?.role as Role | undefined
  const role = rawRole && rawRole in VISIBILITY ? rawRole : null
  const permissions = role ? VISIBILITY[role] : EMPTY_VISIBILITY
  const can = {
    ...permissions,
    forceRun: permissions.canForceRun,
    viewReasoning: permissions.canViewReasoning,
    viewCosts: permissions.canViewCosts,
    manageUsers: permissions.canManageUsers,
    manageSettings: permissions.canManageSettings,
  }

  return {
    role,
    can,
    isLoading,
    user: session?.user || null,
  }
}
```
### Guard body `requireBroker` - `app/actions/clients.ts:9`
```ts
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker';
```
### Guard body `requireBroker` - `app/api/campaigns/trigger/route.ts:8`
```ts
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
```
### Guard body `requireBroker` - `app/api/clients/route.ts:6`
```ts
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
```
### Guard body `requireBroker` - `app/api/leads/route.ts:8`
```ts
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
```
### Guard body `requireBroker` - `app/api/leads/webhook/route.ts:5`
```ts
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
```
### Guard body `requireBroker` - `docs/gharsoch_stage1_master_brief_for_opus.md:259`
```md
- NEW FILE: `lib/auth/requireBroker.ts`
- Find every API route that creates leads or triggers calls (search for `db.leads.insertOne`, `Lead.create`, `triggerCampaignCall`, `triggerOutboundCall`)
- Read-only: existing auth setup in `auth.ts` or `lib/auth/*` to confirm Session type

**Steps:**

â˜ T5.1 â€” Create `lib/auth/requireBroker.ts`:
```ts
import type { Session } from "next-auth";
```

## Section 15 — Scripts folder
### `scripts/count_properties.js`
- Size: 14 lines
```js
const { MongoClient } = require('mongodb');

(async () => {
  const url = process.env.DATABASE_URL || process.argv[2];
  if (!url) { console.error('Pass DATABASE_URL as env or arg'); process.exit(1); }
  const c = new MongoClient(url);
  await c.connect();
  const db = c.db('test');
  const total = await db.collection('properties').countDocuments({});
  const live = await db.collection('properties').countDocuments({ is_deleted: { $ne: true } });
```
### `scripts/create_indexes.js`
- Size: 87 lines
```js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function createIndexes() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL is not set in .env');
    return;
  }

```
### `scripts/diagnose_users.js`
- Size: 19 lines
```js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();

  const users = await db.collection('users').find({}, {
    projection: { email: 1, role: 1, status: 1, created_at: 1 }
```
### `scripts/init_collections.js`
- Size: 50 lines
```js
// DEV ONLY â€” never run in production against live data
// Run this ONCE to initialize the agent_logs collection in Cosmos DB
// Usage: node scripts/init_collections.js

const { MongoClient } = require('mongodb')

const uri = process.env.DATABASE_URL || require('fs').readFileSync('.env', 'utf8')
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.split('=').slice(1).join('=')?.trim()
```
### `scripts/mongo_dump.js`
- Size: 36 lines
```js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || process.argv[2];
const outputDir = process.env.DUMP_OUTPUT_DIR || process.argv[3] || './dump';

if (!url) {
  console.error('Usage: DATABASE_URL=<url> node mongo_dump.js [outputDir]');
  process.exit(1);
```
### `scripts/mongo_import.js`
- Size: 49 lines
```js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || process.argv[2];
const inputDir = process.env.IMPORT_DIR || process.argv[3] || './dump';

if (!url) {
  console.error('Usage: DATABASE_URL=<url> node mongo_import.js [inputDir]');
  process.exit(1);
```

## Section 16 — Recent git history
### git log --oneline -n 30
```text
dff70d0 feat(leads): Commit 1 - multi-view workspace with table, search, filters (UX-Phase1)
77b16ee fix(cooldown): add source-aware cooldown to reminders cron (Z14b)
f6180bd Revert "feat(ui): SystemMap V1 - SVG edge layer with active/idle states (U-SysMap2)"
b380dc5 feat(ui): SystemMap V1 - SVG edge layer with active/idle states (U-SysMap2)
323b6bb fix(ui): correct Kanban drag alignment - remove transform, use closestCorners (U-Lead2)
a8927a7 feat(ui): clickable stat cards with per-agent breakdown popovers (U-AIOps-stats)
93a1652 fix(ui): SysMap dead nodes now show empty-state drawer with agent context (U-SysMap1)
1978145 fix(ui): prevent agent cards from stretching to row-tallest height (U-AIOps1)
78c2b9a chore(git): remove planning docs + .cursor/ workspace from tracking
915f215 fix(ui): dim source card to 0.4 opacity during drag (U-Lead1)
2cce9cc chore(repo): remove debug artifacts + preserve infra scripts
f1f473d chore(repo): V2 migration cleanup — remove scratch, junk, harden .gitignore
4637d89 fix(deploy): disable Oryx build to use pre-built standalone artifact
d94e53a trigger: re-run deploys with portal-downloaded publish profiles
7790639 trigger: re-run deploys with portal-downloaded publish profiles
17027e2 fix(build): trigger deploy with verified standalone config
ddf0ca9 fix(ci): downgrade azure/webapps-deploy to v2 (v3 forces slot-name)
dc5b7ea trigger after profile re-upload
49f70f5 fix(ci): remove slot-name (B1 tier doesn't support deployment slots)
0a9181c trigger: re-run V2 deploys after publish profile fix
a6d4cfa chore: trigger deployment pipelines
aff35b5 chore: ignore sensitive migration and config files
9bd9986 migrate to new azure subscription
23c0fa8 fix(vapi): inject current_datetime + current_date_human_ist into assistant variables (Z13/Z15)
0875939 fix(properties-lifecycle): cascade delete + filter soft-deleted + safe API DELETE (B14-properties + B20 + B24 + B25)
41587f0 fix(re-engage): filter soft-deleted leads from dead lead reactivation cron (B23)
afbbf5a fix(appointments): count cards match list semantics + B16 leak filters (B19)
bbb484f fix(appointment): sanity guard rejects dates outside today->today+90d window (Z13)
3f02112 fix(cooldown): exclude superseded calls from cooldown checks (Z14)
c4bbe9c fix(lifecycle): unify soft-delete convention to is_deleted across client paths (B14+B16 followup)
```
### git log --since="2026-05-15" --pretty=format:"%h %ad %s" --date=short
```text
dff70d0 2026-05-17 feat(leads): Commit 1 - multi-view workspace with table, search, filters (UX-Phase1)
77b16ee 2026-05-17 fix(cooldown): add source-aware cooldown to reminders cron (Z14b)
f6180bd 2026-05-17 Revert "feat(ui): SystemMap V1 - SVG edge layer with active/idle states (U-SysMap2)"
b380dc5 2026-05-17 feat(ui): SystemMap V1 - SVG edge layer with active/idle states (U-SysMap2)
323b6bb 2026-05-17 fix(ui): correct Kanban drag alignment - remove transform, use closestCorners (U-Lead2)
a8927a7 2026-05-17 feat(ui): clickable stat cards with per-agent breakdown popovers (U-AIOps-stats)
93a1652 2026-05-17 fix(ui): SysMap dead nodes now show empty-state drawer with agent context (U-SysMap1)
1978145 2026-05-17 fix(ui): prevent agent cards from stretching to row-tallest height (U-AIOps1)
78c2b9a 2026-05-17 chore(git): remove planning docs + .cursor/ workspace from tracking
915f215 2026-05-17 fix(ui): dim source card to 0.4 opacity during drag (U-Lead1)
2cce9cc 2026-05-17 chore(repo): remove debug artifacts + preserve infra scripts
f1f473d 2026-05-16 chore(repo): V2 migration cleanup — remove scratch, junk, harden .gitignore
4637d89 2026-05-15 fix(deploy): disable Oryx build to use pre-built standalone artifact
d94e53a 2026-05-15 trigger: re-run deploys with portal-downloaded publish profiles
7790639 2026-05-15 trigger: re-run deploys with portal-downloaded publish profiles
17027e2 2026-05-15 fix(build): trigger deploy with verified standalone config
ddf0ca9 2026-05-15 fix(ci): downgrade azure/webapps-deploy to v2 (v3 forces slot-name)
dc5b7ea 2026-05-15 trigger after profile re-upload
49f70f5 2026-05-15 fix(ci): remove slot-name (B1 tier doesn't support deployment slots)
0a9181c 2026-05-15 trigger: re-run V2 deploys after publish profile fix
a6d4cfa 2026-05-15 chore: trigger deployment pipelines
aff35b5 2026-05-15 chore: ignore sensitive migration and config files
```
### git branch -a
```text
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
```
### git status
```text
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	gharsoch_codebase_facts.md

nothing added to commit but untracked files present (use "git add" to track)
```

## Section 17 — Build & deploy config
### `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Keep compiled pages in memory longer in dev (default: 15s â†’ 1 hour)
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },

  // Optimize for faster builds
  swcMinify: true,

  // Reduce build time by skipping type checking (run separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during builds (run separately)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize images
  images: {
    unoptimized: true,
  },

  // Enable experimental features for faster dev
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'recharts',
      'date-fns',
    ],
  },
}

module.exports = nextConfig
```
### `next.config.mjs`
NOT FOUND
### `tsconfig.json`
```json
{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "strictNullChecks": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```
### `.eslintrc.json`
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["react-icons", "react-icons/*"],
            "message": "react-icons is banned. Use lucide-react instead: import { IconName } from 'lucide-react'"
          }
        ]
      }
    ]
  }
}
```
### `azure/functions/.azurite/__azurite_db_blob__.json`
```json
{"filename":"c:\\Users\\anura\\iCloudDrive\\GharSoch\\gharsoch-web\\azure\\functions\\.azurite\\__azurite_db_blob__.json","collections":[{"name":"$SERVICES_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{},"constraints":null,"uniqueNames":["accountName"],"transforms":{},"objType":"$SERVICES_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]},{"name":"$CONTAINERS_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"accountName":{"name":"accountName","dirty":false,"values":[]},"name":{"name":"name","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$CONTAINERS_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]},{"name":"$BLOBS_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"accountName":{"name":"accountName","dirty":false,"values":[]},"containerName":{"name":"containerName","dirty":false,"values":[]},"name":{"name":"name","dirty":false,"values":[]},"snapshot":{"name":"snapshot","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$BLOBS_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]},{"name":"$BLOCKS_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"accountName":{"name":"accountName","dirty":false,"values":[]},"containerName":{"name":"containerName","dirty":false,"values":[]},"blobName":{"name":"blobName","dirty":false,"values":[]},"name":{"name":"name","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$BLOCKS_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]}],"databaseVersion":1.5,"engineVersion":1.5,"autosave":true,"autosaveInterval":5000,"autosaveHandle":null,"throttledSaves":true,"options":{"persistenceMethod":"fs","autosave":true,"autosaveInterval":5000,"serializationMethod":"normal","destructureDelimiter":"$<\n"},"persistenceMethod":"fs","persistenceAdapter":null,"verbose":false,"events":{"init":[null],"loaded":[],"flushChanges":[],"close":[],"changes":[],"warning":[]},"ENV":"NODEJS"}
```
### `azure/functions/.azurite/__azurite_db_blob_extent__.json`
```json
{"filename":"c:\\Users\\anura\\iCloudDrive\\GharSoch\\gharsoch-web\\azure\\functions\\.azurite\\__azurite_db_blob_extent__.json","collections":[{"name":"$EXTENTS_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"id":{"name":"id","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$EXTENTS_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]}],"databaseVersion":1.5,"engineVersion":1.5,"autosave":true,"autosaveInterval":5000,"autosaveHandle":null,"throttledSaves":true,"options":{"persistenceMethod":"fs","autosave":true,"autosaveInterval":5000,"serializationMethod":"normal","destructureDelimiter":"$<\n"},"persistenceMethod":"fs","persistenceAdapter":null,"verbose":false,"events":{"init":[null],"loaded":[],"flushChanges":[],"close":[],"changes":[],"warning":[]},"ENV":"NODEJS"}
```
### `azure/functions/.azurite/__azurite_db_queue__.json`
```json
{"filename":"c:\\Users\\anura\\iCloudDrive\\GharSoch\\gharsoch-web\\azure\\functions\\.azurite\\__azurite_db_queue__.json","collections":[{"name":"$SERVICES_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{},"constraints":null,"uniqueNames":["accountName"],"transforms":{},"objType":"$SERVICES_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]},{"name":"$QUEUES_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"accountName":{"name":"accountName","dirty":false,"values":[]},"name":{"name":"name","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$QUEUES_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]},{"name":"$MESSAGES_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"accountName":{"name":"accountName","dirty":false,"values":[]},"queueName":{"name":"queueName","dirty":false,"values":[]},"messageId":{"name":"messageId","dirty":false,"values":[]},"visibleTime":{"name":"visibleTime","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$MESSAGES_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]}],"databaseVersion":1.5,"engineVersion":1.5,"autosave":true,"autosaveInterval":5000,"autosaveHandle":null,"throttledSaves":true,"options":{"persistenceMethod":"fs","autosave":true,"autosaveInterval":5000,"serializationMethod":"normal","destructureDelimiter":"$<\n"},"persistenceMethod":"fs","persistenceAdapter":null,"verbose":false,"events":{"init":[null],"loaded":[],"flushChanges":[],"close":[],"changes":[],"warning":[]},"ENV":"NODEJS"}
```
### `azure/functions/.azurite/__azurite_db_queue_extent__.json`
```json
{"filename":"c:\\Users\\anura\\iCloudDrive\\GharSoch\\gharsoch-web\\azure\\functions\\.azurite\\__azurite_db_queue_extent__.json","collections":[{"name":"$EXTENTS_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"id":{"name":"id","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$EXTENTS_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]}],"databaseVersion":1.5,"engineVersion":1.5,"autosave":true,"autosaveInterval":5000,"autosaveHandle":null,"throttledSaves":true,"options":{"persistenceMethod":"fs","autosave":true,"autosaveInterval":5000,"serializationMethod":"normal","destructureDelimiter":"$<\n"},"persistenceMethod":"fs","persistenceAdapter":null,"verbose":false,"events":{"init":[null],"loaded":[],"flushChanges":[],"close":[],"changes":[],"warning":[]},"ENV":"NODEJS"}
```
### `azure/functions/.azurite/__azurite_db_table__.json`
```json
{"filename":"c:\\Users\\anura\\iCloudDrive\\GharSoch\\gharsoch-web\\azure\\functions\\.azurite\\__azurite_db_table__.json","collections":[{"name":"$TABLES_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{"account":{"name":"account","dirty":false,"values":[]},"table":{"name":"table","dirty":false,"values":[]}},"constraints":null,"uniqueNames":[],"transforms":{},"objType":"$TABLES_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]},{"name":"$SERVICES_COLLECTION$","data":[],"idIndex":null,"binaryIndices":{},"constraints":null,"uniqueNames":["accountName"],"transforms":{},"objType":"$SERVICES_COLLECTION$","dirty":false,"cachedIndex":null,"cachedBinaryIndex":null,"cachedData":null,"adaptiveBinaryIndices":true,"transactional":false,"cloneObjects":false,"cloneMethod":"parse-stringify","asyncListeners":false,"disableMeta":false,"disableChangesApi":true,"disableDeltaChangesApi":true,"autoupdate":false,"serializableIndices":true,"disableFreeze":true,"ttl":null,"maxId":0,"DynamicViews":[],"events":{"insert":[],"update":[],"pre-insert":[],"pre-update":[],"close":[],"flushbuffer":[],"error":[],"delete":[null],"warning":[null]},"changes":[],"dirtyIds":[]}],"databaseVersion":1.5,"engineVersion":1.5,"autosave":true,"autosaveInterval":5000,"autosaveHandle":null,"throttledSaves":true,"options":{"persistenceMethod":"fs","autosave":true,"autosaveInterval":5000,"serializationMethod":"normal","destructureDelimiter":"$<\n"},"persistenceMethod":"fs","persistenceAdapter":null,"verbose":false,"events":{"init":[null],"loaded":[],"flushChanges":[],"close":[],"changes":[],"warning":[]},"ENV":"NODEJS"}
```
### `azure/functions/followup/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%FOLLOWUP_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/followup/index.js"
}

```
### `azure/functions/host.json`
```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "functionTimeout": "00:05:00",
  "retry": {
    "strategy": "exponentialBackoff",
    "maxRetryCount": 3,
    "minimumInterval": "00:00:10",
    "maximumInterval": "00:01:00"
  }
}
```
### `azure/functions/local.settings.json`
```json
{
    "IsEncrypted":  false,
    "Values":  {
                   "GHARSOCH_API_BASE":  "http://localhost:3000",
                   "FUNCTIONS_WORKER_RUNTIME":  "node",
                   "AzureWebJobsStorage":  "UseDevelopmentStorage=true",
                   "CRON_SECRET":  "wjIEb1hNCtpF9OHr56oyVZKXAsGYzWcPJBmgvd8qxkL7TUifa20SDl4RuMQn3e",
                   "WEBSITE_NODE_DEFAULT_VERSION":  "~20",
                   "WEBSITE_TIME_ZONE":  "India Standard Time"
               }
}
```
### `azure/functions/matchmaker/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%MATCHMAKER_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/matchmaker/index.js"
}

```
### `azure/functions/package.json`
```json
{
  "name": "gharsoch-azure-functions",
  "version": "1.0.0",
  "description": "Azure Timer Functions â€” cron wiring for GharSoch agent routes",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "prestart": "npm run build",
    "start": "func start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@azure/functions": "^3.5.1"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  },
  "engines": {
    "node": ">=20"
  }
}
```
### `azure/functions/package-lock.json`
```json
{
  "name": "gharsoch-azure-functions",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "gharsoch-azure-functions",
      "version": "1.0.0",
      "dependencies": {
        "@azure/functions": "^3.5.1"
      },
      "devDependencies": {
        "typescript": "^5.4.5"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/@azure/functions": {
      "version": "3.5.1",
      "resolved": "https://registry.npmjs.org/@azure/functions/-/functions-3.5.1.tgz",
      "integrity": "sha512-6UltvJiuVpvHSwLcK/Zc6NfUwlkDLOFFx97BHCJzlWNsfiWwzwmTsxJXg4kE/LemKTHxPpfoPE+kOJ8hAdiKFQ==",
      "license": "MIT",
      "dependencies": {
        "iconv-lite": "^0.6.3",
        "long": "^4.0.0",
        "uuid": "^8.3.0"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/long": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/long/-/long-4.0.0.tgz",
      "integrity": "sha512-XsP+KhQif4bjX1kbuSiySJFNAehNxgLb6hPRGJ9QsUr8ajHkuXGdrHmFUTUUXhDwVX2R5bY4JNZEwbUiMhV+MA==",
      "license": "Apache-2.0"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/uuid": {
      "version": "8.3.2",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-8.3.2.tgz",
      "integrity": "sha512-+NYs2QeMWy+GWFOEm9xnn6HCDp0l7QBD7ml8zLUmJ+93Q5NF0NocErnwkTkXVFNiX3/fpC6afS8Dhb/gz7R7eg==",
      "deprecated": "uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).",
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    }
  }
}
```
### `azure/functions/reengage/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%REENGAGE_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/reengage/index.js"
}

```
### `azure/functions/reminders/function.json`
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "%REMINDERS_SCHEDULE%",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/reminders/index.js"
}

```
### `azure/functions/tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```
### `components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```
### `data/demo-kb.json`
```json
{
  "listings": [
    {
      "id": "blr-prestige-lakeside-3bhk",
      "city": "Bangalore",
      "locality": "Whitefield",
      "builder": "Prestige",
      "project": "Prestige Lakeside Habitat",
      "property_type": "Apartment",
      "config": "3 BHK",
      "status": "ReadyToMove",
      "price_inr": 15500000,
      "area_sqft": 1655,
      "hoa_inr_per_month": 5500,
      "amenities": ["clubhouse", "pool", "gym", "security", "children_play_area"],
      "highlights": [
        "Large integrated township",
        "Strong resale demand in Whitefield micro-market"
      ],
      "nearby": ["ITPL", "Whitefield Metro", "International schools"],
      "notes": "Typical negotiation band 2â€“5% depending on inventory."
    },
    {
      "id": "blr-godrej-ananda-2bhk",
      "city": "Bangalore",
      "locality": "Aerospace Park (North Bangalore)",
      "builder": "Godrej",
      "project": "Godrej Ananda",
      "property_type": "Apartment",
      "config": "2 BHK",
      "status": "UnderConstruction",
      "price_inr": 9800000,
      "area_sqft": 1100,
      "hoa_inr_per_month": 4200,
      "amenities": ["clubhouse", "pool", "co-working", "security"],
      "highlights": [
        "North Bangalore growth corridor",
        "Good for long-term appreciation near airport"
      ],
      "nearby": ["Kempegowda International Airport", "Hebbal flyover"],
      "notes": "Payment plan varies by tower; confirm tranche schedule."
    },
    {
      "id": "ggn-dlf-garden-city-3bhk",
      "city": "Gurgaon",
      "locality": "Sector 91",
      "builder": "DLF",
      "project": "DLF Garden City",
      "property_type": "Apartment",
      "config": "3 BHK",
      "status": "ReadyToMove",
      "price_inr": 18500000,
      "area_sqft": 1750,
      "hoa_inr_per_month": 6500,
      "amenities": ["clubhouse", "security", "power_backup", "parking"],
      "highlights": ["DLF brand premium", "Family-friendly community"],
      "nearby": ["Dwarka Expressway", "NH-48"],
      "notes": "Check maintenance escalation clauses in society bylaws."
    },
    {
      "id": "mum-lodha-powai-2bhk",
      "city": "Mumbai",
      "locality": "Powai",
      "builder": "Lodha",
      "project": "Lodha Powai",
      "property_type": "Apartment",
      "config": "2 BHK",
      "status": "UnderConstruction",
      "price_inr": 26500000,
      "area_sqft": 860,
      "hoa_inr_per_month": 8000,
      "amenities": ["clubhouse", "pool", "security", "concierge"],
      "highlights": ["Premium Powai catchment", "Strong rental demand"],
      "nearby": ["Hiranandani Gardens", "JVLR"],
      "notes": "Mumbai deals depend heavily on carpet area and view premium."
    }
  ],
  "project_briefs": [
    {
      "id": "brief-prestige-lakeside",
      "title": "Prestige Lakeside Habitat â€” quick brief",
      "content": "Integrated township in Whitefield with strong amenities. Common buyer questions: maintenance/HOA, school access, commute to ITPL, resale liquidity. Typical objections: 'too far', 'maintenance high', 'waiting for spouse approval'."
    },
    {
      "id": "brief-godrej-ananda",
      "title": "Godrej Ananda â€” quick brief",
      "content": "North Bangalore near Aerospace Park corridor. Good for long-term horizon. Common questions: possession timeline, tranche payment plan, pre-EMI impact. Objections: 'airport area is too early', 'traffic'."
    }
  ],
  "playbooks": [
    {
      "id": "playbook-spousal-objection",
      "title": "Spousal objection handling",
      "content": "Acknowledge decision-making. Offer a joint call slot. Summarize top 3 pros aligned to their priorities. Confirm next step: schedule a 10â€“15 min joint call or a site visit."
    },
    {
      "id": "playbook-price-objection",
      "title": "Pricing objection handling",
      "content": "Reframe to monthly outflow + value. Offer alternatives in same locality or adjacent micro-market. Ask if budget is fixed or flexible for the right project."
    }
  ],
  "compliance": [
    {
      "id": "tcpa-consent",
      "title": "Consent & opt-out",
      "content": "Capture explicit consent to contact for future matching properties. If user says STOP/QUIT/CANCEL, immediately mark Do-Not-Call and end outreach."
    }
  ]
}

```
### `package.json`
```json
{
  "name": "nextjs-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo -p 3000",
    "build": "next build",
    "start": "node server.js",
    "lint": "next lint"
  },
  "dependencies": {
    "@auth/mongodb-adapter": "^3.11.2",
    "@azure/identity": "^4.13.1",
    "@azure/storage-blob": "^12.31.0",
    "@dnd-kit/core": "^6.3.1",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tanstack/react-table": "^8.20.5",
    "@vapi-ai/web": "^2.5.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "googleapis": "^171.4.0",
    "input-otp": "^1.4.2",
    "jose": "^6.2.2",
    "lucide-react": "^0.441.0",
    "mongodb": "^5.9.2",
    "next": "14.2.23",
    "next-auth": "^5.0.0-beta.31",
    "next-themes": "^0.4.6",
    "openai": "^6.34.0",
    "puppeteer": "^24.43.0",
    "react": "^18.3.1",
    "react-day-picker": "^9.13.0",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.71.1",
    "react-icons": "^5.3.0",
    "react-resizable-panels": "^4.5.3",
    "recharts": "^2.15.4",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "xlsx": "^0.18.5",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@netlify/plugin-nextjs": "^5.15.8",
    "@types/node": "^20.16.5",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "dotenv": "^17.4.2",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.23",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.6.2"
  }
}
```
### `tsconfig.json`
```json
{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "strictNullChecks": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```
### `workflow.json`
```json
{
  "workflow": {
    "nodes": [
      {"id": "input_node", "type": "Input", "label": "Inbound Call / CRM Webhook", "nodeCategory": "input"},
      {"id": "manager_agent", "type": "Agent", "label": "Voice Orchestrator", "nodeCategory": "agent", "agent_id": "69e8f73cd8820b5d0188ed99"},
      {"id": "lead_agent", "type": "Agent", "label": "Lead Qualification", "nodeCategory": "agent", "agent_id": "69e8f707f89cad5d4b752d22"},
      {"id": "financial_agent", "type": "Agent", "label": "Financial Advisory", "nodeCategory": "agent", "agent_id": "69e8f7086aa016932b1c1a83"},
      {"id": "property_agent", "type": "Agent", "label": "Property Search", "nodeCategory": "agent", "agent_id": "69e8f709d2531e39b8b15889"},
      {"id": "calendar_agent", "type": "Agent", "label": "Calendar Scheduling", "nodeCategory": "agent", "agent_id": "69e8f71ed8820b5d0188ed95"},
      {"id": "sync_agent", "type": "Agent", "label": "Post-Call Sync", "nodeCategory": "agent", "agent_id": "69e8f709f89cad5d4b752d24"},
      {"id": "reengagement_agent", "type": "Agent", "label": "Re-engagement", "nodeCategory": "agent", "agent_id": "69e8f70a86926aed0100ba92"},
      {"id": "selfservice_agent", "type": "Agent", "label": "Self-Service Advisor", "nodeCategory": "agent", "agent_id": "69e8f709f89cad5d4b752d26"},
      {"id": "output_node", "type": "Output", "label": "Output", "nodeCategory": "end"}
    ],
    "edges": [
      {"source": "input_node", "target": "manager_agent"},
      {"source": "manager_agent", "target": "lead_agent"},
      {"source": "manager_agent", "target": "financial_agent"},
      {"source": "manager_agent", "target": "property_agent"},
      {"source": "manager_agent", "target": "calendar_agent"},
      {"source": "manager_agent", "target": "sync_agent"},
      {"source": "sync_agent", "target": "reengagement_agent"},
      {"source": "reengagement_agent", "target": "selfservice_agent"},
      {"source": "selfservice_agent", "target": "output_node"}
    ]
  },
  "agents": {
    "voice_orchestrator": {
      "agent_id": "69e8f73cd8820b5d0188ed99",
      "name": "Voice Conversation Orchestrator",
      "type": "voice",
      "provider": "openai",
      "model": "gpt-4.1",
      "managed_agents": ["69e8f707f89cad5d4b752d22", "69e8f7086aa016932b1c1a83", "69e8f709d2531e39b8b15889", "69e8f71ed8820b5d0188ed95"]
    },
    "lead_qualification": {
      "agent_id": "69e8f707f89cad5d4b752d22",
      "name": "Lead Qualification & Objection Agent",
      "type": "json",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6"
    },
    "financial_advisory": {
      "agent_id": "69e8f7086aa016932b1c1a83",
      "name": "GharSoch Financial Advisory Agent",
      "type": "json",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6"
    },
    "property_search": {
      "agent_id": "69e8f709d2531e39b8b15889",
      "name": "Property Search Agent",
      "type": "json",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "has_knowledge_base": true
    },
    "calendar_scheduling": {
      "agent_id": "69e8f71ed8820b5d0188ed95",
      "name": "Calendar Scheduling Agent",
      "type": "json",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "tools": ["GOOGLECALENDAR_FIND_FREE_SLOTS", "GOOGLECALENDAR_CREATE_EVENT", "GOOGLECALENDAR_LIST_EVENTS"]
    },
    "post_call_sync": {
      "agent_id": "69e8f709f89cad5d4b752d24",
      "name": "Post-Call Sync Agent",
      "type": "json",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6"
    },
    "reengagement": {
      "agent_id": "69e8f70a86926aed0100ba92",
      "name": "Property Re-engagement Agent",
      "type": "json",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "has_knowledge_base": true,
      "scheduled": true
    },
    "self_service": {
      "agent_id": "69e8f709f89cad5d4b752d26",
      "name": "GharSoch Self-Service Advisor",
      "type": "json",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6"
    }
  }
}
```
### `workflow_state.json`
```json
{
  "app_name": "KnowledgeBase MVP Demo",
  "agents": [
    {
      "agent_id": "69e8fd92bb1a2df4e7d39aee",
      "name": "KB Assistant",
      "description": "A knowledge base Q&A assistant that answers questions based on uploaded documents",
      "model": "gpt-4.1",
      "provider": "openai",
      "temperature": 0.3,
      "top_p": 0.9,
      "has_knowledge_base": true,
      "rag_id": "69e8fd87aa9f34bdaf6dce23",
      "rag_name": "demoknowledgebasemgc8"
    }
  ],
  "agent_ids": {
    "kb_assistant": "69e8fd92bb1a2df4e7d39aee"
  },
  "rag_ids": {
    "demo_knowledge_base": "69e8fd87aa9f34bdaf6dce23",
    "demo_knowledge_base_name": "demoknowledgebasemgc8"
  },
  "knowledge_bases": [
    {
      "rag_id": "69e8fd87aa9f34bdaf6dce23",
      "rag_name": "demoknowledgebasemgc8",
      "name": "demo_knowledge_base",
      "description": "Demo knowledge base for MVP - stores uploaded documents for Q&A"
    }
  ],
  "workflow": {
    "nodes": [
      {"id": "input_node", "type": "Input", "label": "User Question", "nodeCategory": "input"},
      {"id": "kb_assistant_agent", "type": "Agent", "label": "KB Assistant", "nodeCategory": "agent"},
      {"id": "output_node", "type": "Output", "label": "KB Response", "nodeCategory": "end"}
    ],
    "edges": [
      {"source": "input_node", "target": "kb_assistant_agent"},
      {"source": "kb_assistant_agent", "target": "output_node"}
    ]
  }
}
```

## Section 18 — Known TODOs / FIXMEs
### `app/api/cron/reminders/route.ts:112`
```ts
          }

          // Z14b: prevent duplicate reminder calls (30-min loop-prevention)
          const recentReminder = await leadHasRecentOutboundCall(
            lead._id,
```

## Section 19 — Test infrastructure (if any)
- `lib/agents/__tests__/matchmaker.test.ts`
- `lib/agents/__tests__/matchmaker_logic.test.ts`

## Section 20 — Open questions for human
- `src/`: NOT FOUND; repo uses root-level App Router directories such as `app/`, `lib/`, `components/`, `models/`.
- `ARCHIVE_DAYS_OLD`: referenced in code at `app/api/cron/archive/route.ts:21` but not present by exact name in `.env.example`.
- `BOOTSTRAP_ADMIN_EMAIL`: referenced in code at `lib/auth.ts:58` but not present by exact name in `.env.example`.
- `DEFAULT_BROKER_ID`: referenced in code at `lib/auth/requireBroker.ts:13` but not present by exact name in `.env.example`.
- `GOOGLE_CLIENT_ID`: referenced in code at `lib/auth.ts:37` but not present by exact name in `.env.example`.
- `GOOGLE_CLIENT_SECRET`: referenced in code at `lib/auth.ts:38` but not present by exact name in `.env.example`.
- `IMMEDIATE_CALL_AFTER_MATCH`: referenced in code at `lib/agents/matchmaker.ts:245` but not present by exact name in `.env.example`.
- `IS_PAID_USER`: referenced in code at `app/layout.tsx:22` but not present by exact name in `.env.example`.
- `NEXT_PHASE`: referenced in code at `lib/envCheck.ts:16` but not present by exact name in `.env.example`.
- `NEXT_PUBLIC_AGENT_ID`: referenced in code at `hooks/useAgent.ts:128` but not present by exact name in `.env.example`.
- `NEXT_PUBLIC_ENABLE_VOICE_ORCHESTRATOR`: referenced in code at `app/(admin)/ai-operations/page.tsx:62` but not present by exact name in `.env.example`.
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID`: referenced in code at `app/sections/VoiceCallPanel.tsx:144` but not present by exact name in `.env.example`.
- `NODE_ENV`: referenced in code at `app/api/vapi/webhook/route.ts:64` but not present by exact name in `.env.example`.
- `VAPI_ASSISTANT_CALLBACK_ID`: referenced in code at `app/api/cron/follow-up/route.ts:172` but not present by exact name in `.env.example`.
- `VAPI_WEBHOOK_SECRET`: referenced in code at `app/api/vapi/webhook/route.ts:36` but not present by exact name in `.env.example`.
