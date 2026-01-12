'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
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
    defaultTheme: string
    isActive: boolean
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
  const [defaultTheme, setDefaultTheme] = useState(eventType?.defaultTheme || 'classic')
  const [isActive, setIsActive] = useState(eventType?.isActive ?? true)
  
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
        defaultTheme,
        isActive,
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