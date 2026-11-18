import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MODEL_FILES } from '../data/assets'
import { THEME_ORDER, type ThemeId } from '../data/themes'

export interface ThemeModels {
  obstacles: (THREE.Object3D | null)[]
  pickup: THREE.Object3D | null
}

export interface LoadedModels {
  player: THREE.Object3D | null
  themes: Record<ThemeId, ThemeModels>
}

const loader = new GLTFLoader()

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`
}

async function loadModel(path: string): Promise<THREE.Object3D | null> {
  try {
    const url = assetUrl(path)
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) return null
    const gltf = await loader.loadAsync(url)
    return gltf.scene
  } catch {
    return null
  }
}

function normalizeToGround(object: THREE.Object3D, targetMax: number): void {
  const bounds = new THREE.Box3().setFromObject(object)
  const size = bounds.getSize(new THREE.Vector3())
  const maxSize = Math.max(size.x, size.y, size.z)
  if (maxSize > 0) object.scale.multiplyScalar(targetMax / maxSize)

  const scaled = new THREE.Box3().setFromObject(object)
  const center = scaled.getCenter(new THREE.Vector3())
  object.position.x -= center.x
  object.position.z -= center.z
  object.position.y -= scaled.min.y

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = false
    }
  })
}

function normalizeCenter(object: THREE.Object3D, targetMax: number, centerY: number): void {
  const bounds = new THREE.Box3().setFromObject(object)
  const size = bounds.getSize(new THREE.Vector3())
  const maxSize = Math.max(size.x, size.y, size.z)
  if (maxSize > 0) object.scale.multiplyScalar(targetMax / maxSize)

  const scaled = new THREE.Box3().setFromObject(object)
  const center = scaled.getCenter(new THREE.Vector3())
  object.position.x -= center.x
  object.position.z -= center.z
  object.position.y += centerY - center.y

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true
  })
}

export async function loadOptionalModels(): Promise<LoadedModels> {
  const playerPromise = loadModel(MODEL_FILES.player)

  const themePromises = THEME_ORDER.map(async (themeId) => {
    const files = MODEL_FILES.themes[themeId]
    const obstacles = await Promise.all(files.obstacles.map((url) => loadModel(url)))
    const pickup = await loadModel(files.pickup)
    for (const obstacle of obstacles) {
      if (obstacle) normalizeToGround(obstacle, 1.5)
    }
    if (pickup) normalizeCenter(pickup, 0.8, 0)
    return [themeId, { obstacles, pickup }] as const
  })

  const [player, themeEntries] = await Promise.all([playerPromise, Promise.all(themePromises)])
  const themes = Object.fromEntries(themeEntries) as Record<ThemeId, ThemeModels>

  return { player, themes }
}
