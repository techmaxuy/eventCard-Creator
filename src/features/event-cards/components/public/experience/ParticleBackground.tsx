'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { EventTheme } from '@/features/event-cards/config/event-themes'

interface ParticleBackgroundProps {
  theme: EventTheme
  isActive?: boolean
}

export function ParticleBackground({ theme, isActive = true }: ParticleBackgroundProps) {
  const { width, height } = useWindowSize()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isActive || theme.particles === 'none') {
    return null
  }

  // Confetti (cumpleaños, graduación)
  if (theme.particles === 'confetti') {
    return (
      <Confetti
        width={width}
        height={height}
        numberOfPieces={150}
        recycle={true}
        colors={theme.colors}
        gravity={0.3}
        opacity={0.8}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
      />
    )
  }

  // Pétalos (boda, aniversario)
  if (theme.particles === 'petals') {
    return (
      <Confetti
        width={width}
        height={height}
        numberOfPieces={100}
        recycle={true}
        colors={theme.colors}
        gravity={0.15}
        wind={0.01}
        opacity={0.7}
        drawShape={(ctx) => {
          // Forma de pétalo
          ctx.beginPath()
          ctx.arc(0, 0, 8, 0, 2 * Math.PI)
          ctx.fill()
        }}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
      />
    )
  }

  // Burbujas (baby shower)
  if (theme.particles === 'bubbles') {
    return (
      <Confetti
        width={width}
        height={height}
        numberOfPieces={80}
        recycle={true}
        colors={theme.colors}
        gravity={-0.1} // Flotan hacia arriba
        wind={0}
        opacity={0.5}
        drawShape={(ctx) => {
          // Forma de burbuja
          ctx.beginPath()
          ctx.arc(0, 0, 6, 0, 2 * Math.PI)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.lineWidth = 2
          ctx.stroke()
        }}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
      />
    )
  }

  // Estrellas (graduación, año nuevo)
  if (theme.particles === 'stars') {
    return (
      <Confetti
        width={width}
        height={height}
        numberOfPieces={60}
        recycle={true}
        colors={theme.colors}
        gravity={0.2}
        opacity={0.9}
        drawShape={(ctx) => {
          // Forma de estrella
          const spikes = 5
          const outerRadius = 8
          const innerRadius = 4
          
          ctx.beginPath()
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const angle = (i * Math.PI) / spikes
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()
          ctx.fill()
        }}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
      />
    )
  }

  return null
}