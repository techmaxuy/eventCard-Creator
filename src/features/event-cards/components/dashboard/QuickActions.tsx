'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Plus, Calendar, BarChart3, Users, Sparkles } from 'lucide-react'

interface QuickActionsProps {
  locale: string
  stats?: {
    totalEvents: number
    publishedEvents: number
    totalGuests: number
  }
}

export function QuickActions({ locale, stats }: QuickActionsProps) {
  const t = useTranslations('QuickActions')

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 p-8">

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Event */}
        <Link
          href={`/${locale}/events/new`}
          className="group relative p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {t('createEvent')}
              </h3>
              <p className="text-sm text-blue-100">
                {t('createEventDescription')}
              </p>
            </div>
          </div>
        </Link>

        {/* My Events */}
        <Link
          href={`/${locale}/events`}
          className="group relative p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {t('myEvents')}
              </h3>
              <p className="text-sm text-purple-100">
                {t('myEventsDescription')}
              </p>
            </div>
          </div>
        </Link>
      </div>

     

{/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalEvents}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('totalEvents')}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.publishedEvents}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('published')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


/*

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

  //Secondary Actions 
      <div className="my-4 grid grid-cols-1 gap-3">
        <Link
          href={`/${locale}/events`}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('viewStats')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('viewStatsDescription')}
              </p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
        </Link>
      </div>

      

                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalGuests}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('totalGuests')}
            </p>
          </div>
*/