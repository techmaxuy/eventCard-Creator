'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Check } from 'lucide-react'

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

interface EventTypeSelectorProps {
  eventTypes: EventType[]
  selectedTypeId: string | null
  onSelect: (typeId: string) => void
  locale: string
}

export function EventTypeSelector({ 
  eventTypes, 
  selectedTypeId, 
  onSelect,
  locale 
}: EventTypeSelectorProps) {
  const t = useTranslations('Events')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('selectEventType')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('selectEventTypeDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventTypes.map((type) => {
          const isSelected = selectedTypeId === type.id
          const name = locale === 'es' ? type.name : type.nameEn
          const description = locale === 'es' ? type.description : type.descriptionEn

          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`relative p-6 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-zinc-900'
              }`}
            >
              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon */}
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: type.color + '20' }}
              >
                <span className="text-4xl">
                  {type.icon || '🎉'}
                </span>
              </div>

              {/* Name */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {name}
              </h3>

              {/* Description */}
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}

              {/* Color indicator */}
              <div 
                className="mt-4 h-1 rounded-full"
                style={{ backgroundColor: type.color }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}