import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { uploadImage, uploadAudio } from '@/core/shared/lib/azure-storage'
import { prisma } from '@/core/shared/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Solo admins pueden subir assets
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const assetType = formData.get('assetType') as string // 'image' | 'audio' | 'decoration'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`[UploadAsset] Admin ${session.user.id} uploading ${assetType}`)

    let fileUrl: string

    if (assetType === 'image' || assetType === 'decoration') {
      // Subir imagen o decoración
      const folder = assetType === 'decoration' ? 'assets/decorations' : 'assets/images'

      fileUrl = await uploadImage(file, {
        folder,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 90,
      })

      // Generar thumbnail (más pequeño para decoraciones)
      const thumbnailUrl = await uploadImage(file, {
        folder: assetType === 'decoration' ? 'assets/decorations/thumbnails' : 'assets/thumbnails',
        maxWidth: 400,
        maxHeight: 400,
        quality: 80,
      })

      return NextResponse.json({
        success: true,
        imageUrl: fileUrl,
        thumbnailUrl: thumbnailUrl,
        message: assetType === 'decoration' ? 'Decoration uploaded successfully' : 'Image uploaded successfully'
      })

    } else if (assetType === 'audio') {
      // Subir audio a Azure
      const audioUrl = await uploadAudio(file, {
        folder: 'assets/audio',
      })

      return NextResponse.json({
        success: true,
        audioUrl: audioUrl,
        message: 'Audio uploaded successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 })

  } catch (error) {
    console.error('[UploadAsset] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}