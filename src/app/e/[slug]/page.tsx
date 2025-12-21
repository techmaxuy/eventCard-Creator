import { notFound } from 'next/navigation'
import { getPublicEvent } from '@/features/event-cards/actions/guests'
import { EventPublicPage } from '@/features/event-cards/components/public/EventPublicPage'

interface PublicEventPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { slug } = await params
  
  // Determinar locale desde la URL o usar default
  const locale = 'es' // Puedes mejorar esto después
  
  const result = await getPublicEvent(slug)

  if (result.error || !result.event) {
    notFound()
  }

  return <EventPublicPage event={result.event as any} locale={locale} />
}

// Metadata dinámica para SEO
export async function generateMetadata({ params }: PublicEventPageProps) {
  const { slug } = await params
  const result = await getPublicEvent(slug)

  if (result.error || !result.event) {
    return {
      title: 'Event Not Found'
    }
  }

  const event = result.event

  return {
    title: event.title,
    description: event.description || `${event.eventType.name} - ${event.title}`,
    openGraph: {
      title: event.title,
      description: event.description || undefined,
      images: event.coverImage ? [event.coverImage] : [],
    },
  }
}