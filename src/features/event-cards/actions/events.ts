'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreateEventSchema = z.object({
  eventTypeId: z.string().min(1, 'Event type is required'),
  title: z.string().min(1, 'Title is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
})

/**
 * Generar slug único
 */
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.event.findUnique({
      where: { slug }
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Crear evento básico (solo tipo y título)
 */
export async function createEvent(values: z.infer<typeof CreateEventSchema>) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Validar datos
    const validatedFields = CreateEventSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const { eventTypeId, title, slug } = validatedFields.data

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

    // Generar slug único
    const uniqueSlug = await generateUniqueSlug(slug)

    // Crear evento
    const event = await prisma.event.create({
      data: {
        userId: session.user.id,
        eventTypeId,
        title,
        slug: uniqueSlug,
        isPublished: false,
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