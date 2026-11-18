import { THEMES, THEME_ORDER, type ThemeId } from '../data/themes'

export interface MenuCallbacks {
  onStart: () => void
  onSelectTheme: (themeId: ThemeId) => void
  onGallery: () => void
  onRestart: () => void
  onHome: () => void
}

export interface RunResult {
  meters: number
  fragments: number
  best: number
  record: boolean
}

export class Menu {
  private readonly menuEl: HTMLDivElement
  private readonly resultEl: HTMLDivElement
  private readonly bestValue: HTMLElement
  private readonly themeButtons: HTMLButtonElement[] = []
  private readonly resultDistance: HTMLElement
  private readonly resultFragments: HTMLElement
  private readonly resultBest: HTMLElement
  private readonly recordBadge: HTMLElement

  constructor(root: HTMLElement, callbacks: MenuCallbacks) {
    this.menuEl = document.createElement('div')
    this.menuEl.className = 'screen menu-screen'
    this.menuEl.innerHTML = `
      <div class="menu-card">
        <p class="eyebrow">AHOLO · 3D AI HACKATHON</p>
        <h1>造物跑酷</h1>
        <p class="subtitle">MAKE IT RUN</p>
        <p class="lead">把身边的物品交给 Aholo Lux3D，<br>变成你的跑者，冲进生成的世界。</p>
        <div class="theme-list" role="group" aria-label="选择主题"></div>
        <div class="actions">
          <button type="button" class="btn primary" data-action="start">开始奔跑</button>
          <button type="button" class="btn ghost" data-action="gallery">造物档案</button>
        </div>
        <p class="hint">← → 换道 · 空格 / ↑ 跳跃 · 手机滑动或点按</p>
        <p class="best">最佳里程 <strong>0</strong> m</p>
      </div>
    `

    this.bestValue = this.menuEl.querySelector('.best strong') as HTMLElement
    const themeList = this.menuEl.querySelector('.theme-list') as HTMLElement

    for (const themeId of THEME_ORDER) {
      const theme = THEMES[themeId]
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'theme-chip'
      button.dataset.theme = themeId
      button.innerHTML = `
        <span class="theme-swatch" style="background: radial-gradient(circle at 30% 25%, ${theme.accentCss}, ${theme.accentCss}22 55%, transparent 75%)"></span>
        <span class="theme-copy">
          <span class="theme-name">${theme.name}</span>
          <span class="theme-tagline">${theme.tagline}</span>
        </span>
      `
      button.addEventListener('click', () => callbacks.onSelectTheme(themeId))
      this.themeButtons.push(button)
      themeList.appendChild(button)
    }

    ;(this.menuEl.querySelector('[data-action="start"]') as HTMLButtonElement).addEventListener('click', callbacks.onStart)
    ;(this.menuEl.querySelector('[data-action="gallery"]') as HTMLButtonElement).addEventListener('click', callbacks.onGallery)

    this.resultEl = document.createElement('div')
    this.resultEl.className = 'screen result-screen is-hidden'
    this.resultEl.innerHTML = `
      <div class="menu-card result-card">
        <p class="eyebrow">RUN COMPLETE</p>
        <h2>本次造物里程</h2>
        <p class="result-distance"><strong>0</strong><span>m</span></p>
        <p class="result-meta">灵感碎片 <strong>0</strong> · 最佳 <strong>0</strong> m</p>
        <p class="record-badge is-hidden">新纪录</p>
        <div class="actions">
          <button type="button" class="btn primary" data-action="restart">再跑一次</button>
          <button type="button" class="btn ghost" data-action="home">回到营地</button>
        </div>
      </div>
    `

    this.resultDistance = this.resultEl.querySelector('.result-distance strong') as HTMLElement
    this.resultFragments = this.resultEl.querySelector('.result-meta strong') as HTMLElement
    this.resultBest = this.resultEl.querySelectorAll('.result-meta strong')[1] as HTMLElement
    this.recordBadge = this.resultEl.querySelector('.record-badge') as HTMLElement

    ;(this.resultEl.querySelector('[data-action="restart"]') as HTMLButtonElement).addEventListener('click', callbacks.onRestart)
    ;(this.resultEl.querySelector('[data-action="home"]') as HTMLButtonElement).addEventListener('click', callbacks.onHome)

    root.appendChild(this.menuEl)
    root.appendChild(this.resultEl)
  }

  show(best: number, themeId: ThemeId): void {
    this.bestValue.textContent = String(best)
    this.setActiveTheme(themeId)
    this.menuEl.classList.remove('is-hidden')
    this.resultEl.classList.add('is-hidden')
  }

  hide(): void {
    this.menuEl.classList.add('is-hidden')
    this.resultEl.classList.add('is-hidden')
  }

  setActiveTheme(themeId: ThemeId): void {
    for (const button of this.themeButtons) {
      button.classList.toggle('is-active', button.dataset.theme === themeId)
    }
  }

  showResult(result: RunResult): void {
    this.resultDistance.textContent = String(result.meters)
    this.resultFragments.textContent = String(result.fragments)
    this.resultBest.textContent = String(result.best)
    this.recordBadge.classList.toggle('is-hidden', !result.record)
    this.menuEl.classList.add('is-hidden')
    this.resultEl.classList.remove('is-hidden')
  }

  get isMenuVisible(): boolean {
    return !this.menuEl.classList.contains('is-hidden')
  }

  get isResultVisible(): boolean {
    return !this.resultEl.classList.contains('is-hidden')
  }
}
