'use client'

import { useTranslations } from 'next-intl'
import { User, Users } from 'lucide-react'

interface EventType {
  id: string
  name: string
  nameEn: string
  numberOfPeople: number
  askNames: boolean
}

interface StepNamesProps {
  eventType: EventType
  names: string[]
  onNamesChange: (names: string[]) => void
  locale: string
}

export function StepNames({ eventType, names, onNamesChange, locale }: StepNamesProps) {
  const t = useTranslations('EventWizard')

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  // If askNames is false, show a simple message
  if (!eventType.askNames) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('letsStart')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('noNamesRequired', { eventType: eventTypeName })}
          </p>
        </div>
      </div>
    )
  }

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names]
    newNames[index] = value
    onNamesChange(newNames)
  }

  // Labels for different numbers of people
  const getNameLabel = (index: number): string => {
    if (eventType.numberOfPeople === 1) {
      // Single person event (birthday)
      return t('celebrantName')
    } else if (eventType.numberOfPeople === 2) {
      // Two person event (wedding)
      if (index === 0) return t('firstPersonName')
      return t('secondPersonName')
    } else {
      // Multiple people
      return t('personNameN', { n: index + 1 })
    }
  }

  const getPlaceholder = (index: number): string => {
    if (eventType.numberOfPeople === 1) {
      return t('celebrantNamePlaceholder')
    } else if (eventType.numberOfPeople === 2) {
      if (index === 0) return t('firstPersonPlaceholder')
      return t('secondPersonPlaceholder')
    }
    return t('personNamePlaceholder')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          eventType.numberOfPeople > 1
            ? 'bg-pink-100 dark:bg-pink-900/30'
            : 'bg-blue-100 dark:bg-blue-900/30'
        }`}>
          {eventType.numberOfPeople > 1 ? (
            <Users className="w-8 h-8 text-pink-600 dark:text-pink-400" />
          ) : (
            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {eventType.numberOfPeople > 1 ? t('whoAreTheCelebrants') : t('whoIsTheCelebrant')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('namesDescription', { eventType: eventTypeName })}
        </p>
      </div>

      {/* Name inputs */}
      <div className="space-y-4 max-w-md mx-auto">
        {names.map((name, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {getNameLabel(index)} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder={getPlaceholder(index)}
              autoFocus={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Helper text */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        {t('namesHelperText')}
      </p>
    </div>
  )
}
