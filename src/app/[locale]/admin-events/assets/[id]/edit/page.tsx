import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getAsset } from '@/features/event-cards/actions/assets'
import { getEventTypes } from '@/features/event-cards/actions/event-types'
import { AssetForm } from '@/features/event-cards/components/admin/AssetForm'

interface EditAssetPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const { locale, id } = await params
  await requireAdmin(locale)
  
  const t = await getTranslations('Assets')

  const [assetResult, eventTypesResult] = await Promise.all([
    getAsset(id),
    getEventTypes()
  ])

  if (assetResult.error || !assetResult.asset) {
    notFound()
  }

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
      <AssetForm 
        asset={assetResult.asset as any} 
        eventTypes={eventTypesResult.eventTypes || []} 
        locale={locale} 
      />
    </div>
  )
}