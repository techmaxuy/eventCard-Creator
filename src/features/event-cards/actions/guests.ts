'use server'

import { prisma } from '@/core/shared/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/../auth'

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

    // NUEVO: Enviar notificación al dueño del evento
    try {
      await sendGuestNotification(event, guest, existingGuest ? 'updated' : 'new')
    } catch (emailError) {
      // No fallar si el email no se envía
      console.error('[Guests] Error sending notification email:', emailError)
    }



    return { success: true, guest }
  } catch (error) {
    console.error('[Guests] Error confirming guest:', error)
    return { error: 'ConfirmFailed' }
  }
}

/**
 * Enviar notificación por email al dueño del evento
 */
async function sendGuestNotification(
  event: any,
  guest: any,
  type: 'new' | 'updated'
) {
  const { sendEmail } = await import('@/core/shared/lib/email')

  const statusText = {
    CONFIRMED: 'confirmó asistencia',
    DECLINED: 'declinó la invitación',
    MAYBE: 'respondió "tal vez"'
  }

  const subject = type === 'new' 
    ? `Nueva confirmación: ${guest.name} - ${event.title}`
    : `Confirmación actualizada: ${guest.name} - ${event.title}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${type === 'new' ? '🎉 Nueva Confirmación' : '📝 Confirmación Actualizada'}</h2>
      
      <p>Hola,</p>
      
      <p><strong>${guest.name}</strong> ${statusText[guest.status as keyof typeof statusText]} para tu evento <strong>${event.title}</strong>.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalles:</h3>
        <p><strong>Nombre:</strong> ${guest.name}</p>
        <p><strong>Teléfono:</strong> ${guest.phone}</p>
        ${guest.email ? `<p><strong>Email:</strong> ${guest.email}</p>` : ''}
        <p><strong>Estado:</strong> ${guest.status === 'CONFIRMED' ? '✅ Confirmado' : guest.status === 'DECLINED' ? '❌ No asistirá' : '❓ Tal vez'}</p>
        ${guest.status === 'CONFIRMED' ? `<p><strong>Cantidad de personas:</strong> ${guest.numberOfGuests}</p>` : ''}
        ${guest.message ? `<p><strong>Mensaje:</strong> ${guest.message}</p>` : ''}
      </div>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}/guests" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          Ver Todos los Invitados
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Este es un email automático de EventCards.
      </p>
    </div>
  `

  // Obtener email del dueño del evento
  const owner = await prisma.user.findUnique({
    where: { id: event.userId },
    select: { email: true, name: true }
  })

  if (owner?.email) {
    await sendEmail({
      to: owner.email,
      subject,
      html,
    })

    console.log('[Guests] ✅ Notification email sent to:', owner.email)
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


/**
 * Obtener invitados de un evento (solo para el dueño)
 */
export async function getEventGuestsForOwner(eventId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que el evento pertenezca al usuario
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: session.user.id
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    const guests = await prisma.guest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    })

    // Calcular estadísticas
    const stats = {
      total: guests.length,
      confirmed: guests.filter(g => g.status === 'CONFIRMED').length,
      declined: guests.filter(g => g.status === 'DECLINED').length,
      maybe: guests.filter(g => g.status === 'MAYBE').length,
      totalPeople: guests
        .filter(g => g.status === 'CONFIRMED')
        .reduce((sum, g) => sum + g.numberOfGuests, 0)
    }

    return { guests, stats }
  } catch (error) {
    console.error('[Guests] Error getting guests for owner:', error)
    return { error: 'Failed to get guests' }
  }
}

/**
 * Eliminar invitado (solo para el dueño)
 */
export async function deleteGuest(guestId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que el invitado pertenezca a un evento del usuario
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        event: {
          select: { userId: true, slug: true }
        }
      }
    })

    if (!guest || guest.event.userId !== session.user.id) {
      return { error: 'Unauthorized' }
    }

    await prisma.guest.delete({
      where: { id: guestId }
    })

    revalidatePath(`/events/${guest.eventId}/guests`)
    revalidatePath(`/es/e/${guest.event.slug}`)
    revalidatePath(`/en/e/${guest.event.slug}`)

    console.log('[Guests] ✅ Guest deleted:', guest.name)

    return { success: true }
  } catch (error) {
    console.error('[Guests] Error deleting guest:', error)
    return { error: 'DeleteFailed' }
  }
}

/**
 * Exportar invitados a CSV
 */
export async function exportGuestsToCSV(eventId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que el evento pertenezca al usuario
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: session.user.id
      }
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    const guests = await prisma.guest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    })

    // Generar CSV
    const headers = ['Nombre', 'Teléfono', 'Email', 'Estado', 'Cantidad', 'Mensaje', 'Fecha de Confirmación']
    const rows = guests.map(g => [
      g.name,
      g.phone,
      g.email || '',
      g.status,
      g.numberOfGuests.toString(),
      g.message || '',
      g.createdAt.toLocaleString()
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return { success: true, csv, filename: `invitados-${event.slug}.csv` }
  } catch (error) {
    console.error('[Guests] Error exporting guests:', error)
    return { error: 'ExportFailed' }
  }
}

