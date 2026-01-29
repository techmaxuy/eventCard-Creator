'use server'

import { prisma } from '@/core/shared/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/../auth'

const GiftRegistrationSchema = z.object({
  giftName: z.string().min(1, 'Gift name is required').max(200),
  description: z.string().max(500).optional(),
  quantity: z.number().min(1).max(99).default(1),
})

/**
 * Register a gift for an event (guest must have confirmed attendance)
 */
export async function registerGift(
  eventId: string,
  guestPhone: string,
  values: z.infer<typeof GiftRegistrationSchema>
) {
  try {
    // Validate input
    const validatedFields = GiftRegistrationSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    // Check if event exists and has gift registry enabled
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        isPublished: true,
        showGiftRegistry: true,
      },
      include: {
        eventType: {
          select: {
            hasGiftRegistry: true,
          },
        },
      },
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    if (!event.eventType.hasGiftRegistry) {
      return { error: 'GiftRegistryNotEnabled' }
    }

    // Find the guest by phone number and verify they confirmed
    const guest = await prisma.guest.findFirst({
      where: {
        eventId,
        phone: guestPhone,
        status: 'CONFIRMED',
      },
    })

    if (!guest) {
      return { error: 'GuestNotConfirmed' }
    }

    // Check if gift with same name already exists for this guest
    const existingGift = await prisma.giftRegistration.findFirst({
      where: {
        eventId,
        guestId: guest.id,
        giftName: validatedFields.data.giftName,
      },
    })

    if (existingGift) {
      // Update existing gift registration
      const updatedGift = await prisma.giftRegistration.update({
        where: { id: existingGift.id },
        data: {
          description: validatedFields.data.description,
          quantity: validatedFields.data.quantity,
        },
      })

      revalidatePath(`/es/e/${event.slug}`)
      revalidatePath(`/en/e/${event.slug}`)

      return { success: true, gift: updatedGift, updated: true }
    }

    // Create new gift registration
    const gift = await prisma.giftRegistration.create({
      data: {
        eventId,
        guestId: guest.id,
        giftName: validatedFields.data.giftName,
        description: validatedFields.data.description,
        quantity: validatedFields.data.quantity,
      },
    })

    revalidatePath(`/es/e/${event.slug}`)
    revalidatePath(`/en/e/${event.slug}`)

    console.log('[GiftRegistry] Gift registered:', gift.giftName, 'by guest:', guest.name)

    return { success: true, gift }
  } catch (error) {
    console.error('[GiftRegistry] Error registering gift:', error)
    return { error: 'RegistrationFailed' }
  }
}

/**
 * Get gifts registered by a guest (by phone number)
 */
export async function getGuestGifts(eventId: string, guestPhone: string) {
  try {
    const guest = await prisma.guest.findFirst({
      where: {
        eventId,
        phone: guestPhone,
        status: 'CONFIRMED',
      },
      include: {
        giftRegistrations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!guest) {
      return { error: 'GuestNotFound', gifts: [] }
    }

    return { gifts: guest.giftRegistrations }
  } catch (error) {
    console.error('[GiftRegistry] Error getting guest gifts:', error)
    return { error: 'FetchFailed', gifts: [] }
  }
}

/**
 * Remove a gift registration (guest can only remove their own gifts)
 */
export async function removeGift(giftId: string, guestPhone: string) {
  try {
    // Find the gift and verify ownership
    const gift = await prisma.giftRegistration.findUnique({
      where: { id: giftId },
      include: {
        guest: true,
        event: true,
      },
    })

    if (!gift || gift.guest.phone !== guestPhone) {
      return { error: 'Unauthorized' }
    }

    await prisma.giftRegistration.delete({
      where: { id: giftId },
    })

    revalidatePath(`/es/e/${gift.event.slug}`)
    revalidatePath(`/en/e/${gift.event.slug}`)

    console.log('[GiftRegistry] Gift removed:', gift.giftName)

    return { success: true }
  } catch (error) {
    console.error('[GiftRegistry] Error removing gift:', error)
    return { error: 'RemoveFailed' }
  }
}

/**
 * Get all gifts for an event (for event owner)
 */
export async function getEventGifts(eventId: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    const gifts = await prisma.giftRegistration.findMany({
      where: { eventId },
      include: {
        guest: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group gifts by name and count
    const giftSummary = gifts.reduce(
      (acc, gift) => {
        const key = gift.giftName.toLowerCase()
        if (!acc[key]) {
          acc[key] = {
            giftName: gift.giftName,
            totalQuantity: 0,
            registrations: [],
          }
        }
        acc[key].totalQuantity += gift.quantity
        acc[key].registrations.push({
          guestName: gift.guest.name,
          quantity: gift.quantity,
          description: gift.description,
        })
        return acc
      },
      {} as Record<
        string,
        {
          giftName: string
          totalQuantity: number
          registrations: { guestName: string; quantity: number; description: string | null }[]
        }
      >
    )

    return {
      gifts,
      summary: Object.values(giftSummary),
      totalGifts: gifts.reduce((sum, g) => sum + g.quantity, 0),
      totalUniqueGifts: Object.keys(giftSummary).length,
    }
  } catch (error) {
    console.error('[GiftRegistry] Error getting event gifts:', error)
    return { error: 'FetchFailed' }
  }
}

/**
 * Check if a guest can register gifts (must be confirmed)
 */
export async function checkGiftRegistryAccess(eventId: string, guestPhone: string) {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        isPublished: true,
      },
      include: {
        eventType: {
          select: {
            hasGiftRegistry: true,
          },
        },
      },
    })

    if (!event) {
      return { canRegister: false, reason: 'EventNotFound' }
    }

    if (!event.showGiftRegistry || !event.eventType.hasGiftRegistry) {
      return { canRegister: false, reason: 'GiftRegistryDisabled' }
    }

    const guest = await prisma.guest.findFirst({
      where: {
        eventId,
        phone: guestPhone,
        status: 'CONFIRMED',
      },
    })

    if (!guest) {
      return { canRegister: false, reason: 'GuestNotConfirmed' }
    }

    return { canRegister: true, guestId: guest.id, guestName: guest.name }
  } catch (error) {
    console.error('[GiftRegistry] Error checking access:', error)
    return { canRegister: false, reason: 'Error' }
  }
}
