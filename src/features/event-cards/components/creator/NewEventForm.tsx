'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { EventTypeSelector } from './EventTypeSelector'
import { WizardContainer } from './wizard/WizardContainer'

interface EventType {
  id: string
  name: string
  nameEn: string
  slug: string
  description: string | null
  descriptionEn: string | null
  icon: string | null
  color: string
  numberOfPeople: number
  askNames: boolean
  showFeaturedImage: boolean
  aiTitlePromptEs: string | null
  aiTitlePromptEn: string | null
  aiPhrasePromptEs: string | null
  aiPhrasePromptEn: string | null
}

interface SubscriptionInfo {
  planName: string
  displayName: string
  isFreePlan: boolean
  maxEvents: number
  currentEventCount: number
  canCreateEvent: boolean
  hasAIAccess: boolean
  tokensRemaining: number
  tokensUsed: number
}

interface NewEventFormProps {
  eventTypes: EventType[]
  locale: string
  subscriptionInfo?: SubscriptionInfo | null
}

export function NewEventForm({ eventTypes, locale, subscriptionInfo }: NewEventFormProps) {
  const t = useTranslations('Events')

  const [showWizard, setShowWizard] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleNext = () => {
    if (!selectedTypeId) {
      setMessage({ type: 'error', text: t('selectTypeFirst') })
      return
    }
    setMessage(null)
    setShowWizard(true)
  }

  // Get selected event type
  const selectedEventType = eventTypes.find(et => et.id === selectedTypeId)

  // Check if user cannot create events based on subscription
  const cannotCreateEvent = subscriptionInfo ? !subscriptionInfo.canCreateEvent : false

  // If wizard is active, show the wizard
  if (showWizard && selectedEventType) {
    return (
      <WizardContainer
        eventType={selectedEventType}
        locale={locale}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/events`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToEvents')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('createNewEvent')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('createNewEventDescription')}
        </p>
      </div>

      {/* Subscription Limit Warning */}
      {cannotCreateEvent && (
        <div className="mb-6 p-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                {t('subscription.eventLimitReached')}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {t('subscription.eventLimitReachedDescription', {
                  planName: subscriptionInfo?.displayName || 'Free',
                  maxEvents: subscriptionInfo?.maxEvents || 1,
                  currentCount: subscriptionInfo?.currentEventCount || 0
                })}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/${locale}/subscription`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('subscription.upgradePlan')}
                </Link>
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  {t('subscription.upgradeToCreateMore')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Event Type Selection */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-8">
        <EventTypeSelector
          eventTypes={eventTypes}
          selectedTypeId={selectedTypeId}
          onSelect={setSelectedTypeId}
          locale={locale}
        />

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!selectedTypeId || cannotCreateEvent}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {t('continue')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}