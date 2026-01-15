'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { EventTypeSelector } from './EventTypeSelector'
import { createEvent } from '@/features/event-cards/actions/events'

interface EventType {
  id: string
  name: string
  nameEn: string
  slug: string
  description: string | null
  descriptionEn: string | null
  icon: string | null
  color: string
}

interface NewEventFormProps {
  eventTypes: EventType[]
  locale: string
}

export function NewEventForm({ eventTypes, locale }: NewEventFormProps) {
  const router = useRouter()
  const t = useTranslations('Events')
  const [isPending, startTransition] = useTransition()
  
  const [step, setStep] = useState(1)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleNext = () => {
    if (!selectedTypeId) {
      setMessage({ type: 'error', text: t('selectTypeFirst') })
      return
    }
    setMessage(null)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!selectedTypeId || !title) {
      setMessage({ type: 'error', text: t('fillAllFields') })
      return
    }

    startTransition(async () => {
      const result = await createEvent({
        eventTypeId: selectedTypeId,
        title,
      })

      if (result.error) {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      } else if (result.event) {
        // Redirigir al editor del evento
        router.push(`/${locale}/events/${result.event.id}/edit`)
      }
    })
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

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              1
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step >= 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {t('selectType')}
            </span>
          </div>

          {/* Connector */}
          <div className={`flex-1 h-1 mx-4 ${
            step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`} />

          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 2
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              2
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step >= 2 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {t('basicInfo')}
            </span>
          </div>
        </div>
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

      {/* Step Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-8">
        {step === 1 && (
          <>
            <EventTypeSelector
              eventTypes={eventTypes}
              selectedTypeId={selectedTypeId}
              onSelect={setSelectedTypeId}
              locale={locale}
            />

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!selectedTypeId}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {t('continue')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('basicInformation')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('basicInformationDescription')}
                </p>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('eventTitle')} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('eventTitlePlaceholder')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('eventTitleHelp')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('back')}
              </button>
              <button
                type="submit"
                disabled={isPending || !title}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    {t('createAndContinue')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}