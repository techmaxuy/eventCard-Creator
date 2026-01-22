import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

interface GoogleRequestOptions {
  apiKey: string
  model: string
  prompt: string
  maxTokens?: number
  systemPrompt?: string
}

interface AIProviderResponse {
  content: string
  tokensUsed: number
  error?: string
  imageData?: string      // Base64 encoded image data
  imageMimeType?: string  // e.g., 'image/png'
}

export async function generateWithGoogle(options: GoogleRequestOptions): Promise<AIProviderResponse> {
  const { apiKey, model, prompt, maxTokens, systemPrompt } = options

  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    // For Gemini 2.x models, don't use 'models/' prefix
    const isModel2x = model.includes('2.0') || model.includes('2.5')
    const modelId = isModel2x
      ? model.replace('models/', '') // Remove prefix if present for 2.x
      : (model.startsWith('models/') ? model : `models/${model}`)

    // Models 1.5+ and 2.x support systemInstruction
    const supportsSystemInstruction = model.includes('1.5') || isModel2x

    const generativeModel = genAI.getGenerativeModel({
      model: modelId,
      ...(supportsSystemInstruction && systemPrompt ? { systemInstruction: systemPrompt } : {})
    })

    // For Gemini 2.5 text models, we need to disable thinking to avoid token budget issues
    // The thinking tokens count against maxOutputTokens causing premature truncation
    // Note: Image models (gemini-2.5-flash-image) do NOT support thinkingConfig
    const isImageModel = model.includes('image')
    const isModel25Text = model.includes('2.5') && !isImageModel

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: maxTokens || 1000,
      temperature: 0.7,
      topP: 0.95,
    }

    // Disable thinking for 2.5 text models to prevent token truncation issues
    // See: https://discuss.ai.google.dev/t/max-output-tokens-isnt-respected-when-using-gemini-2-5-flash-model/106708
    if (isModel25Text) {
      generationConfig.thinkingConfig = {
        thinkingBudget: 0  // Disable thinking to use all tokens for output
      }
    }

    // For older models, concatenate systemPrompt manually
    const finalPrompt = (!supportsSystemInstruction && systemPrompt)
      ? `${systemPrompt}\n\n${prompt}`
      : prompt

    // DEBUG: Log request configuration
    console.log('\n========== AI PROVIDER REQUEST (Google) ==========')
    console.log('📤 Model ID sent:', modelId)
    console.log('📤 Is Model 2.5 Text:', isModel25Text)
    console.log('📤 Is Image Model:', isImageModel)
    console.log('📤 Generation Config:', JSON.stringify(generationConfig, null, 2))
    console.log('📤 Prompt length:', finalPrompt.length, 'chars')
    console.log('==================================================\n')

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig,
    })

    const response = await result.response
    const text = response.text()

    // DEBUG: Log AI response details
    console.log('\n========== AI PROVIDER RESPONSE (Google) ==========')
    console.log('📤 Model Used:', modelId)
    console.log('📤 Max Output Tokens:', maxTokens || 1000)
    console.log('📥 Response Text:')
    console.log('---')
    console.log(text)
    console.log('---')
    console.log('📊 Tokens Used:', response.usageMetadata?.totalTokenCount || 0)
    console.log('📊 Prompt Tokens:', response.usageMetadata?.promptTokenCount || 'N/A')
    console.log('📊 Candidates Tokens:', response.usageMetadata?.candidatesTokenCount || 'N/A')
    console.log('📊 Finish Reason:', response.candidates?.[0]?.finishReason || 'N/A')
    console.log('===================================================\n')

    return {
      content: text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0
    }
  } catch (error: any) {
    console.error('[Google] ❌ Error detallado:', error)
    return {
      content: '',
      tokensUsed: 0,
      error: error.message.includes('404') 
        ? `Modelo no encontrado (${model}). Intenta con gemini-1.5-flash-latest` 
        : error.message,
    }
  }
}

export async function testGoogleConnection(apiKey: string, defaultModel: string): Promise<{ success: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    // Usamos el nombre base que suele ser el más compatible para tests
    const model = genAI.getGenerativeModel({ model: defaultModel })

    const result = await model.generateContent('Hi')
    const response = await result.response
    const text = response.text()

    return { success: !!text }
  } catch (error: any) {
    return {
      success: false,
      error: `Error de conexión: ${error.message}`,
    }
  }
}

/**
 * Generate images using Gemini 2.5 Flash Image model
 * This model can generate images from text prompts
 */
interface ImageGenerationOptions {
  apiKey: string
  model: string
  prompt: string
  sourceImageBase64?: string  // Optional: for image-to-image operations
  sourceMimeType?: string     // e.g., 'image/jpeg'
}

export async function generateImageWithGoogle(options: ImageGenerationOptions): Promise<AIProviderResponse> {
  const { apiKey, model, prompt, sourceImageBase64, sourceMimeType } = options

  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    // For image generation models
    const isImageModel = model.includes('image')
    const modelId = model.replace('models/', '')

    console.log('\n========== AI IMAGE GENERATION REQUEST (Google) ==========')
    console.log('📤 Model ID sent:', modelId)
    console.log('📤 Is Image Model:', isImageModel)
    console.log('📤 Prompt:', prompt)
    console.log('📤 Has Source Image:', !!sourceImageBase64)
    console.log('===========================================================\n')

    if (!isImageModel) {
      return {
        content: '',
        tokensUsed: 0,
        error: 'Model does not support image generation. Use gemini-2.5-flash-image.'
      }
    }

    const generativeModel = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        // @ts-ignore - responseModalities is a valid config for image models
        responseModalities: ['image', 'text'],
      },
    })

    // Build the content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    // Add source image if provided (for image-to-image operations)
    if (sourceImageBase64 && sourceMimeType) {
      parts.push({
        inlineData: {
          mimeType: sourceMimeType,
          data: sourceImageBase64
        }
      })
    }

    // Add the text prompt
    parts.push({ text: prompt })

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts }],
    })

    const response = await result.response

    // Check if response contains image data
    const candidate = response.candidates?.[0]
    if (!candidate || !candidate.content || !candidate.content.parts) {
      console.log('[Google Image] No candidates in response')
      return {
        content: '',
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        error: 'No image generated'
      }
    }

    // Find image part in response
    let imageData: string | undefined
    let imageMimeType: string | undefined
    let textContent = ''

    for (const part of candidate.content.parts) {
      // @ts-ignore - inlineData exists on image response parts
      if (part.inlineData) {
        // @ts-ignore
        imageData = part.inlineData.data
        // @ts-ignore
        imageMimeType = part.inlineData.mimeType
      }
      // @ts-ignore
      if (part.text) {
        // @ts-ignore
        textContent += part.text
      }
    }

    console.log('\n========== AI IMAGE GENERATION RESPONSE (Google) ==========')
    console.log('📥 Has Image Data:', !!imageData)
    console.log('📥 Image MIME Type:', imageMimeType || 'N/A')
    console.log('📥 Image Data Length:', imageData?.length || 0)
    console.log('📥 Text Content:', textContent || '(none)')
    console.log('📊 Tokens Used:', response.usageMetadata?.totalTokenCount || 0)
    console.log('📊 Finish Reason:', candidate.finishReason || 'N/A')
    console.log('============================================================\n')

    if (!imageData) {
      return {
        content: textContent,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        error: 'No image data in response'
      }
    }

    return {
      content: textContent,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      imageData,
      imageMimeType
    }
  } catch (error: any) {
    console.error('[Google Image] ❌ Error:', error)
    return {
      content: '',
      tokensUsed: 0,
      error: error.message
    }
  }
}
