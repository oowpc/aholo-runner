import * as THREE from 'three'

const LANE_WIDTH = 2.2
const JUMP_VELOCITY = 9.6
const GRAVITY = -26

export class Player {
  readonly group = new THREE.Group()
  private readonly visual = new THREE.Group()
  private readonly shadow: THREE.Mesh
  private readonly placeholder = new THREE.Group()
  private readonly accentMaterials: THREE.MeshStandardMaterial[] = []
  private runTime = 0
  private tilt = 0

  lane = 1
  x = 0
  y = 0
  vy = 0
  grounded = true
  laneWidth = LANE_WIDTH

  constructor() {
    this.buildPlaceholder()
    this.visual.add(this.placeholder)
    this.group.add(this.visual)

    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 28), shadowMaterial)
    this.shadow.rotation.x = -Math.PI / 2
    this.shadow.position.y = 0.01
    this.group.add(this.shadow)
  }

  private buildPlaceholder(): void {
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f6ff,
      roughness: 0.45,
      metalness: 0.05,
    })
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x7fe3ff,
      emissive: 0x7fe3ff,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.2,
    })
    this.accentMaterials.push(accentMaterial)

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.68, 8, 20), bodyMaterial)
    body.position.y = 0.98
    body.castShadow = true
    this.placeholder.add(body)

    const visor = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 10, 28, Math.PI * 1.15), accentMaterial)
    visor.position.set(0, 1.28, 0.26)
    visor.rotation.set(-0.45, 0, Math.PI * 0.08)
    this.placeholder.add(visor)

    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x101322, roughness: 0.4 })
    const eyeGeometry = new THREE.SphereGeometry(0.075, 14, 14)
    const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial)
    eyeLeft.position.set(-0.16, 1.16, 0.36)
    const eyeRight = eyeLeft.clone()
    eyeRight.position.x = 0.16
    this.placeholder.add(eyeLeft, eyeRight)

    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 10, 24), accentMaterial)
    scarf.position.y = 0.82
    scarf.rotation.x = Math.PI / 2
    this.placeholder.add(scarf)

    const antenna = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), accentMaterial)
    antenna.position.set(0.22, 1.62, 0)
    this.placeholder.add(antenna)

    const antennaStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6),
      accentMaterial,
    )
    antennaStem.position.set(0.22, 1.5, 0)
    this.placeholder.add(antennaStem)
  }

  setAccent(color: number): void {
    for (const material of this.accentMaterials) {
      material.color.setHex(color)
      material.emissive.setHex(color)
    }
  }

  attachModel(model: THREE.Object3D): void {
    const bounds = new THREE.Box3().setFromObject(model)
    const size = bounds.getSize(new THREE.Vector3())
    const maxSize = Math.max(size.x, size.y, size.z)
    if (maxSize > 0) model.scale.multiplyScalar(1.7 / maxSize)

    const scaled = new THREE.Box3().setFromObject(model)
    const center = scaled.getCenter(new THREE.Vector3())
    model.position.x -= center.x
    model.position.z -= center.z
    model.position.y -= scaled.min.y

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = true
    })

    this.visual.clear()
    this.visual.add(model)
  }

  reset(): void {
    this.lane = 1
    this.x = 0
    this.y = 0
    this.vy = 0
    this.grounded = true
    this.runTime = 0
    this.tilt = 0
    this.group.position.set(0, 0, 0)
    this.group.rotation.set(0, 0, 0)
    this.visual.rotation.set(0, 0, 0)
    this.visual.position.set(0, 0, 0)
  }

  move(direction: -1 | 1): boolean {
    const next = this.lane + direction
    if (next < 0 || next > 2) return false
    this.lane = next
    return true
  }

  jump(): boolean {
    if (!this.grounded) return false
    this.vy = JUMP_VELOCITY
    this.grounded = false
    return true
  }

  update(dt: number, moving: boolean): void {
    const targetX = (this.lane - 1) * this.laneWidth
    const smoothing = 1 - Math.exp(-12 * dt)
    this.x += (targetX - this.x) * smoothing

    if (!this.grounded) {
      this.vy += GRAVITY * dt
      this.y += this.vy * dt
      if (this.y <= 0) {
        this.y = 0
        this.vy = 0
        this.grounded = true
      }
    }

    if (moving) this.runTime += dt
    const bob = this.grounded && moving ? Math.abs(Math.sin(this.runTime * 11)) * 0.06 : 0
    this.group.position.set(this.x, this.y, 0)

    const laneOffset = targetX - this.x
    const targetTilt = THREE.MathUtils.clamp(-laneOffset * 0.28, -0.35, 0.35)
    this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 14)
    this.visual.rotation.z = this.tilt
    this.visual.rotation.x = this.grounded ? -0.06 : -0.18
    this.visual.position.y = bob

    const heightFactor = 1 - Math.min(1, this.y / 2.2)
    this.shadow.scale.setScalar(0.75 + heightFactor * 0.35)
    const shadowMaterial = this.shadow.material as THREE.MeshBasicMaterial
    shadowMaterial.opacity = 0.08 + heightFactor * 0.27
  }
}
