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
    console.log('[MusicPlayer] 🎵 Initializing with URL:', musicUrl)

    // Crear el elemento de audio
    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.volume = 0.5 // Aumentar volumen por defecto
    audioRef.current = audio

    console.log('[MusicPlayer] Audio element created, volume:', audio.volume)

    // Intentar play inmediato primero
    const immediatePlay = audio.play()

    if (immediatePlay !== undefined) {
      immediatePlay
        .then(() => {
          console.log('[MusicPlayer] ✅ Immediate autoplay successful')
        })
        .catch((error) => {
          console.log('[MusicPlayer] ⚠️ Immediate autoplay prevented:', error.message)

          // Si falla, intentar con delay
          const timer = setTimeout(() => {
            console.log('[MusicPlayer] 🔄 Retrying autoplay after delay...')
            const playPromise = audio.play()

            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('[MusicPlayer] ✅ Delayed autoplay successful')
                })
                .catch((error) => {
                  console.log('[MusicPlayer] ❌ Delayed autoplay also prevented:', error.message)
                })
            }
          }, 500)

          return () => clearTimeout(timer)
        })
    }

    // Event listeners para debugging
    audio.addEventListener('loadstart', () => {
      console.log('[MusicPlayer] 📥 Loading audio...')
    })

    audio.addEventListener('canplay', () => {
      console.log('[MusicPlayer] ✅ Audio can play, ready state:', audio.readyState)
    })

    audio.addEventListener('playing', () => {
      console.log('[MusicPlayer] ▶️ Audio is actually playing!')
    })

    audio.addEventListener('error', (e) => {
      console.error('[MusicPlayer] ❌ Audio error:', e)
      console.error('[MusicPlayer] Error code:', audio.error?.code, 'Message:', audio.error?.message)
    })

    // Auto-ocultar después de 5 segundos
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    // Cleanup al desmontar
    return () => {
      clearTimeout(hideTimer)
      audio.pause()
      audio.src = ''
    }
  }, [musicUrl])

  const handleToggleMute = () => {
    if (!audioRef.current) {
      console.log('[MusicPlayer] ⚠️ Audio ref is null, cannot toggle mute')
      return
    }

    console.log('[MusicPlayer] 🔊 Toggle mute clicked, current muted:', isMuted)

    if (isMuted) {
      audioRef.current.volume = 0.5
      setIsMuted(false)
      console.log('[MusicPlayer] Volume set to 0.5 (unmuted)')

      // Intentar reproducir si está pausado
      if (audioRef.current.paused) {
        console.log('[MusicPlayer] Audio was paused, attempting to play...')
        audioRef.current.play().catch(error => {
          console.error('[MusicPlayer] ❌ Play failed on unmute:', error.message)
        })
      }
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
      console.log('[MusicPlayer] Volume set to 0 (muted)')
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
