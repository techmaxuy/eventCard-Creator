import { BlobServiceClient, ContainerClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob'
import sharp from 'sharp'

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

if (!accountName || !accountKey || !containerName) {
  throw new Error('Azure Storage credentials not configured')
}

// Crear cliente de Blob Storage
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
)

const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName)

export interface UploadOptions {
  folder?: string // Ej: 'avatars', 'products'
  maxWidth?: number // Redimensionar imagen
  maxHeight?: number
  quality?: number // Calidad JPEG (1-100)
}

export interface UploadAudioOptions {
  folder?: string // Ej: 'audio', 'music'
}


/**
 * Sube una imagen a Azure Blob Storage
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  try {
    const {
      folder = 'uploads',
      maxWidth = 800,
      maxHeight = 800,
      quality = 85,
    } = options

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB')
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Procesar imagen con sharp (redimensionar y optimizar)
    const processedBuffer = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside', // Mantiene aspect ratio
        withoutEnlargement: true, // No agranda imágenes pequeñas
      })
      .jpeg({ quality }) // Convierte a JPEG
      .toBuffer()

    // Generar nombre único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = 'jpg' // Siempre JPG después de procesar
    const blobName = `${folder}/${timestamp}-${randomString}.${extension}`

    // Subir a Azure
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    
    await blockBlobClient.uploadData(processedBuffer, {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg',
        blobCacheControl: 'public, max-age=31536000', // Cache 1 año
      },
    })

    // Retornar URL pública
    const url = blockBlobClient.url
    
    console.log(`[Azure] ✅ Image uploaded: ${url}`)
    
    return url
  } catch (error) {
    console.error('[Azure] ❌ Upload error:', error)
    throw error
  }
}

/**
 * Elimina una imagen de Azure Blob Storage
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extraer blob name de la URL
    const url = new URL(imageUrl)
    const blobName = url.pathname.split(`/${containerName}/`)[1]

    if (!blobName) {
      throw new Error('Invalid blob URL')
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    await blockBlobClient.deleteIfExists()

    console.log(`[Azure] ✅ Image deleted: ${blobName}`)
    
    return true
  } catch (error) {
    console.error('[Azure] ❌ Delete error:', error)
    return false
  }
}

/**
 * Obtiene información de una imagen
 */
export async function getImageMetadata(imageUrl: string) {
  try {
    const url = new URL(imageUrl)
    const blobName = url.pathname.split(`/${containerName}/`)[1]

    if (!blobName) {
      throw new Error('Invalid blob URL')
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    const properties = await blockBlobClient.getProperties()

    return {
      size: properties.contentLength,
      contentType: properties.contentType,
      lastModified: properties.lastModified,
      exists: true,
    }
  } catch (error) {
    console.error('[Azure] ❌ Metadata error:', error)
    return { exists: false }
  }
}

/**
 * Lista todas las imágenes en una carpeta
 */
export async function listImages(folder: string = 'uploads', limit: number = 100) {
  try {
    const images: string[] = []
    
    for await (const blob of containerClient.listBlobsFlat({ prefix: folder })) {
      if (images.length >= limit) break
      
      const url = `${containerClient.url}/${blob.name}`
      images.push(url)
    }

    return images
  } catch (error) {
    console.error('[Azure] ❌ List error:', error)
    return []
  }
}

/**
 * Elimina un archivo de audio de Azure Blob Storage
 * NUEVA FUNCIÓN (alias de deleteImage para claridad)
 */
export async function deleteAudio(audioUrl: string): Promise<boolean> {
  return deleteImage(audioUrl)
}


/**
 * Sube un archivo de audio a Azure Blob Storage
 * NUEVA FUNCIÓN
 */
export async function uploadAudio(
  file: File,
  options: UploadAudioOptions = {}
): Promise<string> {
  try {
    const { folder = 'audio' } = options

    // Validar tipo de archivo (audio)
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
    const isValidAudio = validAudioTypes.some(type => file.type.includes(type.split('/')[1]))
    
    if (!isValidAudio && !file.type.startsWith('audio/')) {
      throw new Error('File must be an audio file (MP3, WAV, OGG, M4A)')
    }

    // Validar tamaño (max 10MB para audio)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('Audio file size must be less than 10MB')
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generar nombre único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop() || 'mp3'
    const blobName = `${folder}/${timestamp}-${randomString}.${extension}`

    // Subir a Azure
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type || 'audio/mpeg',
        blobCacheControl: 'public, max-age=31536000', // Cache 1 año
      },
    })

    // Retornar URL pública
    const url = blockBlobClient.url
    
    console.log(`[Azure] ✅ Audio uploaded: ${url}`)

    return url
  } catch (error) {
    console.error('[Azure] ❌ Audio upload error:', error)
    throw error
  }
}

/**
 * Generate a SAS URL for direct client-side upload to Azure Blob Storage
 * This bypasses Vercel's 4.5MB body size limit for serverless functions
 */
export interface PresignedUploadInfo {
  uploadUrl: string      // URL with SAS token for uploading
  blobUrl: string        // Final public URL after upload
  blobName: string       // Name of the blob
  expiresAt: Date        // When the SAS token expires
}

export async function generatePresignedUploadUrl(
  options: {
    folder?: string
    fileName: string
    contentType: string
    expiresInMinutes?: number
  }
): Promise<PresignedUploadInfo> {
  const {
    folder = 'uploads',
    fileName,
    contentType,
    expiresInMinutes = 10,
  } = options

  // Generate unique blob name
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const extension = fileName.split('.').pop() || 'bin'
  const blobName = `${folder}/${timestamp}-${randomString}.${extension}`

  // Create shared key credential
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName!, accountKey!)

  // Calculate expiry time
  const startsOn = new Date()
  const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000)

  // Generate SAS token with write permission
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: containerName!,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('cw'), // Create and Write
      startsOn: startsOn,
      expiresOn: expiresOn,
      contentType: contentType,
    },
    sharedKeyCredential
  ).toString()

  const blockBlobClient = containerClient.getBlockBlobClient(blobName)
  const uploadUrl = `${blockBlobClient.url}?${sasToken}`
  const blobUrl = blockBlobClient.url

  console.log(`[Azure] ✅ Presigned URL generated for: ${blobName}`)

  return {
    uploadUrl,
    blobUrl,
    blobName,
    expiresAt: expiresOn,
  }
}