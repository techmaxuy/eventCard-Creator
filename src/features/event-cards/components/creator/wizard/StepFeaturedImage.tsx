'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { User, Upload, X, Loader2, Palette, Check } from 'lucide-react'
import Image from 'next/image'
import { AIAssistPanel } from './AIAssistPanel'
import { generateImagePrompt } from '@/features/event-cards/actions/event-ai'
import { getAssets } from '@/features/event-cards/actions/assets'

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

interface Asset {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
}

interface StepFeaturedImageProps {
  eventType: EventType
  names: string[]
  title: string
  featuredImage: string
  featuredImageFile: File | null
  selectedAssetId?: string
  onFeaturedImageChange: (url: string, file: File | null, assetId?: string) => void
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
  selectedAssetId,
  onFeaturedImageChange,
  aiStatus,
  tokenCost,
  onTokensUsed,
  locale
}: StepFeaturedImageProps) {
  const t = useTranslations('EventWizard')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Assets state
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('gallery')

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  // Only show AI panel if user has uploaded a custom image
  const hasCustomImage = !!featuredImageFile

  // Load assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      setIsLoadingAssets(true)
      try {
        const result = await getAssets({
          type: 'IMAGE',
          eventTypeId: eventType.id
        })
        if (result.assets) {
          setAssets(result.assets.filter(a => a.imageUrl) as Asset[])
        }
      } catch (err) {
        console.error('Error loading assets:', err)
      } finally {
        setIsLoadingAssets(false)
      }
    }
    loadAssets()
  }, [eventType.id])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file)
      onFeaturedImageChange(previewUrl, file, undefined)
    } catch (err) {
      console.error('Error loading image:', err)
      setError(t('errors.ImageLoadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onFeaturedImageChange('', null, undefined)
    setSuggestions([])
    setAiPrompt('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAssetSelect = (asset: Asset) => {
    if (selectedAssetId === asset.id) {
      // Deselect
      onFeaturedImageChange('', null, undefined)
    } else {
      // Select asset
      onFeaturedImageChange(asset.imageUrl || '', null, asset.id)
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
        imageType: 'featured',
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
      {featuredImage && (
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
            {selectedAssetId && (
              <div className="absolute bottom-2 left-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                {t('fromGallery')}
              </div>
            )}
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
      )}

      {/* Tabs for gallery/upload - show when no image selected */}
      {!featuredImage && (
        <div className="max-w-2xl mx-auto">
          {/* Tab buttons */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'gallery'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Palette className="w-4 h-4" />
              {t('galleryTab')}
              {assets.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                  {assets.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Upload className="w-4 h-4" />
              {t('uploadTab')}
            </button>
          </div>

          {/* Gallery tab content */}
          {activeTab === 'gallery' && (
            <div>
              {isLoadingAssets ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <Palette className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('noFeaturedAssets')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('uploadYourOwn')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleAssetSelect(asset)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedAssetId === asset.id
                          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Image
                        src={asset.thumbnailUrl || asset.imageUrl || ''}
                        alt={asset.name}
                        fill
                        className="object-cover"
                      />
                      {selectedAssetId === asset.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white truncate">{asset.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload tab content */}
          {activeTab === 'upload' && (
            <div>
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
        </div>
      )}

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
            title={t('aiFeaturedAssistant')}
            description={t('aiFeaturedAssistantDescription')}
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
          {t('skipFeaturedNotice')}
        </p>
      </div>
    </div>
  )
}
