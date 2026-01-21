'use server'

import { prisma } from '@/core/shared/lib/db'
import { consumeTokens, canUseAI } from '@/core/shared/lib/tokens'
import { generateWithOpenAI, testOpenAIConnection } from './providers/openai'
import { generateWithAnthropic, testAnthropicConnection } from './providers/anthropic'
import { generateWithGoogle, testGoogleConnection, generateImageWithGoogle } from './providers/google'
import type { AIProvider } from '@prisma/client'

interface AIRequest {
  userId: string
  prompt: string
  configId?: string
  maxTokens?: number
  systemPrompt?: string
  tokensToConsume?: number
  useImageModel?: boolean  // If true, use imageModel instead of defaultModel
}

interface AIResponse {
  success?: boolean
  content?: string
  imageUrl?: string       // For image generation responses (data URL)
  imageBase64?: string    // Raw base64 image data
  imageMimeType?: string  // e.g., 'image/png'
  tokensUsed?: number
  error?: string
}

interface ImageGenerationRequest {
  userId: string
  prompt: string
  configId?: string
  sourceImageBase64?: string  // For image-to-image operations
  sourceMimeType?: string
  tokensToConsume?: number
}

export async function generateAIResponse(request: AIRequest): Promise<AIResponse> {
  const { userId, prompt, configId, maxTokens = 1000, systemPrompt, tokensToConsume = 1, useImageModel = false } = request

  try {
    const hasTokens = await canUseAI(userId, tokensToConsume)
    if (!hasTokens) {
      return { error: 'InsufficientTokens' }
    }

    let config
    if (configId) {
      config = await prisma.aIConfig.findUnique({
        where: { id: configId, isActive: true },
      })
    } else {
      config = await prisma.aIConfig.findFirst({
        where: { isActive: true },
      })
    }

    if (!config) {
      return { error: 'NoAIConfigured' }
    }

    // Use imageModel if requested and available, otherwise fall back to defaultModel
    const modelToUse = (useImageModel && config.imageModel) ? config.imageModel : config.defaultModel

    let result: { content: string; tokensUsed: number; error?: string }

    switch (config.provider) {
      case 'OPENAI':
        result = await generateWithOpenAI({
          apiKey: config.apiKey,
          model: modelToUse,
          prompt,
          maxTokens,
          systemPrompt,
        })
        break

      case 'ANTHROPIC':
        result = await generateWithAnthropic({
          apiKey: config.apiKey,
          model: modelToUse,
          prompt,
          maxTokens,
          systemPrompt,
        })
        break

      case 'GOOGLE':
        result = await generateWithGoogle({
          apiKey: config.apiKey,
          model: modelToUse,
          prompt,
          maxTokens,
          systemPrompt,
        })
        break

      default:
        return { error: 'UnsupportedProvider' }
    }

    if (result.error) {
      return { error: result.error }
    }

    await consumeTokens(userId, tokensToConsume, 'ai_generation', config.id, {
      provider: config.provider,
      model: modelToUse,
      promptLength: prompt.length,
    })

    return {
      success: true,
      content: result.content,
      tokensUsed: result.tokensUsed,
    }
  } catch (error) {
    console.error('[AIService] ❌ Error generating response:', error)
    return { error: 'GenerationFailed' }
  }
}

export async function testAIConfigConnection(configId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await prisma.aIConfig.findUnique({
      where: { id: configId },
    })

    if (!config) {
      return { success: false, error: 'ConfigNotFound' }
    }

    switch (config.provider) {
      case 'OPENAI':
        return await testOpenAIConnection(config.apiKey)

      case 'ANTHROPIC':
        return await testAnthropicConnection(config.apiKey)

      case 'GOOGLE':
        return await testGoogleConnection(config.apiKey,config.defaultModel)

      default:
        return { success: false, error: 'UnsupportedProvider' }
    }
  } catch (error) {
    console.error('[AIService] ❌ Error testing connection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getAvailableModels(provider: AIProvider): Promise<string[]> {
  switch (provider) {
    case 'OPENAI':
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ]

    case 'ANTHROPIC':
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ]

    case 'GOOGLE':
      return [
        'gemini-2.5-flash',              // Fast and capable (recommended for text)
        'gemini-2.5-pro',                // Most capable for text
        'gemini-2.5-flash-image',        // Image generation model
        'gemini-2.0-flash',              // Fast, previous gen
      ]

    default:
      return []
  }
}

/**
 * Generate an image using AI
 * Currently only supports Google's gemini-2.5-flash-image model
 */
export async function generateAIImage(request: ImageGenerationRequest): Promise<AIResponse> {
  const { userId, prompt, configId, sourceImageBase64, sourceMimeType, tokensToConsume = 10 } = request

  try {
    const hasTokens = await canUseAI(userId, tokensToConsume)
    if (!hasTokens) {
      return { error: 'InsufficientTokens' }
    }

    let config
    if (configId) {
      config = await prisma.aIConfig.findUnique({
        where: { id: configId, isActive: true },
      })
    } else {
      config = await prisma.aIConfig.findFirst({
        where: { isActive: true },
      })
    }

    if (!config) {
      return { error: 'NoAIConfigured' }
    }

    // For image generation, use imageModel if configured
    const modelToUse = config.imageModel || config.defaultModel

    // Check if the model supports image generation
    const isImageModel = modelToUse.includes('image')
    if (!isImageModel) {
      return {
        error: 'ImageModelNotConfigured',
        content: 'No image generation model configured. Please set gemini-2.5-flash-image as the image model in AI settings.'
      }
    }

    // Currently only Google supports image generation
    if (config.provider !== 'GOOGLE') {
      return {
        error: 'ImageGenerationNotSupported',
        content: 'Image generation is currently only supported with Google AI (gemini-2.5-flash-image).'
      }
    }

    const result = await generateImageWithGoogle({
      apiKey: config.apiKey,
      model: modelToUse,
      prompt,
      sourceImageBase64,
      sourceMimeType,
    })

    if (result.error) {
      return { error: result.error }
    }

    if (!result.imageData) {
      return { error: 'NoImageGenerated' }
    }

    await consumeTokens(userId, tokensToConsume, 'ai_image_generation', config.id, {
      provider: config.provider,
      model: modelToUse,
      promptLength: prompt.length,
    })

    // Create data URL from base64 image
    const imageUrl = `data:${result.imageMimeType || 'image/png'};base64,${result.imageData}`

    return {
      success: true,
      content: result.content,
      imageUrl,
      imageBase64: result.imageData,
      imageMimeType: result.imageMimeType,
      tokensUsed: result.tokensUsed,
    }
  } catch (error) {
    console.error('[AIService] ❌ Error generating image:', error)
    return { error: 'GenerationFailed' }
  }
}
