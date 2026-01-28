'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Loader2, X, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createAsset, updateAsset } from '@/features/event-cards/actions/assets'

interface EventType {
  id: string
  name: string
  nameEn: string
  icon: string | null
  color: string
}

interface Asset {
  id: string
  type: 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'
  eventTypeId: string | null
  name: string
  description: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  audioUrl: string | null
  phraseEs: string | null
  phraseEn: string | null
  decorationUrl: string | null
  decorationType: string | null
  decorationPosition: string | null
  order: number
}

interface AssetFormProps {
  asset?: Asset
  eventTypes: EventType[]
  locale: string
}

export function AssetForm({ asset, eventTypes, locale }: AssetFormProps) {
  const router = useRouter()
  const t = useTranslations('Assets')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [type, setType] = useState<'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'>(asset?.type || 'IMAGE')
  const [eventTypeId, setEventTypeId] = useState(asset?.eventTypeId || '')
  const [name, setName] = useState(asset?.name || '')
  const [description, setDescription] = useState(asset?.description || '')
  const [order, setOrder] = useState(asset?.order || 0)

  // Image state
  const [imageUrl, setImageUrl] = useState(asset?.imageUrl || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(asset?.thumbnailUrl || '')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Audio state
  const [audioUrl, setAudioUrl] = useState(asset?.audioUrl || '')
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  // Phrase state
  const [phraseEs, setPhraseEs] = useState(asset?.phraseEs || '')
  const [phraseEn, setPhraseEn] = useState(asset?.phraseEn || '')

  // Decoration state
  const [decorationUrl, setDecorationUrl] = useState(asset?.decorationUrl || '')
  const [decorationType, setDecorationType] = useState(asset?.decorationType || 'balloon')
  const [decorationPosition, setDecorationPosition] = useState(asset?.decorationPosition || 'floating')
  const [uploadingDecoration, setUploadingDecoration] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('assetType', 'image')

    try {
      const response = await fetch('/api/upload/asset', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setMessage({ type: 'error', text: result.error || t('errors.UploadFailed') })
      } else {
        setImageUrl(result.imageUrl)
        setThumbnailUrl(result.thumbnailUrl)
        setMessage({ type: 'success', text: t('imageUploaded') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('errors.UploadFailed') })
    }

    setUploadingImage(false)
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAudio(true)
    setMessage(null)

    try {
      // Step 1: Get presigned URL from our API
      const presignedResponse = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          assetType: 'audio',
        }),
      })

      const presignedResult = await presignedResponse.json()

      if (!presignedResponse.ok || presignedResult.error) {
        setMessage({ type: 'error', text: presignedResult.error || t('errors.UploadFailed') })
        setUploadingAudio(false)
        return
      }

      // Step 2: Upload directly to Azure using presigned URL
      const uploadResponse = await fetch(presignedResult.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'x-ms-blob-type': 'BlockBlob',
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        setMessage({ type: 'error', text: t('errors.UploadFailed') })
        setUploadingAudio(false)
        return
      }

      // Step 3: Use the final blob URL
      setAudioUrl(presignedResult.blobUrl)
      setMessage({ type: 'success', text: t('audioUploaded') })
    } catch (error) {
      console.error('[AudioUpload] Error:', error)
      setMessage({ type: 'error', text: t('errors.UploadFailed') })
    }

    setUploadingAudio(false)
  }

  const toggleAudio = () => {
    if (!audioUrl) return

    if (!audioElement) {
      const audio = new Audio(audioUrl)
      audio.addEventListener('ended', () => setIsPlaying(false))
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    }
  }

  const handleDecorationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDecoration(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('assetType', 'decoration')

    try {
      const response = await fetch('/api/upload/asset', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setMessage({ type: 'error', text: result.error || 'Upload failed' })
      } else {
        setDecorationUrl(result.imageUrl)
        setMessage({ type: 'success', text: t('imageUploaded') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed' })
    } finally {
      setUploadingDecoration(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validaciones
    if (!name) {
      setMessage({ type: 'error', text: t('nameRequired') })
      return
    }

    if (type === 'IMAGE' && !imageUrl) {
      setMessage({ type: 'error', text: t('imageRequired') })
      return
    }

    if (type === 'AUDIO' && !audioUrl) {
      setMessage({ type: 'error', text: t('audioRequired') })
      return
    }

    if (type === 'PHRASE' && (!phraseEs || !phraseEn)) {
      setMessage({ type: 'error', text: t('phrasesRequired') })
      return
    }

    if (type === 'DECORATION' && !decorationUrl) {
      setMessage({ type: 'error', text: t('decorationRequired') })
      return
    }

    startTransition(async () => {
      const values = {
        type,
        eventTypeId: eventTypeId || undefined,
        name,
        description,
        imageUrl: type === 'IMAGE' ? imageUrl : undefined,
        thumbnailUrl: type === 'IMAGE' ? thumbnailUrl : undefined,
        audioUrl: type === 'AUDIO' ? audioUrl : undefined,
        phraseEs: type === 'PHRASE' ? phraseEs : undefined,
        phraseEn: type === 'PHRASE' ? phraseEn : undefined,
        decorationUrl: type === 'DECORATION' ? decorationUrl : undefined,
        decorationType: type === 'DECORATION' ? decorationType : undefined,
        decorationPosition: type === 'DECORATION' ? decorationPosition : undefined,
        order,
      }

      const result = asset
        ? await updateAsset(locale, asset.id, values)
        : await createAsset(locale, values)

      if (result.error) {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      } else {
        setMessage({ type: 'success', text: asset ? t('updated') : t('created') })
        setTimeout(() => {
          router.push(`/${locale}/admin-events/assets`)
        }, 1500)
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/admin-events/assets`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToList')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {asset ? t('editAsset') : t('createAsset')}
        </h1>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('assetType')}
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setType('IMAGE')}
              disabled={!!asset}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === 'IMAGE'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${asset ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">{t('image')}</span>
            </button>

            <button
              type="button"
              onClick={() => setType('AUDIO')}
              disabled={!!asset}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === 'AUDIO'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${asset ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium">{t('audio')}</span>
            </button>

            <button
              type="button"
              onClick={() => setType('PHRASE')}
              disabled={!!asset}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === 'PHRASE'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${asset ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium">{t('phrase')}</span>
            </button>

            <button
              type="button"
              onClick={() => setType('DECORATION')}
              disabled={!!asset}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === 'DECORATION'
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${asset ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl">🎈</span>
              <span className="text-sm font-medium block mt-1">{t('decoration')}</span>
            </button>
          </div>
          {asset && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('cannotChangeType')}
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('basicInformation')}
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('namePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('eventType')}
              </label>
              <select
                value={eventTypeId}
                onChange={(e) => setEventTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('allEventTypes')}</option>
                {eventTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.icon} {locale === 'es' ? et.name : et.nameEn}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('eventTypeHelp')}
              </p>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('order')}
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('orderHelp')}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section (depends on type) */}
        {type === 'IMAGE' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('imageContent')}
            </h2>

            {imageUrl ? (
              <div className="space-y-3">
                <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('')
                    setThumbnailUrl('')
                  }}
                  className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('removeImage')}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('uploadImage')}
                      </span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        )}

        {type === 'AUDIO' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('audioContent')}
            </h2>

            {audioUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {name || t('audioFile')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isPlaying ? t('playing') : t('readyToPlay')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (audioElement) {
                      audioElement.pause()
                      setAudioElement(null)
                    }
                    setAudioUrl('')
                    setIsPlaying(false)
                  }}
                  className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('removeAudio')}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  disabled={uploadingAudio}
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                >
                  {uploadingAudio ? (
                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('uploadAudio')}
                      </span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        )}

        {type === 'PHRASE' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('phraseContent')}
            </h2>

            <div className="space-y-4">
              {/* Spanish Phrase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('phraseSpanish')} *
                </label>
                <textarea
                  value={phraseEs}
                  onChange={(e) => setPhraseEs(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t('phraseSpanishPlaceholder')}
                />
              </div>

              {/* English Phrase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('phraseEnglish')} *
                </label>
                <textarea
                  value={phraseEn}
                  onChange={(e) => setPhraseEn(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t('phraseEnglishPlaceholder')}
                />
              </div>
            </div>
          </div>
        )}

        {/* DECORATION Content */}
        {type === 'DECORATION' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('decorationContent')}
            </h2>

            <div className="space-y-4">
              {/* Upload Decoration Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('decorationImage')} * (PNG/SVG con fondo transparente)
                </label>
                {decorationUrl ? (
                  <div className="relative">
                    <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <img
                        src={decorationUrl}
                        alt="Decoration preview"
                        className="max-h-44 max-w-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDecorationUrl('')}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/png,image/svg+xml"
                      onChange={handleDecorationUpload}
                      className="hidden"
                      disabled={uploadingDecoration}
                    />
                    <div className="text-center">
                      {uploadingDecoration ? (
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {uploadingDecoration ? t('uploading') : t('uploadDecoration')}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Decoration Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('decorationType')}
                </label>
                <select
                  value={decorationType}
                  onChange={(e) => setDecorationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="balloon">🎈 {t('decorationTypes.balloon')}</option>
                  <option value="cake">🎂 {t('decorationTypes.cake')}</option>
                  <option value="candles">🕯️ {t('decorationTypes.candles')}</option>
                  <option value="confetti">🎊 {t('decorationTypes.confetti')}</option>
                  <option value="banner">🎏 {t('decorationTypes.banner')}</option>
                  <option value="stars">⭐ {t('decorationTypes.stars')}</option>
                  <option value="gift">🎁 {t('decorationTypes.gift')}</option>
                  <option value="party">🎉 {t('decorationTypes.party')}</option>
                </select>
              </div>

              {/* Decoration Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('decorationPosition')}
                </label>
                <select
                  value={decorationPosition}
                  onChange={(e) => setDecorationPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="top-left">{t('positions.topLeft')}</option>
                  <option value="top-right">{t('positions.topRight')}</option>
                  <option value="bottom-left">{t('positions.bottomLeft')}</option>
                  <option value="bottom-right">{t('positions.bottomRight')}</option>
                  <option value="floating">{t('positions.floating')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin-events/assets`}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('cancel')}
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </button>
        </div>
      </form>
    </div>
  )
}