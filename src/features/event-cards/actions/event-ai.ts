'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { generateAIResponse, generateAIImage } from '@/core/shared/lib/ai'
import { checkAIAccess, getTokenCostForOperation, type AIOperation } from '../lib/subscription-limits'

interface AIResult {
  success?: boolean
  content?: string
  imageUrl?: string  // For image generation responses
  images?: string[]  // For multiple generated images
  error?: string
  tokensUsed?: number
  tokensRemaining?: number
}

/**
 * Generate event title suggestions using AI
 */
export async function generateEventTitle(params: {
  eventTypeId: string
  names: string[]
  userContext?: string  // Optional: text the user wrote as context for AI
  locale: string
}): Promise<AIResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const operation: AIOperation = 'suggestions'

    // Check AI access and token availability
    const accessCheck = await checkAIAccess(session.user.id, operation)
    if (!accessCheck.hasAccess) {
      return { error: accessCheck.error || 'NoAIAccess' }
    }
    if (!accessCheck.canAfford) {
      return { error: 'InsufficientTokens' }
    }

    // Get event type with AI prompt supplements
    const eventType = await prisma.eventType.findUnique({
      where: { id: params.eventTypeId }
    })

    if (!eventType) {
      return { error: 'EventTypeNotFound' }
    }

    // Build the prompt
    const adminPrompt = params.locale === 'es'
      ? eventType.aiTitlePromptEs
      : eventType.aiTitlePromptEn

    const eventTypeName = params.locale === 'es' ? eventType.name : eventType.nameEn
    const namesText = params.names.length > 1
      ? params.names.join(' & ')
      : params.names[0] || ''

    // Include user context if provided
    const userContextText = params.userContext?.trim()
    const contextClause = userContextText
      ? (params.locale === 'es'
          ? `. El usuario quiere algo relacionado con: "${userContextText}"`
          : `. The user wants something related to: "${userContextText}"`)
      : ''

    const basePrompt = params.locale === 'es'
      ? `Genera 3 títulos creativos y cortos (máximo 60 caracteres cada uno) para una invitación de ${eventTypeName}${namesText ? ` para ${namesText}` : ''}${contextClause}. Solo devuelve los títulos, uno por línea, sin numeración ni explicaciones.`
      : `Generate 3 creative and short titles (maximum 60 characters each) for a ${eventTypeName} invitation${namesText ? ` for ${namesText}` : ''}${contextClause}. Only return the titles, one per line, without numbering or explanations.`

    const fullPrompt = adminPrompt
      ? `${adminPrompt}\n\n${basePrompt}`
      : basePrompt

    const tokenCost = await getTokenCostForOperation(operation)

    // DEBUG: Log AI request details
    console.log('\n========== AI TITLE GENERATION REQUEST ==========')
    console.log('📋 Input Parameters:')
    console.log('   - eventTypeId:', params.eventTypeId)
    console.log('   - eventTypeName:', eventTypeName)
    console.log('   - names:', params.names)
    console.log('   - namesText:', namesText)
    console.log('   - userContext:', params.userContext || '(none)')
    console.log('   - locale:', params.locale)
    console.log('📝 Admin Prompt:', adminPrompt || '(none)')
    console.log('📝 Context Clause:', contextClause || '(none)')
    console.log('📝 Base Prompt:', basePrompt)
    console.log('📝 FULL PROMPT SENT TO AI:')
    console.log('---')
    console.log(fullPrompt)
    console.log('---')
    console.log('💰 Token Cost:', tokenCost)
    console.log('=================================================\n')

    // Generate with AI
    const result = await generateAIResponse({
      userId: session.user.id,
      prompt: fullPrompt,
      maxTokens: 500, // Increased from 200 to ensure 3 complete titles
      tokensToConsume: tokenCost,
    })

    // DEBUG: Log AI response
    console.log('\n========== AI TITLE GENERATION RESPONSE ==========')
    console.log('📥 Result received:')
    console.log('   - success:', !result.error)
    console.log('   - error:', result.error || '(none)')
    console.log('   - content length:', result.content?.length || 0)
    console.log('📥 Content received:')
    console.log('---')
    console.log(result.content || '(empty)')
    console.log('---')
    console.log('==================================================\n')

    if (result.error) {
      return { error: result.error }
    }

    // Get updated tokens
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    })

    return {
      success: true,
      content: result.content,
      tokensUsed: tokenCost,
      tokensRemaining: subscription?.tokensRemaining || 0
    }
  } catch (error) {
    console.error('[EventAI] Error generating title:', error)
    return { error: 'GenerationFailed' }
  }
}

/**
 * Generate welcome phrase using AI
 */
export async function generateEventPhrase(params: {
  eventTypeId: string
  names: string[]
  title: string
  locale: string
}): Promise<AIResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const operation: AIOperation = 'phrase_generation'

    // Check AI access and token availability
    const accessCheck = await checkAIAccess(session.user.id, operation)
    if (!accessCheck.hasAccess) {
      return { error: accessCheck.error || 'NoAIAccess' }
    }
    if (!accessCheck.canAfford) {
      return { error: 'InsufficientTokens' }
    }

    // Get event type with AI prompt supplements
    const eventType = await prisma.eventType.findUnique({
      where: { id: params.eventTypeId }
    })

    if (!eventType) {
      return { error: 'EventTypeNotFound' }
    }

    // Build the prompt
    const adminPrompt = params.locale === 'es'
      ? eventType.aiPhrasePromptEs
      : eventType.aiPhrasePromptEn

    const eventTypeName = params.locale === 'es' ? eventType.name : eventType.nameEn
    const namesText = params.names.length > 1
      ? params.names.join(' & ')
      : params.names[0] || ''

    const basePrompt = params.locale === 'es'
      ? `Genera 3 frases de bienvenida emotivas y elegantes (máximo 150 caracteres cada una) para una invitación de ${eventTypeName}${namesText ? ` de ${namesText}` : ''}${params.title ? `. El título del evento es: "${params.title}"` : ''}. Solo devuelve las frases, una por línea, sin numeración.`
      : `Generate 3 emotional and elegant welcome phrases (maximum 150 characters each) for a ${eventTypeName} invitation${namesText ? ` for ${namesText}` : ''}${params.title ? `. The event title is: "${params.title}"` : ''}. Only return the phrases, one per line, without numbering.`

    const fullPrompt = adminPrompt
      ? `${adminPrompt}\n\n${basePrompt}`
      : basePrompt

    const tokenCost = await getTokenCostForOperation(operation)

    // DEBUG: Log AI request details
    console.log('\n========== AI PHRASE GENERATION REQUEST ==========')
    console.log('📋 Input Parameters:')
    console.log('   - eventTypeId:', params.eventTypeId)
    console.log('   - eventTypeName:', eventTypeName)
    console.log('   - names:', params.names)
    console.log('   - namesText:', namesText)
    console.log('   - title:', params.title || '(none)')
    console.log('   - locale:', params.locale)
    console.log('📝 Admin Prompt:', adminPrompt || '(none)')
    console.log('📝 Base Prompt:', basePrompt)
    console.log('📝 FULL PROMPT SENT TO AI:')
    console.log('---')
    console.log(fullPrompt)
    console.log('---')
    console.log('💰 Token Cost:', tokenCost)
    console.log('==================================================\n')

    // Generate with AI
    const result = await generateAIResponse({
      userId: session.user.id,
      prompt: fullPrompt,
      maxTokens: 300,
      tokensToConsume: tokenCost,
    })

    if (result.error) {
      return { error: result.error }
    }

    // Get updated tokens
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    })

    return {
      success: true,
      content: result.content,
      tokensUsed: tokenCost,
      tokensRemaining: subscription?.tokensRemaining || 0
    }
  } catch (error) {
    console.error('[EventAI] Error generating phrase:', error)
    return { error: 'GenerationFailed' }
  }
}

/**
 * Get AI access status for the current user
 */
export async function getAIAccessStatus() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true }
    })

    if (!subscription) {
      return {
        hasAccess: false,
        planName: 'free',
        tokensRemaining: 0,
        isFreePlan: true
      }
    }

    return {
      hasAccess: subscription.plan.hasAIAccess,
      planName: subscription.plan.name,
      tokensRemaining: subscription.tokensRemaining,
      isFreePlan: subscription.plan.price === 0
    }
  } catch (error) {
    console.error('[EventAI] Error getting AI access status:', error)
    return { error: 'Failed to get AI access status' }
  }
}

/**
 * Generate image enhancement prompts/suggestions using AI
 */
export async function generateImagePrompt(params: {
  eventTypeId: string
  names: string[]
  title: string
  imageType: 'background' | 'featured'
  userPrompt?: string
  locale: string
}): Promise<AIResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const operation: AIOperation = 'image_enhancement'

    // Check AI access and token availability
    const accessCheck = await checkAIAccess(session.user.id, operation)
    if (!accessCheck.hasAccess) {
      return { error: accessCheck.error || 'NoAIAccess' }
    }
    if (!accessCheck.canAfford) {
      return { error: 'InsufficientTokens' }
    }

    // Get event type with AI prompt supplements
    const eventType = await prisma.eventType.findUnique({
      where: { id: params.eventTypeId }
    })

    if (!eventType) {
      return { error: 'EventTypeNotFound' }
    }

    // Get the appropriate admin prompt based on image type
    const adminPrompt = params.imageType === 'background'
      ? (params.locale === 'es' ? eventType.aiBackgroundPromptEs : eventType.aiBackgroundPromptEn)
      : (params.locale === 'es' ? eventType.aiPhotoPromptEs : eventType.aiPhotoPromptEn)

    const eventTypeName = params.locale === 'es' ? eventType.name : eventType.nameEn
    const namesText = params.names.length > 1
      ? params.names.join(' & ')
      : params.names[0] || ''

    const imageTypeLabel = params.imageType === 'background'
      ? (params.locale === 'es' ? 'imagen de fondo' : 'background image')
      : (params.locale === 'es' ? 'foto principal/destacada' : 'featured/main photo')

    const basePrompt = params.locale === 'es'
      ? `Genera 3 sugerencias creativas para mejorar o editar la ${imageTypeLabel} de una invitación de ${eventTypeName}${namesText ? ` para ${namesText}` : ''}${params.title ? `. El título del evento es: "${params.title}"` : ''}${params.userPrompt ? `. El usuario quiere: ${params.userPrompt}` : ''}. Las sugerencias deben describir efectos visuales, filtros o modificaciones que se pueden aplicar a la imagen. Máximo 100 caracteres por sugerencia. Solo devuelve las sugerencias, una por línea, sin numeración.`
      : `Generate 3 creative suggestions for enhancing or editing the ${imageTypeLabel} of a ${eventTypeName} invitation${namesText ? ` for ${namesText}` : ''}${params.title ? `. The event title is: "${params.title}"` : ''}${params.userPrompt ? `. The user wants: ${params.userPrompt}` : ''}. Suggestions should describe visual effects, filters, or modifications that can be applied to the image. Maximum 100 characters per suggestion. Only return the suggestions, one per line, without numbering.`

    const fullPrompt = adminPrompt
      ? `${adminPrompt}\n\n${basePrompt}`
      : basePrompt

    const tokenCost = await getTokenCostForOperation(operation)

    // DEBUG: Log AI request details
    console.log('\n========== AI IMAGE PROMPT GENERATION REQUEST ==========')
    console.log('📋 Input Parameters:')
    console.log('   - eventTypeId:', params.eventTypeId)
    console.log('   - eventTypeName:', eventTypeName)
    console.log('   - names:', params.names)
    console.log('   - namesText:', namesText)
    console.log('   - title:', params.title || '(none)')
    console.log('   - imageType:', params.imageType)
    console.log('   - imageTypeLabel:', imageTypeLabel)
    console.log('   - userPrompt:', params.userPrompt || '(none)')
    console.log('   - locale:', params.locale)
    console.log('📝 Admin Prompt:', adminPrompt || '(none)')
    console.log('📝 Base Prompt:', basePrompt)
    console.log('📝 FULL PROMPT SENT TO AI:')
    console.log('---')
    console.log(fullPrompt)
    console.log('---')
    console.log('💰 Token Cost:', tokenCost)
    console.log('=========================================================\n')

    // Generate with AI - use image model for image-related operations
    const result = await generateAIResponse({
      userId: session.user.id,
      prompt: fullPrompt,
      maxTokens: 300,
      tokensToConsume: tokenCost,
      useImageModel: true,  // Use image model if configured
    })

    if (result.error) {
      return { error: result.error }
    }

    // Get updated tokens
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    })

    return {
      success: true,
      content: result.content,
      tokensUsed: tokenCost,
      tokensRemaining: subscription?.tokensRemaining || 0
    }
  } catch (error) {
    console.error('[EventAI] Error generating image prompt:', error)
    return { error: 'GenerationFailed' }
  }
}

/**
 * Generate/enhance image using AI
 * Uses gemini-2.5-flash-image model for image generation
 */
export async function generateEventImage(params: {
  eventTypeId: string
  names: string[]
  title: string
  imageType: 'background' | 'featured'
  prompt: string
  sourceImageBase64?: string  // For image-to-image operations (base64)
  sourceMimeType?: string     // e.g., 'image/jpeg'
  locale: string
}): Promise<AIResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Check AI access
    const accessCheck = await checkAIAccess(session.user.id)
    if (!accessCheck.hasAccess) {
      return { error: 'NoAIAccess' }
    }

    // Get token cost for image generation
    const tokenCost = await getTokenCostForOperation('imageGeneration')
    if (accessCheck.tokensRemaining < tokenCost) {
      return { error: 'InsufficientTokens' }
    }

    // Get event type for context
    const eventType = await prisma.eventType.findUnique({
      where: { id: params.eventTypeId },
      select: { name: true, nameEn: true }
    })

    const eventTypeName = params.locale === 'es' ? eventType?.name : eventType?.nameEn
    const namesText = params.names.filter(n => n.trim()).join(' y ')
    const imageTypeLabel = params.imageType === 'background'
      ? (params.locale === 'es' ? 'imagen de fondo' : 'background image')
      : (params.locale === 'es' ? 'foto principal' : 'featured photo')

    // Build a detailed prompt for image generation
    const fullPrompt = params.locale === 'es'
      ? `Genera una ${imageTypeLabel} elegante y profesional para una invitación de ${eventTypeName}${namesText ? ` para ${namesText}` : ''}${params.title ? `. Título: "${params.title}"` : ''}. ${params.prompt}. La imagen debe ser de alta calidad, visualmente atractiva y apropiada para una invitación formal.`
      : `Generate an elegant and professional ${imageTypeLabel} for a ${eventTypeName} invitation${namesText ? ` for ${namesText}` : ''}${params.title ? `. Title: "${params.title}"` : ''}. ${params.prompt}. The image should be high quality, visually appealing and appropriate for a formal invitation.`

    console.log('\n========== AI IMAGE GENERATION REQUEST ==========')
    console.log('📋 Input Parameters:')
    console.log('   - eventTypeId:', params.eventTypeId)
    console.log('   - eventTypeName:', eventTypeName)
    console.log('   - names:', params.names)
    console.log('   - title:', params.title || '(none)')
    console.log('   - imageType:', params.imageType)
    console.log('   - userPrompt:', params.prompt)
    console.log('   - hasSourceImage:', !!params.sourceImageBase64)
    console.log('   - locale:', params.locale)
    console.log('📝 FULL PROMPT:')
    console.log('---')
    console.log(fullPrompt)
    console.log('---')
    console.log('💰 Token Cost:', tokenCost)
    console.log('=================================================\n')

    // Generate image using AI service
    const result = await generateAIImage({
      userId: session.user.id,
      prompt: fullPrompt,
      sourceImageBase64: params.sourceImageBase64,
      sourceMimeType: params.sourceMimeType,
      tokensToConsume: tokenCost,
    })

    if (result.error) {
      console.log('[EventAI] Image generation error:', result.error)
      return { error: result.error, content: result.content }
    }

    // Get updated tokens
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    })

    console.log('\n========== AI IMAGE GENERATION RESPONSE ==========')
    console.log('📥 Success:', result.success)
    console.log('📥 Has Image URL:', !!result.imageUrl)
    console.log('📥 Image MIME Type:', result.imageMimeType || 'N/A')
    console.log('📥 Tokens Used:', result.tokensUsed || 0)
    console.log('==================================================\n')

    return {
      success: true,
      content: result.content,
      imageUrl: result.imageUrl,
      tokensUsed: tokenCost,
      tokensRemaining: subscription?.tokensRemaining || 0
    }
  } catch (error) {
    console.error('[EventAI] Error generating image:', error)
    return { error: 'GenerationFailed' }
  }
}

/**
 * Get token costs for all AI operations
 */
export async function getAITokenCostsForUser() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const settings = await prisma.eventAISettings.findFirst()

    return {
      titleSuggestion: settings?.suggestionsCost || 1,
      phraseGeneration: settings?.phraseGenerationCost || 1,
      imageEdit: settings?.imageEditCost || 5,
      imageGeneration: settings?.imageGenerationCost || 10,
      descriptionGeneration: settings?.descriptionGenerationCost || 1
    }
  } catch (error) {
    console.error('[EventAI] Error getting token costs:', error)
    return { error: 'Failed to get token costs' }
  }
}
