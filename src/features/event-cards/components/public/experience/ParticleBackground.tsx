'use client'

import { useEffect, useState, useCallback } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { EventTheme } from '@/features/event-cards/config/event-themes'

interface ParticleBackgroundProps {
  theme: EventTheme
  isActive?: boolean
  particleOverride?: string | null // Per-event particle effect override
}

// Custom shape: petal (leaf-like ellipse)
function drawPetal(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(0, -6)
  ctx.bezierCurveTo(4, -4, 5, 2, 0, 8)
  ctx.bezierCurveTo(-5, 2, -4, -4, 0, -6)
  ctx.closePath()
  ctx.fill()
}

// Custom shape: circle (bubble)
function drawBubble(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.arc(0, 0, 5, 0, Math.PI * 2)
  ctx.fill()
  // Add a highlight to make it look like a bubble
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.arc(-1.5, -1.5, 1.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fill()
}

// Custom shape: 5-point star
function drawStar(ctx: CanvasRenderingContext2D) {
  const spikes = 5
  const outerRadius = 6
  const innerRadius = 3
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    if (i === 0) {
      ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    } else {
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
  }
  ctx.closePath()
  ctx.fill()
}

export function ParticleBackground({ theme, isActive = true, particleOverride }: ParticleBackgroundProps) {
  const { width, height } = useWindowSize()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoize draw functions to avoid re-renders
  const drawPetalShape = useCallback((ctx: CanvasRenderingContext2D) => drawPetal(ctx), [])
  const drawBubbleShape = useCallback((ctx: CanvasRenderingContext2D) => drawBubble(ctx), [])
  const drawStarShape = useCallback((ctx: CanvasRenderingContext2D) => drawStar(ctx), [])

  if (!mounted || !isActive) return null

  // Use per-event override if set, otherwise use theme default
  const activeParticle = particleOverride || theme.particles

  if (activeParticle === 'none') return null

  const containerStyle = { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' as const, zIndex: 1 }

  // Confetti - default rectangular shapes, fast and festive
  if (activeParticle === 'confetti') {
    return (
      <div style={containerStyle}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={120}
          recycle={true}
          colors={theme.colors}
          gravity={0.25}
          wind={0.005}
          opacity={0.85}
        />
      </div>
    )
  }

  // Petals - custom petal shapes, slow and elegant
  if (activeParticle === 'petals') {
    return (
      <div style={containerStyle}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={50}
          recycle={true}
          colors={theme.colors}
          gravity={0.04}
          wind={0.02}
          opacity={0.75}
          drawShape={drawPetalShape}
        />
      </div>
    )
  }

  // Bubbles - custom circles, float up from bottom
  if (activeParticle === 'bubbles') {
    return (
      <div style={containerStyle}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={40}
          recycle={true}
          colors={theme.colors}
          gravity={-0.03}
          wind={0}
          opacity={0.5}
          drawShape={drawBubbleShape}
          confettiSource={{ x: 0, y: height, w: width, h: 0 }}
          initialVelocityY={-4}
          initialVelocityX={2}
        />
      </div>
    )
  }

  // Stars - custom star shapes, medium speed
  if (activeParticle === 'stars') {
    return (
      <div style={containerStyle}>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={40}
          recycle={true}
          colors={theme.colors}
          gravity={0.08}
          wind={0.003}
          opacity={0.9}
          drawShape={drawStarShape}
        />
      </div>
    )
  }

  return null
}
