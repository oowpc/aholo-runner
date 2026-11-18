import * as THREE from 'three'
import type { Theme } from '../data/themes'

export class Ambience {
  readonly points: THREE.Points
  private readonly positions: Float32Array
  private readonly speeds: Float32Array
  private readonly material: THREE.PointsMaterial
  private elapsed = 0

  constructor(count = 150) {
    this.positions = new Float32Array(count * 3)
    this.speeds = new Float32Array(count)

    for (let index = 0; index < count; index += 1) {
      this.positions[index * 3] = (Math.random() - 0.5) * 34
      this.positions[index * 3 + 1] = Math.random() * 14
      this.positions[index * 3 + 2] = -42 + Math.random() * 52
      this.speeds[index] = 0.3 + Math.random() * 0.9
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

    this.material = new THREE.PointsMaterial({
      color: 0xd8f1ff,
      size: 0.09,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    this.points = new THREE.Points(geometry, this.material)
    this.points.frustumCulled = false
  }

  setTheme(theme: Theme): void {
    this.material.color.setHex(theme.particle)
  }

  update(dt: number): void {
    this.elapsed += dt
    const count = this.speeds.length
    for (let index = 0; index < count; index += 1) {
      const yIndex = index * 3 + 1
      this.positions[yIndex] -= this.speeds[index] * dt
      this.positions[index * 3] += Math.sin(this.elapsed * 0.6 + index) * 0.05 * dt

      if (this.positions[yIndex] < 0) {
        this.positions[yIndex] = 13 + Math.random()
        this.positions[index * 3] = (Math.random() - 0.5) * 34
        this.positions[index * 3 + 2] = -42 + Math.random() * 52
      }
    }
    const attribute = this.points.geometry.getAttribute('position') as THREE.BufferAttribute
    attribute.needsUpdate = true
  }
}
