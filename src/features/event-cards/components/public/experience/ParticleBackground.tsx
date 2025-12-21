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
    console.log('[ParticleBackground] Mounted:', {
      theme: theme.particles,
      colors: theme.colors,
      isActive,
      width,
      height
    })
  }, [theme, isActive, width, height])

  // No renderizar hasta que esté montado (evita hidratación)
  if (!mounted) {
    console.log('[ParticleBackground] Not mounted yet')
    return null
  }

  if (!isActive) {
    console.log('[ParticleBackground] Not active')
    return null
  }

  if (theme.particles === 'none') {
    console.log('[ParticleBackground] Particles set to none')
    return null
  }

  console.log('[ParticleBackground] Rendering particles:', theme.particles)

  // Confetti (cumpleaños, graduación)
  if (theme.particles === 'confetti') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={150}
          recycle={true}
          colors={theme.colors}
          gravity={0.3}
          opacity={0.8}
        />
      </div>
    )
  }

  // Pétalos (boda, aniversario)
  if (theme.particles === 'petals') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={100}
          recycle={true}
          colors={theme.colors}
          gravity={0.15}
          wind={0.01}
          opacity={0.7}
        />
      </div>
    )
  }

  // Burbujas (baby shower)
  if (theme.particles === 'bubbles') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={80}
          recycle={true}
          colors={theme.colors}
          gravity={-0.05} // Flotan hacia arriba
          wind={0}
          opacity={0.5}
        />
      </div>
    )
  }

  // Estrellas (graduación)
  if (theme.particles === 'stars') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={60}
          recycle={true}
          colors={theme.colors}
          gravity={0.2}
          opacity={0.9}
        />
      </div>
    )
  }

  return null
}