/**
 * scripts/patch-livekit.js
 *
 * Patches two bugs in @livekit/agents that affect Windows + browser WebRTC calls.
 * Run automatically via `postinstall` in package.json.
 *
 * Bug 1 (job_proc_lazy_main.js):
 *   On Windows, pathToFileURL().pathname produces '/D:/path' which Node resolves as
 *   'D:\D:\path' — crashing every job child process (ERR_IPC_CHANNEL_CLOSED).
 *   Fix: use .href instead of .pathname.
 *
 * Bug 2 (_input.js):
 *   ParticipantAudioInputStream only subscribes to SOURCE_MICROPHONE tracks.
 *   Browser WebRTC clients (meet.livekit.io) sometimes publish as SOURCE_UNKNOWN (0)
 *   or other values, so customer audio is never fed to the VAD/STT pipeline.
 *   Fix: accept any audio track from the correct participant.
 */

const fs = require('fs')
const path = require('path')

function patch(filePath, description, searchStr, replaceStr) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-livekit] SKIP (not found): ${filePath}`)
    return
  }
  let content = fs.readFileSync(filePath, 'utf8')
  if (content.includes(replaceStr)) {
    console.log(`[patch-livekit] already patched: ${description}`)
    return
  }
  if (!content.includes(searchStr)) {
    console.warn(`[patch-livekit] search string not found — skipping: ${description}`)
    return
  }
  content = content.replace(searchStr, replaceStr)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`[patch-livekit] patched: ${description}`)
}

const agentsBase = path.join(__dirname, '..', 'node_modules', '@livekit', 'agents', 'dist')

// ── Fix 1: Windows path bug in job child process ──────────────────────────────
patch(
  path.join(agentsBase, 'ipc', 'job_proc_lazy_main.js'),
  'Windows path bug (pathToFileURL.pathname → .href)',
  'import(pathToFileURL(moduleFile).pathname)',
  'import(pathToFileURL(moduleFile).href)'
)

// ── Fix 2a: setParticipant — accept any audio source ─────────────────────────
patch(
  path.join(agentsBase, 'voice', 'room_io', '_input.js'),
  'audio track source filter in setParticipant',
  'if (publication.track && publication.source === TrackSource.SOURCE_MICROPHONE) {',
  'if (publication.track && (publication.source === TrackSource.SOURCE_MICROPHONE || publication.source === TrackSource.SOURCE_UNKNOWN || publication.source === 0 || publication.source === 4)) {'
)

// ── Fix 2b: onTrackSubscribed — accept any audio source ──────────────────────
patch(
  path.join(agentsBase, 'voice', 'room_io', '_input.js'),
  'audio track source filter in onTrackSubscribed',
  'if (this.participantIdentity !== participant.identity || publication.source !== TrackSource.SOURCE_MICROPHONE ||',
  'if (this.participantIdentity !== participant.identity || !(publication.source === TrackSource.SOURCE_MICROPHONE || publication.source === TrackSource.SOURCE_UNKNOWN || publication.source === 0 || publication.source === 4) ||'
)
