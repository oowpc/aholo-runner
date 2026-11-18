import { ASSETS } from '../data/assets'

export class Gallery {
  private readonly el: HTMLDivElement

  constructor(root: HTMLElement, onClose: () => void) {
    this.el = document.createElement('div')
    this.el.className = 'screen gallery-screen is-hidden'

    const cards = ASSETS.map((asset, index) => {
      const glyph = asset.name.slice(0, 1)
      const tint = `hsl(${(index * 47) % 360} 70% 62%)`
      const preview = asset.thumb
        ? `<img src="${asset.thumb}" alt="${asset.name}" loading="lazy" />`
        : `<div class="asset-preview" style="--tint:${tint}"><span class="asset-glyph">${glyph}</span></div>`
      const method = asset.method === 'image' ? '图生 3D' : '文生 3D'
      const status = asset.generated
        ? '<span class="asset-status ok">GLB 已接入</span>'
        : '<span class="asset-status">待导入 GLB</span>'

      return `
        <article class="asset-card">
          ${preview}
          <div class="asset-body">
            <div class="asset-title-row">
              <h3>${asset.name}</h3>
              <span class="asset-method">${method}</span>
            </div>
            <p class="asset-usage">${asset.usage}</p>
            <p class="asset-prompt">${asset.prompt}</p>
            <div class="asset-meta">
              <span>${asset.tris ? `${asset.tris.toLocaleString('en-US')} tris` : '面数待记录'}</span>
              ${status}
            </div>
          </div>
        </article>
      `
    }).join('')

    this.el.innerHTML = `
      <div class="gallery-panel">
        <header class="gallery-header">
          <div>
            <p class="eyebrow">AHOLO LUX3D · 造物档案</p>
            <h2>每个资产，都从一张照片或一句话开始</h2>
          </div>
          <button type="button" class="btn ghost close-gallery">返回</button>
        </header>
        <p class="gallery-lead">
          游戏内的玩家角色、障碍与收集物全部由 Aholo Lux3D 生成：照片经图生 3D 变成跑者，
          其余道具用文生 3D 制作，导出 GLB 后接入 WebGL 场景。这里保留每次生成的提示词与用途，
          与项目报告书中的过程记录一一对应。
        </p>
        <div class="gallery-grid">${cards}</div>
      </div>
    `

    ;(this.el.querySelector('.close-gallery') as HTMLButtonElement).addEventListener('click', onClose)
    root.appendChild(this.el)
  }

  open(): void {
    this.el.classList.remove('is-hidden')
  }

  close(): void {
    this.el.classList.add('is-hidden')
  }

  get isOpen(): boolean {
    return !this.el.classList.contains('is-hidden')
  }
}
