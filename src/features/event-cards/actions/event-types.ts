'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/core/auth/lib/auth-helpers'

const EventTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nameEn: z.string().min(1, 'English name is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  hasDate: z.boolean(),
  hasTime: z.boolean(),
  hasLocation: z.boolean(),
  hasDressCode: z.boolean(),
  hasGiftRegistry: z.boolean(),
  hasMenu: z.boolean(),
  hideGuestCount: z.boolean(),
  allowDecorations: z.boolean(),
  defaultTheme: z.string(),
  isActive: z.boolean(),
  // AI Wizard Configuration
  numberOfPeople: z.number().int().min(1).max(10).default(1),
  askNames: z.boolean().default(true),
  // AI Prompt Supplements (bilingual)
  aiTitlePromptEs: z.string().optional(),
  aiTitlePromptEn: z.string().optional(),
  aiPhrasePromptEs: z.string().optional(),
  aiPhrasePromptEn: z.string().optional(),
  aiBackgroundPromptEs: z.string().optional(),
  aiBackgroundPromptEn: z.string().optional(),
  aiPhotoPromptEs: z.string().optional(),
  aiPhotoPromptEn: z.string().optional(),
})



/**
 * Obtener todos los tipos de eventos
 */
export async function getEventTypes(includeInactive = false) {
  try {
    const eventTypes = await prisma.eventType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { events: true }
        }
      }
    })

    return { eventTypes }
  } catch (error) {
    console.error('[EventTypes] Error getting event types:', error)
    return { error: 'Failed to get event types' }
  }
}

/**
 * Obtener un tipo de evento por ID
 */
export async function getEventType(id: string) {
  try {
    const eventType = await prisma.eventType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true }
        }
      }
    })

    if (!eventType) {
      return { error: 'Event type not found' }
    }

    return { eventType }
  } catch (error) {
    console.error('[EventTypes] Error getting event type:', error)
    return { error: 'Failed to get event type' }
  }
}

/**
 * Crear tipo de evento
 */
export async function createEventType(values: z.infer<typeof EventTypeSchema>) {
  try {
    await requireAdmin()

    // Validar datos
    const validatedFields = EventTypeSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    // Verificar que el slug no exista
    const existingSlug = await prisma.eventType.findUnique({
      where: { slug: validatedFields.data.slug }
    })

    if (existingSlug) {
      return { error: 'SlugAlreadyExists' }
    }

    // Crear tipo de evento
    const eventType = await prisma.eventType.create({
      data: validatedFields.data
    })

    revalidatePath('/admin-events/event-types')

    console.log('[EventTypes] ✅ Event type created:', eventType.slug)

    return { success: true, eventType }
  } catch (error) {
    console.error('[EventTypes] Error creating event type:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { error: 'Unauthorized' }
    }
    
    return { error: 'CreateFailed' }
  }
}

/**
 * Actualizar tipo de evento
 */
export async function updateEventType(id: string, values: z.infer<typeof EventTypeSchema>) {
  try {
    await requireAdmin()

    // Validar datos
    const validatedFields = EventTypeSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    // Verificar que el tipo exista
    const existingEventType = await prisma.eventType.findUnique({
      where: { id }
    })

    if (!existingEventType) {
      return { error: 'EventTypeNotFound' }
    }

    // Si cambió el slug, verificar que no exista
    if (validatedFields.data.slug !== existingEventType.slug) {
      const slugExists = await prisma.eventType.findUnique({
        where: { slug: validatedFields.data.slug }
      })

      if (slugExists) {
        return { error: 'SlugAlreadyExists' }
      }
    }

    // Actualizar tipo de evento
    const eventType = await prisma.eventType.update({
      where: { id },
      data: validatedFields.data
    })

    revalidatePath('/admin-events/event-types')

    console.log('[EventTypes] ✅ Event type updated:', eventType.slug)

    return { success: true, eventType }
  } catch (error) {
    console.error('[EventTypes] Error updating event type:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { error: 'Unauthorized' }
    }
    
    return { error: 'UpdateFailed' }
  }
}

/**
 * Eliminar tipo de evento
 */
export async function deleteEventType(id: string) {
  try {
    await requireAdmin()

    // Verificar que el tipo exista
    const eventType = await prisma.eventType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true }
        }
      }
    })

    if (!eventType) {
      return { error: 'EventTypeNotFound' }
    }

    // No permitir eliminar si tiene eventos asociados
    if (eventType._count.events > 0) {
      return { error: 'CannotDeleteWithEvents' }
    }

    // Eliminar
    await prisma.eventType.delete({
      where: { id }
    })

    revalidatePath('/admin-events/event-types')

    console.log('[EventTypes] ✅ Event type deleted:', eventType.slug)

    return { success: true }
  } catch (error) {
    console.error('[EventTypes] Error deleting event type:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { error: 'Unauthorized' }
    }
    
    return { error: 'DeleteFailed' }
  }
}

/**
 * Crear tipos de eventos por defecto (ejecutar una vez)
 */
export async function seedDefaultEventTypes() {
  try {
    await requireAdmin()

    // Verificar si ya existen tipos
    const existingTypes = await prisma.eventType.count()
    
    if (existingTypes > 0) {
      return { error: 'EventTypesAlreadyExist' }
    }

    // Crear tipos por defecto
    const defaultTypes = [
      {
        name: 'Cumpleaños',
        nameEn: 'Birthday',
        slug: 'birthday',
        description: 'Celebración de cumpleaños',
        descriptionEn: 'Birthday celebration',
        icon: '🎂',
        color: '#ec4899',
        hasDate: true,
        hasTime: true,
        hasLocation: true,
        hasDressCode: true,
        hasGiftRegistry: false,
        hasMenu: true,
        defaultTheme: 'fun',
        isActive: true,
        numberOfPeople: 1,
        askNames: true,
        aiTitlePromptEs: 'Genera un título festivo y alegre para una fiesta de cumpleaños.',
        aiTitlePromptEn: 'Generate a festive and joyful title for a birthday party.',
        aiPhrasePromptEs: 'Genera una frase de bienvenida cálida y emotiva para una celebración de cumpleaños.',
        aiPhrasePromptEn: 'Generate a warm and emotional welcome phrase for a birthday celebration.',
      },
      {
        name: 'Casamiento',
        nameEn: 'Wedding',
        slug: 'wedding',
        description: 'Ceremonia de boda',
        descriptionEn: 'Wedding ceremony',
        icon: '💍',
        color: '#f59e0b',
        hasDate: true,
        hasTime: true,
        hasLocation: true,
        hasDressCode: true,
        hasGiftRegistry: true,
        hasMenu: true,
        defaultTheme: 'elegant',
        isActive: true,
        numberOfPeople: 2,
        askNames: true,
        aiTitlePromptEs: 'Genera un título romántico y elegante para una invitación de boda.',
        aiTitlePromptEn: 'Generate a romantic and elegant title for a wedding invitation.',
        aiPhrasePromptEs: 'Genera una frase de bienvenida romántica y elegante para una ceremonia de boda.',
        aiPhrasePromptEn: 'Generate a romantic and elegant welcome phrase for a wedding ceremony.',
      },
    ]

    await prisma.eventType.createMany({
      data: defaultTypes
    })

    revalidatePath('/admin-events/event-types')

    console.log('[EventTypes] ✅ Default event types created')

    return { success: true }
  } catch (error) {
    console.error('[EventTypes] Error seeding default types:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { error: 'Unauthorized' }
    }
    
    return { error: 'SeedFailed' }
  }
}