'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Plus, Calendar, Eye, Users, Share2 } from 'lucide-react'
import Image from 'next/image'

interface Event {
  id: string
  slug: string
  title: string
  eventDate: Date | null
  eventType: {
    name: string
    nameEn: string
    icon: string | null
    color: string
  }
  coverImage: string | null
  isPublished: boolean
  views: number
  _count: {
    guests: number
  }
}

interface EventsDashboardProps {
  events: Event[]
  locale: string
}

export function EventsDashboard({ events, locale }: EventsDashboardProps) {
  const t = useTranslations('Events')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('myEvents')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('myEventsDescription')}
          </p>
        </div>
        <Link
          href={`/${locale}/events/new`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('createEvent')}
        </Link>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('noEvents')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('noEventsDescription')}
          </p>
          <Link
            href={`/${locale}/events/new`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('createFirstEvent')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/${locale}/events/${event.id}`}
              className="group bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
                {event.coverImage ? (
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: event.eventType.color + '20' }}
                  >
                    <span className="text-6xl">
                      {event.eventType.icon || '🎉'}
                    </span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {event.isPublished ? (
                    <span className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded-full">
                      {t('published')}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-full">
                      {t('draft')}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Event Type */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {event.eventType.icon}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {event.title}
                </h3>

                {/* Date */}
                {event.eventDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {new Date(event.eventDate).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{event.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{event._count.guests}</span>
                  </div>
                  {event.isPublished && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Share2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}