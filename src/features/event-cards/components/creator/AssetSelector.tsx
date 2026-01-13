'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Image as ImageIcon, Music, MessageSquare, X, Play, Pause, Check } from 'lucide-react'
import Image from 'next/image'

interface Asset {
  id: string
  type: 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'
  name: string
  description: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  audioUrl: string | null
  phraseEs: string | null
  phraseEn: string | null
  decorationUrl: string | null
  decorationType: string | null
  decorationPosition: string | null
}

interface AssetSelectorProps {
  type: 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'
  assets: Asset[]
  selectedId?: string
  onSelect: (asset: Asset | null) => void
  locale: string
}

export function AssetSelector({ type, assets, selectedId, onSelect, locale }: AssetSelectorProps) {
  const t = useTranslations('AssetSelector')
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map())
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current)
      }
      // Pausar todos los audios al desmontar
      audioElements.forEach((audio) => {
        audio.pause()
        audio.currentTime = 0
      })
    }
  }, [audioElements])

    const filteredAssets = assets.filter(a => {
    if (a.type !== type) return false
    
    // Verificar que tenga el contenido apropiado según el tipo
    if (type === 'IMAGE') return !!a.imageUrl
    if (type === 'AUDIO') return !!a.audioUrl
    if (type === 'PHRASE') return !!a.phraseEs && !!a.phraseEn
    
    return false
  })

  const handleAudioToggle = (asset: Asset) => {
    if (!asset.audioUrl) return

    console.log('[AssetSelector] 🎵 Audio toggle for asset:', asset.id, 'Current playing:', playingAudioId)

    // Limpiar timeout anterior si existe
    if (audioTimeoutRef.current) {
      console.log('[AssetSelector] ⏱️ Clearing previous timeout')
      clearTimeout(audioTimeoutRef.current)
      audioTimeoutRef.current = null
    }

    const existingAudio = audioElements.get(asset.id)
    console.log('[AssetSelector] Existing audio element:', existingAudio ? 'found' : 'not found')

    if (existingAudio) {
      if (playingAudioId === asset.id) {
        console.log('[AssetSelector] ⏸️ Pausing currently playing audio')
        existingAudio.pause()
        existingAudio.currentTime = 0
        setPlayingAudioId(null)
      } else {
        console.log('[AssetSelector] ▶️ Playing existing audio')
        // Pausar cualquier otro audio
        audioElements.forEach((audio, id) => {
          if (id !== asset.id) {
            audio.pause()
            audio.currentTime = 0
          }
        })
        existingAudio.currentTime = 0
        existingAudio.play()
        setPlayingAudioId(asset.id)

        // Detener automáticamente después de 10 segundos
        console.log('[AssetSelector] ⏱️ Setting 10-second timeout')
        const timeoutId = setTimeout(() => {
          console.log('[AssetSelector] ⏰ 10-second timeout fired! Stopping audio')
          existingAudio.pause()
          existingAudio.currentTime = 0
          setPlayingAudioId(null)
          audioTimeoutRef.current = null
        }, 10000)
        audioTimeoutRef.current = timeoutId
        console.log('[AssetSelector] Timeout ID stored:', timeoutId)
      }
    } else {
      console.log('[AssetSelector] 🆕 Creating new audio element for:', asset.audioUrl)
      // Crear nuevo elemento de audio
      const audio = new Audio(asset.audioUrl)
      audio.addEventListener('ended', () => {
        console.log('[AssetSelector] 🏁 Audio ended naturally')
        setPlayingAudioId(null)
        audio.currentTime = 0
        if (audioTimeoutRef.current) {
          clearTimeout(audioTimeoutRef.current)
          audioTimeoutRef.current = null
        }
      })

      // Pausar otros audios
      audioElements.forEach((a) => {
        a.pause()
        a.currentTime = 0
      })

      console.log('[AssetSelector] ▶️ Playing new audio')
      audio.play()
      setAudioElements(new Map(audioElements).set(asset.id, audio))
      setPlayingAudioId(asset.id)

      // Detener automáticamente después de 10 segundos
      console.log('[AssetSelector] ⏱️ Setting 10-second timeout for new audio')
      const timeoutId = setTimeout(() => {
        console.log('[AssetSelector] ⏰ 10-second timeout fired for new audio! Stopping')
        audio.pause()
        audio.currentTime = 0
        setPlayingAudioId(null)
        audioTimeoutRef.current = null
      }, 10000)
      audioTimeoutRef.current = timeoutId
      console.log('[AssetSelector] Timeout ID stored:', timeoutId)
    }
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5" />
      case 'AUDIO':
        return <Music className="w-5 h-5" />
      case 'PHRASE':
        return <MessageSquare className="w-5 h-5" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'IMAGE':
        return 'text-blue-600 dark:text-blue-400'
      case 'AUDIO':
        return 'text-purple-600 dark:text-purple-400'
      case 'PHRASE':
        return 'text-green-600 dark:text-green-400'
    }
  }

  if (filteredAssets.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3 ${getTypeColor()}`}>
          {getTypeIcon()}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('noAssetsAvailable')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected indicator */}
      {selectedId && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('assetSelected')}
            </span>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('clear')}
          </button>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => onSelect(asset)}
            className={`relative text-left p-4 rounded-lg border-2 transition-all ${
              selectedId === asset.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-zinc-900'
            }`}
          >
            {/* Selected Badge */}
            {selectedId === asset.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Preview */}
            {type === 'IMAGE' && asset.thumbnailUrl && (
              <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3">
                <Image
                  src={asset.thumbnailUrl}
                  alt={asset.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {type === 'AUDIO' && asset.audioUrl && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAudioToggle(asset)
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {playingAudioId === asset.id ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {playingAudioId === asset.id ? t('playing') : t('preview')}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {type === 'PHRASE' && (
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic line-clamp-3">
                  "{locale === 'es' ? asset.phraseEs : asset.phraseEn}"
                </p>
              </div>
            )}

            {/* Info */}
            <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">
              {asset.name}
            </h3>
            {asset.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {asset.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}