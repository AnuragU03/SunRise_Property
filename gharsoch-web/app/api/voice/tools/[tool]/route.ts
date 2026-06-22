import { NextRequest, NextResponse } from 'next/server'
import { dispatchVoiceTool } from '@/lib/voice/toolRouter'
import { extractVoiceToolPayload, recordVoiceToolEvent, voiceToolError, voiceToolSuccess } from '@/lib/voice/toolHelpers'

function validateVoiceToolRequest(request: NextRequest) {
  const secret = process.env.VOICE_RUNTIME_SECRET
  if (!secret) return null

  const header = request.headers.get('x-voice-runtime-secret') || request.headers.get('x-cron-secret')
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''

  if (header === secret || bearer === secret) return null
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  let payload = extractVoiceToolPayload({}, params.tool)

  try {
    const authError = validateVoiceToolRequest(request)
    if (authError) return authError

    const body = await request.json()
    payload = extractVoiceToolPayload(body, params.tool)
    const result = await dispatchVoiceTool(payload)
    return voiceToolSuccess(payload, result)
  } catch (error: any) {
    console.error('[VoiceTool] Error:', params.tool, error)
    if (payload.voiceCallId) {
      await recordVoiceToolEvent(payload.voiceCallId, {
        tool_name: payload.toolName || params.tool,
        success: false,
        result_summary: error.message || 'Voice tool failed',
      })
    }
    return voiceToolError(payload, error.message || 'Voice tool failed')
  }
}
