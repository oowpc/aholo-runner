const BEST_KEY = 'make-it-run.best'

function readBest(): number {
  try {
    const value = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

export class Scoring {
  distance = 0
  fragments = 0
  best = readBest()

  reset(): void {
    this.distance = 0
    this.fragments = 0
  }

  update(dt: number, speed: number): void {
    this.distance += speed * dt
  }

  collect(count = 1): void {
    this.fragments += count
  }

  get meters(): number {
    return Math.floor(this.distance)
  }

  get isRecord(): boolean {
    return this.meters > this.best
  }

  commit(): void {
    if (!this.isRecord) return
    this.best = this.meters
    try {
      localStorage.setItem(BEST_KEY, String(this.best))
    } catch {
      // storage can be unavailable in private modes; best stays in memory
    }
  }
}
