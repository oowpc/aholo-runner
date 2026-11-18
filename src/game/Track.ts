import * as THREE from 'three'
import type { Theme } from '../data/themes'

const DASH_SPACING = 7
const DASH_COUNT = 26

export class Track {
  readonly group = new THREE.Group()
  private readonly ground: THREE.Mesh
  private readonly dashes: THREE.Mesh[] = []
  private readonly railMaterial: THREE.MeshBasicMaterial
  private readonly dashMaterial: THREE.MeshBasicMaterial

  constructor() {
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x233a52,
      roughness: 0.95,
      metalness: 0,
    })
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 260), groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.set(0, 0, -80)
    this.ground.receiveShadow = true
    this.group.add(this.ground)

    this.dashMaterial = new THREE.MeshBasicMaterial({
      color: 0x9fd0ff,
      transparent: true,
      opacity: 0.4,
    })
    const dashGeometry = new THREE.BoxGeometry(0.075, 0.02, 2.4)
    for (let boundary = 0; boundary < 2; boundary += 1) {
      const x = boundary === 0 ? -1.1 : 1.1
      for (let index = 0; index < DASH_COUNT; index += 1) {
        const dash = new THREE.Mesh(dashGeometry, this.dashMaterial)
        dash.position.set(x, 0.02, 14 - index * DASH_SPACING)
        dash.userData.row = index
        this.dashes.push(dash)
        this.group.add(dash)
      }
    }

    this.railMaterial = new THREE.MeshBasicMaterial({
      color: 0x9fd0ff,
      transparent: true,
      opacity: 0.22,
    })
    for (const x of [-3.9, 3.9]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 260), this.railMaterial)
      rail.position.set(x, 0.05, -80)
      this.group.add(rail)
    }
  }

  setTheme(theme: Theme): void {
    const groundMaterial = this.ground.material as THREE.MeshStandardMaterial
    groundMaterial.color.setHex(theme.ground)
    this.dashMaterial.color.setHex(theme.laneLine)
    this.railMaterial.color.setHex(theme.laneLine)
  }

  update(dt: number, speed: number): void {
    const travel = speed * dt
    const wrap = DASH_SPACING * DASH_COUNT
    for (const dash of this.dashes) {
      dash.position.z += travel
      if (dash.position.z > 14) dash.position.z -= wrap
    }
  }

  reset(): void {
    for (const dash of this.dashes) {
      const row = dash.userData.row as number
      dash.position.z = 14 - row * DASH_SPACING
    }
  }
}
