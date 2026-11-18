import * as THREE from 'three'
import type { Theme, ThemeId } from '../data/themes'
import type { ThemeModels } from './ModelLoader'

const SPAWN_Z = -92
const CLEAR_Z = 12
const PICKUP_TRAIL = 5

type ItemKind = 'obstacle' | 'pickup'

interface Item {
  mesh: THREE.Object3D
  kind: ItemKind
  clearance: number
}

export interface ObstacleResult {
  hit: boolean
  picked: number
  hitZ: number
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export class Obstacles {
  readonly group = new THREE.Group()
  private items: Item[] = []
  private distanceUntilSpawn = 20
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
      this.spawnRow(theme, -38)
      this.spawnRow(theme, -64)
    }
  }

  update(dt: number, speed: number, theme: Theme, playerX: number, playerY: number): ObstacleResult {
    const travel = speed * dt
    for (const item of this.items) {
      item.mesh.position.z += travel
      if (item.kind === 'pickup') {
        item.mesh.rotation.y += dt * 2.4
        item.mesh.rotation.x += dt * 1.1
        item.mesh.position.y = 1.25 + Math.sin(item.mesh.position.z * 0.4) * 0.06
      }
    }

    let hit = false
    let hitZ = 0
    let picked = 0

    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      const item = this.items[index]
      const position = item.mesh.position

      if (position.z > CLEAR_Z) {
        item.mesh.removeFromParent()
        this.items.splice(index, 1)
        continue
      }

      const dx = Math.abs(position.x - playerX)
      const dz = Math.abs(position.z)

      if (item.kind === 'obstacle') {
        if (!hit && dx < 0.95 && dz < 1.35 && playerY < item.clearance) {
          hit = true
          hitZ = position.z
        }
      } else if (dx < 1.1 && dz < 1.5) {
        picked += 1
        item.mesh.removeFromParent()
        this.items.splice(index, 1)
      }
    }

    this.distanceUntilSpawn -= travel
    if (this.distanceUntilSpawn <= 0) {
      this.spawnRow(theme)
      this.distanceUntilSpawn = 26 + Math.random() * 14
    }

    return { hit, picked, hitZ }
  }

  private spawnRow(theme: Theme, z = SPAWN_Z): void {
    const lanes = [0, 1, 2]
    for (let i = lanes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[lanes[i], lanes[j]] = [lanes[j], lanes[i]]
    }

    const obstacleCount = Math.random() < 0.4 ? 2 : 1
    const obstacleLanes = lanes.slice(0, obstacleCount)
    const freeLanes = lanes.slice(obstacleCount)

    for (const lane of obstacleLanes) {
      const kind = Math.floor(Math.random() * 3)
      const mesh = this.createObstacle(theme, kind)
      mesh.position.set(this.laneX[lane], 0, z)
      this.group.add(mesh)
      this.items.push({ mesh, kind: 'obstacle', clearance: 1.05 })
    }

    if (freeLanes.length > 0 && Math.random() < 0.85) {
      const lane = pick(freeLanes)
      for (let index = 0; index < PICKUP_TRAIL; index += 1) {
        const mesh = this.createPickup(theme)
        mesh.position.set(this.laneX[lane], 1.25, z - index * 2.6)
        this.group.add(mesh)
        this.items.push({ mesh, kind: 'pickup', clearance: 0 })
      }
    }
  }

  private createObstacle(theme: Theme, kind: number): THREE.Object3D {
    const source = this.models?.[theme.id]?.obstacles[kind]
    if (source) return source.clone(true)

    const group = new THREE.Group()
    const color = theme.obstacle[kind % theme.obstacle.length]
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

    if (kind === 0) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.5, 7), material)
      cone.position.y = 0.75
      cone.castShadow = true
      group.add(cone)
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 8, 24), accent)
      band.position.y = 0.55
      band.rotation.x = Math.PI / 2
      group.add(band)
    } else if (kind === 1) {
      const blob = new THREE.Mesh(new THREE.DodecahedronGeometry(0.78, 0), material)
      blob.position.y = 0.72
      blob.scale.y = 0.92
      blob.castShadow = true
      group.add(blob)
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), accent)
      cap.position.set(0.18, 1.18, 0.1)
      group.add(cap)
    } else {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.4, 1.3), material)
      crate.position.y = 0.7
      crate.rotation.y = 0.3
      crate.castShadow = true
      group.add(crate)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.14, 1.34), accent)
      stripe.position.y = 0.95
      stripe.rotation.y = 0.3
      group.add(stripe)
    }

    return group
  }

  private createPickup(theme: Theme): THREE.Object3D {
    const source = this.models?.[theme.id]?.pickup
    if (source) return source.clone(true)

    const group = new THREE.Group()
    const material = new THREE.MeshStandardMaterial({
      color: theme.pickup,
      emissive: theme.pickup,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.3,
    })
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), material)
    gem.rotation.z = 0.4
    group.add(gem)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: theme.pickup,
      transparent: true,
      opacity: 0.35,
    })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.013, 6, 28), ringMaterial)
    group.add(ring)

    return group
  }
}
