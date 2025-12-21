import { auth } from '@/../auth'
import { redirect, notFound } from 'next/navigation'
import { getUserEvent } from '@/features/event-cards/actions/events'
import { getAssets } from '@/features/event-cards/actions/assets'
import { getTranslations } from 'next-intl/server'
import { EventEditor } from '@/features/event-cards/components/creator/EventEditor'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface EditEventPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { locale, id } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('Events')

  // Obtener evento
  const result = await getUserEvent(id)

  if (result.error || !result.event) {
    notFound()
  }

  const event = result.event

  // Obtener assets disponibles para el tipo de evento del usuario
  const assetsResult = await getAssets({
    eventTypeId: event.eventTypeId,
    includeInactive: false
  })


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header con navegación */}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventEditor event={result.event as any} locale={locale} availableAssets={assetsResult.assets || []} />
      </div>
    </div>
  )
}