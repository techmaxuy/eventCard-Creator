import { auth } from '@/../auth'
import { redirect, notFound } from 'next/navigation'
import { getUserEvent } from '@/features/event-cards/actions/events'
import { getEventGuestsForOwner } from '@/features/event-cards/actions/guests'
import { getTranslations } from 'next-intl/server'
import { GuestsList } from '@/features/event-cards/components/guests/GuestsList'
import Link from 'next/link'
import { ChevronLeft, Users } from 'lucide-react'

interface GuestsPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function GuestsPage({ params }: GuestsPageProps) {
  const { locale, id } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('Guests')

  // Obtener evento
  const eventResult = await getUserEvent(id)
  if (eventResult.error || !eventResult.event) {
    notFound()
  }

  const event = eventResult.event

  // Obtener invitados
  const guestsResult = await getEventGuestsForOwner(id)
  if (guestsResult.error) {
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

  const { guests, stats } = guestsResult

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/${locale}/events/${id}`}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('pageTitle')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {event.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GuestsList 
          guests={guests || []} 
          eventId={id}
          eventSlug={event.slug}
          locale={locale} 
        />
      </div>
    </div>
  )
}