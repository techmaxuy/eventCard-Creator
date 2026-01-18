'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquareHeart } from 'lucide-react'
import { AIAssistPanel } from './AIAssistPanel'
import { generateEventPhrase } from '@/features/event-cards/actions/event-ai'

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

interface StepPhraseProps {
  eventType: EventType
  names: string[]
  title: string
  welcomePhrase: string
  onPhraseChange: (phrase: string) => void
  aiStatus: AIStatus | null
  tokenCost: number
  onTokensUsed: () => void
  locale: string
}

export function StepPhrase({
  eventType,
  names,
  title,
  welcomePhrase,
  onPhraseChange,
  aiStatus,
  tokenCost,
  onTokensUsed,
  locale
}: StepPhraseProps) {
  const t = useTranslations('EventWizard')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateEventPhrase({
        eventTypeId: eventType.id,
        names: names.filter(n => n.trim()),
        title,
        locale
      })

      if (result.error) {
        setError(t(`errors.${result.error}`) || result.error)
      } else if (result.content) {
        // Parse suggestions from the response (one per line)
        const newSuggestions = result.content
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.length <= 200)
          .slice(0, 3)

        setSuggestions(newSuggestions)
        onTokensUsed()
      }
    } catch (err) {
      console.error('Error generating phrase:', err)
      setError(t('errors.GenerationFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    onPhraseChange(suggestion)
    setSuggestions([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquareHeart className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('welcomePhraseHeading')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('welcomePhraseDescription', { eventType: eventTypeName })}
        </p>
      </div>

      {/* Current title preview */}
      <div className="max-w-lg mx-auto p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('eventTitleLabel')}:</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{title}</p>
      </div>

      {/* Phrase input */}
      <div className="max-w-lg mx-auto">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('welcomePhrase')}
          <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">({t('optional')})</span>
        </label>
        <textarea
          value={welcomePhrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          rows={3}
          maxLength={200}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={t('welcomePhrasePlaceholder')}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('welcomePhraseHelp')}
          </p>
          <span className="text-xs text-gray-400">
            {welcomePhrase.length}/200
          </span>
        </div>
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
          title={t('aiPhraseAssistant')}
          description={t('aiPhraseAssistantDescription')}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          hasAccess={aiStatus?.hasAccess ?? false}
          tokensRemaining={aiStatus?.tokensRemaining ?? 0}
          tokenCost={tokenCost}
          isFreePlan={aiStatus?.isFreePlan ?? true}
          locale={locale}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          isLoading={aiStatus === null}
        />
      </div>

      {/* Skip notice */}
      <div className="max-w-lg mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('skipPhraseNotice')}
        </p>
      </div>
    </div>
  )
}
