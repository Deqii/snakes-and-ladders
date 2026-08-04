import { describe, it, expect } from 'vitest'
import { ParticlePool } from '../ParticlePool'

describe('ParticlePool', () => {
  it('starts with zero active particles', () => {
    const pool = new ParticlePool(10)
    expect(pool.activeCount).toBe(0)
    expect(pool.capacity).toBe(10)
  })

  it('activates a particle on spawn', () => {
    const pool = new ParticlePool(10)
    pool.spawn({ x: 1, y: 2, vx: 0, vy: 0, size: 4, color: '#fff', life: 1 })
    expect(pool.activeCount).toBe(1)
    const [active] = pool.getActive()
    expect(active?.x).toBe(1)
    expect(active?.y).toBe(2)
  })

  it('does not exceed capacity when spawning more than maxParticles', () => {
    const pool = new ParticlePool(5)
    for (let i = 0; i < 20; i++) {
      pool.spawn({ x: 0, y: 0, vx: 0, vy: 0, size: 1, color: '#fff', life: 10 })
    }
    expect(pool.activeCount).toBe(5)
    expect(pool.capacity).toBe(5)
  })

  it('moves particles according to velocity on update', () => {
    const pool = new ParticlePool(5)
    pool.spawn({ x: 0, y: 0, vx: 10, vy: -5, size: 1, color: '#fff', life: 10 })
    pool.update(1)
    const [active] = pool.getActive()
    expect(active?.x).toBe(10)
    expect(active?.y).toBe(-5)
  })

  it('deactivates a particle once its life expires', () => {
    const pool = new ParticlePool(5)
    pool.spawn({ x: 0, y: 0, vx: 0, vy: 0, size: 1, color: '#fff', life: 1 })
    pool.update(0.5)
    expect(pool.activeCount).toBe(1)
    pool.update(0.6)
    expect(pool.activeCount).toBe(0)
  })

  it('reuses a freed slot for a new spawn instead of growing the pool', () => {
    const pool = new ParticlePool(1)
    pool.spawn({ x: 0, y: 0, vx: 0, vy: 0, size: 1, color: '#fff', life: 0.1 })
    pool.update(0.2) // expires the only particle
    expect(pool.activeCount).toBe(0)

    pool.spawn({ x: 5, y: 5, vx: 0, vy: 0, size: 1, color: '#fff', life: 10 })
    expect(pool.activeCount).toBe(1)
    expect(pool.capacity).toBe(1)
    const [active] = pool.getActive()
    expect(active?.x).toBe(5)
  })

  it('clear() deactivates all particles', () => {
    const pool = new ParticlePool(5)
    for (let i = 0; i < 5; i++) {
      pool.spawn({ x: 0, y: 0, vx: 0, vy: 0, size: 1, color: '#fff', life: 10 })
    }
    expect(pool.activeCount).toBe(5)
    pool.clear()
    expect(pool.activeCount).toBe(0)
  })
})
