import * as THREE from 'three'
import { THEMES, THEME_ORDER, type Theme, type ThemeId } from '../data/themes'
import { Player } from './Player'
import { Track } from './Track'
import { Obstacles } from './Obstacles'
import { Ambience } from './Ambience'
import { Scoring } from './Scoring'
import { Sfx } from './Sfx'
import { loadOptionalModels } from './ModelLoader'
import { Menu } from '../ui/Menu'
import { HUD } from '../ui/HUD'
import { Gallery } from '../ui/Gallery'

const FIXED_STEP = 1 / 60
const START_SPEED = 14
const MAX_SPEED = 28
const SPEED_RAMP = 0.38
const THEME_KEY = 'make-it-run.theme'

type GameState = 'menu' | 'playing' | 'paused' | 'dead'

function readTheme(): ThemeId {
  try {
    const value = localStorage.getItem(THEME_KEY) as ThemeId | null
    if (value && THEME_ORDER.includes(value)) return value
  } catch {
    // ignore storage failures
  }
  return 'snow'
}

export class Game {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly clock = new THREE.Clock()
  private readonly player = new Player()
  private readonly track = new Track()
  private readonly obstacles = new Obstacles()
  private readonly ambience = new Ambience()
  private readonly scoring = new Scoring()
  private readonly sfx = new Sfx()
  private readonly menu: Menu
  private readonly hud: HUD
  private readonly gallery: Gallery
  private readonly sun: THREE.DirectionalLight
  private readonly hemisphere: THREE.HemisphereLight

  private state: GameState = 'menu'
  private themeId: ThemeId = readTheme()
  private theme: Theme = THEMES[readTheme()]
  private accumulator = 0
  private speed = START_SPEED
  private shake = 0
  private menuTime = 0
  private galleryFrom: 'menu' | 'paused' = 'menu'
  private touchStart: { x: number; y: number } | null = null

  constructor(root: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.22
    root.appendChild(this.renderer.domElement)

    this.scene.background = new THREE.Color(this.theme.bg)
    this.scene.fog = new THREE.Fog(this.theme.fog, this.theme.fogNear, this.theme.fogFar)

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 140)
    this.camera.position.set(0, 3.15, 6.4)
    this.camera.lookAt(0, 1.15, 0)

    this.hemisphere = new THREE.HemisphereLight(this.theme.sun, this.theme.ground, 1.45)
    this.scene.add(this.hemisphere)

    this.sun = new THREE.DirectionalLight(0xffffff, 2.35)
    this.sun.position.set(6, 12, 7)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(1024, 1024)
    this.sun.shadow.camera.left = -14
    this.sun.shadow.camera.right = 14
    this.sun.shadow.camera.top = 14
    this.sun.shadow.camera.bottom = -14
    this.sun.shadow.camera.near = 1
    this.sun.shadow.camera.far = 40
    this.sun.shadow.bias = -0.0005
    this.scene.add(this.sun)

    this.scene.add(this.track.group)
    this.scene.add(this.obstacles.group)
    this.scene.add(this.ambience.points)
    this.scene.add(this.player.group)

    this.menu = new Menu(root, {
      onStart: () => this.startRun(),
      onSelectTheme: (themeId) => {
        if (this.state !== 'menu') return
        this.applyTheme(themeId)
        this.sfx.unlock()
        this.sfx.click()
      },
      onGallery: () => this.openGallery('menu'),
      onRestart: () => this.startRun(),
      onHome: () => this.goHome(),
    })

    this.hud = new HUD(root, {
      onPause: () => this.pause(),
      onResume: () => this.resume(),
      onGallery: () => this.openGallery('paused'),
      onHome: () => this.goHome(),
    })

    this.gallery = new Gallery(root, () => this.closeGallery())

    this.applyTheme(this.themeId, false)
    this.bindInput()
  }

  start(): void {
    this.setState('menu')
    this.menu.show(this.scoring.best, this.themeId)
    this.renderer.setAnimationLoop(() => this.frame())
    void this.loadModels()
    if (new URLSearchParams(window.location.search).has('debug')) {
      ;(window as unknown as { __game: Game }).__game = this
    }
  }

  private async loadModels(): Promise<void> {
    try {
      const models = await loadOptionalModels()
      this.obstacles.setModels(models.themes)
      if (models.player) this.player.attachModel(models.player)
    } catch {
      // procedural placeholders stay in place if Lux3D exports are missing
    }
  }

  private setState(state: GameState): void {
    this.state = state
  }

  private applyTheme(themeId: ThemeId, persist = true): void {
    const theme = THEMES[themeId]
    this.themeId = themeId
    this.theme = theme

    ;(this.scene.background as THREE.Color).setHex(theme.bg)
    const fog = this.scene.fog as THREE.Fog
    fog.color.setHex(theme.fog)
    fog.near = theme.fogNear
    fog.far = theme.fogFar

    this.hemisphere.color.setHex(theme.sun)
    this.hemisphere.groundColor.setHex(theme.ground)
    this.sun.color.setHex(theme.sun)

    this.track.setTheme(theme)
    this.ambience.setTheme(theme)
    this.player.setAccent(theme.accent)
    this.menu.setActiveTheme(themeId)

    document.documentElement.style.setProperty('--accent', theme.accentCss)

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, themeId)
      } catch {
        // ignore storage failures
      }
    }
  }

  private startRun(): void {
    this.scoring.reset()
    this.speed = START_SPEED
    this.accumulator = 0
    this.shake = 0
    this.player.reset()
    this.track.reset()
    this.obstacles.reset(this.theme)

    this.menu.hide()
    this.gallery.close()
    this.hud.hidePause()
    this.hud.update(0, 0, this.scoring.best)
    this.hud.show()
    this.applyTheme(this.themeId, false)
    this.camera.position.set(0, 3.7, 6.9)
    this.camera.lookAt(0, 1.15, -8)

    this.sfx.unlock()
    this.sfx.start()
    this.setState('playing')
  }

  private goHome(): void {
    this.setState('menu')
    this.scoring.reset()
    this.player.reset()
    this.track.reset()
    this.obstacles.reset()
    this.speed = START_SPEED
    this.menuTime = 0
    this.gallery.close()
    this.hud.hide()
    this.menu.show(this.scoring.best, this.themeId)
    this.camera.position.set(0, 3.15, 6.4)
    this.camera.lookAt(0, 1.15, 0)
  }

  private pause(): void {
    if (this.state !== 'playing') return
    this.setState('paused')
    this.hud.showPause()
  }

  private resume(): void {
    if (this.state !== 'paused') return
    this.hud.hidePause()
    this.setState('playing')
  }

  private openGallery(from: 'menu' | 'paused'): void {
    this.galleryFrom = from
    if (this.state === 'playing') {
      this.pause()
      this.galleryFrom = 'paused'
    }
    this.gallery.open()
    this.sfx.unlock()
    this.sfx.click()
  }

  private closeGallery(): void {
    this.gallery.close()
    this.sfx.click()
    if (this.galleryFrom === 'paused' && this.state === 'paused') this.hud.showPause()
  }

  private die(): void {
    if (this.state !== 'playing') return
    const record = this.scoring.isRecord
    const meters = this.scoring.meters
    const fragments = this.scoring.fragments
    this.scoring.commit()

    this.setState('dead')
    this.shake = 0.8
    this.hud.hide()
    this.sfx.hit()
    this.menu.showResult({ meters, fragments, best: this.scoring.best, record })
  }

  private movePlayer(direction: -1 | 1): void {
    if (this.player.move(direction)) this.sfx.click()
  }

  private jump(): void {
    if (this.player.jump()) {
      this.sfx.unlock()
      this.sfx.jump()
    }
  }

  private roll(): void {
    if (this.player.roll()) {
      this.sfx.unlock()
      this.sfx.roll()
    }
  }

  private bindInput(): void {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        if (this.gallery.isOpen) {
          this.closeGallery()
          return
        }
        if (this.state === 'playing') {
          this.pause()
          return
        }
        if (this.state === 'paused') {
          this.resume()
          return
        }
      }

      if (this.gallery.isOpen) return

      if (this.state === 'menu' || this.state === 'dead') {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault()
          this.startRun()
        }
        return
      }

      if (this.state !== 'playing') return

      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault()
        this.movePlayer(-1)
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault()
        this.movePlayer(1)
      } else if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault()
        this.jump()
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault()
        this.roll()
      }
    })

    const canvas = this.renderer.domElement
    canvas.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.changedTouches[0]
        this.touchStart = { x: touch.clientX, y: touch.clientY }
      },
      { passive: true },
    )

    canvas.addEventListener(
      'touchend',
      (event) => {
        const start = this.touchStart
        if (!start) return
        this.touchStart = null
        if (this.state !== 'playing') return

        const touch = event.changedTouches[0]
        const dx = touch.clientX - start.x
        const dy = touch.clientY - start.y
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)

        if (absX > 28 && absX > absY) {
          this.movePlayer(dx < 0 ? -1 : 1)
        } else if (absY > 24 && dy < 0) {
          this.jump()
        } else if (absY > 24 && dy > 0) {
          this.roll()
        } else if (absX < 14 && absY < 14) {
          this.jump()
        }
      },
      { passive: true },
    )

    canvas.addEventListener('touchcancel', () => {
      this.touchStart = null
    })

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pause()
    })
  }

  private step(dt: number): void {
    this.speed = Math.min(MAX_SPEED, this.speed + SPEED_RAMP * dt)
    this.scoring.update(dt, this.speed)
    this.player.update(dt, true)
    this.track.update(dt, this.speed)

    const result = this.obstacles.update(dt, this.speed, this.theme, {
      x: this.player.x,
      y: this.player.y,
      rolling: this.player.rolling,
    })

    if (result.picked > 0) {
      this.scoring.collect(result.picked)
      this.sfx.pickup()
      this.hud.flashFragment()
    }

    if (result.hit) {
      this.die()
      return
    }

    this.hud.update(this.scoring.meters, this.scoring.fragments, this.scoring.best)
  }

  private updateCamera(dt: number): void {
    if (this.state === 'menu') {
      const targetX = Math.sin(this.menuTime * 0.35) * 0.9
      this.camera.position.x += (targetX - this.camera.position.x) * Math.min(1, dt * 2.2)
      this.camera.position.y += (3.15 - this.camera.position.y) * Math.min(1, dt * 2.2)
      this.camera.position.z += (6.4 - this.camera.position.z) * Math.min(1, dt * 2.2)
      this.camera.lookAt(0, 1.15, 0)
    } else {
      const targetX = this.player.x * 0.42
      const targetY = 3.65 + Math.min(0.5, this.player.y * 0.09)
      this.camera.position.x += (targetX - this.camera.position.x) * Math.min(1, dt * 7)
      this.camera.position.y += (targetY - this.camera.position.y) * Math.min(1, dt * 7)
      this.camera.position.z += (6.9 - this.camera.position.z) * Math.min(1, dt * 7)
      this.camera.lookAt(this.player.x * 0.22, 1.1, -9)
    }

    if (this.shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.5
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.4
      this.shake = Math.max(0, this.shake - dt * 1.6)
    }
  }

  private frame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05)

    if (this.state === 'playing') {
      this.accumulator += dt
      let steps = 0
      while (this.accumulator >= FIXED_STEP && steps < 5) {
        this.step(FIXED_STEP)
        this.accumulator -= FIXED_STEP
        steps += 1
        if (this.state !== 'playing') break
      }
    } else if (this.state === 'menu') {
      this.menuTime += dt
      this.player.group.rotation.y = Math.sin(this.menuTime * 0.45) * 0.3
      this.player.update(dt, false)
    } else if (this.state === 'dead') {
      this.player.update(dt, false)
    }

    this.ambience.update(dt)
    this.updateCamera(dt)
    this.renderer.render(this.scene, this.camera)
  }
}
