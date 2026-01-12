'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface DecorationItem {
  assetId: string
  position: string
}

interface Asset {
  id: string
  decorationUrl: string | null
  decorationType: string | null
  name: string
}

interface DecorativeElementsProps {
  decorations: DecorationItem[]
  assets: Asset[]
}

export function DecorativeElements({ decorations, assets }: DecorativeElementsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || decorations.length === 0) {
    return null
  }

  const getPositionStyles = (position: string) => {
    switch (position) {
      case 'top-left':
        return {
          top: '5%',
          left: '5%',
          transform: 'translate(0, 0)',
        }
      case 'top-right':
        return {
          top: '5%',
          right: '5%',
          transform: 'translate(0, 0)',
        }
      case 'bottom-left':
        return {
          bottom: '5%',
          left: '5%',
          transform: 'translate(0, 0)',
        }
      case 'bottom-right':
        return {
          bottom: '5%',
          right: '5%',
          transform: 'translate(0, 0)',
        }
      case 'floating':
      default:
        // Posiciones aleatorias para efecto flotante
        return {
          top: `${Math.random() * 80 + 10}%`,
          left: `${Math.random() * 80 + 10}%`,
          transform: 'translate(-50%, -50%)',
        }
    }
  }

  const getAnimationVariant = (type: string | null, index: number) => {
    // Base delay para escalonar las animaciones
    const delay = index * 0.1

    switch (type) {
      case 'balloon':
        return {
          initial: { y: 100, opacity: 0, scale: 0.8 },
          animate: {
            y: [0, -10, 0],
            opacity: 1,
            scale: 1,
          },
          transition: {
            delay,
            duration: 3,
            repeat: Infinity,
            repeatType: 'loop' as const,
          },
        }
      case 'confetti':
      case 'stars':
        return {
          initial: { y: -100, opacity: 0, rotate: 0 },
          animate: {
            y: 0,
            opacity: 1,
            rotate: 360,
          },
          transition: {
            delay,
            duration: 3,
            repeat: Infinity,
            repeatType: 'loop' as const,
          },
        }
      case 'floating':
        return {
          initial: { y: 0, opacity: 0, scale: 0.8 },
          animate: {
            y: [0, -20, 0],
            opacity: 1,
            scale: [1, 1.05, 1],
          },
          transition: {
            delay,
            duration: 4,
            repeat: Infinity,
            repeatType: 'loop' as const,
          },
        }
      default:
        return {
          initial: { opacity: 0, scale: 0.5 },
          animate: {
            opacity: 1,
            scale: 1,
          },
          transition: {
            delay,
            duration: 0.5,
          },
        }
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {decorations.map((decoration, index) => {
        const asset = assets.find(a => a.id === decoration.assetId)

        if (!asset || !asset.decorationUrl) return null

        const positionStyles = getPositionStyles(decoration.position)
        const animation = getAnimationVariant(asset.decorationType, index)

        return (
          <motion.div
            key={`${decoration.assetId}-${index}`}
            className="absolute"
            style={{
              ...positionStyles,
              width: '150px',
              height: '150px',
              zIndex: 20,
            }}
            initial={animation.initial}
            animate={animation.animate}
            transition={animation.transition}
          >
            <div className="relative w-full h-full">
              <Image
                src={asset.decorationUrl}
                alt={asset.name}
                fill
                className="object-contain drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
