import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { generatePresignedUploadUrl } from '@/core/shared/lib/azure-storage'

export const runtime = 'nodejs'

/**
 * Generate a presigned URL for direct client-side upload to Azure
 * This bypasses Vercel's 4.5MB body size limit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only admins can upload assets
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, contentType, assetType } = body

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      )
    }

    // Determine folder based on asset type
    let folder = 'uploads'
    if (assetType === 'audio') {
      folder = 'assets/audio'
    } else if (assetType === 'image') {
      folder = 'assets/images'
    } else if (assetType === 'decoration') {
      folder = 'assets/decorations'
    }

    // Validate file type
    if (assetType === 'audio') {
      const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a']
      if (!validAudioTypes.some(type => contentType.includes(type.split('/')[1])) && !contentType.startsWith('audio/')) {
        return NextResponse.json(
          { error: 'Invalid audio file type. Allowed: MP3, WAV, OGG, M4A' },
          { status: 400 }
        )
      }
    }

    console.log(`[PresignedUpload] Admin ${session.user.id} requesting presigned URL for ${assetType}: ${fileName}`)

    const presignedInfo = await generatePresignedUploadUrl({
      folder,
      fileName,
      contentType,
      expiresInMinutes: 15,
    })

    return NextResponse.json({
      success: true,
      uploadUrl: presignedInfo.uploadUrl,
      blobUrl: presignedInfo.blobUrl,
      blobName: presignedInfo.blobName,
      expiresAt: presignedInfo.expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('[PresignedUpload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}
