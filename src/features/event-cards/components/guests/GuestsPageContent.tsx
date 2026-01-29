'use client'

import { useState } from 'react'
import { Users, Gift } from 'lucide-react'
import { GuestsList } from './GuestsList'
import { GiftsList } from './GiftsList'

interface Guest {
  id: string
  name: string
  phone: string
  email: string | null
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'MAYBE'
  numberOfGuests: number
  message: string | null
  createdAt: Date
}

interface GuestsPageContentProps {
  guests: Guest[]
  eventId: string
  eventSlug: string
  locale: string
  hasGiftRegistry: boolean
  showGiftRegistry: boolean
}

export function GuestsPageContent({
  guests,
  eventId,
  eventSlug,
  locale,
  hasGiftRegistry,
  showGiftRegistry,
}: GuestsPageContentProps) {
  const [activeTab, setActiveTab] = useState<'guests' | 'gifts'>('guests')

  // Only show tabs if gift registry is enabled
  const showTabs = hasGiftRegistry && showGiftRegistry

  return (
    <div className="space-y-6">
      {/* Tabs - Only show if gift registry is enabled */}
      {showTabs && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('guests')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'guests'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            {locale === 'es' ? 'Invitados' : 'Guests'}
          </button>
          <button
            onClick={() => setActiveTab('gifts')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'gifts'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Gift className="w-5 h-5" />
            {locale === 'es' ? 'Regalos' : 'Gifts'}
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === 'guests' && (
        <GuestsList
          guests={guests}
          eventId={eventId}
          eventSlug={eventSlug}
          locale={locale}
        />
      )}

      {activeTab === 'gifts' && showTabs && (
        <GiftsList eventId={eventId} locale={locale} />
      )}
    </div>
  )
}
