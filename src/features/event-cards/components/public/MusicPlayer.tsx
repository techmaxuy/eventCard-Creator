'use client'

import { useState, useEffect, useRef } from 'react'
import { Music, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

interface MusicPlayerProps {
  musicUrl: string
}

export function MusicPlayer({ musicUrl }: MusicPlayerProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Crear el elemento de audio
    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.volume = 0.3 // Volumen más bajo por defecto
    audioRef.current = audio

    // Pequeño delay para mejorar las probabilidades de autoplay
    const timer = setTimeout(() => {
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[MusicPlayer] ✅ Autoplay successful')
          })
          .catch((error) => {
            console.log('[MusicPlayer] ⚠️ Autoplay prevented:', error.message)
          })
      }
    }, 500)

    // Auto-ocultar después de 5 segundos
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    // Cleanup al desmontar
    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
      audio.pause()
      audio.src = ''
    }
  }, [musicUrl])

  const handleToggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = 0.3
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }

    // Mostrar brevemente cuando se interactúa
    setIsVisible(true)
    setTimeout(() => setIsVisible(false), 3000)
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isVisible ? 1 : 0.3,
        scale: 1,
        y: isVisible ? 0 : 10
      }}
      transition={{ duration: 0.3 }}
      onClick={handleToggleMute}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setTimeout(() => setIsVisible(false), 2000)}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-2 border-white/20"
      title={isMuted ? 'Activar sonido' : 'Silenciar música'}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6" />
      ) : (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Volume2 className="w-6 h-6" />
        </motion.div>
      )}

      {/* Indicador de música activa */}
      {!isMuted && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  )
}
