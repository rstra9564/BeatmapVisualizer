export interface Theme {
  id: string
  name: string
  bg: [string, string, string]
  particleHue: [number, number]
  waveform: [string, string]
  accent: string
  grid?: boolean
}

export const THEMES: Theme[] = [
  {
    id: 'neon',
    name: 'Neon Pulse',
    bg: ['#050510', '#0a0520', '#120830'],
    particleHue: [280, 200],
    waveform: ['#00f5ff', '#ff00aa'],
    accent: '#00f5ff',
  },
  {
    id: 'sunset',
    name: 'Sunset Drive',
    bg: ['#1a0a12', '#3d1020', '#6b1a10'],
    particleHue: [15, 45],
    waveform: ['#ff6b35', '#ffd166'],
    accent: '#ff6b35',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    bg: ['#021612', '#04332a', '#0a2840'],
    particleHue: [140, 190],
    waveform: ['#2dd4bf', '#60a5fa'],
    accent: '#2dd4bf',
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    bg: ['#0d0221', '#1a0533', '#2d1b69'],
    particleHue: [300, 260],
    waveform: ['#f472b6', '#a78bfa'],
    accent: '#f472b6',
    grid: true,
  },
]

export const DEFAULT_THEME = THEMES[0]!
