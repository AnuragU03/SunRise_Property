/**
 * Call Archive Service
 * Handles packaging, compression, and storage of call histories.
 * 
 * LOCAL MODE: Saves archives as JSON files in ./archives/ directory
 * AZURE MODE: Uploads to Azure Blob Storage when AZURE_STORAGE_CONNECTION_STRING is set
 */

import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { CallArchive } from '@/models/CallArchive'

const LOCAL_ARCHIVE_DIR = path.join(process.cwd(), 'archives')

function isLocalMode(): boolean {
  return !process.env.AZURE_STORAGE_CONNECTION_STRING
}

class CallArchiveService {
  /**
   * Archive calls older than specified days (automatic cleanup)
   */
  async archiveClosedCalls(daysOld: number = 30): Promise<CallArchive | null> {
    const callsCollection = await getCollection('calls')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const closedCalls = await callsCollection
      .find({
        call_status: 'completed',
        updated_at: { $lte: cutoffDate },
      })
      .toArray()

    if (closedCalls.length === 0) {
      return null
    }

    return await this.createArchive(
      closedCalls.map((c: any) => c._id.toString()),
      {
        type: 'automatic',
        days_old: daysOld,
        reason: `Auto-archive of calls completed more than ${daysOld} days ago`,
      }
    )
  }

  /**
   * Archive calls by date range (manual export)
   */
  async archiveByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: {
      agent_name?: string
      disposition?: string
      call_outcome?: string
      campaign_id?: string
    }
  ): Promise<CallArchive | null> {
    const callsCollection = await getCollection('calls')

    const query: any = {
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    }

    if (filters?.agent_name) query.agent_name = filters.agent_name
    if (filters?.disposition) query.disposition = filters.disposition
    if (filters?.call_outcome) query.call_outcome = filters.call_outcome
    if (filters?.campaign_id) query.campaign_id = filters.campaign_id

    const calls = await callsCollection.find(query).toArray()

    if (calls.length === 0) {
      return null
    }

    return await this.createArchive(
      calls.map((c: any) => c._id.toString()),
      {
        type: 'manual',
        date_range: { from: startDate.toISOString(), to: endDate.toISOString() },
        filters,
      }
    )
  }

  /**
   * Create archive package from call IDs
   */
  private async createArchive(
    callIds: string[],
    metadata: Record<string, any>
  ): Promise<CallArchive> {
    const archivesCollection = await getCollection('call_archives')
    const callsCollection = await getCollection('calls')
    const leadsCollection = await getCollection('leads')
    const stateHistoryCollection = await getCollection('lead_state_history')

    // Fetch full call details. callIds are _id.toString() hex strings, so they
    // must be converted back to ObjectId for the native driver to match.
    const callObjectIds = callIds.filter(Boolean).map((id) => new ObjectId(id))
    const calls = await callsCollection
      .find({ _id: { $in: callObjectIds } })
      .toArray()

    // lead_id is stored on calls as a string; convert valid ones to ObjectId.
    const leadIds = Array.from(
      new Set(calls.map((c: any) => String(c.lead_id)).filter((id: string) => ObjectId.isValid(id)))
    )
    const leads = await leadsCollection
      .find({ _id: { $in: leadIds.map((id) => new ObjectId(id)) } })
      .toArray()

    const stateTransitions = await stateHistoryCollection
      .find({ lead_id: { $in: leadIds } })
      .toArray()

    // Build archive data structure
    const archiveData = {
      archive_metadata: {
        created_at: new Date().toISOString(),
        version: '1.0',
      },
      calls: calls,
      leads: leads,
      state_transitions: stateTransitions,
      summary: {
        total_calls: calls.length,
        total_duration_seconds: calls.reduce((sum: number, c: any) => sum + (c.duration || 0), 0),
        call_outcomes: this.countByField(calls, 'call_outcome'),
        dispositions: this.countByField(calls, 'disposition'),
        agent_names: Array.from(new Set(calls.map((c: any) => c.agent_name))),
        campaigns: Array.from(new Set(calls.map((c: any) => c.campaign_id))),
      },
    }

    // Upload/save archive
    const storagePath = await this.saveArchive(archiveData)

    // Create archive record
    const archive: CallArchive = {
      archive_id: uuidv4(),
      call_ids: callIds,
      lead_ids: leadIds,
      archive_date: new Date().toISOString(),
      date_range: metadata.date_range || {
        from: new Date().toISOString(),
        to: new Date().toISOString(),
      },
      archive_type: metadata.type || 'manual',
      retention_days: 365,
      retention_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: archiveData.summary,
      blob_info: {
        container: isLocalMode() ? 'local-archives' : 'call-archives',
        blob_name: storagePath.blob_name,
        blob_url: storagePath.blob_url,
        size_bytes: JSON.stringify(archiveData).length,
        encryption_enabled: !isLocalMode(),
      },
      state_transitions_count: stateTransitions.length,
      validation_records_count: stateTransitions.filter((st: any) => st.validation).length,
      export_status: 'completed',
      exported_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Store archive metadata
    await archivesCollection.insertOne(archive)

    return archive
  }

  /**
   * Save archive to local filesystem or Azure Blob Storage
   */
  private async saveArchive(
    archiveData: any
  ): Promise<{ blob_name: string; blob_url: string }> {
    const archiveId = uuidv4()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `call-archive-${timestamp}-${archiveId}.json`
    const jsonData = JSON.stringify(archiveData, null, 2)

    if (isLocalMode()) {
      // Save to local filesystem
      await fs.mkdir(LOCAL_ARCHIVE_DIR, { recursive: true })
      const filePath = path.join(LOCAL_ARCHIVE_DIR, fileName)
      await fs.writeFile(filePath, jsonData, 'utf-8')
      console.log(`[CallArchive] LOCAL: Saved archive to ${filePath}`)

      return {
        blob_name: fileName,
        blob_url: `file://${filePath}`,
      }
    }

    // Azure Blob Storage upload
    const { BlobServiceClient } = require('@azure/storage-blob')
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient('call-archives')

    await containerClient.createIfNotExists()
    const blockBlobClient = containerClient.getBlockBlobClient(fileName)

    await blockBlobClient.upload(jsonData, Buffer.byteLength(jsonData), {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
        blobContentEncoding: 'utf-8',
      },
    })

    return {
      blob_name: fileName,
      blob_url: blockBlobClient.url,
    }
  }

  /**
   * Count occurrences of a field value
   */
  private countByField(
    items: any[],
    field: string
  ): Record<string, number> {
    const counts: Record<string, number> = {}
    items.forEach((item) => {
      const value = item[field] || 'unknown'
      counts[value] = (counts[value] || 0) + 1
    })
    return counts
  }

  /**
   * Get recent archives
   */
  async getRecentArchives(limit: number = 20): Promise<CallArchive[]> {
    const archivesCollection = await getCollection('call_archives')
    return await archivesCollection
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()
  }
}

export const callArchiveService = new CallArchiveService()
