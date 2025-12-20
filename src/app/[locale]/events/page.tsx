import { auth } from '@/../auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/core/shared/lib/db'
import { getTranslations } from 'next-intl/server'
import { EventsDashboard } from '@/features/event-cards/components/dashboard/EventsDashboard'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface EventsPageProps {
  params: Promise<{ locale: string }>
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale } = await params
  const session = await auth()
  
  // Proteger ruta - requiere autenticación
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('Events')

  // Obtener eventos del usuario
  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      eventType: {
        select: {
          name: true,
          nameEn: true,
          icon: true,
          color: true,
        }
      },
      _count: {
        select: {
          guests: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

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
        <EventsDashboard events={events} locale={locale} />
      </div>
    </div>
  )
}