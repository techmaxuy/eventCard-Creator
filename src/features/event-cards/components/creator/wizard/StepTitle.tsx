'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Type } from 'lucide-react'
import { AIAssistPanel } from './AIAssistPanel'
import { generateEventTitle } from '@/features/event-cards/actions/event-ai'

interface EventType {
  id: string
  name: string
  nameEn: string
}

interface AIStatus {
  hasAccess: boolean
  planName: string
  tokensRemaining: number
  isFreePlan: boolean
}

interface StepTitleProps {
  eventType: EventType
  names: string[]
  title: string
  onTitleChange: (title: string) => void
  aiStatus: AIStatus | null
  tokenCost: number
  onTokensUsed: () => void
  locale: string
}

export function StepTitle({
  eventType,
  names,
  title,
  onTitleChange,
  aiStatus,
  tokenCost,
  onTokensUsed,
  locale
}: StepTitleProps) {
  const t = useTranslations('EventWizard')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateEventTitle({
        eventTypeId: eventType.id,
        names: names.filter(n => n.trim()),
        locale
      })

      if (result.error) {
        setError(t(`errors.${result.error}`) || result.error)
      } else if (result.content) {
        // Parse suggestions from the response (one per line)
        const newSuggestions = result.content
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.length <= 100)
          .slice(0, 3)

        setSuggestions(newSuggestions)
        onTokensUsed()
      }
    } catch (err) {
      console.error('Error generating title:', err)
      setError(t('errors.GenerationFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    onTitleChange(suggestion)
    setSuggestions([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Type className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('chooseTitleHeading')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('chooseTitleDescription', { eventType: eventTypeName })}
        </p>
      </div>

      {/* Title input */}
      <div className="max-w-lg mx-auto">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('eventTitle')} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          placeholder={t('eventTitlePlaceholder')}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('eventTitleHelp')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-lg mx-auto p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* AI Assistance Panel */}
      <div className="max-w-lg mx-auto mt-6">
        <AIAssistPanel
          title={t('aiTitleAssistant')}
          description={t('aiTitleAssistantDescription')}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          hasAccess={aiStatus?.hasAccess ?? false}
          tokensRemaining={aiStatus?.tokensRemaining ?? 0}
          tokenCost={tokenCost}
          isFreePlan={aiStatus?.isFreePlan ?? true}
          locale={locale}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
        />
      </div>
    </div>
  )
}
