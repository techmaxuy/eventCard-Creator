'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Palette, BarChart3, Settings, Ticket, Users, TrendingUp } from 'lucide-react'

interface AdminQuickActionsProps {
  locale: string
  stats?: {
    totalEventTypes: number
    totalEvents: number
    totalGuests: number
    activeEvents: number
  }
}

export function AdminQuickActions({ locale, stats }: AdminQuickActionsProps) {
  const t = useTranslations('AdminQuickActions')

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalEventTypes}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('eventTypes')}
            </p>
          </div>
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
              {stats.activeEvents}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('activeEvents')}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats.totalGuests}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('totalGuests')}
            </p>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manage Event Types */}
        <Link
          href={`/${locale}/admin-events/event-types`}
          className="group relative p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {t('manageEventTypes')}
              </h3>
              <p className="text-sm text-purple-100">
                {t('manageEventTypesDescription')}
              </p>
            </div>
          </div>
        </Link>

        {/* Event Dashboard */}
        <Link
          href={`/${locale}/admin-events`}
          className="group relative p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {t('eventDashboard')}
              </h3>
              <p className="text-sm text-green-100">
                {t('eventDashboardDescription')}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link
          href={`/${locale}/admin-events`}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('analytics')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('analyticsDescription')}
              </p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
        </Link>

        <Link
          href={`/${locale}/admin-events`}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('systemActivity')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('systemActivityDescription')}
              </p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
        </Link>
      </div>
    </div>
  )
}