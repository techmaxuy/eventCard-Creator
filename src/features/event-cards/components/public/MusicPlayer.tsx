'use client'

import { useState, useEffect, useRef } from 'react'
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MusicPlayerProps {
  musicUrl: string
  eventTitle: string
}

export function MusicPlayer({ musicUrl, eventTitle }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Crear el elemento de audio
    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.volume = 0.5
    audioRef.current = audio

    // Intentar reproducir automáticamente al cargar
    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[MusicPlayer] ✅ Autoplay successful')
          setIsPlaying(true)
        })
        .catch((error) => {
          console.log('[MusicPlayer] ⚠️ Autoplay prevented by browser:', error.message)
          setIsPlaying(false)
          // Mostrar un mensaje sutil al usuario
        })
    }

    // Cleanup al desmontar
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [musicUrl])

  const handleTogglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((error) => {
        console.error('[MusicPlayer] Error playing audio:', error)
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }

  const handleToggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = 0.5
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 dark:border-zinc-800/50 p-4 flex items-center gap-3 mb-2"
          >
            <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Música de fondo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                {eventTitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <button
                onClick={handleToggleMute}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                title="Minimizar"
              >
                <span className="text-gray-600 dark:text-gray-400 text-lg leading-none">−</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón minimizado */}
      {isMinimized && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg transition-colors"
          title="Mostrar reproductor"
        >
          <Music className="w-5 h-5" />
        </motion.button>
      )}
    </motion.div>
  )
}
