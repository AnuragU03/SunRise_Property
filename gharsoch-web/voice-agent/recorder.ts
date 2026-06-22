/**
 * voice-agent/recorder.ts — Local audio recording for voice calls.
 *
 * Records raw PCM audio frames from the LiveKit room into a WAV file stored at:
 *   data/audio_recordings/{roomName}_{timestamp}.wav
 *
 * The recorder captures the MIXED audio (agent TTS output + customer microphone)
 * by subscribing to the room's composite audio track via the SDK's AudioStream.
 * If composite recording isn't available (SDK limitation), it falls back to
 * recording only the customer's inbound audio.
 *
 * This is a LOCAL recording for development/demo — production uses Azure Blob
 * Storage via LiveKit Egress (see lib/voiceRecording.ts).
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RECORDINGS_DIR = join(process.cwd(), 'data', 'audio_recordings')
const SAMPLE_RATE = 24000
const NUM_CHANNELS = 1
const BITS_PER_SAMPLE = 16

// Ensure directory exists
if (!existsSync(RECORDINGS_DIR)) {
  mkdirSync(RECORDINGS_DIR, { recursive: true })
}

/**
 * In-memory audio buffer that accumulates PCM frames during a call,
 * then writes them as a WAV file when finalized.
 */
export class CallRecorder {
  private chunks: Int16Array[] = []
  private totalSamples = 0
  private roomName: string
  private startTime: Date

  constructor(roomName: string) {
    this.roomName = roomName
    this.startTime = new Date()
  }

  /** Push a PCM audio frame (Int16Array) into the recording buffer. */
  pushFrame(samples: Int16Array): void {
    if (samples.length === 0) return
    this.chunks.push(new Int16Array(samples))
    this.totalSamples += samples.length
  }

  /** Get the total recorded duration in seconds. */
  get durationSeconds(): number {
    return this.totalSamples / SAMPLE_RATE
  }

  /** Get the total number of samples recorded. */
  get sampleCount(): number {
    return this.totalSamples
  }

  /**
   * Write the accumulated audio to a WAV file and return the file path.
   * Returns null if no audio was recorded.
   */
  finalize(): string | null {
    if (this.totalSamples === 0) {
      console.log('[recorder] no audio frames captured — skipping WAV write')
      return null
    }

    // Merge all chunks into a single buffer
    const merged = new Int16Array(this.totalSamples)
    let offset = 0
    for (const chunk of this.chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    // Build WAV file
    const wav = buildWav(merged, SAMPLE_RATE, NUM_CHANNELS)

    // Generate filename: roomName_YYYYMMDD_HHmmss.wav
    const ts = this.startTime.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const safeName = this.roomName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `${safeName}_${ts}.wav`
    const filepath = join(RECORDINGS_DIR, filename)

    try {
      writeFileSync(filepath, Buffer.from(wav.buffer))
      const sizeMB = (wav.byteLength / (1024 * 1024)).toFixed(2)
      console.log(`[recorder] saved ${filepath} (${this.durationSeconds.toFixed(1)}s, ${sizeMB} MB)`)
      return filepath
    } catch (err) {
      console.error('[recorder] failed to write WAV:', (err as Error).message)
      return null
    }
  }
}

/** Build a 16-bit PCM WAV file from an Int16Array. */
function buildWav(samples: Int16Array, sampleRate: number, numChannels: number): Uint8Array {
  const dataLen = samples.byteLength
  const buffer = new ArrayBuffer(44 + dataLen)
  const view = new DataView(buffer)

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataLen, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (BITS_PER_SAMPLE / 8), true) // byte rate
  view.setUint16(32, numChannels * (BITS_PER_SAMPLE / 8), true) // block align
  view.setUint16(34, BITS_PER_SAMPLE, true)
  writeStr(36, 'data')
  view.setUint32(40, dataLen, true)

  new Uint8Array(buffer, 44).set(new Uint8Array(samples.buffer, samples.byteOffset, dataLen))
  return new Uint8Array(buffer)
}
