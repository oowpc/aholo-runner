import type { ThemeId } from './themes'

export type GenerationMethod = 'image' | 'text'

export interface AssetSpec {
  id: string
  name: string
  method: GenerationMethod
  prompt: string
  usage: string
  obstacles?: number
  tris?: number
  thumb?: string
  generated?: boolean
}

export const MODEL_FILES: {
  player: string
  themes: Record<ThemeId, { obstacles: [string, string, string]; pickup: string }>
} = {
  player: 'models/player_plush.glb',
  themes: {
    snow: {
      obstacles: [
        'models/snow_obstacle_pine.glb',
        'models/snow_obstacle_pile.glb',
        'models/snow_obstacle_fence.glb',
      ],
      pickup: 'models/snow_pickup_ice.glb',
    },
    village: {
      obstacles: [
        'models/village_obstacle_lantern.glb',
        'models/village_obstacle_well.glb',
        'models/village_obstacle_basket.glb',
      ],
      pickup: 'models/village_pickup_coin.glb',
    },
    toy: {
      obstacles: [
        'models/toy_obstacle_blocks.glb',
        'models/toy_obstacle_duck.glb',
        'models/toy_obstacle_rocket.glb',
      ],
      pickup: 'models/toy_pickup_gear.glb',
    },
  },
}

export const ASSETS: AssetSpec[] = [
  {
    id: 'player_plush',
    name: '绒绒跑者',
    method: 'image',
    prompt: '上传随身玩偶照片：单一主体、浅色纯背景、光线均匀，生成后取 3 个候选',
    usage: '玩家角色 · 全主题通用',
    tris: 18400,
    generated: false,
  },
  {
    id: 'snow_obstacle_pine',
    name: '覆雪松树',
    method: 'text',
    prompt: '低多边形游戏道具，覆雪松树，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '雪地小屋 · 跳跃障碍 A',
    tris: 6200,
    generated: false,
  },
  {
    id: 'snow_obstacle_pile',
    name: '雪堆',
    method: 'text',
    prompt: '低多边形游戏道具，鼓起的雪堆，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '雪地小屋 · 跳跃障碍 B',
    tris: 3400,
    generated: false,
  },
  {
    id: 'snow_obstacle_fence',
    name: '木栅栏',
    method: 'text',
    prompt: '低多边形游戏道具，覆雪的旧木栅栏，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '雪地小屋 · 跳跃障碍 C',
    tris: 5100,
    generated: false,
  },
  {
    id: 'snow_pickup_ice',
    name: '冰晶碎片',
    method: 'text',
    prompt: '低多边形游戏收集物，发光的冰晶，青蓝色，卡通风格，单一物体居中，纯色背景',
    usage: '雪地小屋 · 金币',
    tris: 1200,
    generated: false,
  },
  {
    id: 'village_obstacle_lantern',
    name: '古村石灯笼',
    method: 'text',
    prompt: '低多边形游戏道具，古村石灯笼，暖黄色火光，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '古村探险 · 跳跃障碍 A',
    tris: 7200,
    generated: false,
  },
  {
    id: 'village_obstacle_well',
    name: '青石古井',
    method: 'text',
    prompt: '低多边形游戏道具，青石古井，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '古村探险 · 跳跃障碍 B',
    tris: 6800,
    generated: false,
  },
  {
    id: 'village_obstacle_basket',
    name: '竹编背篓',
    method: 'text',
    prompt: '低多边形游戏道具，竹编背篓，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '古村探险 · 跳跃障碍 C',
    tris: 4300,
    generated: false,
  },
  {
    id: 'village_pickup_coin',
    name: '旧铜钱',
    method: 'text',
    prompt: '低多边形游戏收集物，发光的旧铜钱，金色，卡通风格，单一物体居中，纯色背景',
    usage: '古村探险 · 金币',
    tris: 900,
    generated: false,
  },
  {
    id: 'toy_obstacle_blocks',
    name: '积木塔',
    method: 'text',
    prompt: '低多边形游戏道具，歪斜的玩具积木塔，霓虹配色，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '赛博玩具城 · 跳跃障碍 A',
    tris: 3600,
    generated: false,
  },
  {
    id: 'toy_obstacle_duck',
    name: '发条鸭',
    method: 'text',
    prompt: '低多边形游戏道具，巨大的发条玩具鸭，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '赛博玩具城 · 跳跃障碍 B',
    tris: 7900,
    generated: false,
  },
  {
    id: 'toy_obstacle_rocket',
    name: '拼装火箭',
    method: 'text',
    prompt: '低多边形游戏道具，塑料拼装玩具火箭，卡通风格，单一物体居中，纯色背景，适合跑酷障碍物',
    usage: '赛博玩具城 · 跳跃障碍 C',
    tris: 6600,
    generated: false,
  },
  {
    id: 'toy_pickup_gear',
    name: '发条齿轮',
    method: 'text',
    prompt: '低多边形游戏收集物，发光的发条齿轮，薄荷绿，卡通风格，单一物体居中，纯色背景',
    usage: '赛博玩具城 · 金币',
    tris: 1500,
    generated: false,
  },
]
