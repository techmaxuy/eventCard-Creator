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

    const generationConfig = {
      maxOutputTokens: maxTokens || 1000,
      temperature: 0.7,
      topP: 0.95,
    }

    // For older models, concatenate systemPrompt manually
    const finalPrompt = (!supportsSystemInstruction && systemPrompt)
      ? `${systemPrompt}\n\n${prompt}`
      : prompt

    // DEBUG: Log request configuration
    console.log('\n========== AI PROVIDER REQUEST (Google) ==========')
    console.log('📤 Model ID sent:', modelId)
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
