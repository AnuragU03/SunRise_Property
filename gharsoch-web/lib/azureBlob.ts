/**
 * Blob Storage Adapter
 * 
 * LOCAL MODE: When AZURE_STORAGE_CONNECTION_STRING is not set,
 * files are saved to the local filesystem under ./uploads/
 * 
 * AZURE MODE: When the connection string is set, uploads to Azure Blob Storage.
 */

import fs from 'fs/promises'
import path from 'path'

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'gharsoch-assets'
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads')

function isLocalMode(): boolean {
  return !AZURE_STORAGE_CONNECTION_STRING
}

/**
 * Get blob client — returns null in local mode
 */
export function getBlobClient() {
  if (isLocalMode()) {
    console.log('[BlobStorage] Local mode — Azure Blob Storage not configured')
    return { blobServiceClient: null, containerClient: null }
  }

  // Dynamic import to avoid crash when @azure/storage-blob is not needed
  const { BlobServiceClient } = require('@azure/storage-blob')
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING!)
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)
  return { blobServiceClient, containerClient }
}

/**
 * Upload file — local FS or Azure Blob depending on config
 */
export async function uploadToBlob(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  if (isLocalMode()) {
    // Local filesystem fallback
    await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(LOCAL_UPLOAD_DIR, safeName)
    await fs.writeFile(filePath, fileBuffer)
    console.log(`[BlobStorage] LOCAL: Saved ${safeName} to ${filePath}`)
    return `/uploads/${safeName}`
  }

  // Azure Blob upload
  const { containerClient } = getBlobClient()
  if (!containerClient) throw new Error('Blob client not initialized')

  await containerClient.createIfNotExists({ access: 'blob' })
  const blockBlobClient = containerClient.getBlockBlobClient(fileName)

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: contentType }
  })

  return blockBlobClient.url
}

/**
 * Delete file — local FS or Azure Blob depending on config
 */
export async function deleteFromBlob(fileName: string): Promise<void> {
  if (isLocalMode()) {
    const filePath = path.join(LOCAL_UPLOAD_DIR, fileName)
    try {
      await fs.unlink(filePath)
      console.log(`[BlobStorage] LOCAL: Deleted ${fileName}`)
    } catch {
      // File may not exist, ignore
    }
    return
  }

  const { containerClient } = getBlobClient()
  if (!containerClient) return
  const blockBlobClient = containerClient.getBlockBlobClient(fileName)
  await blockBlobClient.deleteIfExists()
}
