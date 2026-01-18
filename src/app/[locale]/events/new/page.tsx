import { auth } from '@/../auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/core/shared/lib/db'
import { getTranslations } from 'next-intl/server'
import { NewEventForm } from '@/features/event-cards/components/creator/NewEventForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getEventSubscriptionInfo } from '@/features/event-cards/lib/subscription-limits'

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

  // Obtener información de suscripción del usuario
  const subscriptionInfo = await getEventSubscriptionInfo(session.user.id)

  if (eventTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('noEventTypesAvailable')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('noEventTypesDescription')}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
   <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('backToHome')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewEventForm
          eventTypes={eventTypes}
          locale={locale}
          subscriptionInfo={subscriptionInfo}
        />
      </div>
    </div>
  )
}