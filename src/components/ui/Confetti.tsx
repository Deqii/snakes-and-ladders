import { useEffect, useRef } from 'react'
import { ParticlePool } from '../../core/engine/ParticlePool'

const MAX_PARTICLES = 150
const BURST_COUNT = 120
const GRAVITY = 350 // px/s^2
const COLORS = ['#4ade80', '#f472b6', '#60a5fa', '#fb923c', '#facc15', '#a78bfa']

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio ?? 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const pool = new ParticlePool(MAX_PARTICLES)
    const centerX = window.innerWidth / 2

    // Initial burst from the top-center, spreading outward and downward.
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = randomBetween(-Math.PI * 0.85, -Math.PI * 0.15)
      const speed = randomBetween(150, 420)
      pool.spawn({
        x: centerX + randomBetween(-40, 40),
        y: window.innerHeight * 0.25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randomBetween(4, 9),
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#ffffff',
        life: randomBetween(1.4, 2.4),
      })
    }

    let rafId: number
    let lastTime = performance.now()

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      for (const p of pool.getActive()) {
        // Gravity pulls particles downward over time.
        // (Applied here rather than inside the pool so the pool stays generic.)
        p.vy += GRAVITY * dt
      }
      pool.update(dt)

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const p of pool.getActive()) {
        const alpha = Math.max(p.life / p.maxLife, 0)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
      ctx.globalAlpha = 1

      if (pool.activeCount > 0) {
        rafId = requestAnimationFrame(loop)
      }
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      pool.clear()
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40" aria-hidden="true" />
  )
}
