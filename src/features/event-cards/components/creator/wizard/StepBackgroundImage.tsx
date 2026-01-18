'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { AIAssistPanel } from './AIAssistPanel'
import { generateImagePrompt } from '@/features/event-cards/actions/event-ai'

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

interface StepBackgroundImageProps {
  eventType: EventType
  names: string[]
  title: string
  coverImage: string
  coverImageFile: File | null
  onCoverImageChange: (url: string, file: File | null) => void
  aiStatus: AIStatus | null
  tokenCost: number
  onTokensUsed: () => void
  locale: string
}

export function StepBackgroundImage({
  eventType,
  names,
  title,
  coverImage,
  coverImageFile,
  onCoverImageChange,
  aiStatus,
  tokenCost,
  onTokensUsed,
  locale
}: StepBackgroundImageProps) {
  const t = useTranslations('EventWizard')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  // Only show AI panel if user has uploaded a custom image
  const hasCustomImage = !!coverImageFile

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file)
      onCoverImageChange(previewUrl, file)
    } catch (err) {
      console.error('Error loading image:', err)
      setError(t('errors.ImageLoadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onCoverImageChange('', null)
    setSuggestions([])
    setAiPrompt('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateImagePrompt({
        eventTypeId: eventType.id,
        names: names.filter(n => n.trim()),
        title,
        imageType: 'background',
        userPrompt: aiPrompt,
        locale
      })

      if (result.error) {
        setError(t(`errors.${result.error}`) || result.error)
      } else if (result.content) {
        // Parse suggestions from the response (one per line)
        const newSuggestions = result.content
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.length <= 300)
          .slice(0, 3)

        setSuggestions(newSuggestions)
        onTokensUsed()
      }
    } catch (err) {
      console.error('Error generating image prompt:', err)
      setError(t('errors.GenerationFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setAiPrompt(suggestion)
    setSuggestions([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('backgroundImageHeading')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('backgroundImageDescription', { eventType: eventTypeName })}
        </p>
      </div>

      {/* Image upload area */}
      <div className="max-w-lg mx-auto">
        {coverImage ? (
          <div className="space-y-4">
            {/* Image preview */}
            <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={coverImage}
                alt="Cover preview"
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

            {/* AI prompt input - only show for custom uploaded images */}
            {hasCustomImage && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('aiImagePromptLabel')}
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t('aiImagePromptPlaceholder')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('aiImagePromptHelp')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="background-upload"
            />
            <label
              htmlFor="background-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('uploadBackgroundImage')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('backgroundImageFormats')}
                  </span>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-lg mx-auto p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* AI Assistance Panel - only show for custom uploaded images */}
      {hasCustomImage && (
        <div className="max-w-lg mx-auto mt-6">
          <AIAssistPanel
            title={t('aiBackgroundAssistant')}
            description={t('aiBackgroundAssistantDescription')}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            hasAccess={aiStatus?.hasAccess ?? false}
            tokensRemaining={aiStatus?.tokensRemaining ?? 0}
            tokenCost={tokenCost}
            isFreePlan={aiStatus?.isFreePlan ?? true}
            locale={locale}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
            isLoading={aiStatus === null}
          />
        </div>
      )}

      {/* Skip notice */}
      <div className="max-w-lg mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('skipBackgroundNotice')}
        </p>
      </div>
    </div>
  )
}
