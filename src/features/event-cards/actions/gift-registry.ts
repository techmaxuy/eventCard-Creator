'use server'

import { prisma } from '@/core/shared/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/../auth'
import { generateAIImage } from '@/core/shared/lib/ai'
import { uploadBase64Image } from '@/core/shared/lib/azure-storage'

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

/**
 * Generate AI image for the gift registry
 * Generates an empty gift box image when no gifts, or a collection image when gifts exist
 */
export async function generateGiftRegistryImage(eventId: string, locale: string = 'es') {
  try {
    // Get event with owner info
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventType: {
          select: { name: true, nameEn: true },
        },
      },
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    // Get all registered gifts for this event
    const gifts = await prisma.giftRegistration.findMany({
      where: { eventId },
      select: {
        giftName: true,
        quantity: true,
      },
    })

    const eventTypeName = locale === 'es' ? event.eventType.name : event.eventType.nameEn

    let prompt: string

    if (gifts.length === 0) {
      // Generate empty gift registry image
      prompt = locale === 'es'
        ? `Genera una imagen elegante y minimalista de una caja de regalo vacía o una mesa de regalos vacía para una invitación de ${eventTypeName}.
           El estilo debe ser acuarela suave y romántica con tonos pastel.
           La imagen debe transmitir anticipación y elegancia.
           NO incluir texto ni palabras en la imagen.
           Fondo suave y difuminado.
           La imagen será usada como placeholder para un registro de regalos sin regalos aún.`
        : `Generate an elegant and minimalist image of an empty gift box or empty gift table for a ${eventTypeName} invitation.
           The style should be soft romantic watercolor with pastel tones.
           The image should convey anticipation and elegance.
           Do NOT include any text or words in the image.
           Soft, blurred background.
           This image will be used as a placeholder for an empty gift registry.`
    } else {
      // Generate image with the registered gifts
      const giftsList = gifts
        .map(g => g.quantity > 1 ? `${g.quantity}x ${g.giftName}` : g.giftName)
        .join(', ')

      prompt = locale === 'es'
        ? `Genera una imagen elegante y festiva de una colección de regalos para una invitación de ${eventTypeName}.
           Los regalos incluyen: ${giftsList}.
           El estilo debe ser ilustración elegante con colores cálidos y festivos.
           Muestra los regalos de forma artística y decorativa, envueltos en papel de regalo elegante.
           NO incluir texto ni palabras en la imagen.
           Fondo suave con detalles decorativos sutiles.
           La imagen debe transmitir gratitud y celebración.`
        : `Generate an elegant and festive image of a gift collection for a ${eventTypeName} invitation.
           The gifts include: ${giftsList}.
           The style should be elegant illustration with warm, festive colors.
           Show the gifts artistically and decoratively, wrapped in elegant gift wrap.
           Do NOT include any text or words in the image.
           Soft background with subtle decorative details.
           The image should convey gratitude and celebration.`
    }

    console.log('[GiftRegistry] Generating image with prompt:', prompt)

    // Generate image using AI
    const result = await generateAIImage({
      userId: event.userId,
      prompt,
      tokensToConsume: 10, // Standard cost for image generation
    })

    if (result.error) {
      console.error('[GiftRegistry] AI image generation error:', result.error)
      return { error: result.error }
    }

    if (!result.imageBase64 || !result.imageMimeType) {
      return { error: 'NoImageGenerated' }
    }

    // Upload the image to storage
    const uploadResult = await uploadBase64Image(
      result.imageBase64,
      result.imageMimeType,
      `gift-registry-${eventId}`
    )

    if (uploadResult.error || !uploadResult.url) {
      console.error('[GiftRegistry] Upload error:', uploadResult.error)
      return { error: 'UploadFailed' }
    }

    // Update event with the new gift registry image
    const fieldToUpdate = gifts.length === 0 ? 'giftRegistryEmptyImage' : 'giftRegistryImage'

    await prisma.event.update({
      where: { id: eventId },
      data: { [fieldToUpdate]: uploadResult.url },
    })

    revalidatePath(`/es/e/${event.slug}`)
    revalidatePath(`/en/e/${event.slug}`)

    console.log(`[GiftRegistry] ${fieldToUpdate} updated for event:`, eventId)

    return {
      success: true,
      imageUrl: uploadResult.url,
      isEmpty: gifts.length === 0,
    }
  } catch (error) {
    console.error('[GiftRegistry] Error generating gift registry image:', error)
    return { error: 'GenerationFailed' }
  }
}

/**
 * Get the current gift registry image for an event
 */
export async function getGiftRegistryImage(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        giftRegistryImage: true,
        giftRegistryEmptyImage: true,
      },
    })

    if (!event) {
      return { error: 'EventNotFound' }
    }

    const giftsCount = await prisma.giftRegistration.count({
      where: { eventId },
    })

    // Return the appropriate image based on whether there are gifts
    const imageUrl = giftsCount > 0
      ? event.giftRegistryImage
      : event.giftRegistryEmptyImage

    return {
      imageUrl,
      hasGifts: giftsCount > 0,
      giftsCount,
    }
  } catch (error) {
    console.error('[GiftRegistry] Error getting gift registry image:', error)
    return { error: 'FetchFailed' }
  }
}
