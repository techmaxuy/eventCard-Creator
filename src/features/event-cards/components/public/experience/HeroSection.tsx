'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { EventTheme } from '@/features/event-cards/config/event-themes'
import { ChevronDown } from 'lucide-react'

interface HeroSectionProps {
  title: string // Legacy field for backward compatibility
  titleNames?: string | null // Names of protagonists (e.g., "María y Juan")
  welcomePhrase?: string | null
  eventTypeName: string
  eventTypeIcon: string | null
  featuredImage?: string | null
  showFeaturedImage?: boolean
  theme: EventTheme
  primaryColor: string
  // Multiple fonts for different sections
  fontFamily?: string | null // Legacy, used as fallback
  fontEventType?: string | null
  fontTitle?: string | null // Font for protagonist names
  fontMessage?: string | null
  // Per-group text colors
  colorEventType?: string | null
  colorTitle?: string | null
  colorMessage?: string | null
}

export function HeroSection({
  title,
  titleNames,
  welcomePhrase,
  eventTypeName,
  eventTypeIcon,
  featuredImage,
  showFeaturedImage = true,
  theme,
  primaryColor,
  fontFamily,
  fontEventType,
  fontTitle,
  fontMessage,
  colorEventType,
  colorTitle,
  colorMessage,
}: HeroSectionProps) {

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  // Parse names - split by common separators like "y", "and", "&", ","
  const parseNames = (names: string): string[] => {
    // Split by common separators
    const separators = /\s+y\s+|\s+and\s+|\s*&\s*|\s*,\s*/i
    return names.split(separators).map(name => name.trim()).filter(Boolean)
  }

  // Get the names to display (prefer titleNames, fallback to title)
  const displayNames = titleNames ? parseNames(titleNames) : null

  // If no separated names, use legacy title
  const useLegacyTitle = !displayNames

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Transparent background - the actual background is rendered in EventPublicPage */}

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-10">

        {/* 1. Event Type - First, larger */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.1 }}
          className="text-3xl md:text-5xl text-white font-bold mb-6 drop-shadow-lg uppercase tracking-wider"
          style={{
            fontFamily: fontEventType || fontFamily || undefined,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            color: colorEventType || undefined,
          }}
        >
          {eventTypeName}
        </motion.p>

        {/* 2. Featured Image / Icon - Only if showFeaturedImage is true */}
        {showFeaturedImage && (
          <motion.div
            initial={{ scale: 0, rotate: -360 }}
            animate={{ scale: 1.5, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="mb-6"
          >
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white/30"
              style={{
                backgroundColor: featuredImage ? 'rgba(255, 255, 255, 0.9)' : `${primaryColor}20`,
                backdropFilter: 'blur(10px)',
              }}
            >
              {featuredImage ? (
                <Image
                  src={featuredImage}
                  alt={title}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-6xl">{eventTypeIcon}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. Title - Names on separate lines (larger) + Message */}
        {useLegacyTitle ? (
          // Legacy: single title field
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl"
            style={{
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              fontFamily: fontTitle || fontFamily || undefined,
              color: colorTitle || undefined,
            }}
          >
            {title}
          </motion.h1>
        ) : (
          // New: separate names and message
          <div className="mb-6">
            {/* Names - each on its own line, larger */}
            {displayNames && displayNames.map((name, index) => (
              <motion.h1
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.6, delay: 0.3 + index * 0.15 }}
                className="text-5xl md:text-8xl font-bold text-white drop-shadow-2xl leading-tight"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  fontFamily: fontTitle || fontFamily || undefined,
                  color: colorTitle || undefined,
                }}
              >
                {name}
              </motion.h1>
            ))}

          </div>
        )}

        {/* 4. Welcome Phrase */}
        {welcomePhrase && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 0.6 }}
            className="text-xl md:text-3xl italic font-semibold mb-4 text-white/95 max-w-3xl drop-shadow-lg"
            style={{
              fontFamily: fontMessage || fontFamily || undefined,
              color: colorMessage || undefined,
            }}
          >
            "{welcomePhrase}"
          </motion.p>
        )}

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1,
            repeat: Infinity,
            repeatType: 'reverse',
            repeatDelay: 0.5,
          }}
          className="absolute bottom-10 cursor-pointer"
          onClick={scrollToContent}
        >
          <div className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors">
            <span className="text-sm font-medium">Desliza para ver más</span>
            <ChevronDown className="w-8 h-8 animate-bounce" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
