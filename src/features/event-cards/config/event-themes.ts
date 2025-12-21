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
  
  // Baby Shower
  'baby-shower': {
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
  
  // Aniversario
  aniversario: {
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
  const theme = eventThemes[eventTypeSlug.toLowerCase()] || eventThemes.default
  
  // Si el evento tiene un color personalizado, usarlo como accent
  if (primaryColor) {
    return {
      ...theme,
      accentColor: primaryColor,
    }
  }
  
  return theme
}