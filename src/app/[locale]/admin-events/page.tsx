import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { prisma } from '@/core/shared/lib/db'
import { getTranslations } from 'next-intl/server'
import { Ticket, Palette, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'

interface AdminEventsPageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminEventsPage({ params }: AdminEventsPageProps) {
  const { locale } = await params
  const t = await getTranslations('AdminEvents')
  
  // Protección de ruta
  await requireAdmin(locale)
  
  // Estadísticas de Event Cards
  const eventTypesCount = await prisma.eventType.count()
  const activeEventTypesCount = await prisma.eventType.count({
    where: { isActive: true }
  })
  const totalEvents = await prisma.event.count()
  const publishedEvents = await prisma.event.count({
    where: { isPublished: true }
  })
  const totalGuests = await prisma.guest.count()
  const confirmedGuests = await prisma.guest.count({
    where: { status: 'CONFIRMED' }
  })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Ticket className="w-8 h-8" />
                {t('title')}
              </h1>
              <p className="text-purple-100 dark:text-purple-200 mt-2">
                {t('description')}
              </p>
            </div>
            <Link
              href={`/${locale}/admin`}
              className="px-4 py-2 text-sm text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              ← {t('backToMainAdmin')}
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Event Types */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('eventTypes')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {eventTypesCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('activeTypes', { count: activeEventTypesCount })}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Total Events */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('totalEvents')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalEvents}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('publishedEvents', { count: publishedEvents })}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Guests */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('totalGuests')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalGuests}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('confirmedGuests', { count: confirmedGuests })}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('quickActions')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Link
              href={`/${locale}/admin-events/event-types`}
              className="block p-6 bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('manageEventTypes')}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('manageEventTypesDescription')}
              </p>
            </Link>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 opacity-50">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('analytics')}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('comingSoon')}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800">
          <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('recentActivity')}
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              {t('noActivityYet')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}