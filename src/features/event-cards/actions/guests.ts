'use server'

import { prisma } from '@/core/shared/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const GuestConfirmationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().optional().or(z.literal('')),
  numberOfGuests: z.number().min(1).max(10),
  message: z.string().max(500).optional(),
  status: z.enum(['CONFIRMED', 'DECLINED', 'MAYBE']),
})

/**
 * Obtener evento público por slug
 */
export async function getPublicEvent(slug: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { 
        slug,
        isPublished: true // Solo eventos publicados
      },
      include: {
        eventType: true,
        user: {
          select: {
            name: true,
          }
        },
        _count: {
          select: {
            guests: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    // Incrementar views
    await prisma.event.update({
      where: { id: event.id },
      data: { views: { increment: 1 } }
    })

    return { event }
  } catch (error) {
    console.error('[Guests] Error getting public event:', error)
    return { error: 'Failed to get event' }
  }
}

/**
 * Confirmar asistencia como invitado
 */
export async function confirmGuest(eventId: string, values: z.infer<typeof GuestConfirmationSchema>, metadata?: { ipAddress?: string, userAgent?: string }) {
  try {
    // Validar datos
    const validatedFields = GuestConfirmationSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    // Verificar que el evento exista y esté publicado
    const event = await prisma.event.findUnique({
      where: { 
        id: eventId,
        isPublished: true 
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    // Verificar límite de invitados si existe
    if (event.maxGuests) {
      const currentConfirmed = await prisma.guest.count({
        where: {
          eventId,
          status: 'CONFIRMED'
        }
      })

      if (currentConfirmed >= event.maxGuests && validatedFields.data.status === 'CONFIRMED') {
        return { error: 'EventFull' }
      }
    }

    // Verificar si ya confirmó con este teléfono
    const existingGuest = await prisma.guest.findFirst({
      where: {
        eventId,
        phone: validatedFields.data.phone
      }
    })

    let guest

    if (existingGuest) {
      // Actualizar confirmación existente
      guest = await prisma.guest.update({
        where: { id: existingGuest.id },
        data: {
          ...validatedFields.data,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        }
      })
    } else {
      // Crear nueva confirmación
      guest = await prisma.guest.create({
        data: {
          eventId,
          ...validatedFields.data,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        }
      })
    }

    revalidatePath(`/es/e/${event.slug}`)
    revalidatePath(`/en/e/${event.slug}`)

    console.log('[Guests] ✅ Guest confirmed:', guest.name, guest.status)

    return { success: true, guest }
  } catch (error) {
    console.error('[Guests] Error confirming guest:', error)
    return { error: 'ConfirmFailed' }
  }
}

/**
 * Obtener invitados de un evento (para el dueño)
 */
export async function getEventGuests(eventId: string) {
  try {
    const guests = await prisma.guest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    })

    return { guests }
  } catch (error) {
    console.error('[Guests] Error getting guests:', error)
    return { error: 'Failed to get guests' }
  }
}