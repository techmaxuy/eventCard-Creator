'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, X, Check, Plus } from 'lucide-react'
import Image from 'next/image'

interface Asset {
  id: string
  type: 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'
  name: string
  description: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  audioUrl: string | null
  phraseEs: string | null
  phraseEn: string | null
  decorationUrl: string | null
  decorationType: string | null
  decorationPosition: string | null
}

interface DecorationItem {
  assetId: string
  position: string
}

interface DecorationSelectorProps {
  assets: Asset[]
  selectedDecorations: DecorationItem[]
  onUpdate: (decorations: DecorationItem[]) => void
  locale: string
}

export function DecorationSelector({
  assets,
  selectedDecorations,
  onUpdate,
  locale
}: DecorationSelectorProps) {
  const t = useTranslations('DecorationSelector')
  const tAssets = useTranslations('Assets')

  // Filtrar solo decoraciones con URL válida
  const decorationAssets = assets.filter(a =>
    a.type === 'DECORATION' && a.decorationUrl
  )

  const handleToggleDecoration = (asset: Asset) => {
    const isSelected = selectedDecorations.some(d => d.assetId === asset.id)

    if (isSelected) {
      // Remover decoración
      onUpdate(selectedDecorations.filter(d => d.assetId !== asset.id))
    } else {
      // Agregar decoración con posición por defecto
      const defaultPosition = asset.decorationPosition || 'floating'
      onUpdate([
        ...selectedDecorations,
        { assetId: asset.id, position: defaultPosition }
      ])
    }
  }

  const handlePositionChange = (assetId: string, newPosition: string) => {
    onUpdate(
      selectedDecorations.map(d =>
        d.assetId === assetId ? { ...d, position: newPosition } : d
      )
    )
  }

  const getDecorationTypeEmoji = (type: string | null) => {
    switch (type) {
      case 'balloon': return '🎈'
      case 'cake': return '🎂'
      case 'candles': return '🕯️'
      case 'confetti': return '🎊'
      case 'banner': return '🎪'
      case 'stars': return '✨'
      case 'gift': return '🎁'
      case 'party': return '🎉'
      default: return '🎨'
    }
  }

  if (decorationAssets.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3 text-pink-600 dark:text-pink-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('noDecorationsAvailable')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h3>
        </div>
        {selectedDecorations.length > 0 && (
          <button
            onClick={() => onUpdate([])}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <X className="w-4 h-4" />
            {t('clearAll')}
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('description')}
      </p>

      {/* Selected Decorations Count */}
      {selectedDecorations.length > 0 && (
        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
          <p className="text-sm font-medium text-pink-900 dark:text-pink-100">
            {t('selectedCount', { count: selectedDecorations.length })}
          </p>
        </div>
      )}

      {/* Decorations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decorationAssets.map((asset) => {
          const decoration = selectedDecorations.find(d => d.assetId === asset.id)
          const isSelected = !!decoration

          return (
            <div
              key={asset.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900'
              }`}
            >
              {/* Select Button */}
              <button
                onClick={() => handleToggleDecoration(asset)}
                className="absolute top-2 right-2 z-10"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}>
                  {isSelected ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Decoration Type Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getDecorationTypeEmoji(asset.decorationType)}</span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {asset.decorationType && tAssets(`decorationTypes.${asset.decorationType}`)}
                </span>
              </div>

              {/* Decoration Image Preview */}
              {asset.decorationUrl && (
                <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={asset.decorationUrl}
                    alt={asset.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Info */}
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">
                {asset.name}
              </h3>
              {asset.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {asset.description}
                </p>
              )}

              {/* Position Selector - Solo visible si está seleccionado */}
              {isSelected && decoration && (
                <div className="mt-3 pt-3 border-t border-pink-200 dark:border-pink-800">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('position')}
                  </label>
                  <select
                    value={decoration.position}
                    onChange={(e) => handlePositionChange(asset.id, e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="top-left">{tAssets('positions.topLeft')}</option>
                    <option value="top-right">{tAssets('positions.topRight')}</option>
                    <option value="bottom-left">{tAssets('positions.bottomLeft')}</option>
                    <option value="bottom-right">{tAssets('positions.bottomRight')}</option>
                    <option value="floating">{tAssets('positions.floating')}</option>
                  </select>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
