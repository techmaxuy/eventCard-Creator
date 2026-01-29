/**
 * Calculate the relative luminance of a hex color
 * Based on WCAG 2.0 formula
 */
function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)
  if (!rgb) return 0

  const [r, g, b] = rgb.map(c => {
    const sRGB = parseInt(c, 16) / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Get a contrasting text color (black or white) based on background color
 * Returns black for light backgrounds, white for dark backgrounds
 */
export function getContrastColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#000000'

  const luminance = getLuminance(hexColor)
  // Using 0.5 as threshold - higher values make the switch happen earlier (more white text)
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Get a contrasting text color for use on transparent/glass backgrounds
 * that use the primary color as an accent
 * Returns a dark gray for light colors, light gray for dark colors
 */
export function getModalTextColor(primaryColor: string): string {
  if (!primaryColor || !primaryColor.startsWith('#')) return '#374151' // default gray-700

  const luminance = getLuminance(primaryColor)
  // For modal text, we want readable text that complements the primary color
  // If primary is light, use dark text; if primary is dark, use slightly lighter text
  return luminance > 0.5 ? '#1f2937' : '#374151' // gray-800 or gray-700
}

export interface EventTheme {
  particles: 'confetti' | 'petals' | 'bubbles' | 'stars' | 'none'
  colors: string[]
  animation: 'bounce' | 'elegant' | 'float' | 'fade'
  background: 'gradient' | 'blur' | 'soft-gradient' | 'solid'
  accentColor: string
}

export const eventThemes: Record<string, EventTheme> = {
  // Cumpleaños
  cumpleanos: {
    particles: 'confetti',
    colors: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'],
    animation: 'bounce',
    background: 'gradient',
    accentColor: '#FF6B6B',
  },
  'cumpleaños': {  // Con ñ
    particles: 'confetti',
    colors: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'],
    animation: 'bounce',
    background: 'gradient',
    accentColor: '#FF6B6B',
  },
  'birthday': {  // En inglés
    particles: 'confetti',
    colors: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'],
    animation: 'bounce',
    background: 'gradient',
    accentColor: '#FF6B6B',
  },
  
  // Boda
  boda: {
    particles: 'petals',
    colors: ['#FFD700', '#FFFFFF', '#F0E68C', '#FFF8DC'],
    animation: 'elegant',
    background: 'blur',
    accentColor: '#FFD700',
  },
  
  casamiento: {
    particles: 'petals',
    colors: ['#FFD700', '#FFFFFF', '#F0E68C', '#FFF8DC'],
    animation: 'elegant',
    background: 'blur',
    accentColor: '#FFD700',
  },
  'wedding': {
    particles: 'petals',
    colors: ['#FFD700', '#FFFFFF', '#F0E68C', '#FFF8DC'],
    animation: 'elegant',
    background: 'blur',
    accentColor: '#FFD700',
  },
  
  // Baby Shower
  'baby-shower': {
    particles: 'bubbles',
    colors: ['#FFB6C1', '#87CEEB', '#FFFFFF', '#E6E6FA'],
    animation: 'float',
    background: 'soft-gradient',
    accentColor: '#FFB6C1',
  },
  'babyshower': {
    particles: 'bubbles',
    colors: ['#FFB6C1', '#87CEEB', '#FFFFFF', '#E6E6FA'],
    animation: 'float',
    background: 'soft-gradient',
    accentColor: '#FFB6C1',
  },
  
  // Graduación
  graduacion: {
    particles: 'stars',
    colors: ['#1E3A8A', '#FFD700', '#FFFFFF', '#3B82F6'],
    animation: 'fade',
    background: 'gradient',
    accentColor: '#1E3A8A',
  },
  'graduación': {
    particles: 'stars',
    colors: ['#1E3A8A', '#FFD700', '#FFFFFF', '#3B82F6'],
    animation: 'fade',
    background: 'gradient',
    accentColor: '#1E3A8A',
  },
  'graduation': {
    particles: 'stars',
    colors: ['#1E3A8A', '#FFD700', '#FFFFFF', '#3B82F6'],
    animation: 'fade',
    background: 'gradient',
    accentColor: '#1E3A8A',
  },
  
  // Aniversario
  aniversario: {
    particles: 'petals',
    colors: ['#DC143C', '#FFD700', '#FFFFFF', '#FF69B4'],
    animation: 'elegant',
    background: 'soft-gradient',
    accentColor: '#DC143C',
  },
  'anniversary': {
    particles: 'petals',
    colors: ['#DC143C', '#FFD700', '#FFFFFF', '#FF69B4'],
    animation: 'elegant',
    background: 'soft-gradient',
    accentColor: '#DC143C',
  },
  
  // Default
  default: {
    particles: 'none',
    colors: ['#3B82F6', '#8B5CF6', '#EC4899'],
    animation: 'fade',
    background: 'gradient',
    accentColor: '#3B82F6',
  },
}

export function getEventTheme(eventTypeSlug: string, primaryColor?: string): EventTheme {
  
  const normalizedSlug = eventTypeSlug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
  
  console.log('[getEventTheme] Looking for:', {
    original: eventTypeSlug,
    normalized: normalizedSlug,
    available: Object.keys(eventThemes)
  })
  
  // Buscar por slug normalizado primero
  const themeByNormalized = eventThemes[normalizedSlug]
  if (themeByNormalized) {
    console.log('[getEventTheme] Found by normalized slug')
    return primaryColor ? { ...themeByNormalized, accentColor: primaryColor } : themeByNormalized
  }
  
  // Buscar por slug original
  const themeByOriginal = eventThemes[eventTypeSlug.toLowerCase()]
  if (themeByOriginal) {
    console.log('[getEventTheme] Found by original slug')
    return primaryColor ? { ...themeByOriginal, accentColor: primaryColor } : themeByOriginal
  }
  
  // Default
  console.log('[getEventTheme] Using default theme')
  const defaultTheme = eventThemes.default
  return primaryColor ? { ...defaultTheme, accentColor: primaryColor } : defaultTheme
}