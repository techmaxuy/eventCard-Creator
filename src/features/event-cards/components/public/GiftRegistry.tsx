'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { Gift, Plus, Trash2, Loader2, Check, AlertCircle, Phone } from 'lucide-react'
import { registerGift, getGuestGifts, removeGift, checkGiftRegistryAccess } from '@/features/event-cards/actions/gift-registry'
import { getContrastColor } from '@/features/event-cards/config/event-themes'

interface GiftRegistration {
  id: string
  giftName: string
  description: string | null
  quantity: number
}

interface GiftRegistryProps {
  eventId: string
  eventSlug: string
  primaryColor?: string
  locale: string
  fontFamily?: string | null
  giftRegistryImage?: string | null  // AI-generated image showing registered gifts
  giftRegistryEmptyImage?: string | null  // AI-generated empty gift box image
}

export function GiftRegistry({
  eventId,
  eventSlug,
  primaryColor = '#3b82f6',
  locale,
  fontFamily,
  giftRegistryImage,
  giftRegistryEmptyImage,
}: GiftRegistryProps) {
  const [isPending, startTransition] = useTransition()
  const [phone, setPhone] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [gifts, setGifts] = useState<GiftRegistration[]>([])
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [giftName, setGiftName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)

  const fontStyle = fontFamily ? { fontFamily } : {}

  // Get contrasting color for text - used for all modal text
  const contrastColor = getContrastColor(primaryColor)

  // Combined style for text with font and contrast color
  const textStyle = { ...fontStyle, color: contrastColor }
  const labelStyle = { ...fontStyle, color: contrastColor, opacity: 0.8 }
  const hintStyle = { ...fontStyle, color: contrastColor, opacity: 0.6 }

  // Load phone from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `event-confirmation-${eventSlug}`
      const savedConfirmation = localStorage.getItem(storageKey)

      if (savedConfirmation) {
        try {
          const data = JSON.parse(savedConfirmation)
          if (data.status === 'CONFIRMED') {
            // Try to get the phone from the confirmation
            const phoneKey = `event-phone-${eventSlug}`
            const savedPhone = localStorage.getItem(phoneKey)
            if (savedPhone) {
              setPhone(savedPhone)
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [eventSlug])

  const handleVerifyPhone = async () => {
    if (!phone.trim()) {
      setError(locale === 'es' ? 'Ingresa tu teléfono' : 'Enter your phone')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await checkGiftRegistryAccess(eventId, phone)

      if (result.canRegister) {
        setIsVerified(true)
        setGuestName(result.guestName || '')

        // Save phone to localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem(`event-phone-${eventSlug}`, phone)
        }

        // Load existing gifts
        const giftsResult = await getGuestGifts(eventId, phone)
        if (giftsResult.gifts) {
          setGifts(giftsResult.gifts)
        }
      } else {
        if (result.reason === 'GuestNotConfirmed') {
          setError(
            locale === 'es'
              ? 'Debes confirmar tu asistencia antes de registrar regalos'
              : 'You must confirm attendance before registering gifts'
          )
        } else {
          setError(
            locale === 'es'
              ? 'No se encontró tu confirmación con este teléfono'
              : 'No confirmation found with this phone'
          )
        }
      }
    })
  }

  const handleAddGift = async () => {
    if (!giftName.trim()) {
      setError(locale === 'es' ? 'Ingresa el nombre del regalo' : 'Enter gift name')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await registerGift(eventId, phone, {
        giftName: giftName.trim(),
        description: description.trim() || undefined,
        quantity,
      })

      if (result.success && result.gift) {
        // Add to local list or update existing
        if (result.updated) {
          setGifts(prev =>
            prev.map(g => (g.giftName === result.gift!.giftName ? result.gift! : g))
          )
        } else {
          setGifts(prev => [result.gift!, ...prev])
        }

        // Reset form
        setGiftName('')
        setDescription('')
        setQuantity(1)
      } else {
        setError(
          locale === 'es' ? 'Error al registrar el regalo' : 'Error registering gift'
        )
      }
    })
  }

  const handleRemoveGift = async (giftId: string) => {
    startTransition(async () => {
      const result = await removeGift(giftId, phone)

      if (result.success) {
        setGifts(prev => prev.filter(g => g.id !== giftId))
      } else {
        setError(locale === 'es' ? 'Error al eliminar el regalo' : 'Error removing gift')
      }
    })
  }

  // Phone verification screen
  if (!isVerified) {
    return (
      <div
        className="backdrop-blur-md rounded-xl shadow-lg border p-8"
        style={{
          backgroundColor: `${primaryColor}10`,
          borderColor: `${primaryColor}20`,
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Gift className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3
              className="text-xl font-bold"
              style={textStyle}
            >
              {locale === 'es' ? 'Registro de Regalos' : 'Gift Registry'}
            </h3>
            <p className="text-sm" style={labelStyle}>
              {locale === 'es'
                ? 'Indica qué regalo traerás al evento'
                : 'Let us know what gift you will bring'}
            </p>
          </div>
        </div>

        {/* Gift Registry Image */}
        {(giftRegistryImage || giftRegistryEmptyImage) && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <div className="relative w-full aspect-video">
              <Image
                src={giftRegistryImage || giftRegistryEmptyImage || ''}
                alt={locale === 'es' ? 'Registro de regalos' : 'Gift registry'}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={labelStyle}
            >
              {locale === 'es'
                ? 'Ingresa tu teléfono para verificar'
                : 'Enter your phone to verify'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={fontStyle}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+598 99 123 456"
              />
            </div>
            <p className="text-xs mt-1" style={hintStyle}>
              {locale === 'es'
                ? 'Usa el mismo teléfono con el que confirmaste asistencia'
                : 'Use the same phone you used to confirm attendance'}
            </p>
          </div>

          <button
            onClick={handleVerifyPhone}
            disabled={isPending}
            style={{
              ...fontStyle,
              backgroundColor: primaryColor,
              color: contrastColor,
            }}
            className="w-full px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {locale === 'es' ? 'Verificando...' : 'Verifying...'}
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                {locale === 'es' ? 'Verificar' : 'Verify'}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Gift registration screen
  return (
    <div
      className="backdrop-blur-md rounded-xl shadow-lg border p-6"
      style={{
        backgroundColor: `${primaryColor}10`,
        borderColor: `${primaryColor}20`,
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Gift className="w-6 h-6" style={{ color: primaryColor }} />
        </div>
        <div>
          <h3
            className="text-xl font-bold"
            style={textStyle}
          >
            {locale === 'es' ? 'Registro de Regalos' : 'Gift Registry'}
          </h3>
          <p className="text-sm" style={labelStyle}>
            {locale === 'es' ? `Hola, ${guestName}` : `Hello, ${guestName}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Add gift form */}
      <div className="space-y-4 mb-6">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={labelStyle}
          >
            {locale === 'es' ? 'Nombre del regalo' : 'Gift name'} *
          </label>
          <input
            type="text"
            value={giftName}
            onChange={e => setGiftName(e.target.value)}
            style={fontStyle}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={locale === 'es' ? 'Ej: Tostadora' : 'Ex: Toaster'}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label
              className="block text-sm font-medium mb-1"
              style={labelStyle}
            >
              {locale === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={fontStyle}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={locale === 'es' ? 'Marca, color, etc.' : 'Brand, color, etc.'}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={labelStyle}
            >
              {locale === 'es' ? 'Cantidad' : 'Qty'}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={99}
              style={fontStyle}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleAddGift}
          disabled={isPending || !giftName.trim()}
          style={{
            ...fontStyle,
            backgroundColor: primaryColor,
            color: contrastColor,
          }}
          className="w-full px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {locale === 'es' ? 'Agregar regalo' : 'Add gift'}
        </button>
      </div>

      {/* Registered gifts list */}
      {gifts.length > 0 && (
        <div>
          <h4
            className="text-sm font-medium mb-3"
            style={labelStyle}
          >
            {locale === 'es' ? 'Tus regalos registrados:' : 'Your registered gifts:'}
          </h4>
          <div className="space-y-2">
            {gifts.map(gift => (
              <div
                key={gift.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white" style={fontStyle}>
                    {gift.giftName}
                    {gift.quantity > 1 && (
                      <span className="text-gray-500 ml-1">x{gift.quantity}</span>
                    )}
                  </p>
                  {gift.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400" style={fontStyle}>
                      {gift.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveGift(gift.id)}
                  disabled={isPending}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {gifts.length === 0 && (
        <p className="text-center text-sm" style={hintStyle}>
          {locale === 'es'
            ? 'Aún no has registrado ningún regalo'
            : "You haven't registered any gifts yet"}
        </p>
      )}
    </div>
  )
}
