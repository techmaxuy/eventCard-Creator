'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { checkEventCreationLimit, getEventSubscriptionInfo } from '../lib/subscription-limits'

const CreateEventSchema = z.object({
  eventTypeId: z.string().min(1, 'Event type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  titleNames: z.string().max(200).optional(),
  welcomePhrase: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  featuredImage: z.string().url().optional(),
})

/**
 * Generate a short, random alphanumeric slug (URL-safe)
 * Uses base62 encoding (a-z, A-Z, 0-9) for maximum readability
 */
function generateRandomSlug(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  // Use crypto.randomBytes for better randomness
  const randomBytes = crypto.getRandomValues(new Uint8Array(length))

  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length]
  }

  return result
}

/**
 * Generar slug único encriptado y corto
 */
export async function generateUniqueSlug(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const slug = generateRandomSlug(8)

    const existing = await prisma.event.findUnique({
      where: { slug }
    })

    if (!existing) {
      return slug
    }

    attempts++
  }

  // Si después de 10 intentos no encontramos uno único, usar 10 caracteres
  return generateRandomSlug(10)
}

/**
 * Crear evento básico (solo tipo y título)
 * Verifica límites de suscripción antes de crear
 */
export async function createEvent(values: z.infer<typeof CreateEventSchema>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // ✅ NUEVO: Verificar límite de eventos según suscripción
    const limitCheck = await checkEventCreationLimit(session.user.id)
    if (!limitCheck.canCreate) {
      console.log('[Events] ❌ Event limit reached:', limitCheck)
      return {
        error: 'EventLimitReached',
        limitInfo: {
          currentCount: limitCheck.currentCount,
          maxEvents: limitCheck.maxEvents,
          planName: limitCheck.planName,
          isFreePlan: limitCheck.isFreePlan
        }
      }
    }

    // Validar datos
    const validatedFields = CreateEventSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const { eventTypeId, title, titleNames, welcomePhrase, coverImage, featuredImage } = validatedFields.data

    // Verificar que el tipo de evento exista y esté activo
    const eventType = await prisma.eventType.findFirst({
      where: {
        id: eventTypeId,
        isActive: true
      }
    })

    if (!eventType) {
      return { error: 'EventTypeNotFound' }
    }

    // Generar slug único encriptado
    const uniqueSlug = await generateUniqueSlug()

    // Crear evento
    const event = await prisma.event.create({
      data: {
        userId: session.user.id,
        eventTypeId,
        title,
        titleNames: titleNames || null,
        welcomePhrase: welcomePhrase || null,
        description: welcomePhrase || null, // Also set description for the editor
        slug: uniqueSlug,
        isPublished: false,
        coverImage: coverImage || null,
        featuredImage: featuredImage || null,
      },
      include: {
        eventType: true
      }
    })

    revalidatePath('/events')

    console.log('[Events] ✅ Event created:', event.slug)

    return { success: true, event }
  } catch (error) {
    console.error('[Events] Error creating event:', error)
    return { error: 'CreateFailed' }
  }
}

/**
 * Obtener información de suscripción del usuario para eventos
 */
export async function getUserEventSubscriptionInfo() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const info = await getEventSubscriptionInfo(session.user.id)

    if (!info) {
      return { error: 'SubscriptionInfoNotFound' }
    }

    return { subscriptionInfo: info }
  } catch (error) {
    console.error('[Events] Error getting subscription info:', error)
    return { error: 'Failed to get subscription info' }
  }
}

/**
 * Obtener eventos del usuario
 */
export async function getUserEvents() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        eventType: {
          select: {
            name: true,
            nameEn: true,
            icon: true,
            color: true,
          }
        },
        _count: {
          select: {
            guests: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { events }
  } catch (error) {
    console.error('[Events] Error getting user events:', error)
    return { error: 'Failed to get events' }
  }
}

/**
 * Obtener un evento del usuario
 */
export async function getUserEvent(id: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        eventType: true,
        _count: {
          select: {
            guests: true
          }
        }
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    return { event }
  } catch (error) {
    console.error('[Events] Error getting event:', error)
    return { error: 'Failed to get event' }
  }
}


const UpdateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  titleNames: z.string().max(200).optional(),
  titleMessage: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  eventDate: z.string().optional(), // ISO date string
  eventTime: z.string().optional(),
  location: z.string().max(200).optional(),
  locationAddress: z.string().max(500).optional(),
  locationUrl: z.string().url().optional().or(z.literal('')),
  dressCode: z.string().max(100).optional(),
  giftRegistry: z.string().max(1000).optional().or(z.literal('')),
  giftRegistryType: z.enum(['url', 'text']).optional(),
  menu: z.string().max(1000).optional(),
  theme: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isPublished: z.boolean().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  featuredImage: z.string().url().optional().or(z.literal('')),
  welcomePhrase: z.string().optional(),
  musicUrl: z.string().url().optional().or(z.literal('')),
  fontFamily: z.string().optional(),
  fontEventType: z.string().optional(),
  fontTitle: z.string().optional(),
  fontMessage: z.string().optional(),
  fontBody: z.string().optional(),
  colorEventType: z.string().optional(),
  colorTitle: z.string().optional(),
  colorMessage: z.string().optional(),
  colorBody: z.string().optional(),
  fontSizeEventType: z.number().int().min(25).max(400).optional(),
  fontSizeTitle: z.number().int().min(25).max(400).optional(),
  fontSizeMessage: z.number().int().min(25).max(400).optional(),
  fontSizeBody: z.number().int().min(25).max(400).optional(),
  welcomePhrasePosition: z.enum(['above', 'below']).optional(),
  decorations: z.array(z.object({
    assetId: z.string(),
    position: z.string(),
  })).optional(),
  askDietaryRequirements: z.boolean().optional(),
  particleEffect: z.enum(['confetti', 'petals', 'bubbles', 'stars', 'none']).optional().nullable(),
  showCountdown: z.boolean().optional(),
})

/**
 * Actualizar evento
 */
export async function updateEvent(id: string, values: z.infer<typeof UpdateEventSchema>) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que el evento exista y pertenezca al usuario
    const event = await prisma.event.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    // Validar datos
    const validatedFields = UpdateEventSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const data = validatedFields.data

    // Convertir fecha ISO a DateTime si existe
    // IMPORTANTE: Guardamos la fecha al mediodía UTC para evitar problemas de zona horaria
    // que pueden cambiar el día cuando se visualiza en diferentes zonas horarias
    const updateData: any = { ...data }
    if (data.eventDate) {
      // data.eventDate viene como "2026-02-22", lo convertimos a "2026-02-22T12:00:00Z"
      updateData.eventDate = new Date(`${data.eventDate}T12:00:00Z`)
    }

    // Actualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        eventType: true
      }
    })

    revalidatePath(`/events/${id}`)
    revalidatePath(`/events/${id}/edit`)
    revalidatePath('/events')

    if (updatedEvent.isPublished) {
  revalidatePath(`/es/e/${updatedEvent.slug}`)
  revalidatePath(`/en/e/${updatedEvent.slug}`)
}

    console.log('[Events] ✅ Event updated:', updatedEvent.slug)

    return { success: true, event: updatedEvent }
  } catch (error) {
    console.error('[Events] Error updating event:', error)
    return { error: 'UpdateFailed' }
  }
}

/**
 * Eliminar evento
 */
export async function deleteEvent(id: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que el evento exista y pertenezca al usuario
    const event = await prisma.event.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    // Eliminar evento (cascade eliminará guests)
    await prisma.event.delete({
      where: { id }
    })

    revalidatePath('/events')

    console.log('[Events] ✅ Event deleted:', event.slug)

    return { success: true }
  } catch (error) {
    console.error('[Events] Error deleting event:', error)
    return { error: 'DeleteFailed' }
  }
}

/**
 * Publicar/Despublicar evento
 */
export async function togglePublishEvent(id: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        isPublished: !event.isPublished
      }
    })

    revalidatePath(`/events/${id}`)
    revalidatePath(`/events/${id}/edit`)
    revalidatePath('/events')

    // Solo revalidar la página pública si está publicado
    if (updatedEvent.isPublished) {
      // Revalidar para ambos idiomas
      revalidatePath(`/es/e/${updatedEvent.slug}`)
      revalidatePath(`/en/e/${updatedEvent.slug}`)
    }
    

    console.log('[Events] ✅ Event publish toggled:', updatedEvent.slug, updatedEvent.isPublished)

    return { success: true, event: updatedEvent }
  } catch (error) {
    console.error('[Events] Error toggling publish:', error)
    return { error: 'ToggleFailed' }
  }
}

