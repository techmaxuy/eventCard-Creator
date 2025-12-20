import { auth } from '@/../auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/core/shared/lib/db'
import { getTranslations } from 'next-intl/server'
import { NewEventForm } from '@/features/event-cards/components/creator/NewEventForm'

interface NewEventPageProps {
  params: Promise<{ locale: string }>
}

export default async function NewEventPage({ params }: NewEventPageProps) {
  const { locale } = await params
  const session = await auth()
  
  // Proteger ruta
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('Events')

  // Obtener tipos de eventos activos
  const eventTypes = await prisma.eventType.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  if (eventTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('noEventTypesAvailable')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('noEventTypesDescription')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewEventForm eventTypes={eventTypes} locale={locale} />
      </div>
    </div>
  )
}