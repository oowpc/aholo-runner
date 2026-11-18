import * as THREE from 'three'
import type { Theme } from '../data/themes'

const SLEEPER_SPACING = 2.9
const SLEEPER_COUNT = 48
const LIGHT_SPACING = 10
const LIGHT_COUNT = 24
const BUILDING_SPACING = 18
const BUILDINGS_PER_SIDE = 6
const GANTRY_SPACING = 30
const GANTRY_COUNT = 5
const TRACK_LENGTH = 260

interface Movable {
  mesh: THREE.Object3D
  row: number
}

export class Track {
  readonly group = new THREE.Group()
  private readonly ground: THREE.Mesh
  private readonly groundMaterial: THREE.MeshStandardMaterial
  private readonly sleeperMaterial: THREE.MeshStandardMaterial
  private readonly railMaterial: THREE.MeshStandardMaterial
  private readonly wallMaterial: THREE.MeshStandardMaterial
  private readonly glowMaterial: THREE.MeshBasicMaterial
  private readonly buildingBodyMaterial: THREE.MeshStandardMaterial
  private readonly buildingStripMaterial: THREE.MeshBasicMaterial
  private readonly gantryMaterial: THREE.MeshStandardMaterial
  private readonly gantryStripMaterial: THREE.MeshBasicMaterial
  private readonly sleepers: Movable[] = []
  private readonly lights: Movable[] = []
  private readonly buildings: (Movable & { side: number })[] = []
  private readonly gantries: Movable[] = []

  constructor() {
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2238,
      roughness: 0.95,
      metalness: 0,
    })
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 320), this.groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.set(0, 0, -110)
    this.ground.receiveShadow = true
    this.group.add(this.ground)

    this.railMaterial = new THREE.MeshStandardMaterial({
      color: 0x9aa4b8,
      roughness: 0.3,
      metalness: 0.85,
    })
    const railGeometry = new THREE.BoxGeometry(0.09, 0.1, TRACK_LENGTH)
    for (const x of [-2.75, -1.65, -0.55, 0.55, 1.65, 2.75]) {
      const rail = new THREE.Mesh(railGeometry, this.railMaterial)
      rail.position.set(x, 0.06, -100)
      rail.receiveShadow = true
      this.group.add(rail)
    }

    this.sleeperMaterial = new THREE.MeshStandardMaterial({
      color: 0x37302c,
      roughness: 0.92,
      metalness: 0,
    })
    const sleeperGeometry = new THREE.BoxGeometry(7.7, 0.08, 0.42)
    for (let index = 0; index < SLEEPER_COUNT; index += 1) {
      const sleeper = new THREE.Mesh(sleeperGeometry, this.sleeperMaterial)
      sleeper.position.set(0, 0.03, 14 - index * SLEEPER_SPACING)
      sleeper.receiveShadow = true
      this.group.add(sleeper)
      this.sleepers.push({ mesh: sleeper, row: index })
    }

    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2a3f,
      roughness: 0.85,
      metalness: 0.1,
    })
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x9fd0ff,
      transparent: true,
      opacity: 0.75,
    })
    const wallGeometry = new THREE.BoxGeometry(0.28, 1.1, TRACK_LENGTH)
    for (const x of [-4.35, 4.35]) {
      const wall = new THREE.Mesh(wallGeometry, this.wallMaterial)
      wall.position.set(x, 0.55, -100)
      wall.receiveShadow = true
      this.group.add(wall)

      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, TRACK_LENGTH), this.glowMaterial)
      glow.position.set(x - Math.sign(x) * 0.12, 1.14, -100)
      this.group.add(glow)
    }

    const lightGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.9)
    for (const side of [-1, 1]) {
      for (let index = 0; index < LIGHT_COUNT; index += 1) {
        const light = new THREE.Mesh(lightGeometry, this.glowMaterial)
        light.position.set(side * 4.42, 1.2, 12 - index * LIGHT_SPACING)
        this.group.add(light)
        this.lights.push({ mesh: light, row: index })
      }
    }

    this.buildingBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x121a2e,
      roughness: 0.9,
      metalness: 0.05,
      emissive: 0x000000,
    })
    this.buildingStripMaterial = new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.55 })
    for (const side of [-1, 1]) {
      for (let index = 0; index < BUILDINGS_PER_SIDE; index += 1) {
        this.buildings.push(this.createBuilding(side, index))
      }
    }

    this.gantryMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3247,
      roughness: 0.6,
      metalness: 0.35,
    })
    this.gantryStripMaterial = new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.6 })
    for (let index = 0; index < GANTRY_COUNT; index += 1) {
      const gantry = this.createGantry()
      gantry.position.z = 4 - index * GANTRY_SPACING
      this.group.add(gantry)
      this.gantries.push({ mesh: gantry, row: index })
    }
  }

  private createBuilding(side: number, row: number): Movable & { side: number } {
    const group = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 10, 4.2), this.buildingBodyMaterial)
    body.position.y = 5
    group.add(body)

    for (const y of [2.4, 4.6, 6.8, 8.6]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.06), this.buildingStripMaterial)
      strip.position.set(0, y, 2.11)
      group.add(strip)
    }

    group.position.set(side * (8.5 + Math.random() * 4.5), 0, 10 - row * BUILDING_SPACING)
    group.scale.y = 0.6 + Math.random() * 1.1
    this.group.add(group)
    return { mesh: group, row, side }
  }

  private createGantry(): THREE.Group {
    const group = new THREE.Group()
    const postGeometry = new THREE.BoxGeometry(0.32, 5.2, 0.32)
    for (const x of [-4.7, 4.7]) {
      const post = new THREE.Mesh(postGeometry, this.gantryMaterial)
      post.position.set(x, 2.6, 0)
      group.add(post)
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.7, 0.4, 0.4), this.gantryMaterial)
    beam.position.y = 5
    group.add(beam)

    const strip = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.08, 0.12), this.gantryStripMaterial)
    strip.position.set(0, 4.75, 0.22)
    group.add(strip)

    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.26, 0.08), this.gantryStripMaterial)
    sign.position.set(0, 4.35, 0.1)
    group.add(sign)

    return group
  }

  setTheme(theme: Theme): void {
    this.groundMaterial.color.setHex(theme.ground)
    this.sleeperMaterial.color.setHex(theme.ground)
    this.railMaterial.color.setHex(theme.laneLine)
    this.wallMaterial.color.setHex(theme.ground)
    this.glowMaterial.color.setHex(theme.accent)
    this.buildingBodyMaterial.color.setHex(theme.bg)
    this.buildingBodyMaterial.emissive.setHex(theme.ground)
    this.buildingBodyMaterial.emissiveIntensity = 0.25
    this.buildingStripMaterial.color.setHex(theme.accent)
    this.gantryMaterial.color.setHex(theme.ground)
    this.gantryStripMaterial.color.setHex(theme.accent)
  }

  update(dt: number, speed: number): void {
    const travel = speed * dt

    const sleeperTravel = SLEEPER_SPACING * SLEEPER_COUNT
    for (const sleeper of this.sleepers) {
      sleeper.mesh.position.z += travel
      if (sleeper.mesh.position.z > 14) sleeper.mesh.position.z -= sleeperTravel
    }

    const lightTravel = LIGHT_SPACING * LIGHT_COUNT
    for (const light of this.lights) {
      light.mesh.position.z += travel
      if (light.mesh.position.z > 14) light.mesh.position.z -= lightTravel
    }

    const buildingTravel = BUILDING_SPACING * BUILDINGS_PER_SIDE
    for (const building of this.buildings) {
      building.mesh.position.z += travel
      if (building.mesh.position.z > 30) {
        building.mesh.position.z -= buildingTravel
        building.mesh.position.x = building.side * (8.5 + Math.random() * 4.5)
        building.mesh.scale.y = 0.6 + Math.random() * 1.1
      }
    }

    const gantryTravel = GANTRY_SPACING * GANTRY_COUNT
    for (const gantry of this.gantries) {
      gantry.mesh.position.z += travel
      if (gantry.mesh.position.z > 26) gantry.mesh.position.z -= gantryTravel
    }
  }

  reset(): void {
    for (const sleeper of this.sleepers) {
      sleeper.mesh.position.z = 14 - sleeper.row * SLEEPER_SPACING
    }
    for (const light of this.lights) {
      light.mesh.position.z = 12 - light.row * LIGHT_SPACING
    }
    for (const building of this.buildings) {
      building.mesh.position.z = 10 - building.row * BUILDING_SPACING
    }
    for (const gantry of this.gantries) {
      gantry.mesh.position.z = 4 - gantry.row * GANTRY_SPACING
    }
  }
}
