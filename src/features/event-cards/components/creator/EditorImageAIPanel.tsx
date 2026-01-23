'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, Lock, ChevronDown, ChevronUp, Wand2, RefreshCw, Check, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getAIAccessStatus, getAITokenCostsForUser, retouchEventImage, generateEventImage } from '@/features/event-cards/actions/event-ai'

interface AIStatus {
  hasAccess: boolean
  planName: string
  tokensRemaining: number
  isFreePlan: boolean
}

interface TokenCosts {
  titleSuggestion: number
  phraseGeneration: number
  imageEdit: number
  imageGeneration: number
  descriptionGeneration: number
}

type ImageType = 'background' | 'featured'

interface EditorImageAIPanelProps {
  type: ImageType
  eventTypeId: string
  eventTypeName: string
  names?: string[]
  title?: string
  currentImageUrl?: string
  currentImageFile?: File | null
  onImageChange: (url: string, file: File | null) => void
  locale: string
}

export function EditorImageAIPanel({
  type,
  eventTypeId,
  eventTypeName,
  names = [],
  title = '',
  currentImageUrl = '',
  currentImageFile = null,
  onImageChange,
  locale
}: EditorImageAIPanelProps) {
  const t = useTranslations('Events')
  const [isExpanded, setIsExpanded] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)
  const [tokenCosts, setTokenCosts] = useState<TokenCosts | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Retouch state
  const [isRetouching, setIsRetouching] = useState(false)
  const [retouchPrompt, setRetouchPrompt] = useState('')
  const [retouchedImageUrl, setRetouchedImageUrl] = useState<string | null>(null)

  // Generate state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState<'retouch' | 'generate'>('retouch')

  // Load AI status on mount
  useEffect(() => {
    const loadAIStatus = async () => {
      setIsLoading(true)
      try {
        const [statusResult, costsResult] = await Promise.all([
          getAIAccessStatus(),
          getAITokenCostsForUser()
        ])

        if (!statusResult.error) {
          setAiStatus(statusResult as AIStatus)
        }

        if (!costsResult.error) {
          setTokenCosts(costsResult as TokenCosts)
        }
      } catch (err) {
        console.error('Error loading AI status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAIStatus()
  }, [])

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  // Fetch image and convert to base64
  const urlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
    const response = await fetch(url)
    const blob = await response.blob()
    const mimeType = blob.type || 'image/jpeg'

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve({ base64, mimeType })
      }
      reader.onerror = error => reject(error)
    })
  }

  const getEditTokenCost = (): number => {
    return tokenCosts?.imageEdit || 5
  }

  const getGenerateTokenCost = (): number => {
    return tokenCosts?.imageGeneration || 10
  }

  // Retouch the current image
  const handleRetouch = async () => {
    if (!retouchPrompt.trim()) {
      setError(locale === 'es' ? 'Ingresa instrucciones para la edición' : 'Enter editing instructions')
      return
    }

    if (!currentImageUrl && !currentImageFile) {
      setError(locale === 'es' ? 'No hay imagen para editar' : 'No image to edit')
      return
    }

    setIsRetouching(true)
    setError(null)
    setRetouchedImageUrl(null)

    try {
      let imageBase64: string
      let imageMimeType: string

      if (currentImageFile) {
        imageBase64 = await fileToBase64(currentImageFile)
        imageMimeType = currentImageFile.type
      } else if (currentImageUrl) {
        const result = await urlToBase64(currentImageUrl)
        imageBase64 = result.base64
        imageMimeType = result.mimeType
      } else {
        throw new Error('No image available')
      }

      const result = await retouchEventImage({
        eventTypeId,
        names: names.filter(n => n.trim()),
        title,
        imageType: type,
        editPrompt: retouchPrompt,
        imageBase64,
        imageMimeType,
        locale
      })

      if (result.error) {
        setError(t(`aiErrors.${result.error}`) || result.content || result.error)
      } else if (result.imageUrl) {
        setRetouchedImageUrl(result.imageUrl)
        // Refresh AI status
        const statusResult = await getAIAccessStatus()
        if (!statusResult.error) {
          setAiStatus(statusResult as AIStatus)
        }
      } else {
        setError(locale === 'es' ? 'No se generó ninguna imagen' : 'No image was generated')
      }
    } catch (err) {
      console.error('Error retouching image:', err)
      setError(locale === 'es' ? 'Error al editar la imagen' : 'Error editing image')
    } finally {
      setIsRetouching(false)
    }
  }

  // Generate a new image
  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      setError(locale === 'es' ? 'Ingresa una descripción para la imagen' : 'Enter an image description')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImageUrl(null)

    try {
      const result = await generateEventImage({
        eventTypeId,
        names: names.filter(n => n.trim()),
        title,
        imageType: type,
        prompt: generatePrompt,
        locale
      })

      if (result.error) {
        setError(t(`aiErrors.${result.error}`) || result.content || result.error)
      } else if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl)
        // Refresh AI status
        const statusResult = await getAIAccessStatus()
        if (!statusResult.error) {
          setAiStatus(statusResult as AIStatus)
        }
      } else {
        setError(locale === 'es' ? 'No se generó ninguna imagen' : 'No image was generated')
      }
    } catch (err) {
      console.error('Error generating image:', err)
      setError(locale === 'es' ? 'Error al generar la imagen' : 'Error generating image')
    } finally {
      setIsGenerating(false)
    }
  }

  // Accept retouched image
  const handleAcceptRetouch = () => {
    if (retouchedImageUrl) {
      onImageChange(retouchedImageUrl, null)
      setRetouchedImageUrl(null)
      setRetouchPrompt('')
    }
  }

  // Reject retouched image
  const handleRejectRetouch = () => {
    setRetouchedImageUrl(null)
  }

  // Accept generated image
  const handleAcceptGenerate = () => {
    if (generatedImageUrl) {
      onImageChange(generatedImageUrl, null)
      setGeneratedImageUrl(null)
      setGeneratePrompt('')
    }
  }

  // Reject generated image
  const handleRejectGenerate = () => {
    setGeneratedImageUrl(null)
  }

  const getTitle = (): string => {
    return type === 'background'
      ? (locale === 'es' ? 'Asistente IA para Imagen de Fondo' : 'AI Background Image Assistant')
      : (locale === 'es' ? 'Asistente IA para Foto Principal' : 'AI Featured Photo Assistant')
  }

  // Only show if there's a custom image (for retouch) or always show generate option
  const hasImage = !!(currentImageUrl || currentImageFile)

  if (isLoading) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{locale === 'es' ? 'Cargando IA...' : 'Loading AI...'}</span>
        </div>
      </div>
    )
  }

  if (!aiStatus?.hasAccess) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-700 dark:text-purple-300">
              {locale === 'es' ? 'Actualiza tu plan para usar IA' : 'Upgrade your plan to use AI'}
            </span>
          </div>
          <Link
            href={`/${locale}/pricing`}
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
          >
            {locale === 'es' ? 'Actualizar' : 'Upgrade'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            {getTitle()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-600 dark:text-purple-400">
            {aiStatus.tokensRemaining} tokens
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 bg-white dark:bg-gray-900 space-y-3">
          {/* Tabs */}
          <div className="flex gap-2">
            {hasImage && (
              <button
                type="button"
                onClick={() => setActiveTab('retouch')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'retouch'
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                {locale === 'es' ? 'Retocar' : 'Retouch'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'generate'
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {locale === 'es' ? 'Generar Nueva' : 'Generate New'}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Retouch Tab */}
          {activeTab === 'retouch' && hasImage && (
            <div className="space-y-3">
              {!retouchedImageUrl ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {locale === 'es'
                      ? 'Describe los cambios que quieres hacer a la imagen actual'
                      : 'Describe the changes you want to make to the current image'}
                  </p>
                  <textarea
                    value={retouchPrompt}
                    onChange={(e) => setRetouchPrompt(e.target.value)}
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder={locale === 'es'
                      ? 'Ej: Agrega un efecto de luz cálida, mejora los colores...'
                      : 'E.g.: Add a warm light effect, enhance colors...'}
                  />
                  <button
                    type="button"
                    onClick={handleRetouch}
                    disabled={isRetouching || aiStatus.tokensRemaining < getEditTokenCost()}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRetouching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {locale === 'es' ? 'Retocando...' : 'Retouching...'}
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        {locale === 'es' ? 'Retocar Imagen' : 'Retouch Image'} ({getEditTokenCost()} tokens)
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {locale === 'es' ? 'Imagen retocada:' : 'Retouched image:'}
                  </p>
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src={retouchedImageUrl}
                      alt="Retouched preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAcceptRetouch}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {locale === 'es' ? 'Usar' : 'Use'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectRetouch}
                      className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {locale === 'es' ? 'Reintentar' : 'Retry'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-3">
              {!generatedImageUrl ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {locale === 'es'
                      ? 'Describe la imagen que quieres generar'
                      : 'Describe the image you want to generate'}
                  </p>
                  <textarea
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder={locale === 'es'
                      ? 'Ej: Fondo elegante con flores y tonos pastel...'
                      : 'E.g.: Elegant background with flowers and pastel tones...'}
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || aiStatus.tokensRemaining < getGenerateTokenCost()}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {locale === 'es' ? 'Generando...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {locale === 'es' ? 'Generar Imagen' : 'Generate Image'} ({getGenerateTokenCost()} tokens)
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {locale === 'es' ? 'Imagen generada:' : 'Generated image:'}
                  </p>
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src={generatedImageUrl}
                      alt="Generated preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAcceptGenerate}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {locale === 'es' ? 'Usar' : 'Use'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectGenerate}
                      className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {locale === 'es' ? 'Reintentar' : 'Retry'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
