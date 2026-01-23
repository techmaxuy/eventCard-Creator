'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Type, Check, X } from 'lucide-react'
import { EVENT_FONTS, getFontsForEventType, type EventFont } from '@/features/event-cards/config/fonts'

interface FontSelectorProps {
  eventTypeSlug?: string
  fontCategories?: string[] // Categories configured in EventType
  selectedFontId?: string
  onSelect: (fontId: string | null) => void
  eventTitle: string // Para preview personalizado
}

export function FontSelector({
  eventTypeSlug,
  fontCategories,
  selectedFontId,
  onSelect,
  eventTitle
}: FontSelectorProps) {
  const t = useTranslations('FontSelector')
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'playful' | 'elegant' | 'modern' | 'handwritten'>('all')

  // Obtener fuentes recomendadas según tipo de evento y categorías configuradas
  const recommendedFonts = eventTypeSlug
    ? getFontsForEventType(eventTypeSlug, fontCategories)
    : EVENT_FONTS

  // Filtrar por categoría
  const filteredFonts = selectedCategory === 'all'
    ? recommendedFonts
    : recommendedFonts.filter(font => font.category === selectedCategory)

  // Cargar fuente cuando se monta el componente
  useEffect(() => {
    filteredFonts.forEach(font => {
      if (!loadedFonts.has(font.id)) {
        loadFont(font)
      }
    })
  }, [filteredFonts])

  const loadFont = (font: EventFont) => {
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontName}:wght@${font.weights?.join(';') || '400'}&display=swap`
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    // Marcar como cargada después de un breve delay
    setTimeout(() => {
      setLoadedFonts(prev => new Set(prev).add(font.id))
    }, 100)
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: t('allFonts'),
      playful: t('playful'),
      elegant: t('elegant'),
      modern: t('modern'),
      handwritten: t('handwritten'),
    }
    return labels[category] || category
  }

  const getCategoryIcon = (category: EventFont['category']) => {
    switch (category) {
      case 'playful':
        return '🎉'
      case 'elegant':
        return '✨'
      case 'modern':
        return '🚀'
      case 'handwritten':
        return '✍️'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h3>
        </div>

        {selectedFontId && (
          <button
            onClick={() => onSelect(null)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <X className="w-4 h-4" />
            {t('clearSelection')}
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('description')}
      </p>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'playful', 'elegant', 'modern', 'handwritten'].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {getCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* Font Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
        {filteredFonts.map((font) => {
          const isSelected = selectedFontId === font.id
          const isLoaded = loadedFonts.has(font.id)

          return (
            <button
              key={font.id}
              onClick={() => onSelect(isSelected ? null : font.id)}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Category Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{getCategoryIcon(font.category)}</span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {font.displayName}
                </span>
              </div>

              {/* Font Preview */}
              <div
                style={{
                  fontFamily: isLoaded ? font.name : 'inherit',
                  fontSize: '24px',
                  lineHeight: '1.2',
                  opacity: isLoaded ? 1 : 0.5,
                }}
                className="text-gray-900 dark:text-white font-bold break-words"
              >
                {eventTitle || font.previewText}
              </div>

              {/* Loading State */}
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredFonts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('noFonts')}
        </div>
      )}

      {/* Selected Font Info */}
      {selectedFontId && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <span className="font-semibold">{t('selectedFont')}:</span>{' '}
            {filteredFonts.find(f => f.id === selectedFontId)?.displayName}
          </p>
        </div>
      )}
    </div>
  )
}
