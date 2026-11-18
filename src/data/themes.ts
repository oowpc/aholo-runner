export type ThemeId = 'snow' | 'village' | 'toy'

export interface Theme {
  id: ThemeId
  name: string
  tagline: string
  bg: number
  fog: number
  fogNear: number
  fogFar: number
  ground: number
  laneLine: number
  accent: number
  accentCss: string
  obstacle: number[]
  pickup: number
  particle: number
  sun: number
}

export const THEMES: Record<ThemeId, Theme> = {
  snow: {
    id: 'snow',
    name: '雪地小屋',
    tagline: '踩过松软的雪，去追极光',
    bg: 0x0e1a2b,
    fog: 0x16283f,
    fogNear: 18,
    fogFar: 72,
    ground: 0x233a52,
    laneLine: 0x9fd0ff,
    accent: 0x7fe3ff,
    accentCss: '#7fe3ff',
    obstacle: [0xdfeeff, 0x9fc4e8, 0x6d8fb3],
    pickup: 0x9ff6ff,
    particle: 0xd8f1ff,
    sun: 0xbfd4ff,
  },
  village: {
    id: 'village',
    name: '古村探险',
    tagline: '穿过灯笼与石井，拾起旧时光',
    bg: 0x1b120e,
    fog: 0x2b1c13,
    fogNear: 16,
    fogFar: 64,
    ground: 0x3a2a1f,
    laneLine: 0xffc98a,
    accent: 0xffb15c,
    accentCss: '#ffb15c',
    obstacle: [0xffd7a1, 0xc98a52, 0x8a5a33],
    pickup: 0xffd166,
    particle: 0xffc27a,
    sun: 0xffd9b0,
  },
  toy: {
    id: 'toy',
    name: '赛博玩具城',
    tagline: '霓虹亮起，玩具开始造反',
    bg: 0x120b24,
    fog: 0x1d1036,
    fogNear: 18,
    fogFar: 70,
    ground: 0x241546,
    laneLine: 0x8f7bff,
    accent: 0xb388ff,
    accentCss: '#b388ff',
    obstacle: [0xb388ff, 0x5ad1ff, 0xff6ec7],
    pickup: 0x7dffce,
    particle: 0xff8bff,
    sun: 0xd0c4ff,
  },
}

export const THEME_ORDER: ThemeId[] = ['snow', 'village', 'toy']
