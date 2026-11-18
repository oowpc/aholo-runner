export interface HudCallbacks {
  onPause: () => void
  onResume: () => void
  onGallery: () => void
  onHome: () => void
}

export class HUD {
  private readonly hudEl: HTMLDivElement
  private readonly pauseEl: HTMLDivElement
  private readonly distanceValue: HTMLElement
  private readonly fragmentValue: HTMLElement
  private readonly bestValue: HTMLElement

  constructor(root: HTMLElement, callbacks: HudCallbacks) {
    this.hudEl = document.createElement('div')
    this.hudEl.className = 'hud is-hidden'
    this.hudEl.innerHTML = `
      <div class="hud-stat">
        <span class="hud-label">距离</span>
        <strong class="hud-value" data-hud="distance">0</strong>
        <small>m</small>
      </div>
      <div class="hud-best">最佳 <strong data-hud="best">0</strong> m</div>
      <div class="hud-stat hud-fragments">
        <span class="hud-label">灵感碎片</span>
        <strong class="hud-value" data-hud="fragments">0</strong>
      </div>
      <button type="button" class="icon-btn pause-btn" aria-label="暂停">II</button>
    `

    this.distanceValue = this.hudEl.querySelector('[data-hud="distance"]') as HTMLElement
    this.fragmentValue = this.hudEl.querySelector('[data-hud="fragments"]') as HTMLElement
    this.bestValue = this.hudEl.querySelector('[data-hud="best"]') as HTMLElement

    ;(this.hudEl.querySelector('.pause-btn') as HTMLButtonElement).addEventListener('click', callbacks.onPause)

    this.pauseEl = document.createElement('div')
    this.pauseEl.className = 'screen pause-screen is-hidden'
    this.pauseEl.innerHTML = `
      <div class="menu-card menu-card-small">
        <p class="eyebrow">PAUSED</p>
        <h2>已暂停</h2>
        <div class="actions vertical">
          <button type="button" class="btn primary" data-action="resume">继续</button>
          <button type="button" class="btn ghost" data-action="gallery">造物档案</button>
          <button type="button" class="btn ghost" data-action="home">回到营地</button>
        </div>
      </div>
    `

    ;(this.pauseEl.querySelector('[data-action="resume"]') as HTMLButtonElement).addEventListener('click', callbacks.onResume)
    ;(this.pauseEl.querySelector('[data-action="gallery"]') as HTMLButtonElement).addEventListener('click', callbacks.onGallery)
    ;(this.pauseEl.querySelector('[data-action="home"]') as HTMLButtonElement).addEventListener('click', callbacks.onHome)

    root.appendChild(this.hudEl)
    root.appendChild(this.pauseEl)
  }

  show(): void {
    this.hudEl.classList.remove('is-hidden')
  }

  hide(): void {
    this.hudEl.classList.add('is-hidden')
    this.pauseEl.classList.add('is-hidden')
  }

  update(meters: number, fragments: number, best: number): void {
    this.distanceValue.textContent = String(meters)
    this.fragmentValue.textContent = String(fragments)
    this.bestValue.textContent = String(best)
  }

  flashFragment(): void {
    this.fragmentValue.classList.remove('pop')
    void this.fragmentValue.offsetWidth
    this.fragmentValue.classList.add('pop')
  }

  showPause(): void {
    this.pauseEl.classList.remove('is-hidden')
  }

  hidePause(): void {
    this.pauseEl.classList.add('is-hidden')
  }

  get isPauseVisible(): boolean {
    return !this.pauseEl.classList.contains('is-hidden')
  }
}
