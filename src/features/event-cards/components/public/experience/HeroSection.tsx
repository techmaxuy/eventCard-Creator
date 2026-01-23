'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { EventTheme } from '@/features/event-cards/config/event-themes'
import { ChevronDown } from 'lucide-react'

interface HeroSectionProps {
  title: string
  welcomePhrase?: string | null
  eventTypeName: string
  eventTypeIcon: string | null
  featuredImage?: string | null
  theme: EventTheme
  primaryColor: string
  fontFamily?: string | null
}

export function HeroSection({
  title,
  welcomePhrase,
  eventTypeName,
  eventTypeIcon,
  featuredImage,
  theme,
  primaryColor,
  fontFamily,
}: HeroSectionProps) {

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Transparent background - the actual background is rendered in EventPublicPage */}

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-10">
        
        {/* Icon Animado o Featured Image */}
        <motion.div
          initial={{ scale: 0, rotate: -360 }}
          animate={{ scale: 1.5, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
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

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.3 }}
          className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl"
          style={{
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: fontFamily || undefined
          }}
        >
          {title}
        </motion.h1>

        {/* Welcome Phrase */}
        {welcomePhrase && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 0.5 }}
            className="text-2xl md:text-4xl italic font-semibold mb-4 text-white/95 max-w-3xl drop-shadow-lg"
            style={{
              fontFamily: fontFamily || undefined
            }}
          >
            "{welcomePhrase}"
          </motion.p>
        )}

        {/* Event Type */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.7 }}
          className="text-xl md:text-2xl text-white/90 font-medium"
        >
          {eventTypeName}
        </motion.p>

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
    </div>)
}