import { auth } from '@/../auth'
import { redirect, notFound } from 'next/navigation'
import { getUserEvent } from '@/features/event-cards/actions/events'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronLeft, Edit, Eye, Users, Share2, Globe } from 'lucide-react'
import Image from 'next/image'

interface EventPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { locale, id } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('Events')

  const result = await getUserEvent(id)

  if (result.error || !result.event) {
    notFound()
  }

  const event = result.event

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/${locale}/events`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('backToEvents')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover Image */}
        {event.coverImage && (
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Event Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{event.eventType.icon}</span>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {event.title}
                </h1>
              </div>
              {event.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {event.description}
                </p>
              )}
            </div>
            
            {event.isPublished ? (
              <span className="px-3 py-1 text-sm font-semibold bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
                {t('published')}
              </span>
            ) : (
              <span className="px-3 py-1 text-sm font-semibold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full">
                {t('draft')}
              </span>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            {event.eventDate && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  📅
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('date')}</p>
                  <p className="font-medium">
                    {new Date(event.eventDate).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {event.eventTime && ` - ${event.eventTime}`}
                  </p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  📍
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('location')}</p>
                  <p className="font-medium">{event.location}</p>
                  {event.locationAddress && (
                    <p className="text-sm text-gray-500">{event.locationAddress}</p>
                  )}
                </div>
              </div>
            )}

            {event.dressCode && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center">
                  👔
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('dressCode')}</p>
                  <p className="font-medium">{event.dressCode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 pt-6 border-t border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {event.views} {t('views')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {event._count.guests} {t('guests')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/events/${event.id}/edit`}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {t('editEvent')}
            </Link>

            {event.isPublished && (
              <>
                
                  <a href={`/${locale}/e/${event.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  {t('viewPublic')}
                </a>

                <Link
                  href={`/${locale}/events/${event.id}/guests`}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {t('manageGuests')} ({event._count.guests})
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}