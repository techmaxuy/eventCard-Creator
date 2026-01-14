'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Shirt, Gift, Utensils } from 'lucide-react'
import { ReactNode } from 'react'

interface DetailItemProps {
  icon: ReactNode
  value: string | ReactNode
  accentColor: string
  index: number
  fontFamily?: string | null
}

function DetailItem({ icon, value, accentColor, index, fontFamily }: DetailItemProps) {
  const fontStyle = fontFamily ? { fontFamily } : {}

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
      className="flex items-center gap-4 text-center justify-center"
    >
      <motion.div
        whileHover={{ scale: 1.2, rotate: 10 }}
        className="flex items-center justify-center flex-shrink-0"
        style={{ color: accentColor }}
      >
        {icon}
      </motion.div>
      <div className="text-2xl md:text-3xl font-semibold text-white" style={fontStyle}>
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
  menu?: string | null
  accentColor: string
  locale: string
  fontFamily?: string | null
  eventTypeSlug?: string
}

export function AnimatedDetails({
  eventDate,
  eventTime,
  location,
  locationAddress,
  locationUrl,
  dressCode,
  giftRegistry,
  menu,
  accentColor,
  locale,
  fontFamily,
  eventTypeSlug,
}: AnimatedDetailsProps) {
  
  const details = []
  let index = 0

  // Date
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
        })}
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" style={fontFamily ? { fontFamily } : {}}>
                {locationAddress}
              </p>
            )}
            {locationUrl && (

                <a href={locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm font-medium hover:underline"
                style={{ color: accentColor, ...(fontFamily ? { fontFamily } : {}) }}
              >
                Ver mapa →
              </a>
            )}
          </div>
        }
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
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
      />
    )
  }

  // Gift Registry
  if (giftRegistry) {
    details.push(
      <DetailItem
        key="giftRegistry"
        icon={<Gift className="w-6 h-6" />}
        value={

            <a href={giftRegistry}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: accentColor, ...(fontFamily ? { fontFamily } : {}) }}
          >
            Ver lista de regalos →
          </a>
        }
        accentColor={accentColor}
        index={index++}
        fontFamily={fontFamily}
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
          className="text-3xl md:text-4xl text-white text-center font-medium"
          style={fontFamily ? { fontFamily } : {}}
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