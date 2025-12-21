import { notFound } from 'next/navigation'
import { getPublicEvent } from '@/features/event-cards/actions/guests'
import { EventPublicPage } from '@/features/event-cards/components/public/EventPublicPage'

interface PublicEventPageProps {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { locale,slug } = await params
  
    
  const result = await getPublicEvent(slug)

  if (result.error || !result.event) {
    notFound()
  }

  return <EventPublicPage event={result.event as any} locale={locale} />
}

// Metadata dinámica para SEO
export async function generateMetadata({ params }: PublicEventPageProps) {
  const { slug, locale } = await params
  const result = await getPublicEvent(slug)

  if (result.error || !result.event) {
    return {
      title: 'Event Not Found'
    }
  }

  const event = result.event
  const eventTypeName = locale === 'es' ? event.eventType.name : event.eventType.nameEn

  // Formatear fecha si existe
  let formattedDate = ''
  if (event.eventDate) {
    formattedDate = new Date(event.eventDate).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const description = event.description 
    || `${eventTypeName} - ${event.title}${formattedDate ? ` | ${formattedDate}` : ''}`

  return {
    title: `${event.title} | ${eventTypeName}`,
    description: description,
    openGraph: {
      title: event.title,
      description: description,
      type: 'website',
      locale: locale,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/e/${slug}`,
      siteName: 'EventCards',
      images: event.coverImage ? [
        {
          url: event.coverImage,
          width: 1200,
          height: 630,
          alt: event.title,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: description,
      images: event.coverImage ? [event.coverImage] : [],
    },
  }
}