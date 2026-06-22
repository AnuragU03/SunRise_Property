/**
 * sarvam/tts.ts — Sarvam Bulbul v3 TTS plugin for @livekit/agents (TS port of
 * the Python sarvam_plugins/tts.py).
 *
 * Non-streaming-interface TTS (the framework wraps it with tts.StreamAdapter +
 * a sentence tokenizer at session setup). Internally uses Sarvam's streaming
 * endpoint so PCM chunks arrive progressively (low time-to-first-audio), with
 * the plain REST endpoint as fallback.
 */
import { AudioByteStream, shortuuid, tts } from '@livekit/agents'
import type { APIConnectOptions } from '@livekit/agents'

type AudioFrameT = ReturnType<AudioByteStream['write']>[number]

const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech'
const SARVAM_TTS_STREAM_URL = 'https://api.sarvam.ai/text-to-speech/stream'

export interface SarvamTTSOptions {
  model: string
  targetLanguageCode: string
  speaker: string
  pace: number
  sampleRate: number
  enablePreprocessing: boolean
}

function resolveTtsLanguage(code: string): string {
  const map: Record<string, string> = {
    'hi-IN': 'hi-IN', 'en-IN': 'en-IN', 'mr-IN': 'mr-IN', 'hi-EN': 'hi-IN', unknown: 'hi-IN',
  }
  return map[code] || 'hi-IN'
}

export class SarvamTTS extends tts.TTS {
  label = 'sarvam.TTS'
  readonly opts: SarvamTTSOptions
  private apiKey: string

  constructor(opts?: Partial<SarvamTTSOptions> & { apiKey?: string }) {
    const sampleRate = opts?.sampleRate ?? 24000
    super(sampleRate, 1, { streaming: false })
    this.apiKey = opts?.apiKey || process.env.SARVAM_API_KEY || ''
    this.opts = {
      model: opts?.model ?? 'bulbul:v3',
      targetLanguageCode: opts?.targetLanguageCode ?? 'hi-IN',
      speaker: opts?.speaker ?? process.env.SARVAM_TTS_SPEAKER ?? 'ritu',
      pace: opts?.pace ?? 1.1,
      sampleRate,
      enablePreprocessing: opts?.enablePreprocessing ?? true,
    }
    if (!this.apiKey) {
      console.warn('[SarvamTTS] SARVAM_API_KEY is not set — synthesis will fail')
    }
  }

  /** Runtime language switch (called by the switch_language tool). */
  setLanguage(languageCode: string): void {
    const old = this.opts.targetLanguageCode
    this.opts.targetLanguageCode = languageCode
    console.log(`[SarvamTTS] language switched: ${old} → ${languageCode}`)
  }

  get currentLanguage(): string {
    return this.opts.targetLanguageCode
  }

  synthesize(text: string, connOptions?: APIConnectOptions, abortSignal?: AbortSignal): SarvamChunkedStream {
    return new SarvamChunkedStream(text, this, this.apiKey, connOptions, abortSignal)
  }

  stream(): never {
    throw new Error('SarvamTTS is non-streaming — wrap it with tts.StreamAdapter')
  }

  /** Pre-warm the HTTPS connection so the first real request has no TLS handshake cost. */
  async prewarm(): Promise<void> {
    try {
      const resp = await fetch(SARVAM_TTS_STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-subscription-key': this.apiKey },
        body: JSON.stringify({
          text: '.',
          target_language_code: 'hi-IN',
          speaker: this.opts.speaker,
          model: this.opts.model,
          speech_sample_rate: this.opts.sampleRate,
          output_audio_codec: 'linear16',
        }),
      })
      await resp.arrayBuffer()
    } catch {
      // non-critical
    }
  }
}

export class SarvamChunkedStream extends tts.ChunkedStream {
  label = 'sarvam.ChunkedStream'
  private sarvam: SarvamTTS
  private apiKey: string

  constructor(text: string, ttsInstance: SarvamTTS, apiKey: string, connOptions?: APIConnectOptions, abortSignal?: AbortSignal) {
    super(text, ttsInstance, connOptions, abortSignal)
    this.sarvam = ttsInstance
    this.apiKey = apiKey
  }

  protected async run(): Promise<void> {
    const text = this.inputText.trim()
    if (!text) {
      this.queue.close()
      return
    }

    const opts = this.sarvam.opts
    const payload: Record<string, unknown> = {
      text,
      target_language_code: resolveTtsLanguage(opts.targetLanguageCode),
      speaker: opts.speaker,
      model: opts.model,
      pace: opts.pace,
      speech_sample_rate: opts.sampleRate,
      output_audio_codec: 'linear16',
      enable_preprocessing: opts.enablePreprocessing,
    }
    const headers = { 'Content-Type': 'application/json', 'api-subscription-key': this.apiKey }

    try {
      try {
        await this.runStreaming(payload, headers)
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        console.warn('[SarvamTTS] streaming failed, falling back to REST:', (err as Error)?.message)
        await this.runRest(payload, headers)
      }
    } finally {
      this.queue.close()
    }
  }

  /** Streaming endpoint: progressive raw-PCM chunks → AudioFrames. */
  private async runStreaming(payload: Record<string, unknown>, headers: Record<string, string>): Promise<void> {
    const resp = await fetch(SARVAM_TTS_STREAM_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: this.abortSignal,
    })
    if (!resp.ok || !resp.body) {
      throw new Error(`Sarvam stream TTS ${resp.status}: ${await resp.text().catch(() => '')}`)
    }

    const requestId = shortuuid()
    const byteStream = new AudioByteStream(this.sarvam.opts.sampleRate, 1)
    let lastFrame: AudioFrameT | undefined
    const sendLastFrame = (final: boolean) => {
      if (lastFrame) {
        this.queue.put({ requestId, segmentId: requestId, frame: lastFrame, final })
        lastFrame = undefined
      }
    }

    const reader = (resp.body as ReadableStream<Uint8Array>).getReader()
    let first = true
    let receivedAny = false
    let leftover: Uint8Array<ArrayBufferLike> = new Uint8Array(0)

    // Sarvam's streaming endpoint sends all audio then sometimes leaves the HTTP
    // connection idle instead of closing it — which would stall the agent until
    // the framework's 10s read-idle timeout. Once audio has started arriving,
    // treat ~1.8s of silence as end-of-audio and close cleanly.
    const IDLE_MS = 1800

    while (true) {
      const readPromise = reader.read()
      const result: ReadableStreamReadResult<Uint8Array> | { idle: true } = receivedAny
        ? await Promise.race([
            readPromise,
            new Promise<{ idle: true }>((r) => setTimeout(() => r({ idle: true }), IDLE_MS)),
          ])
        : await readPromise

      if ('idle' in result) {
        await reader.cancel().catch(() => {})
        break
      }

      const { done, value } = result
      if (done) break
      if (!value || value.length === 0) continue
      receivedAny = true

      let chunk = value
      // Strip a WAV/RIFF header if the very first chunk carries one
      if (first && chunk.length >= 4 && chunk[0] === 0x52 && chunk[1] === 0x49 && chunk[2] === 0x46 && chunk[3] === 0x46) {
        chunk = chunk.subarray(44)
      }
      first = false

      // Maintain 16-bit alignment across chunk boundaries
      let data: Uint8Array<ArrayBufferLike>
      if (leftover.length) {
        data = new Uint8Array(leftover.length + chunk.length)
        data.set(leftover, 0)
        data.set(chunk, leftover.length)
      } else {
        data = chunk
      }
      if (data.length % 2 !== 0) {
        leftover = data.subarray(data.length - 1)
        data = data.subarray(0, data.length - 1)
      } else {
        leftover = new Uint8Array(0)
      }

      if (data.length) {
        for (const frame of byteStream.write(data.slice().buffer as ArrayBuffer)) {
          sendLastFrame(false)
          lastFrame = frame
        }
      }
    }

    for (const frame of byteStream.flush()) {
      sendLastFrame(false)
      lastFrame = frame
    }
    sendLastFrame(true)
  }

  /** Fallback: non-streaming REST endpoint (base64 WAV in JSON). */
  private async runRest(payload: Record<string, unknown>, headers: Record<string, string>): Promise<void> {
    const restPayload = { ...payload }
    delete restPayload.output_audio_codec

    const resp = await fetch(SARVAM_TTS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(restPayload),
      signal: this.abortSignal,
    })
    if (!resp.ok) {
      throw new Error(`Sarvam TTS ${resp.status}: ${await resp.text().catch(() => '')}`)
    }

    const data = (await resp.json()) as { audios?: string[] }
    const audioB64 = data.audios?.[0]
    if (!audioB64) throw new Error('No audio in Sarvam TTS response')

    let audio = new Uint8Array(Buffer.from(audioB64, 'base64'))
    if (audio.length >= 4 && audio[0] === 0x52 && audio[1] === 0x49 && audio[2] === 0x46 && audio[3] === 0x46) {
      audio = audio.subarray(44) // strip WAV header → raw PCM
    }

    const requestId = shortuuid()
    const byteStream = new AudioByteStream(this.sarvam.opts.sampleRate, 1)
    let lastFrame: AudioFrameT | undefined
    const sendLastFrame = (final: boolean) => {
      if (lastFrame) {
        this.queue.put({ requestId, segmentId: requestId, frame: lastFrame, final })
        lastFrame = undefined
      }
    }
    for (const frame of byteStream.write(audio.slice().buffer as ArrayBuffer)) {
      sendLastFrame(false)
      lastFrame = frame
    }
    for (const frame of byteStream.flush()) {
      sendLastFrame(false)
      lastFrame = frame
    }
    sendLastFrame(true)
  }
}
