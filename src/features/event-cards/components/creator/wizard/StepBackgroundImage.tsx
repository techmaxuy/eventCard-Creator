'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ImageIcon, Upload, X, Loader2, Palette, Check, Sparkles, RefreshCw, Wand2 } from 'lucide-react'
import Image from 'next/image'
import { generateEventImage, retouchEventImage } from '@/features/event-cards/actions/event-ai'
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

interface StepBackgroundImageProps {
  eventType: EventType
  names: string[]
  title: string
  coverImage: string
  coverImageFile: File | null
  selectedAssetId?: string
  onCoverImageChange: (url: string, file: File | null, assetId?: string) => void
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
  selectedAssetId,
  onCoverImageChange,
  aiStatus,
  tokenCost,
  onTokensUsed,
  locale
}: StepBackgroundImageProps) {
  const t = useTranslations('EventWizard')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isRetouching, setIsRetouching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [aiGeneratePrompt, setAiGeneratePrompt] = useState('')
  const [retouchPrompt, setRetouchPrompt] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [retouchedImageUrl, setRetouchedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Assets state
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'ai'>('gallery')

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  // Only show retouch panel if user has uploaded a custom image
  const hasCustomImage = !!coverImageFile

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
      onCoverImageChange(previewUrl, file)
    } catch (err) {
      console.error('Error loading image:', err)
      setError(t('errors.ImageLoadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onCoverImageChange('', null, undefined)
    setRetouchPrompt('')
    setGeneratedImageUrl(null)
    setRetouchedImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAssetSelect = (asset: Asset) => {
    if (selectedAssetId === asset.id) {
      // Deselect
      onCoverImageChange('', null, undefined)
    } else {
      // Select asset
      onCoverImageChange(asset.imageUrl || '', null, asset.id)
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

    if (!coverImageFile) {
      setError(t('errors.NoImageToRetouch'))
      return
    }

    setIsRetouching(true)
    setError(null)
    setRetouchedImageUrl(null)

    try {
      const imageBase64 = await fileToBase64(coverImageFile)

      const result = await retouchEventImage({
        eventTypeId: eventType.id,
        names: names.filter(n => n.trim()),
        title,
        imageType: 'background',
        editPrompt: retouchPrompt,
        imageBase64,
        imageMimeType: coverImageFile.type,
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
      onCoverImageChange(retouchedImageUrl, null, undefined)
      setRetouchedImageUrl(null)
      setRetouchPrompt('')
    }
  }

  // Reject the retouched image
  const handleRejectRetouchedImage = () => {
    setRetouchedImageUrl(null)
  }

  // Generate image using AI
  const handleGenerateImage = async () => {
    if (!aiGeneratePrompt.trim()) {
      setError(t('errors.PromptRequired'))
      return
    }

    setIsGeneratingImage(true)
    setError(null)
    setGeneratedImageUrl(null)

    try {
      const result = await generateEventImage({
        eventTypeId: eventType.id,
        names: names.filter(n => n.trim()),
        title,
        imageType: 'background',
        prompt: aiGeneratePrompt,
        locale
      })

      if (result.error) {
        setError(t(`errors.${result.error}`) || result.content || result.error)
      } else if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl)
        onTokensUsed()
      } else {
        setError(t('errors.NoImageGenerated'))
      }
    } catch (err) {
      console.error('Error generating image:', err)
      setError(t('errors.GenerationFailed'))
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Accept the generated image
  const handleAcceptGeneratedImage = () => {
    if (generatedImageUrl) {
      onCoverImageChange(generatedImageUrl, null, undefined)
      setGeneratedImageUrl(null)
      setAiGeneratePrompt('')
    }
  }

  // Reject the generated image and try again
  const handleRejectGeneratedImage = () => {
    setGeneratedImageUrl(null)
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

      {/* Selected image preview */}
      {coverImage && !retouchedImageUrl && (
        <div className="max-w-lg mx-auto space-y-4">
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
            {selectedAssetId && (
              <div className="absolute bottom-2 left-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                {t('fromGallery')}
              </div>
            )}
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
                  src={coverImage}
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

      {/* Tabs for gallery/upload/ai - show when no image selected */}
      {!coverImage && (
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
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ai'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {t('aiGenerateTab')}
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
                    {t('noBackgroundAssets')}
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
                id="background-upload"
              />
              <label
                htmlFor="background-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
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

          {/* AI Generate tab content */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* AI Access check */}
              {!aiStatus?.hasAccess ? (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t('aiGenerateNoAccess')}
                  </p>
                  <a
                    href="/pricing"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {t('upgradePlan')}
                  </a>
                </div>
              ) : (
                <>
                  {/* Generated image preview */}
                  {generatedImageUrl && (
                    <div className="space-y-4">
                      <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={generatedImageUrl}
                          alt="Generated preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 px-3 py-1 bg-purple-600 text-white text-xs rounded-full">
                          {t('aiGenerated')}
                        </div>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <button
                          type="button"
                          onClick={handleAcceptGeneratedImage}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          {t('acceptImage')}
                        </button>
                        <button
                          type="button"
                          onClick={handleRejectGeneratedImage}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t('tryAgain')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI prompt input - show when no generated image */}
                  {!generatedImageUrl && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                              {t('aiGenerateTitle')}
                            </h4>
                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                              {t('aiGenerateDescription')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('aiGeneratePromptLabel')}
                        </label>
                        <textarea
                          value={aiGeneratePrompt}
                          onChange={(e) => setAiGeneratePrompt(e.target.value)}
                          rows={3}
                          maxLength={500}
                          disabled={isGeneratingImage}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50"
                          placeholder={t('aiGeneratePromptPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('aiGeneratePromptHelp')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{tokenCost * 2}</span> {t('tokensRequired')}
                          {aiStatus && (
                            <span className="ml-2 text-xs">
                              ({aiStatus.tokensRemaining} {t('tokensAvailable')})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage || !aiGeneratePrompt.trim() || (aiStatus?.tokensRemaining || 0) < tokenCost * 2}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t('generating')}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              {t('generateImage')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
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

      {/* Skip notice */}
      <div className="max-w-lg mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('skipBackgroundNotice')}
        </p>
      </div>
    </div>
  )
}
