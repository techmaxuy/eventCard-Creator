import { auth } from '@/../auth'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { getTranslations } from 'next-intl/server'
import { getAssets } from '@/features/event-cards/actions/assets'
import { AssetsList } from '@/features/event-cards/components/admin/AssetsList'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface AssetsPageProps {
  params: Promise<{ locale: string }>
}

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { locale } = await params
  await requireAdmin(locale)
  
  const t = await getTranslations('Assets')

  const result = await getAssets({ includeInactive: true })

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {t('errorLoading')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/${locale}/admin-events`}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('pageTitle')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('pageDescription')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AssetsList assets={result.assets || []} locale={locale} />
      </div>
    </div>
  )
}