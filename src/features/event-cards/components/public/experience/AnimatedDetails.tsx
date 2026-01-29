'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Shirt, Gift, Utensils } from 'lucide-react'
import { ReactNode } from 'react'

/**
 * Compute a responsive font size for body/detail text based on a percentage value.
 * The percentage maps so that 50% ≈ current default size (~1.5rem desktop).
 */
function bodyFontSize(pct: number): string {
  const maxRem = pct * 0.03
  const minRem = Math.max(0.75, maxRem * 0.55)
  const vw = pct * 0.06
  return `clamp(${minRem.toFixed(2)}rem, ${vw.toFixed(1)}vw, ${maxRem.toFixed(2)}rem)`
}

interface DetailItemProps {
  icon: ReactNode
  value: string | ReactNode
  accentColor: string
  index: number
  fontFamily?: string | null
  fontSize?: string
  textColor?: string | null
}

function DetailItem({ icon, value, accentColor, index, fontFamily, fontSize, textColor }: DetailItemProps) {
  const fontStyle: React.CSSProperties = {
    ...(fontFamily ? { fontFamily } : {}),
    ...(fontSize ? { fontSize } : {}),
    ...(textColor ? { color: textColor } : {}),
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: 'easeOut'
      }}
      className="text-center"
    >
      <div className={`font-semibold ${textColor ? '' : 'text-white'}`} style={fontStyle}>
        {value}
      </div>
    </motion.div>
  )
}

interface AnimatedDetailsProps {
  eventDate?: Date | null
  eventTime?: string | null
  location?: string | null
  locationAddress?: string | null
  locationUrl?: string | null
  dressCode?: string | null
  giftRegistry?: string | null
  giftRegistryType?: string | null
  menu?: string | null
  accentColor: string
  locale: string
  fontFamily?: string | null
  eventTypeSlug?: string
  fontSizeBody?: number | null
  colorBody?: string | null
}

export function AnimatedDetails({
  eventDate,
  eventTime,
  location,
  locationAddress,
  locationUrl,
  dressCode,
  giftRegistry,
  giftRegistryType,
  menu,
  accentColor,
  locale,
  fontFamily,
  eventTypeSlug,
  fontSizeBody,
  colorBody,
}: AnimatedDetailsProps) {
  // Compute responsive body font size (default 50%)
  const computedFontSize = bodyFontSize(fontSizeBody ?? 50)
  // Slightly larger for intro text
  const introFontSize = bodyFontSize((fontSizeBody ?? 50) * 1.4)
  
  const details = []
  let index = 0

  // Date - Usamos timeZone: 'UTC' para mostrar la fecha exacta que guardó el usuario
  // sin conversiones de zona horaria
  if (eventDate) {
    details.push(
      <DetailItem
        key="date"
        icon={<Calendar className="w-6 h-6" />}
        value={new Date(eventDate).toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        })}
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
        fontSize={computedFontSize}
        textColor={colorBody}
      />
    )
  }

  // Time
  if (eventTime) {
    details.push(
      <DetailItem
        key="time"
        icon={<Clock className="w-6 h-6" />}
        value={eventTime}
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
        fontSize={computedFontSize}
        textColor={colorBody}
      />
    )
  }

  // Location
  if (location) {
    details.push(
      <DetailItem
        key="location"
        icon={<MapPin className="w-6 h-6" />}
        value={
          <div>
            <p style={fontFamily ? { fontFamily } : {}}>{location}</p>
            {locationAddress && (
              <p className="text-gray-400 mt-1" style={{ fontFamily: fontFamily || undefined, fontSize: computedFontSize }}>
                {locationAddress}
              </p>
            )}
            {locationUrl && (
              <a href={locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 font-bold hover:underline"
                style={{ color: accentColor, fontFamily: fontFamily || undefined, fontSize: computedFontSize }}
              >
                Ver mapa →
              </a>
            )}
          </div>
        }
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
        fontSize={computedFontSize}
        textColor={colorBody}
      />
    )
  }

  // Dress Code
  if (dressCode) {
    details.push(
      <DetailItem
        key="dressCode"
        icon={<Shirt className="w-6 h-6" />}
        value={dressCode}
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
        fontSize={computedFontSize}
        textColor={colorBody}
      />
    )
  }

  // Gift Registry
  if (giftRegistry) {
    const isUrl = giftRegistryType === 'url' || !giftRegistryType
    details.push(
      <DetailItem
        key="giftRegistry"
        icon={<Gift className="w-6 h-6" />}
        value={
          isUrl ? (
            <a
              href={giftRegistry}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: accentColor, ...(fontFamily ? { fontFamily } : {}) }}
            >
              {locale === 'es' ? 'Ver lista de regalos →' : 'View gift registry →'}
            </a>
          ) : (
            <p className="whitespace-pre-line" style={fontFamily ? { fontFamily } : {}}>
              {giftRegistry}
            </p>
          )
        }
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
        fontSize={computedFontSize}
        textColor={colorBody}
      />
    )
  }

  // Menu
  if (menu) {
    details.push(
      <DetailItem
        key="menu"
        icon={<Utensils className="w-6 h-6" />}
        value={
          <p className="whitespace-pre-line text-sm" style={fontFamily ? { fontFamily } : {}}>
            {menu}
          </p>
        }
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
        fontSize={computedFontSize}
        textColor={colorBody}
      />
    )
  }

  if (details.length === 0) {
    return null
  }

  // Generate personalized intro message based on event type
  const getIntroMessage = () => {
    if (!eventDate && !location) return null

    const dateStr = eventDate ? new Date(eventDate).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }) : ''

    const timeStr = eventTime ? ` a las ${eventTime}` : ''
    const locationStr = location ? ` en ${location}` : ''

    // Check event type
    if (eventTypeSlug === 'cumpleanos' || eventTypeSlug === 'birthday') {
      return `Te espero el ${dateStr}${timeStr}${locationStr}`
    } else if (eventTypeSlug === 'casamiento' || eventTypeSlug === 'wedding') {
      return `Te esperamos el ${dateStr}${timeStr}${locationStr}`
    }

    return null
  }

  const introMessage = getIntroMessage()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {introMessage && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`text-center font-medium ${colorBody ? '' : 'text-white'}`}
          style={{
            ...(fontFamily ? { fontFamily } : {}),
            fontSize: introFontSize,
            ...(colorBody ? { color: colorBody } : {}),
          }}
        >
          {introMessage}
        </motion.p>
      )}
      <div className="space-y-4">
        {details}
      </div>
    </motion.div>
  )
}