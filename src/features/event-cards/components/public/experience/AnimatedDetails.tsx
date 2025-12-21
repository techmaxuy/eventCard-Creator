'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Shirt, Gift, Utensils } from 'lucide-react'
import { ReactNode } from 'react'

interface DetailItemProps {
  icon: ReactNode
  label: string
  value: string | ReactNode
  accentColor: string
  index: number
}

function DetailItem({ icon, label, value, accentColor, index }: DetailItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: 'easeOut'
      }}
      className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ backgroundColor: `${accentColor}20` }}
      >
        <div style={{ color: accentColor }}>
          {icon}
        </div>
      </motion.div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </p>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {value}
        </div>
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
}: AnimatedDetailsProps) {
  
  const details = []
  let index = 0

  // Date
  if (eventDate) {
    details.push(
      <DetailItem
        key="date"
        icon={<Calendar className="w-6 h-6" />}
        label="Fecha"
        value={new Date(eventDate).toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        accentColor={accentColor}
        index={index++}
      />
    )
  }

  // Time
  if (eventTime) {
    details.push(
      <DetailItem
        key="time"
        icon={<Clock className="w-6 h-6" />}
        label="Hora"
        value={eventTime}
        accentColor={accentColor}
        index={index++}
      />
    )
  }

  // Location
  if (location) {
    details.push(
      <DetailItem
        key="location"
        icon={<MapPin className="w-6 h-6" />}
        label="Ubicación"
        value={
          <div>
            <p>{location}</p>
            {locationAddress && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {locationAddress}
              </p>
            )}
            {locationUrl && (
              
                <a href={locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm font-medium hover:underline"
                style={{ color: accentColor }}
              >
                Ver mapa →
              </a>
            )}
          </div>
        }
        accentColor={accentColor}
        index={index++}
      />
    )
  }

  // Dress Code
  if (dressCode) {
    details.push(
      <DetailItem
        key="dressCode"
        icon={<Shirt className="w-6 h-6" />}
        label="Dress Code"
        value={dressCode}
        accentColor={accentColor}
        index={index++}
      />
    )
  }

  // Gift Registry
  if (giftRegistry) {
    details.push(
      <DetailItem
        key="giftRegistry"
        icon={<Gift className="w-6 h-6" />}
        label="Mesa de Regalos"
        value={
          
            <a href={giftRegistry}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: accentColor }}
          >
            Ver lista de regalos →
          </a>
        }
        accentColor={accentColor}
        index={index++}
      />
    )
  }

  // Menu
  if (menu) {
    details.push(
      <DetailItem
        key="menu"
        icon={<Utensils className="w-6 h-6" />}
        label="Menú"
        value={
          <p className="whitespace-pre-line text-sm">
            {menu}
          </p>
        }
        accentColor={accentColor}
        index={index++}
      />
    )
  }

  if (details.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {details}
    </motion.div>
  )
}