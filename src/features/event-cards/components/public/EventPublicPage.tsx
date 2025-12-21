'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { GuestConfirmation } from './GuestConfirmation'
import { ShareButtons } from '@/features/event-cards/components/share/ShareButtons'
import { HeroSection } from './experience/HeroSection'
import { AnimatedDetails } from './experience/AnimatedDetails'
import { ParticleBackground } from './experience/ParticleBackground'
import { getEventTheme } from '@/features/event-cards/config/event-themes'
import { motion } from 'framer-motion'

interface EventType {
  name: string
  nameEn: string
  icon: string | null
  color: string
  slug?: string
}

interface Event {
  id: string
  slug: string
  title: string
  description: string | null
  eventDate: Date | null
  eventTime: string | null
  location: string | null
  locationAddress: string | null
  locationUrl: string | null
  dressCode: string | null
  giftRegistry: string | null
  menu: string | null
  coverImage: string | null
  gallery: any
  primaryColor: string
  requirePhone: boolean
  welcomePhrase: string | null
  musicUrl: string | null
  eventType: EventType
  _count: {
    guests: number
  }
}

interface EventPublicPageProps {
  event: Event
  locale: string
  fullEventUrl: string
}

export function EventPublicPage({ event, locale, fullEventUrl }: EventPublicPageProps) {
  const t = useTranslations('EventPublic')
  
  // Obtener tema visual según tipo de evento
  const theme = getEventTheme(
    event.eventType.slug || event.eventType.name.toLowerCase() || 'default',
    event.primaryColor
  )

  // DEBUG: Ver qué tema se está usando
  console.log('[EventPublicPage] Theme:', {
    eventTypeSlug: event.eventType.slug,
    eventTypeName: event.eventType.name,
    theme: theme.particles,
    colors: theme.colors
  })

  const eventTypeName = locale === 'es' ? event.eventType.name : event.eventType.nameEn

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black relative">
      {/* Particle Background */}
      <ParticleBackground theme={theme} />

      {/* Hero Section */}
      <HeroSection
        title={event.title}
        welcomePhrase={event.welcomePhrase}
        eventTypeName={eventTypeName}
        eventTypeIcon={event.eventType.icon}
        coverImage={event.coverImage}
        theme={theme}
        primaryColor={event.primaryColor}
      />

      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          
          {/* Description (if exists) */}
          {event.description && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-8 text-center"
            >
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {event.description}
              </p>
            </motion.div>
          )}

          {/* Guest Count Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6"
          >
            <div className="flex items-center justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${event.primaryColor}20` }}
              >
                <Users className="w-8 h-8" style={{ color: event.primaryColor }} />
              </motion.div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {event._count.guests}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('guestsConfirmed')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-8"
          >
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center"
            >
              {t('eventDetails')}
            </motion.h2>

            <AnimatedDetails
              eventDate={event.eventDate}
              eventTime={event.eventTime}
              location={event.location}
              locationAddress={event.locationAddress}
              locationUrl={event.locationUrl}
              dressCode={event.dressCode}
              giftRegistry={event.giftRegistry}
              menu={event.menu}
              accentColor={event.primaryColor}
              locale={locale}
            />
          </motion.div>

          {/* Gallery */}
          {event.gallery && Array.isArray(event.gallery) && event.gallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                {t('gallery')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {event.gallery.map((imageUrl: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    className="relative aspect-square rounded-lg overflow-hidden shadow-md"
                  >
                    <Image
                      src={imageUrl}
                      alt={`Gallery ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirmation Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            id="confirmar"
          >
            <GuestConfirmation
              eventId={event.id}
              eventSlug={event.slug}
              requirePhone={event.requirePhone}
              locale={locale}
            />
          </motion.div>

          {/* Share Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6"
          >
            <ShareButtons
              eventTitle={event.title}
              eventUrl={fullEventUrl}
              eventDescription={event.description || undefined}
              primaryColor={event.primaryColor}
              locale={locale}
            />
          </motion.div>

        </div>
      </div>
    </div>
  )
}