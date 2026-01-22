'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { User, Upload, X, Loader2, Wand2, Check, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { retouchEventImage } from '@/features/event-cards/actions/event-ai'

interface EventType {
  id: string
  name: string
  nameEn: string
}

interface AIStatus {
  hasAccess: boolean
  planName: string
  tokensRemaining: number
  isFreePlan: boolean
}

interface StepFeaturedImageProps {
  eventType: EventType
  names: string[]
  title: string
  featuredImage: string
  featuredImageFile: File | null
  onFeaturedImageChange: (url: string, file: File | null) => void
  aiStatus: AIStatus | null
  tokenCost: number
  onTokensUsed: () => void
  locale: string
}

export function StepFeaturedImage({
  eventType,
  names,
  title,
  featuredImage,
  featuredImageFile,
  onFeaturedImageChange,
  aiStatus,
  tokenCost,
  onTokensUsed,
  locale
}: StepFeaturedImageProps) {
  const t = useTranslations('EventWizard')
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRetouching, setIsRetouching] = useState(false)
  const [retouchPrompt, setRetouchPrompt] = useState('')
  const [retouchedImageUrl, setRetouchedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  // Only show retouch panel if user has uploaded a custom image
  const hasCustomImage = !!featuredImageFile

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file)
      onFeaturedImageChange(previewUrl, file)
    } catch (err) {
      console.error('Error loading image:', err)
      setError(t('errors.ImageLoadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onFeaturedImageChange('', null)
    setRetouchPrompt('')
    setRetouchedImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:image/xxx;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  // Retouch the uploaded image using AI
  const handleRetouchImage = async () => {
    if (!retouchPrompt.trim()) {
      setError(t('errors.PromptRequired'))
      return
    }

    if (!featuredImageFile) {
      setError(t('errors.NoImageToRetouch'))
      return
    }

    setIsRetouching(true)
    setError(null)
    setRetouchedImageUrl(null)

    try {
      const imageBase64 = await fileToBase64(featuredImageFile)

      const result = await retouchEventImage({
        eventTypeId: eventType.id,
        names: names.filter(n => n.trim()),
        title,
        imageType: 'featured',
        editPrompt: retouchPrompt,
        imageBase64,
        imageMimeType: featuredImageFile.type,
        locale
      })

      if (result.error) {
        setError(t(`errors.${result.error}`) || result.content || result.error)
      } else if (result.imageUrl) {
        setRetouchedImageUrl(result.imageUrl)
        onTokensUsed()
      } else {
        setError(t('errors.NoImageGenerated'))
      }
    } catch (err) {
      console.error('Error retouching image:', err)
      setError(t('errors.GenerationFailed'))
    } finally {
      setIsRetouching(false)
    }
  }

  // Accept the retouched image
  const handleAcceptRetouchedImage = () => {
    if (retouchedImageUrl) {
      onFeaturedImageChange(retouchedImageUrl, null)
      setRetouchedImageUrl(null)
      setRetouchPrompt('')
    }
  }

  // Reject the retouched image
  const handleRejectRetouchedImage = () => {
    setRetouchedImageUrl(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('featuredImageHeading')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('featuredImageDescription', { eventType: eventTypeName })}
        </p>
      </div>

      {/* Selected image preview */}
      {featuredImage && !retouchedImageUrl && (
        <div className="max-w-lg mx-auto space-y-4">
          <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Image
              src={featuredImage}
              alt="Featured preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AI Retouch section - only show for custom uploaded images */}
          {hasCustomImage && aiStatus?.hasAccess && (
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {t('aiRetouchTitle')}
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    {t('aiRetouchDescription')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={retouchPrompt}
                  onChange={(e) => setRetouchPrompt(e.target.value)}
                  rows={2}
                  maxLength={300}
                  disabled={isRetouching}
                  className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50"
                  placeholder={t('aiRetouchPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  <span className="font-medium">{tokenCost}</span> {t('tokensRequired')}
                  <span className="ml-2 text-xs">
                    ({aiStatus.tokensRemaining} {t('tokensAvailable')})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRetouchImage}
                  disabled={isRetouching || !retouchPrompt.trim() || aiStatus.tokensRemaining < tokenCost}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                >
                  {isRetouching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('retouching')}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      {t('retouchImage')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Retouched image preview - show comparison */}
      {retouchedImageUrl && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                {t('originalImage')}
              </p>
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <Image
                  src={featuredImage}
                  alt="Original"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            {/* Retouched */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 text-center">
                {t('retouchedImage')}
              </p>
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ring-2 ring-purple-500">
                <Image
                  src={retouchedImageUrl}
                  alt="Retouched"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                  {t('aiGenerated')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleAcceptRetouchedImage}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {t('useRetouched')}
            </button>
            <button
              type="button"
              onClick={handleRejectRetouchedImage}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('keepOriginal')}
            </button>
          </div>
        </div>
      )}

      {/* Upload area - show when no image selected */}
      {!featuredImage && (
        <div className="max-w-lg mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="featured-upload-wizard"
          />
          <label
            htmlFor="featured-upload-wizard"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('uploadFeaturedImage')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('featuredImageFormats')}
                </span>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="max-w-lg mx-auto p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Skip notice */}
      <div className="max-w-lg mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('skipFeaturedNotice')}
        </p>
      </div>
    </div>
  )
}
