'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { getAIAccessStatus, getAITokenCostsForUser, generateEventTitle, generateEventPhrase, generateImagePrompt } from '@/features/event-cards/actions/event-ai'

interface AIStatus {
  hasAccess: boolean
  planName: string
  tokensRemaining: number
  isFreePlan: boolean
}

interface TokenCosts {
  titleSuggestion: number
  phraseGeneration: number
  imageEdit: number
  imageGeneration: number
  descriptionGeneration: number
}

type AIOperationType = 'title' | 'description' | 'background' | 'featured'

interface EditorAIPanelProps {
  type: AIOperationType
  eventTypeId: string
  eventTypeName: string
  names?: string[]
  title?: string
  currentValue?: string
  hasCustomImage?: boolean
  onSelectSuggestion: (suggestion: string) => void
  locale: string
}

export function EditorAIPanel({
  type,
  eventTypeId,
  eventTypeName,
  names = [],
  title = '',
  currentValue = '',
  hasCustomImage = false,
  onSelectSuggestion,
  locale
}: EditorAIPanelProps) {
  const t = useTranslations('Events')
  const [isExpanded, setIsExpanded] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)
  const [tokenCosts, setTokenCosts] = useState<TokenCosts | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState('')

  // Load AI status on mount
  useEffect(() => {
    const loadAIStatus = async () => {
      setIsLoading(true)
      try {
        const [statusResult, costsResult] = await Promise.all([
          getAIAccessStatus(),
          getAITokenCostsForUser()
        ])

        if (!statusResult.error) {
          setAiStatus(statusResult as AIStatus)
        }

        if (!costsResult.error) {
          setTokenCosts(costsResult as TokenCosts)
        }
      } catch (err) {
        console.error('Error loading AI status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAIStatus()
  }, [])

  const getTokenCost = (): number => {
    if (!tokenCosts) return 1
    switch (type) {
      case 'title':
        return tokenCosts.titleSuggestion
      case 'description':
        return tokenCosts.phraseGeneration
      case 'background':
      case 'featured':
        return tokenCosts.imageEdit
      default:
        return 1
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setSuggestions([])

    try {
      let result

      switch (type) {
        case 'title':
          result = await generateEventTitle({
            eventTypeId,
            names: names.filter(n => n.trim()),
            locale
          })
          break
        case 'description':
          result = await generateEventPhrase({
            eventTypeId,
            names: names.filter(n => n.trim()),
            title,
            locale
          })
          break
        case 'background':
        case 'featured':
          result = await generateImagePrompt({
            eventTypeId,
            names: names.filter(n => n.trim()),
            title,
            imageType: type === 'background' ? 'background' : 'featured',
            userPrompt,
            locale
          })
          break
      }

      if (result?.error) {
        setError(t(`aiErrors.${result.error}`) || result.error)
      } else if (result?.content) {
        const newSuggestions = result.content
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.length <= 300)
          .slice(0, 3)

        setSuggestions(newSuggestions)

        // Refresh AI status to update tokens
        const statusResult = await getAIAccessStatus()
        if (!statusResult.error) {
          setAiStatus(statusResult as AIStatus)
        }
      }
    } catch (err) {
      console.error('Error generating:', err)
      setError(t('aiErrors.GenerationFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion)
    setSuggestions([])
    setIsExpanded(false)
  }

  const getTitle = (): string => {
    switch (type) {
      case 'title':
        return t('aiTitleAssistant')
      case 'description':
        return t('aiDescriptionAssistant')
      case 'background':
        return t('aiBackgroundAssistant')
      case 'featured':
        return t('aiFeaturedAssistant')
      default:
        return t('aiAssistant')
    }
  }

  const getDescription = (): string => {
    switch (type) {
      case 'title':
        return t('aiTitleAssistantDesc')
      case 'description':
        return t('aiDescriptionAssistantDesc')
      case 'background':
        return t('aiBackgroundAssistantDesc')
      case 'featured':
        return t('aiFeaturedAssistantDesc')
      default:
        return ''
    }
  }

  // For image types, only show if user has uploaded a custom image
  if ((type === 'background' || type === 'featured') && !hasCustomImage) {
    return null
  }

  if (isLoading) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('loadingAI')}</span>
        </div>
      </div>
    )
  }

  if (!aiStatus?.hasAccess) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-700 dark:text-purple-300">
              {t('aiLockedDescription')}
            </span>
          </div>
          <Link
            href={`/${locale}/pricing`}
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
          >
            {t('upgradeToPro')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            {getTitle()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-600 dark:text-purple-400">
            {aiStatus.tokensRemaining} {t('tokensRemaining')}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 bg-white dark:bg-gray-900 space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getDescription()}
          </p>

          {/* User prompt for images */}
          {(type === 'background' || type === 'featured') && (
            <div>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder={t('aiImagePromptPlaceholder')}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || aiStatus.tokensRemaining < getTokenCost()}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('generateWithAI')} ({getTokenCost()} {t('tokens')})
              </>
            )}
          </button>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('suggestions')}:
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
