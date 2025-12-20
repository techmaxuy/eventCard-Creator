'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { deleteEventType } from '@/features/event-cards/actions/event-types'

interface EventType {
  id: string
  name: string
  nameEn: string
  slug: string
  description: string | null
  icon: string | null
  color: string
  isActive: boolean
  _count: {
    events: number
  }
}

interface EventTypesListProps {
  eventTypes: EventType[]
  locale: string
}

export function EventTypesList({ eventTypes, locale }: EventTypesListProps) {
  const router = useRouter()
  const t = useTranslations('EventTypes')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string, eventCount: number) => {
    if (eventCount > 0) {
      alert(t('cannotDeleteWithEvents', { count: eventCount }))
      return
    }

    const confirmed = confirm(t('confirmDelete', { name }))
    
    if (!confirmed) return

    setDeletingId(id)

    const result = await deleteEventType(id)

    if (result.error) {
      alert(t(`errors.${result.error}`) || result.error)
    } else {
      router.refresh()
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h2>
        <Link
          href={`/${locale}/admin-events/event-types/new`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('createNew')}
        </Link>
      </div>

      {/* Lista */}
      {eventTypes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
          <p className="text-gray-500 dark:text-gray-400">
            {t('noEventTypes')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((type) => (
            <div
              key={type.id}
              className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {type.icon && (
                    <span className="text-4xl">{type.icon}</span>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {locale === 'es' ? type.name : type.nameEn}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      /{type.slug}
                    </p>
                  </div>
                </div>
                {type.isActive ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Color */}
              <div className="mb-4">
                <div 
                  className="h-2 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
              </div>

              {/* Descripción */}
              {type.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {locale === 'es' ? type.description : type.description}
                </p>
              )}

              {/* Estadísticas */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('eventsUsing', { count: type._count.events })}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/admin-events/event-types/${type.id}/edit`}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t('edit')}
                </Link>
                
                <button
                  onClick={() => handleDelete(type.id, type.name, type._count.events)}
                  disabled={deletingId === type.id}
                  className="px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingId === type.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}