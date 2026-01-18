'use server'

import { prisma } from '@/core/shared/lib/db'

/**
 * Tipo de operación de IA para eventos
 */
export type AIOperation =
  | 'phrase_generation'      // Generar frases de bienvenida
  | 'image_edit'             // Editar/mejorar imágenes
  | 'image_generation'       // Generar imágenes
  | 'description_generation' // Generar descripciones
  | 'suggestions'            // Sugerencias de IA

/**
 * Resultado de verificación de límites de eventos
 */
export interface EventLimitResult {
  canCreate: boolean
  currentCount: number
  maxEvents: number  // -1 = unlimited
  planName: string
  isFreePlan: boolean
  error?: string
}

/**
 * Resultado de verificación de acceso a IA
 */
export interface AIAccessResult {
  hasAccess: boolean
  tokensRemaining: number
  tokenCost: number
  canAfford: boolean
  planName: string
  error?: string
}

/**
 * Configuración de costos de IA
 */
export interface AITokenCosts {
  phraseGenerationCost: number
  imageEditCost: number
  imageGenerationCost: number
  descriptionGenerationCost: number
  suggestionsCost: number
  isAIEnabled: boolean
}

/**
 * Verificar si un usuario puede crear más eventos basado en su suscripción
 */
export async function checkEventCreationLimit(userId: string): Promise<EventLimitResult> {
  try {
    // Obtener suscripción del usuario con su plan
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: {
        plan: true
      }
    })

    // Si no tiene suscripción, asumimos plan free con límite de 1
    if (!subscription) {
      const eventCount = await prisma.event.count({
        where: { userId }
      })

      return {
        canCreate: eventCount < 1,
        currentCount: eventCount,
        maxEvents: 1,
        planName: 'free',
        isFreePlan: true,
        error: eventCount >= 1 ? 'EventLimitReached' : undefined
      }
    }

    const { plan } = subscription
    const isFreePlan = plan.name.toLowerCase() === 'free' || plan.price === 0

    // Si el plan tiene eventos ilimitados (-1), permitir siempre
    if (plan.maxEvents === -1) {
      const eventCount = await prisma.event.count({
        where: { userId }
      })

      return {
        canCreate: true,
        currentCount: eventCount,
        maxEvents: -1,
        planName: plan.name,
        isFreePlan
      }
    }

    // Contar eventos actuales del usuario
    const eventCount = await prisma.event.count({
      where: { userId }
    })

    const canCreate = eventCount < plan.maxEvents

    return {
      canCreate,
      currentCount: eventCount,
      maxEvents: plan.maxEvents,
      planName: plan.name,
      isFreePlan,
      error: !canCreate ? 'EventLimitReached' : undefined
    }
  } catch (error) {
    console.error('[checkEventCreationLimit] Error:', error)
    return {
      canCreate: false,
      currentCount: 0,
      maxEvents: 0,
      planName: 'unknown',
      isFreePlan: true,
      error: 'DatabaseError'
    }
  }
}

/**
 * Obtener configuración de costos de IA para eventos
 */
export async function getAITokenCosts(): Promise<AITokenCosts> {
  try {
    // Buscar configuración existente o usar valores por defecto
    let settings = await prisma.eventAISettings.findFirst()

    if (!settings) {
      // Crear configuración por defecto
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

    return {
      phraseGenerationCost: settings.phraseGenerationCost,
      imageEditCost: settings.imageEditCost,
      imageGenerationCost: settings.imageGenerationCost,
      descriptionGenerationCost: settings.descriptionGenerationCost,
      suggestionsCost: settings.suggestionsCost,
      isAIEnabled: settings.isAIEnabled
    }
  } catch (error) {
    console.error('[getAITokenCosts] Error:', error)
    // Retornar valores por defecto en caso de error
    return {
      phraseGenerationCost: 1,
      imageEditCost: 5,
      imageGenerationCost: 10,
      descriptionGenerationCost: 1,
      suggestionsCost: 1,
      isAIEnabled: true
    }
  }
}

/**
 * Obtener el costo en tokens para una operación de IA específica
 */
export async function getTokenCostForOperation(operation: AIOperation): Promise<number> {
  const costs = await getAITokenCosts()

  switch (operation) {
    case 'phrase_generation':
      return costs.phraseGenerationCost
    case 'image_edit':
      return costs.imageEditCost
    case 'image_generation':
      return costs.imageGenerationCost
    case 'description_generation':
      return costs.descriptionGenerationCost
    case 'suggestions':
      return costs.suggestionsCost
    default:
      return 1 // Costo por defecto
  }
}

/**
 * Verificar si un usuario tiene acceso a funciones de IA
 */
export async function checkAIAccess(userId: string, operation: AIOperation): Promise<AIAccessResult> {
  try {
    // Verificar si IA está habilitada globalmente
    const aiCosts = await getAITokenCosts()
    if (!aiCosts.isAIEnabled) {
      return {
        hasAccess: false,
        tokensRemaining: 0,
        tokenCost: 0,
        canAfford: false,
        planName: 'unknown',
        error: 'AIDisabled'
      }
    }

    // Obtener suscripción del usuario
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: {
        plan: true
      }
    })

    // Sin suscripción = sin acceso a IA
    if (!subscription) {
      return {
        hasAccess: false,
        tokensRemaining: 0,
        tokenCost: await getTokenCostForOperation(operation),
        canAfford: false,
        planName: 'free',
        error: 'NoSubscription'
      }
    }

    const { plan } = subscription

    // Verificar si el plan tiene acceso a IA
    if (!plan.hasAIAccess) {
      return {
        hasAccess: false,
        tokensRemaining: subscription.tokensRemaining,
        tokenCost: await getTokenCostForOperation(operation),
        canAfford: false,
        planName: plan.name,
        error: 'NoAIAccess'
      }
    }

    // Obtener costo de la operación
    const tokenCost = await getTokenCostForOperation(operation)

    // Verificar si tiene tokens suficientes
    const canAfford = subscription.tokensRemaining >= tokenCost

    return {
      hasAccess: true,
      tokensRemaining: subscription.tokensRemaining,
      tokenCost,
      canAfford,
      planName: plan.name,
      error: !canAfford ? 'InsufficientTokens' : undefined
    }
  } catch (error) {
    console.error('[checkAIAccess] Error:', error)
    return {
      hasAccess: false,
      tokensRemaining: 0,
      tokenCost: 0,
      canAfford: false,
      planName: 'unknown',
      error: 'DatabaseError'
    }
  }
}

/**
 * Obtener información completa de suscripción para eventos
 */
export async function getEventSubscriptionInfo(userId: string) {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: {
        plan: true
      }
    })

    if (!subscription) {
      // Usuario sin suscripción - asumimos free
      const eventCount = await prisma.event.count({
        where: { userId }
      })

      return {
        planName: 'free',
        displayName: 'Free',
        isFreePlan: true,
        maxEvents: 1,
        currentEventCount: eventCount,
        canCreateEvent: eventCount < 1,
        hasAIAccess: false,
        tokensRemaining: 0,
        tokensUsed: 0
      }
    }

    const eventCount = await prisma.event.count({
      where: { userId }
    })

    const isFreePlan = subscription.plan.name.toLowerCase() === 'free' || subscription.plan.price === 0
    const canCreateEvent = subscription.plan.maxEvents === -1 || eventCount < subscription.plan.maxEvents

    return {
      planName: subscription.plan.name,
      displayName: subscription.plan.displayNameEs || subscription.plan.displayNameEn,
      isFreePlan,
      maxEvents: subscription.plan.maxEvents,
      currentEventCount: eventCount,
      canCreateEvent,
      hasAIAccess: subscription.plan.hasAIAccess,
      tokensRemaining: subscription.tokensRemaining,
      tokensUsed: subscription.tokensUsed
    }
  } catch (error) {
    console.error('[getEventSubscriptionInfo] Error:', error)
    return null
  }
}
