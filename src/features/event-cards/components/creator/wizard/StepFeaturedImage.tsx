'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { User, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface EventType {
  id: string
  name: string
  nameEn: string
}

interface StepFeaturedImageProps {
  eventType: EventType
  featuredImage: string
  featuredImageFile: File | null
  onFeaturedImageChange: (url: string, file: File | null) => void
  locale: string
}

export function StepFeaturedImage({
  eventType,
  featuredImage,
  featuredImageFile,
  onFeaturedImageChange,
  locale
}: StepFeaturedImageProps) {
  const t = useTranslations('EventWizard')
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
