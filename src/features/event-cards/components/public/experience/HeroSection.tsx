'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
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
  theme,
  primaryColor,
  fontFamily,
}: HeroSectionProps) {


  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })

  // Parallax effect - la imagen se mueve más lento que el scroll
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1],)
  
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
      {/* Background con Parallax */}
      {coverImage ? (
        <>
          <motion.div 
            style={{ y }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm w-full h-[120%]"
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
          <motion.div 
            style={{ opacity }}
            className="absolute inset-0 " 
          />
        </>
      ) : (
        <motion.div 
          style={{ opacity }}
          className="absolute inset-0"
        >
          <div 
            className="w-full h-full"
            style={{ background: getBackground() || primaryColor }}
          />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-10">
        
        {/* Icon Animado */}
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
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
            style={{ 
              backgroundColor: coverImage ? 'rgba(255, 255, 255, 0.9)' : `${primaryColor}20`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <span className="text-6xl">{eventTypeIcon}</span>
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