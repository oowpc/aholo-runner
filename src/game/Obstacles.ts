import * as THREE from 'three'
import type { Theme, ThemeId } from '../data/themes'
import type { ThemeModels } from './ModelLoader'

const SPAWN_Z = -96
const CLEAR_Z = 12
const COIN_TRAIL = 6

type ObstacleType = 'jump' | 'roll' | 'train'
type ItemKind = 'obstacle' | 'coin'

interface Item {
  mesh: THREE.Object3D
  kind: ItemKind
  obstacleType?: ObstacleType
  halfLength: number
}

export interface PlayerState {
  x: number
  y: number
  rolling: boolean
}

export interface ObstacleResult {
  hit: boolean
  picked: number
  hitZ: number
}

function shuffledLanes(): number[] {
  const lanes = [0, 1, 2]
  for (let i = lanes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[lanes[i], lanes[j]] = [lanes[j], lanes[i]]
  }
  return lanes
}

export class Obstacles {
  readonly group = new THREE.Group()
  private items: Item[] = []
  private distanceUntilSpawn = 30
  private models: Record<ThemeId, ThemeModels> | null = null
  private readonly laneX = [-2.2, 0, 2.2]

  setModels(models: Record<ThemeId, ThemeModels>): void {
    this.models = models
  }

  reset(theme?: Theme): void {
    for (const item of this.items) item.mesh.removeFromParent()
    this.items = []
    this.distanceUntilSpawn = 30
    if (theme) {
      this.spawnRow(theme, -34)
      this.spawnRow(theme, -62)
    }
  }

  update(
    dt: number,
    speed: number,
    theme: Theme,
    player: PlayerState,
  ): ObstacleResult {
    const travel = speed * dt
    for (const item of this.items) {
      item.mesh.position.z += travel
      if (item.kind === 'coin') {
        item.mesh.rotation.y += dt * 3.2
        const baseY = (item.mesh.userData.baseY as number | undefined) ?? 1.2
        item.mesh.position.y = baseY + Math.sin(item.mesh.position.z * 0.5) * 0.07
      }
    }

    let hit = false
    let hitZ = 0
    let picked = 0

    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      const item = this.items[index]
      const position = item.mesh.position

      if (position.z - item.halfLength > CLEAR_Z) {
        item.mesh.removeFromParent()
        this.items.splice(index, 1)
        continue
      }

      const dx = Math.abs(position.x - player.x)
      const dz = Math.abs(position.z)

      if (item.kind === 'obstacle') {
        if (hit || dx > 0.98 || dz > item.halfLength + 0.7) continue
        if (item.obstacleType === 'train') {
          hit = true
          hitZ = position.z
        } else if (item.obstacleType === 'roll') {
          const passes = player.rolling && player.y < 0.35
          if (!passes) {
            hit = true
            hitZ = position.z
          }
        } else if (player.y < 1.02) {
          hit = true
          hitZ = position.z
        }
      } else {
        const heightGap = Math.abs(position.y - (player.y + 0.95))
        if (dx < 1.15 && dz < 1.4 && heightGap < 1.4) {
          picked += 1
          item.mesh.removeFromParent()
          this.items.splice(index, 1)
        }
      }
    }

    this.distanceUntilSpawn -= travel
    if (this.distanceUntilSpawn <= 0) {
      this.spawnRow(theme)
      this.distanceUntilSpawn = 28 + Math.random() * 12
    }

    return { hit, picked, hitZ }
  }

  private spawnRow(theme: Theme, z = SPAWN_Z): void {
    const lanes = shuffledLanes()
    const obstacleCount = Math.random() < 0.45 ? 2 : 1
    const obstacleLanes = lanes.slice(0, obstacleCount)
    const freeLanes = lanes.slice(obstacleCount)
    let hasTrain = false
    let jumpLane: number | null = null

    for (const lane of obstacleLanes) {
      let type: ObstacleType
      if (!hasTrain && Math.random() < 0.32) {
        type = 'train'
        hasTrain = true
      } else if (Math.random() < 0.42) {
        type = 'roll'
      } else {
        type = 'jump'
        jumpLane = lane
      }

      const halfLength = type === 'train' ? 6 : 0.85
      const mesh =
        type === 'train'
          ? this.createTrain(theme)
          : type === 'roll'
            ? this.createRollGate(theme)
            : this.createJumpObstacle(theme)

      const zPosition = type === 'train' ? z - halfLength : z
      mesh.position.set(this.laneX[lane], 0, zPosition)
      this.group.add(mesh)
      this.items.push({ mesh, kind: 'obstacle', obstacleType: type, halfLength })
    }

    if (freeLanes.length > 0) {
      const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)]
      const count = COIN_TRAIL
      for (let index = 0; index < count; index += 1) {
        const coin = this.createCoin(theme)
        coin.position.set(this.laneX[lane], 1.2, z - index * 2.4)
        coin.userData.baseY = 1.2
        this.group.add(coin)
        this.items.push({ mesh: coin, kind: 'coin', halfLength: 0.5 })
      }
    }

    if (jumpLane !== null && Math.random() < 0.55) {
      const arcHeights = [1.1, 1.8, 2.15, 1.8, 1.1]
      for (let index = 0; index < arcHeights.length; index += 1) {
        const coin = this.createCoin(theme)
        coin.position.set(this.laneX[jumpLane], arcHeights[index], z + 3.2 - index * 1.6)
        coin.userData.baseY = arcHeights[index]
        this.group.add(coin)
        this.items.push({ mesh: coin, kind: 'coin', halfLength: 0.5 })
      }
    }
  }

  private createJumpObstacle(theme: Theme): THREE.Object3D {
    const variant = Math.floor(Math.random() * 3)
    const source = this.models?.[theme.id]?.obstacles[variant]
    if (source) return source.clone(true)

    const group = new THREE.Group()
    const color = theme.obstacle[variant % theme.obstacle.length]
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
      metalness: 0.08,
      emissive: color,
      emissiveIntensity: 0.1,
    })
    const accent = new THREE.MeshStandardMaterial({
      color: theme.accent,
      emissive: theme.accent,
      emissiveIntensity: 0.6,
      roughness: 0.35,
    })

    if (variant === 0) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.95, 7), material)
      cone.position.y = 0.48
      cone.castShadow = true
      group.add(cone)
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 8, 24), accent)
      band.position.y = 0.4
      band.rotation.x = Math.PI / 2
      group.add(band)
    } else if (variant === 1) {
      const blob = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), material)
      blob.position.y = 0.55
      blob.scale.y = 0.85
      blob.castShadow = true
      group.add(blob)
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), accent)
      cap.position.set(0.15, 0.92, 0.08)
      group.add(cap)
    } else {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 0.9), material)
      crate.position.y = 0.48
      crate.rotation.y = 0.15
      crate.castShadow = true
      group.add(crate)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.12, 0.94), accent)
      stripe.position.y = 0.72
      stripe.rotation.y = 0.15
      group.add(stripe)
    }

    return group
  }

  private createRollGate(theme: Theme): THREE.Object3D {
    const group = new THREE.Group()
    const postMaterial = new THREE.MeshStandardMaterial({
      color: theme.obstacle[2],
      roughness: 0.55,
      metalness: 0.25,
    })
    const barMaterial = new THREE.MeshStandardMaterial({
      color: theme.accent,
      emissive: theme.accent,
      emissiveIntensity: 0.5,
      roughness: 0.35,
      metalness: 0.3,
    })
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x151a28, roughness: 0.6 })

    for (const x of [-0.95, 0.95]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.95, 0.16), postMaterial)
      post.position.set(x, 0.98, 0)
      post.castShadow = true
      group.add(post)
    }

    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.46, 0.52), barMaterial)
    bar.position.y = 1.88
    bar.castShadow = true
    group.add(bar)

    for (const x of [-0.5, 0, 0.5]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.56), darkMaterial)
      stripe.position.set(x, 1.88, 0)
      group.add(stripe)
    }

    return group
  }

  private createTrain(theme: Theme): THREE.Object3D {
    const group = new THREE.Group()
    const bodyColor = theme.obstacle[0]
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.38,
      metalness: 0.25,
      emissive: bodyColor,
      emissiveIntensity: 0.06,
    })
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: theme.accent,
      emissive: theme.accent,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.4,
    })
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b1220,
      emissive: theme.accent,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.6,
    })
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.7 })

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 2.4, 12), bodyMaterial)
    body.position.y = 1.35
    body.castShadow = true
    group.add(body)

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 11.6), darkMaterial)
    roof.position.y = 2.64
    group.add(roof)

    const undercarriage = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 11.2), darkMaterial)
    undercarriage.position.y = 0.22
    group.add(undercarriage)

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 12.05), accentMaterial)
    stripe.position.y = 0.72
    group.add(stripe)

    for (const side of [-1, 1]) {
      const windows = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 10.4), windowMaterial)
      windows.position.set(side * 0.99, 1.95, 0)
      group.add(windows)
    }

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.62, 0.05), windowMaterial)
    windshield.position.set(0, 2.0, 6.02)
    group.add(windshield)

    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff6d8 })
    for (const side of [-1, 1]) {
      const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), lightMaterial)
      headlight.position.set(side * 0.62, 1.0, 6.05)
      group.add(headlight)
    }

    return group
  }

  private createCoin(theme: Theme): THREE.Object3D {
    const source = this.models?.[theme.id]?.pickup
    if (source) {
      const clone = source.clone(true)
      clone.position.y = 1.2
      return clone
    }

    const group = new THREE.Group()
    const gold = 0xffd166
    const material = new THREE.MeshStandardMaterial({
      color: gold,
      emissive: 0xffb84d,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.7,
    })
    const geometry = new THREE.CylinderGeometry(0.27, 0.27, 0.07, 24)
    geometry.rotateX(Math.PI / 2)
    const coin = new THREE.Mesh(geometry, material)
    group.add(coin)

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.018, 6, 28),
      new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.35 }),
    )
    group.add(ring)

    return group
  }
}
