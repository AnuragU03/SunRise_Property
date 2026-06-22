/**
 * lib/voiceRecording.ts — LiveKit call recording → Azure Blob Storage.
 *
 * Restores the Vapi-era `recording_url` feature for the self-owned LiveKit
 * runtime. Vapi hosted recordings itself and we only stored a URL; with
 * LiveKit we own storage, so a server-side audio-only Room Composite Egress
 * writes an OGG straight into Azure Blob (no media ever passes through the
 * Next.js process).
 *
 * Gating (graceful no-op, same philosophy as lib/azureBlob.ts local mode):
 *  - AZURE_STORAGE_CONNECTION_STRING absent → recording disabled
 *  - VOICE_RECORDING=off                    → recording disabled
 * LiveKit file egress REQUIRES customer cloud storage, so there is no
 * local-filesystem fallback for recordings — calls simply aren't recorded
 * until the Azure account lands.
 *
 * Playback: the blob container stays private; the call doc's recording_url
 * points at /api/calls/{id}/recording which 302s to a short-lived SAS URL.
 */

import {
  AzureBlobUpload,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
} from 'livekit-server-sdk'
import { getCollection } from '@/lib/mongodb'

const LIVEKIT_URL = process.env.LIVEKIT_URL || ''
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || ''
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || ''
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || ''
const RECORDINGS_CONTAINER = process.env.AZURE_RECORDINGS_CONTAINER || 'call-recordings'

export function parseAzureConnectionString(cs: string): { accountName: string; accountKey: string } | null {
  const accountName = /AccountName=([^;]+)/i.exec(cs)?.[1]
  const accountKey = /AccountKey=([^;]+)/i.exec(cs)?.[1]
  if (!accountName || !accountKey) return null
  return { accountName, accountKey }
}

export function isRecordingEnabled(): boolean {
  if ((process.env.VOICE_RECORDING || '').toLowerCase() === 'off') return false
  if (!CONNECTION_STRING || !parseAzureConnectionString(CONNECTION_STRING)) return false
  return Boolean(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET)
}

function normalizeLiveKitHost(url: string) {
  return url
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://')
    .replace(/\/$/, '')
}

/**
 * Start an audio-only room-composite egress for the call's room.
 * Fire-and-forget from voiceRuntime: a recording failure must never block the dial.
 * The egress ends automatically when the room closes (agent hangup deletes the room).
 */
export async function startCallRecording(roomName: string, callDocId: string): Promise<void> {
  if (!isRecordingEnabled()) return

  const azure = parseAzureConnectionString(CONNECTION_STRING)!
  const blobPath = `${roomName}.ogg`

  try {
    const egressClient = new EgressClient(normalizeLiveKitHost(LIVEKIT_URL), LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.OGG,
      filepath: blobPath,
      output: {
        case: 'azure',
        value: new AzureBlobUpload({
          accountName: azure.accountName,
          accountKey: azure.accountKey,
          containerName: RECORDINGS_CONTAINER,
        }),
      },
    })

    const info = await egressClient.startRoomCompositeEgress(roomName, { file: fileOutput }, { audioOnly: true })

    const calls = await getCollection('calls')
    await calls.updateOne(
      { room_name: roomName },
      {
        $set: {
          egress_id: info.egressId,
          recording_blob: blobPath,
          recording_container: RECORDINGS_CONTAINER,
          // App-relative playback URL — resolves to a short-lived SAS redirect.
          recording_url: `/api/calls/${callDocId}/recording`,
          recording_status: 'recording',
          updated_at: new Date(),
        },
      }
    )

    console.log(`[voiceRecording] Egress ${info.egressId} recording ${roomName} → ${RECORDINGS_CONTAINER}/${blobPath}`)
  } catch (err) {
    console.error(`[voiceRecording] Failed to start egress for ${roomName}:`, err instanceof Error ? err.message : err)
    try {
      const calls = await getCollection('calls')
      await calls.updateOne(
        { room_name: roomName },
        { $set: { recording_status: 'failed', updated_at: new Date() } }
      )
    } catch {
      // best-effort status update only
    }
  }
}
