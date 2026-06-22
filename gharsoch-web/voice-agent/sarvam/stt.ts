/**
 * sarvam/stt.ts — Sarvam Saaras STT plugin for @livekit/agents (TS port of the
 * Python sarvam_plugins/stt.py).
 *
 * Non-streaming recognize: the session wraps it with stt.StreamAdapter + VAD so
 * each detected speech segment is sent as one WAV to Sarvam. Supports runtime
 * language switching for Hindi/English/Marathi mid-call.
 */
import { mergeFrames, stt } from '@livekit/agents'
import type { AudioBuffer } from '@livekit/agents'

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text'

export class SarvamSTT extends stt.STT {
  label = 'sarvam.STT'
  private apiKey: string
  private languageCode: string
  private modelName: string

  constructor(opts?: { languageCode?: string; model?: string; apiKey?: string }) {
    super({ streaming: false, interimResults: false })
    this.apiKey = opts?.apiKey || process.env.SARVAM_API_KEY || ''
    this.languageCode = opts?.languageCode ?? 'hi-IN'
    this.modelName = opts?.model ?? 'saaras:v3'
    if (!this.apiKey) {
      console.warn('[SarvamSTT] SARVAM_API_KEY is not set — transcription will fail')
    }
  }

  /** Runtime language switch (called by the switch_language tool). */
  setLanguage(languageCode: string): void {
    const old = this.languageCode
    this.languageCode = languageCode
    console.log(`[SarvamSTT] language switched: ${old} → ${languageCode}`)
  }

  get currentLanguage(): string {
    return this.languageCode
  }

  stream(): never {
    throw new Error('SarvamSTT is non-streaming — wrap it with stt.StreamAdapter')
  }

  protected async _recognize(buffer: AudioBuffer, abortSignal?: AbortSignal): Promise<stt.SpeechEvent> {
    const frame = mergeFrames(buffer)
    const wav = frameToWav(frame.data, frame.sampleRate, frame.channels)
    const lang = this.languageCode

    const form = new FormData()
    form.append('file', new Blob([wav as unknown as BlobPart], { type: 'audio/wav' }), 'audio.wav')
    form.append('model', this.modelName)
    form.append('language_code', lang)
    form.append('with_timestamps', 'false')

    const empty: stt.SpeechEvent = {
      type: stt.SpeechEventType.FINAL_TRANSCRIPT,
      alternatives: [{ text: '', language: lang as any, startTime: 0, endTime: 0, confidence: 0 }],
    }

    try {
      const resp = await fetch(SARVAM_STT_URL, {
        method: 'POST',
        headers: { 'api-subscription-key': this.apiKey },
        body: form,
        signal: abortSignal ?? null,
      })
      if (!resp.ok) {
        console.error(`[SarvamSTT] error ${resp.status}: ${await resp.text().catch(() => '')}`)
        return empty
      }
      const data = (await resp.json()) as { transcript?: string }
      return {
        type: stt.SpeechEventType.FINAL_TRANSCRIPT,
        alternatives: [{ text: data.transcript || '', language: lang as any, startTime: 0, endTime: 0, confidence: 1 }],
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('[SarvamSTT] request failed:', (err as Error)?.message)
      }
      return empty
    }
  }
}

/** Build a 16-bit PCM WAV file from an Int16Array. */
function frameToWav(samples: Int16Array, sampleRate: number, numChannels: number): Uint8Array {
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
  view.setUint32(28, sampleRate * numChannels * 2, true) // byte rate
  view.setUint16(32, numChannels * 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, dataLen, true)

  new Uint8Array(buffer, 44).set(new Uint8Array(samples.buffer, samples.byteOffset, dataLen))
  return new Uint8Array(buffer)
}
