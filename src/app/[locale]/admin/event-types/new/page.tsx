import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { getTranslations } from 'next-intl/server'
import { EventTypeForm } from '@/features/event-cards/components/admin/EventTypeForm'

interface NewEventTypePageProps {
  params: Promise<{ locale: string }>
}

export default async function NewEventTypePage({ params }: NewEventTypePageProps) {
  const { locale } = await params
  const t = await getTranslations('EventTypes')
  
  // Protección de ruta
  await requireAdmin(locale)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventTypeForm locale={locale} />
      </div>
    </div>
  )
}