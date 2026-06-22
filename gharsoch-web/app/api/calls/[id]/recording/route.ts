/**
 * GET /api/calls/[id]/recording — stream-safe playback redirect.
 *
 * The recordings container is private; this route authenticates the session,
 * then 302s to a 15-minute read-only SAS URL for the call's recording blob.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { authErrorResponse, requireSession } from '@/lib/auth'
import { getCollection } from '@/lib/mongodb'
import { parseAzureConnectionString } from '@/lib/voiceRecording'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession()

    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid call ID' }, { status: 400 })
    }

    const calls = await getCollection('calls')
    const call = await calls.findOne({ _id: new ObjectId(id) })
    if (!call) {
      return NextResponse.json({ success: false, error: 'Call not found' }, { status: 404 })
    }

    // Legacy Vapi-era calls stored a full external URL — just forward to it.
    const stored = String(call.recording_url || '')
    if (/^https?:\/\//i.test(stored)) {
      return NextResponse.redirect(stored)
    }

    const blobPath = String(call.recording_blob || '')
    if (!blobPath) {
      return NextResponse.json({ success: false, error: 'No recording for this call' }, { status: 404 })
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    const azure = parseAzureConnectionString(connectionString)
    if (!azure) {
      return NextResponse.json(
        { success: false, error: 'Azure storage not configured — recording unavailable' },
        { status: 503 }
      )
    }

    const {
      BlobSASPermissions,
      StorageSharedKeyCredential,
      generateBlobSASQueryParameters,
    } = require('@azure/storage-blob')

    const containerName = String(call.recording_container || process.env.AZURE_RECORDINGS_CONTAINER || 'call-recordings')
    const credential = new StorageSharedKeyCredential(azure.accountName, azure.accountKey)
    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(Date.now() - 5 * 60 * 1000),
        expiresOn: new Date(Date.now() + 15 * 60 * 1000),
      },
      credential
    ).toString()

    const url = `https://${azure.accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobPath)}?${sas}`
    return NextResponse.redirect(url)
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Calls/Recording] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
