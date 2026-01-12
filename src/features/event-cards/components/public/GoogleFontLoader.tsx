'use client'

import { useEffect } from 'react'
import { getGoogleFontUrl } from '@/features/event-cards/config/fonts'

interface GoogleFontLoaderProps {
  fontId?: string | null
}

/**
 * Componente que carga dinámicamente una fuente de Google Fonts
 * Solo carga la fuente si el fontId es válido
 */
export function GoogleFontLoader({ fontId }: GoogleFontLoaderProps) {
  useEffect(() => {
    if (!fontId) return

    const fontUrl = getGoogleFontUrl(fontId)
    if (!fontUrl) return

    // Verificar si ya existe el link
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`)
    if (existingLink) return

    // Crear y agregar el link
    const link = document.createElement('link')
    link.href = fontUrl
    link.rel = 'stylesheet'
    link.type = 'text/css'
    document.head.appendChild(link)

    // Cleanup al desmontar
    return () => {
      const linkToRemove = document.querySelector(`link[href="${fontUrl}"]`)
      if (linkToRemove && linkToRemove.parentNode) {
        linkToRemove.parentNode.removeChild(linkToRemove)
      }
    }
  }, [fontId])

  return null // No renderiza nada
}
