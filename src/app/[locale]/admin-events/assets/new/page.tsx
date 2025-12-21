import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { getTranslations } from 'next-intl/server'
import { getEventTypes } from '@/features/event-cards/actions/event-types'
import { AssetForm } from '@/features/event-cards/components/admin/AssetForm'

interface NewAssetPageProps {
  params: Promise<{ locale: string }>
}

export default async function NewAssetPage({ params }: NewAssetPageProps) {
  const { locale } = await params
  await requireAdmin(locale)
  
  const t = await getTranslations('Assets')

  const eventTypesResult = await getEventTypes()

  if (eventTypesResult.error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {t('errorLoadingEventTypes')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black py-8">
      <AssetForm eventTypes={eventTypesResult.eventTypes || []} locale={locale} />
    </div>
  )
}