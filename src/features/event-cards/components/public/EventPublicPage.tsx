'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { HeroSection } from './experience/HeroSection'
import { AnimatedDetails } from './experience/AnimatedDetails'
import { Countdown } from './experience/Countdown'
import { ParticleBackground } from './experience/ParticleBackground'
import { GoogleFontLoader } from './GoogleFontLoader'
import { DecorativeElements } from './DecorativeElements'
import { MusicPlayer } from './MusicPlayer'
import { FloatingActionButtons } from './FloatingActionButtons'
import { getEventTheme } from '@/features/event-cards/config/event-themes'
import { getFontFamilyName } from '@/features/event-cards/config/fonts'
import React from 'react'
import { motion } from 'framer-motion'

interface EventType {
  name: string
  nameEn: string
  icon: string | null
  color: string
  slug?: string
  hideGuestCount?: boolean
  showFeaturedImage?: boolean
}

interface DecorationAsset {
  id: string
  decorationUrl: string | null
  decorationType: string | null
  name: string
}

interface Event {
  id: string
  slug: string
  title: string
  titleNames: string | null
  description: string | null
  eventDate: Date | null
  eventTime: string | null
  location: string | null
  locationAddress: string | null
  locationUrl: string | null
  dressCode: string | null
  giftRegistry: string | null
  giftRegistryType: string | null
  menu: string | null
  coverImage: string | null
  featuredImage: string | null
  gallery: any
  primaryColor: string
  requirePhone: boolean
  askDietaryRequirements: boolean
  welcomePhrase: string | null
  musicUrl: string | null
  fontFamily: string | null
  fontEventType: string | null
  fontTitle: string | null
  fontMessage: string | null
  fontBody: string | null
  decorations: any
  particleEffect: string | null
  colorEventType: string | null
  colorTitle: string | null
  colorMessage: string | null
  colorBody: string | null
  fontSizeEventType: number | null
  fontSizeTitle: number | null
  fontSizeMessage: number | null
  fontSizeBody: number | null
  welcomePhrasePosition: string | null
  showCountdown: boolean
  eventType: EventType
  _count: {
    guests: number
  }
}

interface EventPublicPageProps {
  event: Event
  locale: string
  fullEventUrl: string
  decorationAssets?: DecorationAsset[]
}

export function EventPublicPage({ event, locale, fullEventUrl, decorationAssets = [] }: EventPublicPageProps) {
  const t = useTranslations('EventPublic')

  // DEBUG: Monitorear scroll y dimensiones de pantalla para diagnosticar el efecto de resize
  React.useEffect(() => {
    let lastScrollY = 0
    let lastInnerHeight = window.innerHeight
    let lastOuterHeight = window.outerHeight
    let lastDocumentHeight = document.documentElement.scrollHeight

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (currentScrollY / maxScrollY * 100).toFixed(1)
      const isAtBottom = currentScrollY >= maxScrollY - 10

      // Solo loguear si hay cambios significativos
      if (Math.abs(currentScrollY - lastScrollY) > 50 || isAtBottom) {
        console.log('[DEBUG Scroll]', {
          scrollY: currentScrollY,
          maxScrollY,
          scrollPercent: `${scrollPercent}%`,
          isAtBottom,
          innerHeight: window.innerHeight,
          outerHeight: window.outerHeight,
          documentHeight: document.documentElement.scrollHeight,
          visualViewportHeight: window.visualViewport?.height,
        })
        lastScrollY = currentScrollY
      }

      // Detectar cambios en dimensiones
      if (window.innerHeight !== lastInnerHeight ||
          window.outerHeight !== lastOuterHeight ||
          document.documentElement.scrollHeight !== lastDocumentHeight) {
        console.warn('[DEBUG Resize Detected During Scroll!]', {
          innerHeight: { was: lastInnerHeight, now: window.innerHeight },
          outerHeight: { was: lastOuterHeight, now: window.outerHeight },
          documentHeight: { was: lastDocumentHeight, now: document.documentElement.scrollHeight },
        })
        lastInnerHeight = window.innerHeight
        lastOuterHeight = window.outerHeight
        lastDocumentHeight = document.documentElement.scrollHeight
      }
    }

    const handleResize = () => {
      console.warn('[DEBUG Window Resize Event!]', {
        innerHeight: window.innerHeight,
        outerHeight: window.outerHeight,
        innerWidth: window.innerWidth,
        documentHeight: document.documentElement.scrollHeight,
        visualViewportHeight: window.visualViewport?.height,
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [])

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

  // DEBUG: Ver el fontFamily
  console.log('[EventPublicPage] Font Family:', event.fontFamily)
  console.log('[EventPublicPage] Full event object keys:', Object.keys(event))

  // Convertir los font IDs a nombres CSS correctos
  const cssFontFamily = event.fontFamily ? getFontFamilyName(event.fontFamily) : null
  const cssFontEventType = event.fontEventType ? getFontFamilyName(event.fontEventType) : null
  const cssFontTitle = event.fontTitle ? getFontFamilyName(event.fontTitle) : null
  const cssFontMessage = event.fontMessage ? getFontFamilyName(event.fontMessage) : null
  const cssFontBody = event.fontBody ? getFontFamilyName(event.fontBody) : null
  console.log('[EventPublicPage] CSS Font Family Name:', cssFontFamily)

  const eventTypeName = locale === 'es' ? event.eventType.name : event.eventType.nameEn

  return (
    <div className="min-h-screen  relative">
      {/* Cargar fuentes de Google Fonts si están seleccionadas */}
      <GoogleFontLoader fontId={event.fontFamily} />
      {event.fontEventType && event.fontEventType !== event.fontFamily && (
        <GoogleFontLoader fontId={event.fontEventType} />
      )}
      {event.fontTitle && event.fontTitle !== event.fontFamily && event.fontTitle !== event.fontEventType && (
        <GoogleFontLoader fontId={event.fontTitle} />
      )}
      {event.fontMessage && event.fontMessage !== event.fontFamily && event.fontMessage !== event.fontEventType && event.fontMessage !== event.fontTitle && (
        <GoogleFontLoader fontId={event.fontMessage} />
      )}
      {event.fontBody && event.fontBody !== event.fontFamily && event.fontBody !== event.fontEventType && event.fontBody !== event.fontTitle && event.fontBody !== event.fontMessage && (
        <GoogleFontLoader fontId={event.fontBody} />
      )}

    {/* Fondo global con imagen y partículas - SIN efectos de brillo ni opacidad */}
    {/* Usamos 100lvh (large viewport height) para evitar el resize cuando el address bar del móvil se oculta/muestra */}
    <div className="fixed top-0 left-0 -z-10 overflow-hidden bg-fixed-viewport">
      {/* Cover image - sin filtros, sin transformaciones */}
      {event.coverImage && (
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      )}

      {/* Particle Background */}
      <ParticleBackground theme={theme} particleOverride={event.particleEffect} />
    </div>

      {/* Decorative Elements */}
      {(() => {
        console.log('[EventPublicPage] Event decorations:', event.decorations)
        console.log('[EventPublicPage] Decoration assets:', decorationAssets)
        return event.decorations && Array.isArray(event.decorations) && event.decorations.length > 0 && (
          <DecorativeElements
            decorations={event.decorations}
            assets={decorationAssets}
          />
        )
      })()}

  {/* Contenido */}
      <div className="relative z-10">
      {/* Hero Section */}
      <HeroSection
        title={event.title}
        titleNames={event.titleNames}
        welcomePhrase={event.welcomePhrase}
        eventTypeName={eventTypeName}
        eventTypeIcon={event.eventType.icon}
        featuredImage={event.featuredImage}
        showFeaturedImage={event.eventType.showFeaturedImage !== false}
        theme={theme}
        primaryColor={event.primaryColor}
        fontFamily={cssFontFamily}
        fontEventType={cssFontEventType}
        fontTitle={cssFontTitle}
        fontMessage={cssFontMessage}
        colorEventType={event.colorEventType}
        colorTitle={event.colorTitle}
        colorMessage={event.colorMessage}
        fontSizeEventType={event.fontSizeEventType}
        fontSizeTitle={event.fontSizeTitle}
        fontSizeMessage={event.fontSizeMessage}
        welcomePhrasePosition={event.welcomePhrasePosition}
      />

      {/* Main Content */}
      
        {/* pb-[50vh] permite que el contenido final suba hasta el centro de la pantalla */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-[50vh] space-y-12">
          
          {/* Featured Image - Foto principal */}
          {event.featuredImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30">
                <Image
                  src={event.featuredImage}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.div>
          )}

          {/* Guest Count Card - Solo si no está oculto */}
          {!event.eventType.hideGuestCount && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-zinc-800/50 p-6"
            >
              <div className="flex items-center justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${event.primaryColor}20` }}
                >
                  <Users className="w-8 h-8" style={{ color: event.primaryColor }} />
                </motion.div>
                <div className="text-center" style={cssFontBody || cssFontFamily ? { fontFamily: cssFontBody || cssFontFamily || undefined } : {}}>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    {event._count.guests}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('guestsConfirmed')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

           
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <AnimatedDetails
              eventDate={event.eventDate}
              eventTime={event.eventTime}
              location={event.location}
              locationAddress={event.locationAddress}
              locationUrl={event.locationUrl}
              dressCode={event.dressCode}
              giftRegistry={event.giftRegistry}
              giftRegistryType={event.giftRegistryType}
              menu={event.menu}
              accentColor={event.primaryColor}
              locale={locale}
              fontFamily={cssFontBody || cssFontFamily}
              eventTypeSlug={event.eventType.slug || event.eventType.name.toLowerCase()}
              fontSizeBody={event.fontSizeBody}
              colorBody={event.colorBody}
            />

            {/* Countdown Timer - Shows remaining days until event */}
            {event.showCountdown && event.eventDate && (
              <Countdown
                eventDate={event.eventDate}
                accentColor={event.primaryColor}
                locale={locale}
                fontFamily={cssFontBody || cssFontFamily}
                textColor={event.colorBody}
                fontSize={event.fontSizeBody}
              />
            )}
          </motion.div>

          {/* Gallery */}
          {event.gallery && Array.isArray(event.gallery) && event.gallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-zinc-800/50 p-8"
            >
              <h2
                className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center"
                style={{
                  ...(cssFontBody || cssFontFamily ? { fontFamily: cssFontBody || cssFontFamily || undefined } : {}),
                  ...(event.colorBody ? { color: event.colorBody } : {}),
                }}
              >
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


        </div>
      </div>

      {/* Floating Action Buttons (RSVP + Share) */}
      <FloatingActionButtons
        eventId={event.id}
        eventSlug={event.slug}
        eventTitle={event.title}
        eventDescription={event.description || undefined}
        eventUrl={fullEventUrl}
        requirePhone={event.requirePhone}
        askDietaryRequirements={event.askDietaryRequirements}
        primaryColor={event.primaryColor}
        locale={locale}
        fontFamily={cssFontFamily}
      />

      {/* Music Player */}
      {event.musicUrl && (
        <MusicPlayer musicUrl={event.musicUrl} />
      )}
    </div>

  )
}