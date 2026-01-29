'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Check, X, HelpCircle, Loader2, Mail, Phone, User, Users, MessageSquare, UtensilsCrossed } from 'lucide-react'
import { confirmGuest } from '@/features/event-cards/actions/guests'
import { getContrastColor } from '@/features/event-cards/config/event-themes'

// Dietary requirement options
const DIETARY_OPTIONS = [
  { id: 'celiac', labelEs: 'Celíaco', labelEn: 'Celiac' },
  { id: 'vegan', labelEs: 'Vegano', labelEn: 'Vegan' },
  { id: 'vegetarian', labelEs: 'Vegetariano', labelEn: 'Vegetarian' },
  { id: 'lactose_intolerant', labelEs: 'Intolerante a la lactosa', labelEn: 'Lactose intolerant' },
  { id: 'allergic', labelEs: 'Alérgico (especificar)', labelEn: 'Allergic (specify)' },
]

interface GuestConfirmationProps {
  eventId: string
  eventSlug: string
  requirePhone: boolean
  askDietaryRequirements: boolean
  primaryColor?: string
  locale: string
  fontFamily?: string | null
  onSuccess?: () => void
}

export function GuestConfirmation({ eventId, eventSlug, requirePhone, askDietaryRequirements, primaryColor = '#3b82f6', locale, fontFamily, onSuccess }: GuestConfirmationProps) {
  const t = useTranslations('EventPublic')
  const [isPending, startTransition] = useTransition()

  // Aplicar fuente personalizada si existe (ya viene convertida desde el padre)
  const fontStyle = fontFamily ? { fontFamily } : {}

  // Get contrasting color for text - used for all modal text
  const contrastColor = getContrastColor(primaryColor)

  // Combined style for text with font and contrast color
  const textStyle = { ...fontStyle, color: contrastColor }
  const labelStyle = { ...fontStyle, color: contrastColor, opacity: 0.8 }
  const hintStyle = { ...fontStyle, color: contrastColor, opacity: 0.6 }

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [numberOfGuests, setNumberOfGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'CONFIRMED' | 'DECLINED' | 'MAYBE'>('CONFIRMED')
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([])
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toggle dietary requirement
  const toggleDietaryRequirement = (id: string) => {
    setDietaryRequirements(prev =>
      prev.includes(id)
        ? prev.filter(r => r !== id)
        : [...prev, id]
    )
  }

  // Cargar estado de confirmación previo desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `event-confirmation-${eventSlug}`
      const savedConfirmation = localStorage.getItem(storageKey)

      if (savedConfirmation) {
        try {
          const data = JSON.parse(savedConfirmation)
          setSubmitted(true)
          setStatus(data.status)
          setName(data.name)
        } catch (e) {
          // Si hay error parseando, ignorar
        }
      }
    }
  }, [eventSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await confirmGuest(eventId, {
        name,
        phone,
        email: email || undefined,
        numberOfGuests,
        message: message || undefined,
        status,
        dietaryRequirements: dietaryRequirements.length > 0 ? dietaryRequirements : undefined,
        dietaryNotes: dietaryNotes || undefined,
      }, {
        ipAddress: typeof window !== 'undefined' ? window.location.hostname : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      })

      if (result.error) {
        setError(t(`errors.${result.error}`) || result.error)
      } else {
        setSubmitted(true)

        // Guardar confirmación en localStorage
        if (typeof window !== 'undefined') {
          const storageKey = `event-confirmation-${eventSlug}`
          localStorage.setItem(storageKey, JSON.stringify({
            status,
            name,
            confirmedAt: new Date().toISOString()
          }))
        }

        // Llamar callback de éxito si existe
        if (onSuccess) {
          onSuccess()
        }
      }
    })
  }

  const handleModifyResponse = () => {
    // Limpiar localStorage al modificar respuesta
    if (typeof window !== 'undefined') {
      const storageKey = `event-confirmation-${eventSlug}`
      localStorage.removeItem(storageKey)
    }
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div
        className="backdrop-blur-md rounded-xl shadow-lg border p-8 text-center"
        style={{
          backgroundColor: `${primaryColor}10`,
          borderColor: `${primaryColor}20`
        }}
      >
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
          status === 'CONFIRMED'
            ? 'bg-green-100 dark:bg-green-900/20'
            : status === 'DECLINED'
            ? 'bg-red-100 dark:bg-red-900/20'
            : 'bg-yellow-100 dark:bg-yellow-900/20'
        }`}>
          {status === 'CONFIRMED' && <Check className="w-8 h-8 text-green-600 dark:text-green-400" />}
          {status === 'DECLINED' && <X className="w-8 h-8 text-red-600 dark:text-red-400" />}
          {status === 'MAYBE' && <HelpCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />}
        </div>
        <h3 className="text-2xl font-bold mb-2" style={textStyle}>
          {status === 'CONFIRMED' && t('thankYouConfirmed')}
          {status === 'DECLINED' && t('thankYouDeclined')}
          {status === 'MAYBE' && t('thankYouMaybe')}
        </h3>
        <p className="mb-6" style={labelStyle}>
          {t('confirmationReceived')}
        </p>
        <button
          onClick={handleModifyResponse}
          style={{ ...textStyle, textDecoration: 'underline' }}
          className="hover:opacity-80"
        >
          {t('modifyResponse')}
        </button>
      </div>
    )
  }

  return (
    <div
      className="backdrop-blur-md rounded-xl shadow-lg border p-8"
      style={{
        backgroundColor: `${primaryColor}10`,
        borderColor: `${primaryColor}20`
      }}
    >
      <h3 className="text-2xl font-bold mb-2" style={textStyle}>
        {t('confirmAttendance')}
      </h3>
      <p className="mb-6" style={labelStyle}>
        {t('confirmAttendanceDescription')}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium mb-3" style={labelStyle}>
            {t('yourResponse')} *
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setStatus('CONFIRMED')}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === 'CONFIRMED'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Check className={`w-6 h-6 mx-auto mb-1 ${
                status === 'CONFIRMED' ? 'text-green-600' : 'text-gray-400'
              }`} />
              <span style={fontStyle} className={`text-sm font-medium ${
                status === 'CONFIRMED'
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              }`}>
                {status !== 'CONFIRMED' && <span style={hintStyle}>{t('attending')}</span>}
                {status === 'CONFIRMED' && t('attending')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('MAYBE')}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === 'MAYBE'
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <HelpCircle className={`w-6 h-6 mx-auto mb-1 ${
                status === 'MAYBE' ? 'text-yellow-600' : 'text-gray-400'
              }`} />
              <span style={fontStyle} className={`text-sm font-medium ${
                status === 'MAYBE' 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {t('maybe')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('DECLINED')}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === 'DECLINED'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <X className={`w-6 h-6 mx-auto mb-1 ${
                status === 'DECLINED' ? 'text-red-600' : 'text-gray-400'
              }`} />
              <span style={fontStyle} className={`text-sm font-medium ${
                status === 'DECLINED' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {t('notAttending')}
              </span>
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            {t('yourName')} *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={fontStyle}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('namePlaceholder')}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            {t('yourPhone')} {requirePhone && '*'}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required={requirePhone}
              style={fontStyle}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+598 99 123 456"
            />
          </div>
        </div>

        {/* Email (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            {t('yourEmail')} ({t('optional')})
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={fontStyle}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        {/* Number of Guests */}
        {status === 'CONFIRMED' && (
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              {t('numberOfGuests')} *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                required
                style={fontStyle}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs mt-1" style={hintStyle}>
              {t('numberOfGuestsHelp')}
            </p>
          </div>
        )}

        {/* Dietary Requirements - Only show when confirmed and enabled */}
        {status === 'CONFIRMED' && askDietaryRequirements && (
          <div>
            <label className="block text-sm font-medium mb-3" style={labelStyle}>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                {locale === 'es' ? 'Requerimientos alimenticios' : 'Dietary requirements'} ({t('optional')})
              </div>
            </label>
            <div className="space-y-2">
              {DIETARY_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    dietaryRequirements.includes(option.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={dietaryRequirements.includes(option.id)}
                    onChange={() => toggleDietaryRequirement(option.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm" style={labelStyle}>
                    {locale === 'es' ? option.labelEs : option.labelEn}
                  </span>
                </label>
              ))}
            </div>

            {/* Notes for allergies or other details */}
            {dietaryRequirements.includes('allergic') && (
              <div className="mt-3">
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  maxLength={200}
                  style={fontStyle}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={locale === 'es' ? '¿A qué eres alérgico?' : 'What are you allergic to?'}
                />
              </div>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            {t('message')} ({t('optional')})
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              style={fontStyle}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t('messagePlaceholder')}
            />
          </div>
          <p className="text-xs mt-1" style={hintStyle}>
            {message.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          style={{
            ...fontStyle,
            backgroundColor: primaryColor,
            color: contrastColor,
          }}
          className="w-full px-6 py-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {t('submitResponse')}
            </>
          )}
        </button>
      </form>
    </div>
  )
}