/**
 * Configuración de fuentes personalizadas para eventos
 * Todas las fuentes son de Google Fonts (gratuitas)
 */

export interface EventFont {
  id: string
  name: string
  displayName: string
  category: 'playful' | 'elegant' | 'modern' | 'handwritten'
  googleFontName: string // Nombre exacto para Google Fonts URL
  previewText: string
  weights?: number[] // Pesos disponibles
  eventTypes?: string[] // Tipos de eventos recomendados
}

export const EVENT_FONTS: EventFont[] = [
  // Fuentes Juguesas (Playful) - Perfectas para cumpleaños
  {
    id: 'pacifico',
    name: 'Pacifico',
    displayName: 'Pacifico',
    category: 'playful',
    googleFontName: 'Pacifico',
    previewText: '¡Feliz Cumpleaños!',
    weights: [400],
    eventTypes: ['birthday', 'cumpleanos', 'baby-shower'],
  },
  {
    id: 'fredoka-one',
    name: 'Fredoka One',
    displayName: 'Fredoka One',
    category: 'playful',
    googleFontName: 'Fredoka+One',
    previewText: '¡Celebremos!',
    weights: [400],
    eventTypes: ['birthday', 'cumpleanos', 'kids-party'],
  },
  {
    id: 'chewy',
    name: 'Chewy',
    displayName: 'Chewy',
    category: 'playful',
    googleFontName: 'Chewy',
    previewText: '¡Fiesta!',
    weights: [400],
    eventTypes: ['birthday', 'cumpleanos'],
  },
  {
    id: 'bubblegum-sans',
    name: 'Bubblegum Sans',
    displayName: 'Bubblegum Sans',
    category: 'playful',
    googleFontName: 'Bubblegum+Sans',
    previewText: 'Party Time!',
    weights: [400],
    eventTypes: ['birthday', 'cumpleanos', 'baby-shower'],
  },
  {
    id: 'lilita-one',
    name: 'Lilita One',
    displayName: 'Lilita One',
    category: 'playful',
    googleFontName: 'Lilita+One',
    previewText: '¡Vamos a Celebrar!',
    weights: [400],
    eventTypes: ['birthday', 'cumpleanos', 'graduation'],
  },
  {
    id: 'titan-one',
    name: 'Titan One',
    displayName: 'Titan One',
    category: 'playful',
    googleFontName: 'Titan+One',
    previewText: 'Super Fiesta',
    weights: [400],
    eventTypes: ['birthday', 'cumpleanos'],
  },

  // Fuentes Manuscritas (Handwritten) - Para eventos más personales
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    displayName: 'Dancing Script',
    category: 'handwritten',
    googleFontName: 'Dancing+Script',
    previewText: 'Celebración Especial',
    weights: [400, 700],
    eventTypes: ['wedding', 'casamiento', 'anniversary'],
  },
  {
    id: 'satisfy',
    name: 'Satisfy',
    displayName: 'Satisfy',
    category: 'handwritten',
    googleFontName: 'Satisfy',
    previewText: 'Con Amor',
    weights: [400],
    eventTypes: ['wedding', 'casamiento', 'anniversary', 'baby-shower'],
  },
  {
    id: 'permanent-marker',
    name: 'Permanent Marker',
    displayName: 'Permanent Marker',
    category: 'handwritten',
    googleFontName: 'Permanent+Marker',
    previewText: '¡Increíble!',
    weights: [400],
    eventTypes: ['birthday', 'cumpleanos', 'graduation'],
  },

  // Fuentes Elegantes (Elegant) - Para bodas y eventos formales
  {
    id: 'great-vibes',
    name: 'Great Vibes',
    displayName: 'Great Vibes',
    category: 'elegant',
    googleFontName: 'Great+Vibes',
    previewText: 'Nuestra Boda',
    weights: [400],
    eventTypes: ['wedding', 'casamiento', 'anniversary'],
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    displayName: 'Playfair Display',
    category: 'elegant',
    googleFontName: 'Playfair+Display',
    previewText: 'Evento Especial',
    weights: [400, 700],
    eventTypes: ['wedding', 'casamiento', 'gala', 'corporate'],
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    displayName: 'Cinzel',
    category: 'elegant',
    googleFontName: 'Cinzel',
    previewText: 'Celebración',
    weights: [400, 700],
    eventTypes: ['wedding', 'casamiento', 'gala'],
  },

  // Fuentes Modernas (Modern) - Para eventos contemporáneos
  {
    id: 'montserrat',
    name: 'Montserrat',
    displayName: 'Montserrat',
    category: 'modern',
    googleFontName: 'Montserrat',
    previewText: 'Evento Moderno',
    weights: [400, 700],
    eventTypes: ['corporate', 'graduation', 'launch'],
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    displayName: 'Bebas Neue',
    category: 'modern',
    googleFontName: 'Bebas+Neue',
    previewText: 'GRAN EVENTO',
    weights: [400],
    eventTypes: ['corporate', 'launch', 'conference'],
  },
]

/**
 * Obtener fuentes filtradas por categoría o tipo de evento
 */
export function getFontsByCategory(category?: EventFont['category']): EventFont[] {
  if (!category) return EVENT_FONTS
  return EVENT_FONTS.filter((font) => font.category === category)
}

/**
 * Obtener fuentes recomendadas para un tipo de evento
 */
export function getFontsForEventType(eventTypeSlug: string): EventFont[] {
  return EVENT_FONTS.filter(
    (font) => !font.eventTypes || font.eventTypes.some((type) => eventTypeSlug.includes(type))
  )
}

/**
 * Obtener una fuente por su ID
 */
export function getFontById(fontId: string): EventFont | undefined {
  return EVENT_FONTS.find((font) => font.id === fontId)
}

/**
 * Generar URL de Google Fonts para una fuente específica
 */
export function getGoogleFontUrl(fontId: string): string {
  const font = getFontById(fontId)
  if (!font) return ''

  const weights = font.weights?.join(';') || '400'
  return `https://fonts.googleapis.com/css2?family=${font.googleFontName}:wght@${weights}&display=swap`
}

/**
 * Generar múltiples URLs de Google Fonts
 */
export function getGoogleFontsUrls(fontIds: string[]): string[] {
  return fontIds.map(getGoogleFontUrl).filter(Boolean)
}
