'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Lock, Coins } from 'lucide-react'
import Link from 'next/link'

interface AIAssistPanelProps {
  title: string
  description?: string
  onGenerate: () => Promise<void>
  isGenerating: boolean
  hasAccess: boolean
  tokensRemaining: number
  tokenCost: number
  isFreePlan?: boolean
  locale: string
  suggestions?: string[]
  onSelectSuggestion?: (suggestion: string) => void
  disabled?: boolean
}

export function AIAssistPanel({
  title,
  description,
  onGenerate,
  isGenerating,
  hasAccess,
  tokensRemaining,
  tokenCost,
  isFreePlan = false,
  locale,
  suggestions = [],
  onSelectSuggestion,
  disabled = false
}: AIAssistPanelProps) {
  const t = useTranslations('EventWizard')
  const [isExpanded, setIsExpanded] = useState(true)

  const canAfford = tokensRemaining >= tokenCost
  const isDisabled = disabled || isGenerating || !hasAccess || !canAfford

  const handleGenerate = async () => {
    if (isDisabled) return
    await onGenerate()
  }

  // If user doesn't have AI access (free plan or no subscription)
  if (!hasAccess || isFreePlan) {
    return (
      <div className="border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {title}
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              {t('aiLockedDescription')}
            </p>
            <Link
              href={`/${locale}/subscription`}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t('upgradeToPro')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 overflow-hidden">
      {/* Header - Collapsible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-100/50 dark:hover:bg-purple-800/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h4>
            {description && (
              <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Token cost badge */}
          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
            canAfford
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            <Coins className="w-3 h-3" />
            {tokenCost} {t('tokens')}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-purple-200/50 dark:border-purple-700/50">
          {/* Token status */}
          <div className="flex items-center justify-between py-3">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t('tokensRemaining')}: <span className="font-semibold">{tokensRemaining}</span>
            </span>
            {!canAfford && (
              <Link
                href={`/${locale}/subscription`}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                {t('getMoreTokens')}
              </Link>
            )}
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isDisabled}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              isDisabled
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('generateWithAI')}
              </>
            )}
          </button>

          {/* Suggestions list */}
          {suggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('suggestions')}:
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelectSuggestion?.(suggestion)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm text-gray-700 dark:text-gray-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Insufficient tokens warning */}
          {!canAfford && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('insufficientTokensMessage', { cost: tokenCost, remaining: tokensRemaining })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
