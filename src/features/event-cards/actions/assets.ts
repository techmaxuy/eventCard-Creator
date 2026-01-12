'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreateAssetSchema = z.object({
  type: z.enum(['IMAGE', 'AUDIO', 'PHRASE', 'DECORATION']),
  eventTypeId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  audioDuration: z.number().optional(),
  phraseEs: z.string().optional(),
  phraseEn: z.string().optional(),
  decorationUrl: z.string().optional(),
  decorationType: z.string().optional(),
  decorationPosition: z.string().optional(),
  order: z.number().default(0),
})

/**
 * Obtener assets (filtrado por tipo y eventType)
 */
export async function getAssets(filters?: {
  type?: 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'
  eventTypeId?: string
  includeInactive?: boolean
}) {
  try {
    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.eventTypeId) {
      where.OR = [
        { eventTypeId: filters.eventTypeId },
        { eventTypeId: null } // Assets globales
      ]
    }

    if (!filters?.includeInactive) {
      where.isActive = true
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        eventType: {
          select: {
            name: true,
            nameEn: true,
            icon: true,
            color: true,
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return { assets }
  } catch (error) {
    console.error('[Assets] Error getting assets:', error)
    return { error: 'Failed to get assets' }
  }
}

/**
 * Obtener un asset
 */
export async function getAsset(id: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        eventType: true
      }
    })

    if (!asset) {
      return { error: 'AssetNotFound' }
    }

    return { asset }
  } catch (error) {
    console.error('[Assets] Error getting asset:', error)
    return { error: 'Failed to get asset' }
  }
}

/**
 * Crear asset (ADMIN)
 */
export async function createAsset(locale: string, values: z.infer<typeof CreateAssetSchema>) {
  try {
    await requireAdmin(locale)

    const validatedFields = CreateAssetSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const data = validatedFields.data

    // Validar que tenga el contenido según el tipo
    if (data.type === 'IMAGE' && !data.imageUrl) {
      return { error: 'ImageUrlRequired' }
    }

    if (data.type === 'AUDIO' && !data.audioUrl) {
      return { error: 'AudioUrlRequired' }
    }

    if (data.type === 'PHRASE' && (!data.phraseEs || !data.phraseEn)) {
      return { error: 'PhrasesRequired' }
    }

    // Si se especifica eventTypeId, verificar que exista
    if (data.eventTypeId) {
      const eventType = await prisma.eventType.findUnique({
        where: { id: data.eventTypeId }
      })

      if (!eventType) {
        return { error: 'EventTypeNotFound' }
      }
    }

    const asset = await prisma.asset.create({
      data: {
        type: data.type,
        eventTypeId: data.eventTypeId || null,
        name: data.name,
        description: data.description,
        tags: data.tags || [],
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        audioUrl: data.audioUrl,
        audioDuration: data.audioDuration,
        phraseEs: data.phraseEs,
        phraseEn: data.phraseEn,
        order: data.order,
      }
    })

    revalidatePath('/admin-events/assets')

    console.log('[Assets] ✅ Asset created:', asset.name)

    return { success: true, asset }
  } catch (error) {
    console.error('[Assets] Error creating asset:', error)
    return { error: 'CreateFailed' }
  }
}

/**
 * Actualizar asset (ADMIN)
 */
export async function updateAsset(locale: string, id: string, values: Partial<z.infer<typeof CreateAssetSchema>>) {
  try {
    await requireAdmin(locale)

    const asset = await prisma.asset.findUnique({
      where: { id }
    })

    if (!asset) {
      return { error: 'AssetNotFound' }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: values
    })

    revalidatePath('/admin-events/assets')

    console.log('[Assets] ✅ Asset updated:', updatedAsset.name)

    return { success: true, asset: updatedAsset }
  } catch (error) {
    console.error('[Assets] Error updating asset:', error)
    return { error: 'UpdateFailed' }
  }
}

/**
 * Eliminar asset (ADMIN)
 */
export async function deleteAsset(locale: string, id: string) {
  try {
    await requireAdmin(locale)

    const asset = await prisma.asset.findUnique({
      where: { id }
    })

    if (!asset) {
      return { error: 'AssetNotFound' }
    }

    await prisma.asset.delete({
      where: { id }
    })

    revalidatePath('/admin-events/assets')

    console.log('[Assets] ✅ Asset deleted:', asset.name)

    return { success: true }
  } catch (error) {
    console.error('[Assets] Error deleting asset:', error)
    return { error: 'DeleteFailed' }
  }
}

/**
 * Toggle activo/inactivo (ADMIN)
 */
export async function toggleAssetActive(locale: string, id: string) {
  try {
    await requireAdmin(locale)

    const asset = await prisma.asset.findUnique({
      where: { id }
    })

    if (!asset) {
      return { error: 'AssetNotFound' }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: { isActive: !asset.isActive }
    })

    revalidatePath('/admin-events/assets')

    console.log('[Assets] ✅ Asset toggled:', updatedAsset.name, updatedAsset.isActive)

    return { success: true, asset: updatedAsset }
  } catch (error) {
    console.error('[Assets] Error toggling asset:', error)
    return { error: 'ToggleFailed' }
  }
}