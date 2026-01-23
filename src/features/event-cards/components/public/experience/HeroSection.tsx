'use client'

import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion'
import Image from 'next/image'
import { EventTheme } from '@/features/event-cards/config/event-themes'
import { ChevronDown } from 'lucide-react'
import { useRef } from 'react'

interface HeroSectionProps {
  title: string
  welcomePhrase?: string | null
  eventTypeName: string
  eventTypeIcon: string | null
  coverImage?: string | null
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
  coverImage,
  featuredImage,
  theme,
  primaryColor,
  fontFamily,
}: HeroSectionProps) {


  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })

  // Brightness filter effect - starts bright (1.2), dims to normal (1.0) on scroll
  const brightnessValue = useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 1.1, 1])
  const filterStyle = useMotionTemplate`brightness(${brightnessValue})`

  // Subtle vignette/darkening effect - transparent at start, subtle dark overlay on scroll
  const vignetteOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.1, 0.25])
  
  // Gradientes según tipo de background
  const getBackground = () => {
    if (coverImage) {
      return null // Usar imagen
    }
    
    switch (theme.background) {
      case 'gradient':
        return `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 50%, ${theme.colors[2]} 100%)`
      case 'soft-gradient':
        return `linear-gradient(to bottom, ${theme.colors[0]}20, ${theme.colors[1]}20)`
      case 'blur':
        return `linear-gradient(135deg, ${theme.colors[0]}40, ${theme.colors[1]}40)`
      default:
        return primaryColor
    }
  }

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <div ref={ref} className="relative h-screen w-full overflow-hidden">
      {/* Background - static image with animated brightness filter */}
      {coverImage ? (
        <>
          {/* Static cover image with brightness filter - always visible */}
          <motion.div
            className="absolute inset-0"
            style={{ filter: filterStyle }}
          >
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </motion.div>
          {/* Subtle radial vignette - dark edges that appear on scroll */}
          <motion.div
            style={{ opacity: vignetteOpacity }}
            className="absolute inset-0 pointer-events-none"
          >
            <div
              className="w-full h-full"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
              }}
            />
          </motion.div>
        </>
      ) : (
        <>
          <motion.div
            className="absolute inset-0"
            style={{ filter: filterStyle }}
          >
            <div
              className="w-full h-full"
              style={{ background: getBackground() || primaryColor }}
            />
          </motion.div>
          {/* Subtle radial vignette for gradient backgrounds too */}
          <motion.div
            style={{ opacity: vignetteOpacity }}
            className="absolute inset-0 pointer-events-none"
          >
            <div
              className="w-full h-full"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
              }}
            />
          </motion.div>
        </>
      )}

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
              backgroundColor: coverImage ? 'rgba(255, 255, 255, 0.9)' : `${primaryColor}20`,
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