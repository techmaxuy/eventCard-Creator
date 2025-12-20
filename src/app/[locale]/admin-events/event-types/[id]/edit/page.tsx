import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { getEventType } from '@/features/event-cards/actions/event-types'
import { getTranslations } from 'next-intl/server'
import { EventTypeForm } from '@/features/event-cards/components/admin/EventTypeForm'
import { notFound } from 'next/navigation'

interface EditEventTypePageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function EditEventTypePage({ params }: EditEventTypePageProps) {
  const { locale, id } = await params
  const t = await getTranslations('EventTypes')
  
  // Protección de ruta
  await requireAdmin(locale)
  
  // Obtener tipo de evento
  const result = await getEventType(id)
  
  if (result.error || !result.eventType) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventTypeForm 
          eventType={result.eventType} 
          locale={locale} 
        />
      </div>
    </div>
  )
}