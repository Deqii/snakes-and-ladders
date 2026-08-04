// ─── Types ───────────────────────────────────────────
export interface Particle {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

function createParticle(): Particle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 0,
    color: '#ffffff',
    life: 0,
    maxLife: 1,
  }
}

export interface SpawnOptions {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
}

// ─── ParticlePool ────────────────────────────────────
/**
 * Fixed-size particle pool. All particle objects are allocated once up front;
 * spawning reuses an inactive slot instead of pushing a new object, and
 * "removing" a particle just flips `active` back to false. This avoids
 * per-frame allocation/GC churn during long animation sessions.
 */
export class ParticlePool {
  private particles: Particle[]

  constructor(maxParticles: number) {
    this.particles = Array.from({ length: maxParticles }, createParticle)
  }

  /** Activates the first free slot with the given properties. No-op if the pool is full. */
  spawn(options: SpawnOptions): void {
    const particle = this.particles.find((p) => !p.active)
    if (!particle) return

    particle.active = true
    particle.x = options.x
    particle.y = options.y
    particle.vx = options.vx
    particle.vy = options.vy
    particle.size = options.size
    particle.color = options.color
    particle.life = options.life
    particle.maxLife = options.life
  }

  /** Advances all active particles by `dt` seconds, deactivating any that expire. */
  update(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue

      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        continue
      }

      p.x += p.vx * dt
      p.y += p.vy * dt
    }
  }

  /** Read-only view of currently active particles, for drawing. */
  getActive(): readonly Particle[] {
    return this.particles.filter((p) => p.active)
  }

  get activeCount(): number {
    let count = 0
    for (const p of this.particles) {
      if (p.active) count++
    }
    return count
  }

  get capacity(): number {
    return this.particles.length
  }

  clear(): void {
    for (const p of this.particles) {
      p.active = false
    }
  }
}
