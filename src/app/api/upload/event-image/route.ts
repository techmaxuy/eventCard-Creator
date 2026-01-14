import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { uploadImage, deleteImage } from '@/core/shared/lib/azure-storage'
import { prisma } from '@/core/shared/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string
    const imageType = formData.get('imageType') as string // 'cover' | 'featured' | 'gallery'

    if (!file || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar que el evento pertenezca al usuario
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: session.user.id
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    console.log(`[UploadEventImage] User ${session.user.id} uploading ${imageType} for event ${eventId}`)

    // Subir imagen a Azure
    const imageUrl = await uploadImage(file, {
      folder: `events/${eventId}`,
      maxWidth: imageType === 'cover' ? 1920 : (imageType === 'featured' ? 1200 : 1200),
      maxHeight: imageType === 'cover' ? 1080 : (imageType === 'featured' ? 1200 : 1200),
      quality: 85,
    })

    // Si es cover, actualizar evento y eliminar cover anterior
    if (imageType === 'cover') {
      if (event.coverImage && event.coverImage.includes('blob.core.windows.net')) {
        await deleteImage(event.coverImage).catch(err => {
          console.warn('[UploadEventImage] Failed to delete old cover:', err)
        })
      }

      await prisma.event.update({
        where: { id: eventId },
        data: { coverImage: imageUrl }
      })
    } else if (imageType === 'featured') {
      // Si es featured, actualizar evento y eliminar featured anterior
      if (event.featuredImage && event.featuredImage.includes('blob.core.windows.net')) {
        await deleteImage(event.featuredImage).catch(err => {
          console.warn('[UploadEventImage] Failed to delete old featured:', err)
        })
      }

      await prisma.event.update({
        where: { id: eventId },
        data: { featuredImage: imageUrl }
      })
    } else {
      // Si es galería, agregar al array
      const currentGallery = (event.gallery as string[]) || []
      await prisma.event.update({
        where: { id: eventId },
        data: { gallery: [...currentGallery, imageUrl] }
      })
    }

    console.log(`[UploadEventImage] ✅ ${imageType} uploaded`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('[UploadEventImage] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const imageUrl = searchParams.get('imageUrl')
    const imageType = searchParams.get('imageType') // 'cover' | 'featured' | 'gallery'

    if (!eventId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar que el evento pertenezca al usuario
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: session.user.id
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Eliminar de Azure
    if (imageUrl.includes('blob.core.windows.net')) {
      await deleteImage(imageUrl)
    }

    // Actualizar base de datos
    if (imageType === 'cover') {
      await prisma.event.update({
        where: { id: eventId },
        data: { coverImage: null }
      })
    } else if (imageType === 'featured') {
      await prisma.event.update({
        where: { id: eventId },
        data: { featuredImage: null }
      })
    } else {
      const currentGallery = (event.gallery as string[]) || []
      await prisma.event.update({
        where: { id: eventId },
        data: { gallery: currentGallery.filter(url => url !== imageUrl) }
      })
    }

    console.log(`[UploadEventImage] ✅ Image deleted`)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('[UploadEventImage] Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}