'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ShareButtons } from '@/features/event-cards/components/share/ShareButtons'
import { AssetSelector } from './AssetSelector'
import { FontSelector } from './FontSelector'
import { DecorationSelector } from './DecorationSelector'
import { EditorAIPanel } from './EditorAIPanel'
import { EditorImageAIPanel } from './EditorImageAIPanel'

import {
  Save,
  Eye,
  Trash2,
  Loader2,
  Upload,
  X,
  MapPin,
  Calendar,
  Clock,
  Palette,
  Image as ImageIcon,
  Music,
  Globe,
  MessageSquare,
  Sparkles,
  User
} from 'lucide-react'
import Image from 'next/image'
import { updateEvent, deleteEvent, togglePublishEvent } from '@/features/event-cards/actions/events'
import Link from 'next/link'

interface EventType {
  id: string
  slug: string
  name: string
  nameEn: string
  hasDate: boolean
  hasTime: boolean
  hasLocation: boolean
  hasDressCode: boolean
  hasGiftRegistry: boolean
  hasMenu: boolean
  allowDecorations: boolean
  showFonts: boolean
  fontCategories: unknown // Json type from Prisma
  showFeaturedImage: boolean
  color: string
  icon: string | null
}

interface Event {
  id: string
  slug: string
  title: string
  titleNames: string | null
  titleMessage: string | null
  description: string | null
  eventDate: Date | null
  eventTime: string | null
  location: string | null
  locationAddress: string | null
  locationUrl: string | null
  dressCode: string | null
  giftRegistry: string | null
  menu: string | null
  theme: string
  primaryColor: string
  coverImage: string | null
  featuredImage: string | null
  gallery: any
  welcomePhrase: string | null
  musicUrl: string | null
  fontFamily: string | null
  fontEventType: string | null
  fontTitle: string | null
  fontMessage: string | null
  fontBody: string | null
  decorations: any
  isPublished: boolean
  askDietaryRequirements: boolean
  eventType: EventType
  user?: {
    name: string | null
  }
  _count?: {
    guests: number
  }
}

interface EventEditorProps {
  event: Event
  locale: string
}

interface Asset {
  id: string
  type: 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'
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
}

interface EventEditorProps {
  event: Event
  locale: string
  availableAssets?: Asset[]  // ← AGREGAR ESTO
}

export function EventEditor({ event: initialEvent, locale,availableAssets = [] }: EventEditorProps) {
  const router = useRouter()
  const t = useTranslations('Events')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingFeatured, setUploadingFeatured] = useState(false)
  
  const [event, setEvent] = useState(initialEvent)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [title, setTitle] = useState(event.title)
  const [titleNames, setTitleNames] = useState(event.titleNames || '')
  const [titleMessage, setTitleMessage] = useState(event.titleMessage || '')
  const [description, setDescription] = useState(event.description || event.welcomePhrase || '')
  const [eventDate, setEventDate] = useState(
    event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : ''
  )
  const [eventTime, setEventTime] = useState(event.eventTime || '')
  const [location, setLocation] = useState(event.location || '')
  const [locationAddress, setLocationAddress] = useState(event.locationAddress || '')
  const [locationUrl, setLocationUrl] = useState(event.locationUrl || '')
  const [dressCode, setDressCode] = useState(event.dressCode || '')
  const [giftRegistry, setGiftRegistry] = useState(event.giftRegistry || '')
  const [menu, setMenu] = useState(event.menu || '')
  const [primaryColor, setPrimaryColor] = useState(event.primaryColor)
  const [selectedCoverAsset, setSelectedCoverAsset] = useState<Asset | null>(null)
  const [selectedMusicAsset, setSelectedMusicAsset] = useState<Asset | null>(null)
  const [selectedPhraseAsset, setSelectedPhraseAsset] = useState<Asset | null>(null)
  const [showCoverAssets, setShowCoverAssets] = useState(false)
  const [showMusicAssets, setShowMusicAssets] = useState(false)
  const [showPhraseAssets, setShowPhraseAssets] = useState(false)
  const [welcomePhrase, setWelcomePhrase] = useState(event.welcomePhrase || '')
  const [musicUrl, setMusicUrl] = useState(event.musicUrl || '')
  const [fontFamily, setFontFamily] = useState(event.fontFamily || '')
  const [fontEventType, setFontEventType] = useState(event.fontEventType || '')
  const [fontTitle, setFontTitle] = useState(event.fontTitle || '')
  const [fontMessage, setFontMessage] = useState(event.fontMessage || '')
  const [fontBody, setFontBody] = useState(event.fontBody || '')
  const [selectedDecorations, setSelectedDecorations] = useState<Array<{ assetId: string, position: string }>>(
    event.decorations ? (Array.isArray(event.decorations) ? event.decorations : []) : []
  )

  // Track if images are custom uploads (not from assets) for AI enhancement
  const [isCustomCoverImage, setIsCustomCoverImage] = useState(false)
  const [isCustomFeaturedImage, setIsCustomFeaturedImage] = useState(false)

  // Guest confirmation settings
  const [askDietaryRequirements, setAskDietaryRequirements] = useState(event.askDietaryRequirements || false)

  // Inicializar el asset de música seleccionado cuando el evento ya tiene música
  useEffect(() => {
    if (event.musicUrl && availableAssets.length > 0) {
      const musicAsset = availableAssets.find(a => a.type === 'AUDIO' && a.audioUrl === event.musicUrl)
      if (musicAsset) {
        setSelectedMusicAsset(musicAsset)
      }
    }
  }, [event.musicUrl, availableAssets])

  const handleSave = async () => {
    setMessage(null)

    startTransition(async () => {
      const result = await updateEvent(event.id, {
        title,
        titleNames: titleNames || undefined,
        titleMessage: titleMessage || undefined,
        description,
        eventDate: eventDate || undefined,
        eventTime: eventTime || undefined,
        location,
        locationAddress,
        locationUrl,
        dressCode,
        giftRegistry,
        menu,
        primaryColor,
        coverImage: event.coverImage || undefined,
        featuredImage: event.featuredImage || undefined,
        welcomePhrase: welcomePhrase || undefined,
        musicUrl: musicUrl || undefined,
        fontFamily: fontFamily || undefined,
        fontEventType: fontEventType || undefined,
        fontTitle: fontTitle || undefined,
        fontMessage: fontMessage || undefined,
        fontBody: fontBody || undefined,
        decorations: selectedDecorations,
        askDietaryRequirements
      })

      if (result.error) {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      } else {
        setMessage({ type: 'success', text: t('savedSuccessfully') })
        if (result.event) {
          setEvent({
          ...event,
          ...result.event,
          eventType: result.event.eventType || event.eventType,  // Puede venir o no
          user: event.user,
          _count: event._count,
        } as any)
        }
        //router.refresh()
      }
    })
  }

  const handleTogglePublish = async () => {
    try {
    setIsToggling(true)
    setMessage(null)

    const result = await togglePublishEvent(event.id)

    if (result.error) {
      setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
    } else {
      setMessage({ 
        type: 'success', 
        text: result.event?.isPublished ? t('publishedSuccessfully') : t('unpublishedSuccessfully')
      })
      if (result.event) { 
        setEvent({
          ...event,                    // Mantener todos los datos actuales
          ...result.event,             // Sobrescribir con nuevos datos
          eventType: event.eventType,  // Preservar eventType porque no viene en el result
          user: event.user,            // Preservar user
          _count: event._count,        // Preservar _count
        } as any)}
      //router.refresh()
    }

      } catch (error) {
      console.error('[EventEditor] Unexpected error:', error)
      setMessage({ type: 'error', text: 'Unexpected error occurred' })
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = confirm(t('confirmDelete'))
    if (!confirmed) return

    const doubleConfirm = confirm(t('confirmDeleteWarning'))
    if (!doubleConfirm) return

    setIsDeleting(true)

    const result = await deleteEvent(event.id)

    if (result.error) {
      setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      setIsDeleting(false)
    } else {
      router.push(`/${locale}/events`)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('eventId', event.id)
    formData.append('imageType', 'cover')

    try {
      const response = await fetch('/api/upload/event-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setMessage({ type: 'error', text: result.error || t('errors.UploadFailed') })
      } else {
        setMessage({ type: 'success', text: t('coverUploaded') })
        setEvent({ ...event, coverImage: result.imageUrl })
        setIsCustomCoverImage(true) // Mark as custom upload for AI
        setSelectedCoverAsset(null)
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('errors.UploadFailed') })
    }

    setUploadingCover(false)
  }

  const handleCoverDelete = async () => {
    if (!event.coverImage || !confirm(t('confirmDeleteCover'))) return

    setUploadingCover(true)

    try {
      const response = await fetch(
        `/api/upload/event-image?eventId=${event.id}&imageUrl=${encodeURIComponent(event.coverImage)}&imageType=cover`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (!response.ok || result.error) {
        setMessage({ type: 'error', text: result.error || t('errors.DeleteFailed') })
      } else {
        setMessage({ type: 'success', text: t('coverDeleted') })
        setEvent({ ...event, coverImage: null })
        setIsCustomCoverImage(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('errors.DeleteFailed') })
    }

    setUploadingCover(false)
  }

  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFeatured(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('eventId', event.id)
    formData.append('imageType', 'featured')

    try {
      const response = await fetch('/api/upload/event-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setMessage({ type: 'error', text: result.error || t('errors.UploadFailed') })
      } else {
        setMessage({ type: 'success', text: t('featuredUploaded') })
        setEvent({ ...event, featuredImage: result.imageUrl })
        setIsCustomFeaturedImage(true) // Mark as custom upload for AI
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('errors.UploadFailed') })
    }

    setUploadingFeatured(false)
  }

  const handleFeaturedDelete = async () => {
    if (!event.featuredImage || !confirm(t('confirmDeleteFeatured'))) return

    setUploadingFeatured(true)

    try {
      const response = await fetch(
        `/api/upload/event-image?eventId=${event.id}&imageUrl=${encodeURIComponent(event.featuredImage)}&imageType=featured`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (!response.ok || result.error) {
        setMessage({ type: 'error', text: result.error || t('errors.DeleteFailed') })
      } else {
        setMessage({ type: 'success', text: t('featuredDeleted') })
        setEvent({ ...event, featuredImage: null })
        setIsCustomFeaturedImage(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('errors.DeleteFailed') })
    }

    setUploadingFeatured(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('editEvent')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            /{event.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Preview Button */}

          {event.isPublished && (
            <Link
              href={`/${locale}/e/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {t('preview')}
            </Link>
          )}

          {/* Publish Toggle */}
          <button
            onClick={handleTogglePublish}
            disabled={isToggling}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              event.isPublished
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {event.isPublished ? t('unpublish') : t('publish')}
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {event.isPublished ? (
          <span className="px-3 py-1 text-sm font-semibold bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
            {t('published')}
          </span>
        ) : (
          <span className="px-3 py-1 text-sm font-semibold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full">
            {t('draft')}
          </span>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {locale === 'es' ? event.eventType.name : event.eventType.nameEn}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t('basicInformation')}
            </h2>

            <div className="space-y-4">
              {/* Title Names - Protagonists */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {locale === 'es' ? 'Nombres de los protagonistas' : 'Protagonist names'}
                </label>
                <input
                  type="text"
                  value={titleNames}
                  onChange={(e) => {
                    setTitleNames(e.target.value)
                    // Auto-update legacy title field
                    setTitle(e.target.value + (titleMessage ? ' ' + titleMessage : ''))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={locale === 'es' ? 'Ej: María y Juan, Lucía' : 'E.g.: Maria and John, Lucy'}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === 'es'
                    ? 'Los nombres aparecerán en líneas separadas y con mayor tamaño'
                    : 'Names will appear on separate lines with larger size'}
                </p>
              </div>

              {/* Title Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {locale === 'es' ? 'Mensaje del título' : 'Title message'}
                </label>
                <input
                  type="text"
                  value={titleMessage}
                  onChange={(e) => {
                    setTitleMessage(e.target.value)
                    // Auto-update legacy title field
                    setTitle((titleNames || '') + (e.target.value ? ' ' + e.target.value : ''))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={locale === 'es' ? 'Ej: se casan, cumple 30' : 'E.g.: are getting married, turns 30'}
                />
                <EditorAIPanel
                  type="title"
                  eventTypeId={event.eventType.id}
                  eventTypeName={locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                  title={titleNames}
                  onSelectSuggestion={(suggestion) => {
                    setTitleMessage(suggestion)
                    setTitle((titleNames || '') + ' ' + suggestion)
                  }}
                  locale={locale}
                />
              </div>

              {/* Legacy Title (hidden, for backward compatibility) */}
              <input type="hidden" value={title} />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t('descriptionPlaceholder')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {description.length}/1000
                </p>
                <EditorAIPanel
                  type="description"
                  eventTypeId={event.eventType.id}
                  eventTypeName={locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                  title={title}
                  currentValue={description}
                  onSelectSuggestion={(suggestion) => setDescription(suggestion)}
                  locale={locale}
                />
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('primaryColor')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font Selectors - Multiple fonts for different sections */}
          {event.eventType.showFonts !== false && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {locale === 'es' ? 'Tipografías' : 'Typography'}
              </h2>

              {/* Font for Event Type */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {locale === 'es' ? 'Fuente para tipo de evento' : 'Font for event type'}
                  <span className="text-xs text-gray-500 ml-2">
                    ({locale === 'es' ? event.eventType.name : event.eventType.nameEn})
                  </span>
                </h3>
                <FontSelector
                  eventTypeSlug={event.eventType.slug}
                  fontCategories={(event.eventType.fontCategories as string[]) || undefined}
                  selectedFontId={fontEventType}
                  onSelect={(fontId) => setFontEventType(fontId || '')}
                  eventTitle={locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                  compact={true}
                />
              </div>

              {/* Font for Names/Title */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {locale === 'es' ? 'Fuente para nombres' : 'Font for names'}
                  <span className="text-xs text-gray-500 ml-2">
                    ({titleNames || 'María y Juan'})
                  </span>
                </h3>
                <FontSelector
                  eventTypeSlug={event.eventType.slug}
                  fontCategories={(event.eventType.fontCategories as string[]) || undefined}
                  selectedFontId={fontTitle}
                  onSelect={(fontId) => setFontTitle(fontId || '')}
                  eventTitle={titleNames || 'María y Juan'}
                  compact={true}
                />
              </div>

              {/* Font for Message */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {locale === 'es' ? 'Fuente para mensaje y frase' : 'Font for message and phrase'}
                  <span className="text-xs text-gray-500 ml-2">
                    ({titleMessage || welcomePhrase || 'se casan'})
                  </span>
                </h3>
                <FontSelector
                  eventTypeSlug={event.eventType.slug}
                  fontCategories={(event.eventType.fontCategories as string[]) || undefined}
                  selectedFontId={fontMessage}
                  onSelect={(fontId) => setFontMessage(fontId || '')}
                  eventTitle={titleMessage || welcomePhrase || 'se casan'}
                  compact={true}
                />
              </div>

              {/* Font for Body/Rest */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {locale === 'es' ? 'Fuente para el resto de la invitación' : 'Font for rest of invitation'}
                  <span className="text-xs text-gray-500 ml-2">
                    ({locale === 'es' ? 'Detalles, ubicación, etc.' : 'Details, location, etc.'})
                  </span>
                </h3>
                <FontSelector
                  eventTypeSlug={event.eventType.slug}
                  fontCategories={(event.eventType.fontCategories as string[]) || undefined}
                  selectedFontId={fontBody}
                  onSelect={(fontId) => setFontBody(fontId || '')}
                  eventTitle={locale === 'es' ? 'Detalles del evento' : 'Event details'}
                  compact={true}
                />
              </div>
            </div>
          )}

          {/* Decoration Selector */}
          {event.eventType.allowDecorations && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
              <DecorationSelector
                assets={availableAssets}
                selectedDecorations={selectedDecorations}
                onUpdate={setSelectedDecorations}
                locale={locale}
              />
            </div>
          )}

          {/* Date & Time */}
          {(event.eventType.hasDate || event.eventType.hasTime) && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('dateAndTime')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.eventType.hasDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('eventDate')}
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {event.eventType.hasTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('eventTime')}
                    </label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {event.eventType.hasLocation && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('location')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('locationName')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('locationNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('locationAddress')}
                  </label>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('locationAddressPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('locationUrl')}
                  </label>
                  <input
                    type="url"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://maps.google.com/..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('locationUrlHelp')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Fields */}
          {(event.eventType.hasDressCode || event.eventType.hasGiftRegistry || event.eventType.hasMenu) && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('additionalDetails')}
              </h2>

              <div className="space-y-4">
                {event.eventType.hasDressCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('dressCode')}
                    </label>
                    <input
                      type="text"
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('dressCodePlaceholder')}
                    />
                  </div>
                )}

                {event.eventType.hasGiftRegistry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('giftRegistry')}
                    </label>
                    <input
                      type="url"
                      value={giftRegistry}
                      onChange={(e) => setGiftRegistry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                )}

                {event.eventType.hasMenu && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('menu')}
                    </label>
                    <textarea
                      value={menu}
                      onChange={(e) => setMenu(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={t('menuPlaceholder')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cover Image */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {t('coverImage')}
            </h2>

            {event.coverImage ? (
              <div className="space-y-3">
                <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={event.coverImage}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCoverDelete}
                  disabled={uploadingCover}
                  className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {t('removeCover')}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('uploadCover')}
                      </span>
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('coverImageHelp')}
                </p>
              </div>
            )}

            {/* AI Enhancement for cover images */}
            {event.coverImage && (
              <EditorImageAIPanel
                type="background"
                eventTypeId={event.eventType.id}
                eventTypeName={locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                title={title}
                currentImageUrl={event.coverImage || ''}
                currentImageFile={null}
                onImageChange={(url) => {
                  setEvent({ ...event, coverImage: url })
                  setIsCustomCoverImage(true)
                }}
                locale={locale}
              />
            )}
          </div>

         {/* NUEVO: Preset Cover Images */}
          {availableAssets.filter(a => a.type === 'IMAGE').length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('presetCoverImages')}
              </label>
              <button
                type="button"
                onClick={() => setShowCoverAssets(!showCoverAssets)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-900 dark:text-white">
                    {selectedCoverAsset ? selectedCoverAsset.name : t('selectPresetImage')}
                  </span>
                </div>
                <span className="text-gray-400">
                  {showCoverAssets ? '▼' : '▶'}
                </span>
              </button>

              {showCoverAssets && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <AssetSelector
                    type="IMAGE"
                    assets={availableAssets}
                    selectedId={selectedCoverAsset?.id}
                    onSelect={(asset) => {
                      setSelectedCoverAsset(asset)
                      if (asset?.imageUrl) {
                        // Solo actualizar el estado local, se guardará con handleSave
                        setEvent({ ...event, coverImage: asset.imageUrl })
                      } else {
                        setEvent({ ...event, coverImage: null })
                      }
                    }}
                    locale={locale}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('presetCoverImagesHelp')}
              </p>
            </div>
          )}

          {/* Featured Image - Conditional based on event type */}
          {event.eventType.showFeaturedImage !== false && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('featuredImage')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('featuredImageDescription')}
            </p>

            {event.featuredImage ? (
              <div className="space-y-3">
                <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={event.featuredImage}
                    alt="Featured"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFeaturedDelete}
                  disabled={uploadingFeatured}
                  className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingFeatured ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {t('removeFeatured')}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedUpload}
                  disabled={uploadingFeatured}
                  className="hidden"
                  id="featured-upload"
                />
                <label
                  htmlFor="featured-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  {uploadingFeatured ? (
                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('uploadFeatured')}
                      </span>
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('featuredImageHelp')}
                </p>
              </div>
            )}

            {/* AI Enhancement for featured images */}
            {event.featuredImage && (
              <EditorImageAIPanel
                type="featured"
                eventTypeId={event.eventType.id}
                eventTypeName={locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                title={title}
                currentImageUrl={event.featuredImage || ''}
                currentImageFile={null}
                onImageChange={(url) => {
                  setEvent({ ...event, featuredImage: url })
                  setIsCustomFeaturedImage(true)
                }}
                locale={locale}
              />
            )}
          </div>
          )}

          {/* NUEVO: Background Music */}
          {availableAssets.filter(a => a.type === 'AUDIO').length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Music className="w-4 h-4 inline mr-1" />
                {t('backgroundMusic')}
              </label>
              <button
                type="button"
                onClick={() => setShowMusicAssets(!showMusicAssets)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-900 dark:text-white">
                    {selectedMusicAsset ? selectedMusicAsset.name : t('selectBackgroundMusic')}
                  </span>
                </div>
                <span className="text-gray-400">
                  {showMusicAssets ? '▼' : '▶'}
                </span>
              </button>

              {showMusicAssets && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <AssetSelector
                    type="AUDIO"
                    assets={availableAssets}
                    selectedId={selectedMusicAsset?.id}
                    onSelect={(asset) => {
                      setSelectedMusicAsset(asset)
                      if (asset?.audioUrl) {
                        setMusicUrl(asset.audioUrl)
                      } else {
                        setMusicUrl('')
                      }
                    }}
                    locale={locale}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('backgroundMusicHelp')}
              </p>
            </div>
          )}

          {/* NUEVO: Welcome Phrase */}
          {availableAssets.filter(a => a.type === 'PHRASE').length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                {t('welcomePhrase')}
              </label>
              <button
                type="button"
                onClick={() => setShowPhraseAssets(!showPhraseAssets)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-900 dark:text-white line-clamp-1">
                    {selectedPhraseAsset 
                      ? (locale === 'es' ? selectedPhraseAsset.phraseEs : selectedPhraseAsset.phraseEn)
                      : t('selectWelcomePhrase')}
                  </span>
                </div>
                <span className="text-gray-400 flex-shrink-0">
                  {showPhraseAssets ? '▼' : '▶'}
                </span>
              </button>

              {showPhraseAssets && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <AssetSelector
                    type="PHRASE"
                    assets={availableAssets}
                    selectedId={selectedPhraseAsset?.id}
                    onSelect={(asset) => {
                      setSelectedPhraseAsset(asset)
                      if (asset) {
                        const phrase = locale === 'es' ? asset.phraseEs : asset.phraseEn
                        setWelcomePhrase(phrase || '')
                      } else {
                        setWelcomePhrase('')
                      }
                    }}
                    locale={locale}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('welcomePhraseHelp')}
              </p>
            </div>
          )}


          {/* Guest Confirmation Settings */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {locale === 'es' ? 'Configuración de Confirmación' : 'Confirmation Settings'}
            </h2>

            {/* Dietary Requirements Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {locale === 'es' ? 'Preguntar requerimientos alimenticios' : 'Ask for dietary requirements'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {locale === 'es'
                    ? 'Los invitados podrán indicar si son celíacos, veganos, vegetarianos o tienen alergias'
                    : 'Guests can indicate if they are celiac, vegan, vegetarian or have allergies'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAskDietaryRequirements(!askDietaryRequirements)}
                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  askDietaryRequirements ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    askDietaryRequirements ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isPending ? t('saving') : t('saveChanges')}
          </button>
        </div>

        {/* Right Column - Preview/Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('eventInfo')}
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('status')}:</span>
                <span className={`ml-2 font-medium ${
                  event.isPublished 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {event.isPublished ? t('published') : t('draft')}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('publicUrl')}:</span>
                <div className="mt-1">
                  {event.isPublished ? (

                      <a href={`/${locale}/e/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all"
                    >
                      {typeof window !== 'undefined' ? `${window.location.origin}${locale ? `/${locale}` : ''}/e/${event.slug}` : `/${locale}/e/${event.slug}`}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      {t('publishToGetUrl')}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">{t('eventType')}:</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl">{event.eventType.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                  </span>
                </div>
              </div>

              {/* NUEVO: Share Buttons (solo si está publicado) */}
                {event.isPublished && (
                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
                    <ShareButtons
                      eventTitle={event.title}
                      eventUrl={`/${locale}/e/${event.slug}`}
                      eventDescription={event.description || undefined}
                      primaryColor={event.primaryColor}
                      locale={locale}
                    />
                  </div>
                )}


            </div>
          </div>
        </div>
      </div>
    </div>
  )
}