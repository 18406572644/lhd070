export interface ColorScheme {
  base: string
  modifiers: string
  accents: string
  legends: string
  legendsSecondary: string
}

export interface CaseColors {
  frame: string
  frameDark: string
  frameLight: string
  plate: string
  inner: string
}

export interface CableColors {
  main: string
  accent: string
  connector: string
}

export interface SwitchColors {
  stem: string
  housingTop: string
  housingBottom: string
}

const keycapColorSchemes: Record<string, ColorScheme> = {
  '双月': {
    base: '#F5E6D3',
    modifiers: '#2C3E50',
    accents: '#E74C3C',
    legends: '#1A1A1A',
    legendsSecondary: '#F5E6D3',
  },
  '复古打字机': {
    base: '#3D3D3D',
    modifiers: '#2A2A2A',
    accents: '#C0392B',
    legends: '#D4A853',
    legendsSecondary: '#D4A853',
  },
  '赛博浅青': {
    base: '#1A1D23',
    modifiers: '#22262E',
    accents: '#7DFDFE',
    legends: '#F0F2F5',
    legendsSecondary: '#7DFDFE',
  },
  '默认': {
    base: '#2A2F38',
    modifiers: '#1A1D23',
    accents: '#7DFDFE',
    legends: '#F0F2F5',
    legendsSecondary: '#7DFDFE',
  },
}

const caseColorSchemes: Record<string, CaseColors> = {
  '深空灰': {
    frame: '#3A3F47',
    frameDark: '#2A2F38',
    frameLight: '#4A4F57',
    plate: '#2A2F38',
    inner: '#1A1D23',
  },
  '透明': {
    frame: 'rgba(180, 200, 220, 0.35)',
    frameDark: 'rgba(140, 160, 180, 0.25)',
    frameLight: 'rgba(200, 220, 240, 0.45)',
    plate: 'rgba(180, 200, 220, 0.2)',
    inner: 'rgba(30, 40, 60, 0.3)',
  },
  '雾透': {
    frame: 'rgba(120, 160, 180, 0.45)',
    frameDark: 'rgba(80, 120, 140, 0.35)',
    frameLight: 'rgba(160, 200, 220, 0.55)',
    plate: 'rgba(120, 160, 180, 0.3)',
    inner: 'rgba(40, 60, 80, 0.4)',
  },
  '默认': {
    frame: '#2A2F38',
    frameDark: '#1A1D23',
    frameLight: '#3A3F47',
    plate: '#22262E',
    inner: '#1A1D23',
  },
}

const cableColorSchemes: Record<string, CableColors> = {
  '浅青': {
    main: '#7DFDFE',
    accent: '#5BC4C5',
    connector: '#3A3F47',
  },
  '银灰': {
    main: '#C0C5CC',
    accent: '#8892A0',
    connector: '#3A3F47',
  },
  '默认': {
    main: '#7DFDFE',
    accent: '#5BC4C5',
    connector: '#3A3F47',
  },
}

const switchColorSchemes: Record<string, SwitchColors> = {
  '红色': {
    stem: '#E74C3C',
    housingTop: '#3A3F47',
    housingBottom: '#2A2F38',
  },
  '黄色': {
    stem: '#F1C40F',
    housingTop: '#3A3F47',
    housingBottom: '#2A2F38',
  },
  '金色': {
    stem: '#D4A853',
    housingTop: '#3A3F47',
    housingBottom: '#2A2F38',
  },
  '默认': {
    stem: '#7DFDFE',
    housingTop: '#3A3F47',
    housingBottom: '#2A2F38',
  },
}

export function detectKeycapTheme(name: string, params?: Record<string, string>): string {
  if (params?.['主题']) {
    if (keycapColorSchemes[params['主题']]) return params['主题']
  }
  for (const key of Object.keys(keycapColorSchemes)) {
    if (name.includes(key)) return key
  }
  return '默认'
}

export function detectCaseColor(name: string, params?: Record<string, string>): string {
  if (params?.['颜色']) {
    if (caseColorSchemes[params['颜色']]) return params['颜色']
  }
  for (const key of Object.keys(caseColorSchemes)) {
    if (name.includes(key)) return key
  }
  return '默认'
}

export function detectCableColor(name: string, params?: Record<string, string>): string {
  if (params?.['颜色']) {
    if (cableColorSchemes[params['颜色']]) return params['颜色']
  }
  for (const key of Object.keys(cableColorSchemes)) {
    if (name.includes(key)) return key
  }
  return '默认'
}

export function detectStemColor(name: string, params?: Record<string, string>): string {
  if (params?.['轴心颜色']) {
    if (switchColorSchemes[params['轴心颜色']]) return params['轴心颜色']
  }
  if (name.includes('红')) return '红色'
  if (name.includes('黄')) return '黄色'
  if (name.includes('金')) return '金色'
  return '默认'
}

export function getKeycapColors(name: string, params?: Record<string, string>): ColorScheme {
  return keycapColorSchemes[detectKeycapTheme(name, params)]
}

export function getCaseColors(name: string, params?: Record<string, string>): CaseColors {
  return caseColorSchemes[detectCaseColor(name, params)]
}

export function getCableColors(name: string, params?: Record<string, string>): CableColors {
  return cableColorSchemes[detectCableColor(name, params)]
}

export function getSwitchColors(name: string, params?: Record<string, string>): SwitchColors {
  return switchColorSchemes[detectStemColor(name, params)]
}

export function isModifierKey(label: string): boolean {
  const modifiers = ['Ctrl', 'Win', 'Alt', 'Shift', 'Caps', 'Tab', 'Backspace', 'Enter', 'Space', 'Fn', 'RCtrl', 'RAlt', 'RShift', 'Esc', 'Del', 'PgUp', 'PgDn', 'Home', 'End']
  return modifiers.includes(label)
}

export function isAccentKey(label: string): boolean {
  const accents = ['Esc', 'Enter']
  return accents.includes(label)
}
