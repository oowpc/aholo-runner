export class Sfx {
  private ctx: AudioContext | null = null
  private muted = false

  unlock(): void {
    if (this.muted) return
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return
        this.ctx = new Ctor()
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch {
      this.ctx = null
    }
  }

  private tone(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    if (!this.ctx || this.muted) return
    const ctx = this.ctx
    const start = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, start)
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  jump(): void {
    this.tone(320, 620, 0.18, 'triangle', 0.08)
  }

  pickup(): void {
    this.tone(880, 1320, 0.09, 'sine', 0.07)
    this.tone(1320, 1760, 0.08, 'sine', 0.05, 0.05)
  }

  hit(): void {
    this.tone(220, 60, 0.32, 'sawtooth', 0.09)
    this.tone(110, 45, 0.38, 'square', 0.05, 0.02)
  }

  click(): void {
    this.tone(520, 680, 0.06, 'sine', 0.04)
  }

  start(): void {
    this.tone(392, 523, 0.1, 'triangle', 0.05)
    this.tone(523, 784, 0.12, 'triangle', 0.05, 0.09)
  }
}
