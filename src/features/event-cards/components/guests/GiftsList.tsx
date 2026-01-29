'use client'

import { useState, useEffect } from 'react'
import { Gift, User, Package, Loader2 } from 'lucide-react'
import { getEventGifts } from '@/features/event-cards/actions/gift-registry'

interface GiftRegistration {
  id: string
  giftName: string
  description: string | null
  quantity: number
  guest: {
    name: string
    phone: string
  }
  createdAt: Date
}

interface GiftSummary {
  giftName: string
  totalQuantity: number
  registrations: {
    guestName: string
    quantity: number
    description: string | null
  }[]
}

interface GiftsListProps {
  eventId: string
  locale: string
}

export function GiftsList({ eventId, locale }: GiftsListProps) {
  const [gifts, setGifts] = useState<GiftRegistration[]>([])
  const [summary, setSummary] = useState<GiftSummary[]>([])
  const [totalGifts, setTotalGifts] = useState(0)
  const [totalUniqueGifts, setTotalUniqueGifts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary')

  useEffect(() => {
    async function loadGifts() {
      setLoading(true)
      const result = await getEventGifts(eventId)

      if (result.error) {
        setError(result.error)
      } else {
        setGifts(result.gifts || [])
        setSummary(result.summary || [])
        setTotalGifts(result.totalGifts || 0)
        setTotalUniqueGifts(result.totalUniqueGifts || 0)
      }

      setLoading(false)
    }

    loadGifts()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">
          {locale === 'es' ? 'Error al cargar los regalos' : 'Error loading gifts'}
        </p>
      </div>
    )
  }

  if (gifts.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-12 text-center">
        <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {locale === 'es'
            ? 'Aun no hay regalos registrados'
            : 'No gifts registered yet'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          {locale === 'es'
            ? 'Los invitados confirmados pueden registrar los regalos que traerán'
            : 'Confirmed guests can register the gifts they will bring'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {locale === 'es' ? 'Total de regalos' : 'Total gifts'}
          </p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {totalGifts}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {locale === 'es' ? 'Regalos únicos' : 'Unique gifts'}
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalUniqueGifts}
          </p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('summary')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'summary'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {locale === 'es' ? 'Resumen' : 'Summary'}
        </button>
        <button
          onClick={() => setViewMode('detail')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'detail'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {locale === 'es' ? 'Detalle' : 'Detail'}
        </button>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              {locale === 'es' ? 'Resumen de regalos' : 'Gift summary'}
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-zinc-700">
            {summary.map((item, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.giftName}
                  </p>
                  <span className="px-2 py-1 text-sm font-semibold bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded-full">
                    x{item.totalQuantity}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.registrations.map((reg, i) => (
                    <span key={i}>
                      {reg.guestName}
                      {reg.quantity > 1 && ` (x${reg.quantity})`}
                      {i < item.registrations.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail View */}
      {viewMode === 'detail' && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'es' ? 'Invitado' : 'Guest'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'es' ? 'Regalo' : 'Gift'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'es' ? 'Cantidad' : 'Qty'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'es' ? 'Fecha' : 'Date'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {gifts.map((gift) => (
                  <tr
                    key={gift.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {gift.guest.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {gift.guest.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {gift.giftName}
                      </p>
                      {gift.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {gift.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                        {gift.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(gift.createdAt).toLocaleDateString(locale)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
