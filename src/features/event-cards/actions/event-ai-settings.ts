'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const UpdateAISettingsSchema = z.object({
  phraseGenerationCost: z.number().min(1).max(100),
  imageEditCost: z.number().min(1).max(100),
  imageGenerationCost: z.number().min(1).max(100),
  descriptionGenerationCost: z.number().min(1).max(100),
  suggestionsCost: z.number().min(1).max(100),
  isAIEnabled: z.boolean(),
})

/**
 * Obtener configuración actual de costos de IA
 * Solo accesible por admins
 */
export async function getEventAISettings() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'AdminOnly' }
    }

    // Buscar configuración existente o crear una por defecto
    let settings = await prisma.eventAISettings.findFirst()

    if (!settings) {
      settings = await prisma.eventAISettings.create({
        data: {
          phraseGenerationCost: 1,
          imageEditCost: 5,
          imageGenerationCost: 10,
          descriptionGenerationCost: 1,
          suggestionsCost: 1,
          isAIEnabled: true
        }
      })
    }

    return { settings }
  } catch (error) {
    console.error('[EventAISettings] Error getting settings:', error)
    return { error: 'DatabaseError' }
  }
}

/**
 * Actualizar configuración de costos de IA
 * Solo accesible por admins
 */
export async function updateEventAISettings(values: z.infer<typeof UpdateAISettingsSchema>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'AdminOnly' }
    }

    // Validar datos
    const validatedFields = UpdateAISettingsSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const data = validatedFields.data

    // Buscar configuración existente
    let settings = await prisma.eventAISettings.findFirst()

    if (!settings) {
      // Crear si no existe
      settings = await prisma.eventAISettings.create({
        data
      })
    } else {
      // Actualizar existente
      settings = await prisma.eventAISettings.update({
        where: { id: settings.id },
        data
      })
    }

    revalidatePath('/admin-events')

    console.log('[EventAISettings] ✅ Settings updated:', settings)

    return { success: true, settings }
  } catch (error) {
    console.error('[EventAISettings] Error updating settings:', error)
    return { error: 'UpdateFailed' }
  }
}

/**
 * Habilitar/Deshabilitar IA globalmente
 * Solo accesible por admins
 */
export async function toggleAIEnabled() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'AdminOnly' }
    }

    // Buscar configuración existente
    let settings = await prisma.eventAISettings.findFirst()

    if (!settings) {
      settings = await prisma.eventAISettings.create({
        data: {
          phraseGenerationCost: 1,
          imageEditCost: 5,
          imageGenerationCost: 10,
          descriptionGenerationCost: 1,
          suggestionsCost: 1,
          isAIEnabled: true
        }
      })
    }

    // Toggle estado
    settings = await prisma.eventAISettings.update({
      where: { id: settings.id },
      data: {
        isAIEnabled: !settings.isAIEnabled
      }
    })

    revalidatePath('/admin-events')

    console.log('[EventAISettings] ✅ AI toggled:', settings.isAIEnabled)

    return { success: true, isAIEnabled: settings.isAIEnabled }
  } catch (error) {
    console.error('[EventAISettings] Error toggling AI:', error)
    return { error: 'ToggleFailed' }
  }
}
