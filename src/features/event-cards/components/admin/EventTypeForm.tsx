'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createEventType, updateEventType } from '@/features/event-cards/actions/event-types'

interface EventTypeFormProps {
  eventType?: {
    id: string
    name: string
    nameEn: string
    slug: string
    description: string | null
    descriptionEn: string | null
    icon: string | null
    color: string
    hasDate: boolean
    hasTime: boolean
    hasLocation: boolean
    hasDressCode: boolean
    hasGiftRegistry: boolean
    hasMenu: boolean
    hideGuestCount: boolean
    allowDecorations: boolean
    defaultTheme: string
    isActive: boolean
    // AI Wizard Configuration
    numberOfPeople: number
    askNames: boolean
    aiTitlePromptEs: string | null
    aiTitlePromptEn: string | null
    aiPhrasePromptEs: string | null
    aiPhrasePromptEn: string | null
    aiBackgroundPromptEs: string | null
    aiBackgroundPromptEn: string | null
    aiPhotoPromptEs: string | null
    aiPhotoPromptEn: string | null
    // Font Configuration
    showFonts: boolean
    fontCategories: unknown // Json type from Prisma, will be cast to string[]
  }
  locale: string
}

export function EventTypeForm({ eventType, locale }: EventTypeFormProps) {
  const router = useRouter()
  const t = useTranslations('EventTypes')
  const [isPending, startTransition] = useTransition()
  
  // Form state
  const [name, setName] = useState(eventType?.name || '')
  const [nameEn, setNameEn] = useState(eventType?.nameEn || '')
  const [slug, setSlug] = useState(eventType?.slug || '')
  const [description, setDescription] = useState(eventType?.description || '')
  const [descriptionEn, setDescriptionEn] = useState(eventType?.descriptionEn || '')
  const [icon, setIcon] = useState(eventType?.icon || '')
  const [color, setColor] = useState(eventType?.color || '#3b82f6')
  const [hasDate, setHasDate] = useState(eventType?.hasDate ?? true)
  const [hasTime, setHasTime] = useState(eventType?.hasTime ?? true)
  const [hasLocation, setHasLocation] = useState(eventType?.hasLocation ?? true)
  const [hasDressCode, setHasDressCode] = useState(eventType?.hasDressCode ?? false)
  const [hasGiftRegistry, setHasGiftRegistry] = useState(eventType?.hasGiftRegistry ?? false)
  const [hasMenu, setHasMenu] = useState(eventType?.hasMenu ?? false)
  const [hideGuestCount, setHideGuestCount] = useState(eventType?.hideGuestCount ?? false)
  const [allowDecorations, setAllowDecorations] = useState(eventType?.allowDecorations ?? true)
  const [defaultTheme, setDefaultTheme] = useState(eventType?.defaultTheme || 'classic')
  const [isActive, setIsActive] = useState(eventType?.isActive ?? true)

  // AI Wizard Configuration state
  const [numberOfPeople, setNumberOfPeople] = useState(eventType?.numberOfPeople ?? 1)
  const [askNames, setAskNames] = useState(eventType?.askNames ?? true)
  const [aiTitlePromptEs, setAiTitlePromptEs] = useState(eventType?.aiTitlePromptEs || '')
  const [aiTitlePromptEn, setAiTitlePromptEn] = useState(eventType?.aiTitlePromptEn || '')
  const [aiPhrasePromptEs, setAiPhrasePromptEs] = useState(eventType?.aiPhrasePromptEs || '')
  const [aiPhrasePromptEn, setAiPhrasePromptEn] = useState(eventType?.aiPhrasePromptEn || '')
  const [aiBackgroundPromptEs, setAiBackgroundPromptEs] = useState(eventType?.aiBackgroundPromptEs || '')
  const [aiBackgroundPromptEn, setAiBackgroundPromptEn] = useState(eventType?.aiBackgroundPromptEn || '')
  const [aiPhotoPromptEs, setAiPhotoPromptEs] = useState(eventType?.aiPhotoPromptEs || '')
  const [aiPhotoPromptEn, setAiPhotoPromptEn] = useState(eventType?.aiPhotoPromptEn || '')

  // Font Configuration state
  const [showFonts, setShowFonts] = useState(eventType?.showFonts ?? true)
  const [fontCategories, setFontCategories] = useState<string[]>(
    (eventType?.fontCategories as string[]) || ['playful', 'elegant', 'modern', 'handwritten']
  )

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Auto-generar slug desde nombre
  const handleNameChange = (value: string) => {
    setName(value)
    if (!eventType) { // Solo auto-generar en creación
      const autoSlug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno
        .trim()
      setSlug(autoSlug)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const formData = {
        name,
        nameEn,
        slug,
        description: description || undefined,
        descriptionEn: descriptionEn || undefined,
        icon: icon || undefined,
        color,
        hasDate,
        hasTime,
        hasLocation,
        hasDressCode,
        hasGiftRegistry,
        hasMenu,
        hideGuestCount,
        allowDecorations,
        defaultTheme,
        isActive,
        // AI Wizard Configuration
        numberOfPeople,
        askNames,
        aiTitlePromptEs: aiTitlePromptEs || undefined,
        aiTitlePromptEn: aiTitlePromptEn || undefined,
        aiPhrasePromptEs: aiPhrasePromptEs || undefined,
        aiPhrasePromptEn: aiPhrasePromptEn || undefined,
        aiBackgroundPromptEs: aiBackgroundPromptEs || undefined,
        aiBackgroundPromptEn: aiBackgroundPromptEn || undefined,
        aiPhotoPromptEs: aiPhotoPromptEs || undefined,
        aiPhotoPromptEn: aiPhotoPromptEn || undefined,
        // Font Configuration
        showFonts,
        fontCategories: showFonts ? fontCategories : [],
      }

      const result = eventType
        ? await updateEventType(eventType.id, formData)
        : await createEventType(formData)

      if (result.error) {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      } else {
        setMessage({ type: 'success', text: t(eventType ? 'updated' : 'created') })
        setTimeout(() => {
          router.push(`/${locale}/admin-events/event-types`)
        }, 1000)
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${locale}/admin-events/event-types`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToList')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {eventType ? t('editEventType') : t('createEventType')}
        </h1>
      </div>

      {/* Message Banner */}
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
        {/* Basic Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('basicInformation')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spanish Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('nameSpanish')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cumpleaños"
              />
            </div>

            {/* English Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('nameEnglish')} *
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Birthday"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('slug')} *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                pattern="^[a-z0-9-]+$"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="birthday"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('slugHelp')}
              </p>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('icon')}
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="🎂"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('iconHelp')}
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('color')} *
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Default Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('defaultTheme')} *
              </label>
              <select
                value={defaultTheme}
                onChange={(e) => setDefaultTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="classic">{t('themes.classic')}</option>
                <option value="modern">{t('themes.modern')}</option>
                <option value="elegant">{t('themes.elegant')}</option>
                <option value="fun">{t('themes.fun')}</option>
              </select>
            </div>

            {/* Spanish Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('descriptionSpanish')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Celebración de cumpleaños"
              />
            </div>

            {/* English Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('descriptionEnglish')}
              </label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Birthday celebration"
              />
            </div>
          </div>
        </div>

        {/* Available Fields */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('availableFields')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('availableFieldsHelp')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={hasDate}
                onChange={(e) => setHasDate(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('fields.date')}
              </span>
            </label>

            {/* Time */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={hasTime}
                onChange={(e) => setHasTime(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('fields.time')}
              </span>
            </label>

            {/* Location */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={hasLocation}
                onChange={(e) => setHasLocation(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('fields.location')}
              </span>
            </label>

            {/* Dress Code */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={hasDressCode}
                onChange={(e) => setHasDressCode(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('fields.dressCode')}
              </span>
            </label>

            {/* Gift Registry */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={hasGiftRegistry}
                onChange={(e) => setHasGiftRegistry(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('fields.giftRegistry')}
              </span>
            </label>

            {/* Menu */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={hasMenu}
                onChange={(e) => setHasMenu(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('fields.menu')}
              </span>
            </label>
          </div>
        </div>

        {/* Display Options */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('displayOptions')}
          </h3>
          <div className="space-y-3">
            {/* Hide Guest Count */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={hideGuestCount}
                onChange={(e) => setHideGuestCount(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white block">
                  {t('hideGuestCount')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('hideGuestCountHelp')}
                </span>
              </div>
            </label>

            {/* Allow Decorations */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={allowDecorations}
                onChange={(e) => setAllowDecorations(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white block">
                  {t('allowDecorations')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('allowDecorationsHelp')}
                </span>
              </div>
            </label>

            {/* Show Fonts */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={showFonts}
                onChange={(e) => setShowFonts(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white block">
                  {locale === 'es' ? 'Mostrar selector de fuentes' : 'Show font selector'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {locale === 'es' ? 'Permitir que el usuario elija tipografías' : 'Allow users to choose typography'}
                </span>
              </div>
            </label>
          </div>

          {/* Font Categories - Only show if fonts are enabled */}
          {showFonts && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {locale === 'es' ? 'Categorías de fuentes permitidas' : 'Allowed font categories'}
              </label>
              <div className="flex flex-wrap gap-2">
                {['playful', 'elegant', 'modern', 'handwritten'].map((category) => (
                  <label
                    key={category}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      fontCategories.includes(category)
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={fontCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFontCategories([...fontCategories, category])
                        } else {
                          setFontCategories(fontCategories.filter(c => c !== category))
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">
                      {category === 'playful' ? (locale === 'es' ? '🎉 Juguetona' : '🎉 Playful') :
                       category === 'elegant' ? (locale === 'es' ? '✨ Elegante' : '✨ Elegant') :
                       category === 'modern' ? (locale === 'es' ? '🚀 Moderna' : '🚀 Modern') :
                       (locale === 'es' ? '✍️ Manuscrita' : '✍️ Handwritten')}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {locale === 'es' ? 'Selecciona qué estilos de fuente estarán disponibles' : 'Select which font styles will be available'}
              </p>
            </div>
          )}
        </div>

        {/* AI Wizard Configuration */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('aiWizardConfig')}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('aiWizardConfigHelp')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Number of People */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('numberOfPeople')}
              </label>
              <input
                type="number"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                min={1}
                max={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('numberOfPeopleHelp')}
              </p>
            </div>

            {/* Ask Names */}
            <div className="flex items-center">
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 w-full">
                <input
                  type="checkbox"
                  checked={askNames}
                  onChange={(e) => setAskNames(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    {t('askNames')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('askNamesHelp')}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* AI Prompt Supplements */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('aiPromptSupplements')}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('aiPromptSupplementsHelp')}
          </p>

          <div className="space-y-6">
            {/* Title Prompt */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t('aiTitlePrompt')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('spanish')}
                  </label>
                  <textarea
                    value={aiTitlePromptEs}
                    onChange={(e) => setAiTitlePromptEs(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiTitlePromptPlaceholderEs')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('english')}
                  </label>
                  <textarea
                    value={aiTitlePromptEn}
                    onChange={(e) => setAiTitlePromptEn(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiTitlePromptPlaceholderEn')}
                  />
                </div>
              </div>
            </div>

            {/* Phrase Prompt */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t('aiPhrasePrompt')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('spanish')}
                  </label>
                  <textarea
                    value={aiPhrasePromptEs}
                    onChange={(e) => setAiPhrasePromptEs(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiPhrasePromptPlaceholderEs')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('english')}
                  </label>
                  <textarea
                    value={aiPhrasePromptEn}
                    onChange={(e) => setAiPhrasePromptEn(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiPhrasePromptPlaceholderEn')}
                  />
                </div>
              </div>
            </div>

            {/* Background Image Prompt */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t('aiBackgroundPrompt')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('spanish')}
                  </label>
                  <textarea
                    value={aiBackgroundPromptEs}
                    onChange={(e) => setAiBackgroundPromptEs(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiBackgroundPromptPlaceholderEs')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('english')}
                  </label>
                  <textarea
                    value={aiBackgroundPromptEn}
                    onChange={(e) => setAiBackgroundPromptEn(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiBackgroundPromptPlaceholderEn')}
                  />
                </div>
              </div>
            </div>

            {/* Additional Photo Prompt */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t('aiPhotoPrompt')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('spanish')}
                  </label>
                  <textarea
                    value={aiPhotoPromptEs}
                    onChange={(e) => setAiPhotoPromptEs(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiPhotoPromptPlaceholderEs')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('english')}
                  </label>
                  <textarea
                    value={aiPhotoPromptEn}
                    onChange={(e) => setAiPhotoPromptEn(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    placeholder={t('aiPhotoPromptPlaceholderEn')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('activeStatus')}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('activeStatusHelp')}
              </p>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/${locale}/admin-events/event-types`}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('cancel')}
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  )
}