import type { Board, Player } from '../types/index'
import { useUIStore } from '../../stores/uiStore'
import { ParticlePool } from './ParticlePool'
import snakeGreenBodyUrl from '../../assets/snakes/snake-green-body.svg'
import snakeGreenHeadUrl from '../../assets/snakes/snake-green-head.svg'
import snakeRedBodyUrl from '../../assets/snakes/snake-red-body.svg'
import snakeRedHeadUrl from '../../assets/snakes/snake-red-head.svg'
import snakePurpleBodyUrl from '../../assets/snakes/snake-purple-body.svg'
import snakePurpleHeadUrl from '../../assets/snakes/snake-purple-head.svg'
import snakeOrangeBodyUrl from '../../assets/snakes/snake-orange-body.svg'
import snakeOrangeHeadUrl from '../../assets/snakes/snake-orange-head.svg'
import snakeBlueBodyUrl from '../../assets/snakes/snake-blue-body.svg'
import snakeBlueHeadUrl from '../../assets/snakes/snake-blue-head.svg'
import ladderUnitUrl from '../../assets/ladder/ladder-unit.svg'

// ─── Constants ───────────────────────────────────────
const COLORS = {
  cellBg: '#16213e',
  cellAlt: '#0f3460',
  cellBorder: '#1a1a4e',
  cellText: '#94a3b8',
  snake: '#e94560',
  ladder: '#4ade80',
  challenge: '#f59e0b',
  challengeText: '#1c1c1c',
} as const

interface SnakeVariant {
  body: string
  head: string
}

const SNAKE_VARIANTS: SnakeVariant[] = [
  { body: snakeGreenBodyUrl, head: snakeGreenHeadUrl },
  { body: snakeRedBodyUrl, head: snakeRedHeadUrl },
  { body: snakePurpleBodyUrl, head: snakePurpleHeadUrl },
  { body: snakeOrangeBodyUrl, head: snakeOrangeHeadUrl },
  { body: snakeBlueBodyUrl, head: snakeBlueHeadUrl },
]

const TRAIL_MAX_PARTICLES = 60
const TRAIL_SPAWN_INTERVAL = 0.05

const SNAKE_SEGMENT_SPACING = 14
const LADDER_RUNG_SPACING = 26

// ─── Helpers ─────────────────────────────────────────

export function cellToXY(index: number, cellSize: number): { x: number; y: number } {
  const row = Math.floor((index - 1) / 10)
  const col = (index - 1) % 10
  const x = row % 2 === 0 ? col * cellSize : (9 - col) * cellSize
  const y = (9 - row) * cellSize
  return { x, y }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

interface Point {
  x: number
  y: number
}

function quadraticBezierPoint(p0: Point, control: Point, p1: Point, t: number): Point {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * control.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * control.y + t * t * p1.y,
  }
}

function quadraticBezierTangentAngle(p0: Point, control: Point, p1: Point, t: number): number {
  const mt = 1 - t
  const dx = 2 * mt * (control.x - p0.x) + 2 * t * (p1.x - control.x)
  const dy = 2 * mt * (control.y - p0.y) + 2 * t * (p1.y - control.y)
  return Math.atan2(dy, dx)
}

interface PathSegment {
  x: number
  y: number
  angle: number
  isEnd: boolean
}

function computeCurvedPath(
  tail: Point,
  head: Point,
  spacing: number,
  bowFactor: number,
): PathSegment[] {
  const dx = head.x - tail.x
  const dy = head.y - tail.y
  const distance = Math.max(Math.hypot(dx, dy), 1)

  const perpX = -dy / distance
  const perpY = dx / distance
  const hashSeed = Math.round(tail.x) * 31 + Math.round(tail.y) * 17 + Math.round(head.x) * 7
  const bowSign = hashSeed % 2 === 0 ? 1 : -1
  const bowAmount = distance * bowFactor * bowSign

  const control: Point = {
    x: (tail.x + head.x) / 2 + perpX * bowAmount,
    y: (tail.y + head.y) / 2 + perpY * bowAmount,
  }

  const segments: PathSegment[] = []
  const steps = Math.max(4, Math.round(distance / spacing))

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const point = quadraticBezierPoint(tail, control, head, t)
    const angle = quadraticBezierTangentAngle(tail, control, head, t)
    segments.push({ x: point.x, y: point.y, angle, isEnd: i === steps })
  }

  return segments
}

function computeStraightPath(from: Point, to: Point, spacing: number): PathSegment[] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.max(Math.hypot(dx, dy), 1)
  const angle = Math.atan2(dy, dx)

  const segments: PathSegment[] = []
  const steps = Math.max(1, Math.round(distance / spacing))

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    segments.push({
      x: from.x + dx * t,
      y: from.y + dy * t,
      angle,
      isEnd: i === steps,
    })
  }

  return segments
}

// ─── Renderer Class ───────────────────────────────────
export class BoardRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private cellSize: number = 0
  private board: Board | null = null
  private players: Player[] = []
  private animationQueue: number[] = []
  private animatingPlayerIndex: number = -1
  private animProgress: number = 0
  private animFromPos: number = 0
  private animToPos: number = 0
  private rafId: number | null = null
  private observer: ResizeObserver
  private trailPool: ParticlePool = new ParticlePool(TRAIL_MAX_PARTICLES)
  private lastFrameTime: number = performance.now()
  private lastTrailSpawnTime: number = 0

  private snakeBodyImages: HTMLImageElement[] = []
  private snakeHeadImages: HTMLImageElement[] = []
  private ladderUnitImage: HTMLImageElement | null = null
  private assetsReady: boolean = false

  private snakeVariantByHead: Map<number, number> = new Map()
  private snakePathByHead: Map<number, PathSegment[]> = new Map()
  private ladderPathByBottom: Map<number, PathSegment[]> = new Map()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    this.observer = new ResizeObserver(() => {
      this.resize()
      this.rebuildPaths()
      this.draw()
    })
    this.observer.observe(canvas.parentElement ?? canvas)

    setTimeout(() => {
      this.resize()
      this.rebuildPaths()
      this.draw()
    }, 0)

    this.preloadAssets()
  }

  private async preloadAssets(): Promise<void> {
    try {
      const [bodyImages, headImages, ladderUnitImage] = await Promise.all([
        Promise.all(SNAKE_VARIANTS.map((v) => loadImage(v.body))),
        Promise.all(SNAKE_VARIANTS.map((v) => loadImage(v.head))),
        loadImage(ladderUnitUrl),
      ])
      this.snakeBodyImages = bodyImages
      this.snakeHeadImages = headImages
      this.ladderUnitImage = ladderUnitImage
      this.assetsReady = true
      this.rebuildPaths()
      this.draw()
    } catch {
      this.assetsReady = false
    }
  }

  private rebuildPaths(): void {
    if (!this.board || this.cellSize === 0) return

    this.snakePathByHead = new Map()
    for (const snake of this.board.snakes) {
      const head = cellToXY(snake.head, this.cellSize)
      const tail = cellToXY(snake.tail, this.cellSize)
      const headPoint = { x: head.x + this.cellSize / 2, y: head.y + this.cellSize / 2 }
      const tailPoint = { x: tail.x + this.cellSize / 2, y: tail.y + this.cellSize / 2 }

      const path = computeCurvedPath(tailPoint, headPoint, SNAKE_SEGMENT_SPACING, 0.18)
      this.snakePathByHead.set(snake.head, path)
    }

    this.ladderPathByBottom = new Map()
    for (const ladder of this.board.ladders) {
      const bottom = cellToXY(ladder.bottom, this.cellSize)
      const top = cellToXY(ladder.top, this.cellSize)
      const bottomPoint = { x: bottom.x + this.cellSize / 2, y: bottom.y + this.cellSize / 2 }
      const topPoint = { x: top.x + this.cellSize / 2, y: top.y + this.cellSize / 2 }

      const path = computeStraightPath(bottomPoint, topPoint, LADDER_RUNG_SPACING)
      this.ladderPathByBottom.set(ladder.bottom, path)
    }
  }

  // ─── Public API ────────────────────────────────────
  setBoard(board: Board): void {
    this.board = board
    this.snakeVariantByHead = new Map(
      board.snakes.map((snake) => [snake.head, Math.floor(Math.random() * SNAKE_VARIANTS.length)]),
    )
    this.rebuildPaths()
    this.draw()
  }

  setPlayers(players: Player[]): void {
    this.players = players
    this.draw()
  }

  animatePlayerMove(playerIndex: number, path: number[]): void {
    this.animatingPlayerIndex = playerIndex
    this.animationQueue = path
    useUIStore.getState().setIsAnimating(true)
    this.playNextStep()
  }

  private playNextStep(): void {
    const next = this.animationQueue.shift()
    if (next === undefined) {
      this.animatingPlayerIndex = -1
      useUIStore.getState().setIsAnimating(false)
      return
    }

    const player = this.players[this.animatingPlayerIndex]
    if (!player) return

    this.animFromPos = player.position
    this.animToPos = next
    this.animProgress = 0

    const duration = 300
    const startTime = performance.now()

    const step = (now: number) => {
      this.animProgress = Math.min((now - startTime) / duration, 1)

      if (this.players[this.animatingPlayerIndex]) {
        this.players = this.players.map((p, i) =>
          i === this.animatingPlayerIndex
            ? { ...p, position: this.animProgress < 1 ? this.animFromPos : this.animToPos }
            : p,
        )
      }

      this.spawnTrailParticle()
      this.draw()

      if (this.animProgress < 1) {
        requestAnimationFrame(step)
      } else {
        this.playNextStep()
      }
    }

    requestAnimationFrame(step)
  }

  private spawnTrailParticle(): void {
    const now = performance.now()
    if ((now - this.lastTrailSpawnTime) / 1000 < TRAIL_SPAWN_INTERVAL) return
    this.lastTrailSpawnTime = now

    const player = this.players[this.animatingPlayerIndex]
    if (!player) return

    const from = cellToXY(this.animFromPos, this.cellSize)
    const to = cellToXY(this.animToPos, this.cellSize)
    const lerp = (a: number, b: number) => a + (b - a) * this.animProgress

    const cx = lerp(from.x, to.x) + this.cellSize / 2
    const cy = lerp(from.y, to.y) + this.cellSize / 2

    this.trailPool.spawn({
      x: cx + (Math.random() - 0.5) * this.cellSize * 0.2,
      y: cy + (Math.random() - 0.5) * this.cellSize * 0.2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: this.cellSize * 0.12,
      color: player.color,
      life: 0.8,
    })
  }

  start(): void {
    this.lastFrameTime = performance.now()

    const loop = (now: number) => {
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05)
      this.lastFrameTime = now

      this.trailPool.update(dt)
      this.draw()

      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  destroy(): void {
    this.stop()
    this.observer.disconnect()
    this.trailPool.clear()
  }

  // ─── Resize ────────────────────────────────────────
  private resize(): void {
    const dpr = window.devicePixelRatio ?? 1
    const parent = this.canvas.parentElement
    const size =
      parent && parent.clientWidth > 0
        ? Math.min(parent.clientWidth, parent.clientHeight || parent.clientWidth)
        : 500

    this.canvas.width = size * dpr
    this.canvas.height = size * dpr
    this.canvas.style.width = `${size}px`
    this.canvas.style.height = `${size}px`

    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.scale(dpr, dpr)
    this.cellSize = size / 10
  }

  // ─── Draw ──────────────────────────────────────────
  private draw(): void {
    const { ctx, cellSize } = this
    const size = cellSize * 10

    ctx.clearRect(0, 0, size, size)

    this.drawCells()
    if (this.board) {
      this.drawSnakes()
      this.drawLadders()
      this.drawChallengeBlocks()
      this.drawTrail()
      this.drawTokens()
    }
  }

  // ─── Draw Cells ────────────────────────────────────
  private drawCells(): void {
    const { ctx, cellSize } = this

    for (let i = 1; i <= 100; i++) {
      const { x, y } = cellToXY(i, cellSize)

      ctx.fillStyle = i % 2 === 0 ? COLORS.cellBg : COLORS.cellAlt
      ctx.fillRect(x, y, cellSize, cellSize)

      ctx.strokeStyle = COLORS.cellBorder
      ctx.lineWidth = 0.5
      ctx.strokeRect(x, y, cellSize, cellSize)

      ctx.fillStyle = COLORS.cellText
      ctx.font = `bold ${cellSize * 0.22}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(i), x + cellSize / 2, y + cellSize / 2)
    }
  }

  // ─── Draw Snakes ───────────────────────────────────
  private drawSnakes(): void {
    if (!this.board) return
    const { ctx, cellSize } = this

    for (const snake of this.board.snakes) {
      const path = this.snakePathByHead.get(snake.head)
      const variantIndex = this.snakeVariantByHead.get(snake.head) ?? 0
      const bodyImage = this.snakeBodyImages[variantIndex]
      const headImage = this.snakeHeadImages[variantIndex]

      if (!this.assetsReady || !path || !bodyImage || !headImage) {
        const head = cellToXY(snake.head, cellSize)
        const tail = cellToXY(snake.tail, cellSize)
        const hx = head.x + cellSize / 2
        const hy = head.y + cellSize / 2
        const tx = tail.x + cellSize / 2
        const ty = tail.y + cellSize / 2

        ctx.beginPath()
        ctx.moveTo(hx, hy)
        ctx.bezierCurveTo(hx + cellSize, hy + cellSize, tx - cellSize, ty - cellSize, tx, ty)
        ctx.strokeStyle = COLORS.snake
        ctx.lineWidth = cellSize * 0.12
        ctx.lineCap = 'round'
        ctx.stroke()
        continue
      }

      const thickness = cellSize * 0.32
      const unitWidth = SNAKE_SEGMENT_SPACING * 1.6

      for (const segment of path) {
        const image = segment.isEnd ? headImage : bodyImage
        ctx.save()
        ctx.translate(segment.x, segment.y)
        ctx.rotate(segment.angle)
        ctx.drawImage(image, -unitWidth / 2, -thickness / 2, unitWidth, thickness)
        ctx.restore()
      }
    }
  }

  // ─── Draw Ladders ──────────────────────────────────
  private drawLadders(): void {
    if (!this.board) return
    const { ctx, cellSize } = this

    for (const ladder of this.board.ladders) {
      const path = this.ladderPathByBottom.get(ladder.bottom)

      if (!this.assetsReady || !path || !this.ladderUnitImage) {
        const bottom = cellToXY(ladder.bottom, cellSize)
        const top = cellToXY(ladder.top, cellSize)
        const bx = bottom.x + cellSize / 2
        const by = bottom.y + cellSize / 2
        const tx = top.x + cellSize / 2
        const ty = top.y + cellSize / 2

        ctx.beginPath()
        ctx.moveTo(bx, by)
        ctx.lineTo(tx, ty)
        ctx.strokeStyle = COLORS.ladder
        ctx.lineWidth = cellSize * 0.1
        ctx.lineCap = 'round'
        ctx.stroke()
        continue
      }

      const rungWidth = cellSize * 0.4
      const rungHeight = LADDER_RUNG_SPACING * 1.15

      for (const segment of path) {
        ctx.save()
        ctx.translate(segment.x, segment.y)
        ctx.rotate(segment.angle + Math.PI / 2)
        ctx.drawImage(this.ladderUnitImage, -rungWidth / 2, -rungHeight / 2, rungWidth, rungHeight)
        ctx.restore()
      }
    }
  }

  // ─── Draw Challenge Blocks ─────────────────────────
  private drawChallengeBlocks(): void {
    if (!this.board) return
    const { ctx, cellSize } = this

    for (const block of this.board.challengeBlocks) {
      const { x, y } = cellToXY(block.cellIndex, cellSize)

      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'
      ctx.fillRect(x, y, cellSize, cellSize)

      ctx.fillStyle = COLORS.challenge
      ctx.font = `bold ${cellSize * 0.4}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', x + cellSize / 2, y + cellSize / 2)
    }
  }

  // ─── Draw Trail ────────────────────────────────────
  private drawTrail(): void {
    const { ctx } = this

    for (const p of this.trailPool.getActive()) {
      const alpha = Math.max(p.life / p.maxLife, 0)
      const scale = alpha

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = alpha * 0.5
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  // ─── Draw Tokens ───────────────────────────────────
  private drawTokens(): void {
    const { ctx, cellSize } = this

    const grouped = new Map<number, Player[]>()
    for (const player of this.players) {
      const existing = grouped.get(player.position) ?? []
      grouped.set(player.position, [...existing, player])
    }

    for (const [position, players] of grouped) {
      const { x, y } = cellToXY(position, cellSize)
      const cx = x + cellSize / 2
      const cy = y + cellSize / 2

      const offsets: { dx: number; dy: number }[] = [
        { dx: 0, dy: 0 },
        { dx: cellSize * 0.25, dy: 0 },
        { dx: 0, dy: cellSize * 0.25 },
        { dx: cellSize * 0.25, dy: cellSize * 0.25 },
      ]

      players.forEach((player, i) => {
        const offset = offsets[i] ?? { dx: 0, dy: 0 }
        const tx = cx + offset.dx - (players.length > 1 ? cellSize * 0.12 : 0)
        const ty = cy + offset.dy - (players.length > 1 ? cellSize * 0.12 : 0)
        const radius = cellSize * (players.length > 1 ? 0.18 : 0.28)

        ctx.beginPath()
        ctx.arc(tx, ty, radius, 0, Math.PI * 2)
        ctx.fillStyle = player.color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${radius * 1.1}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(player.name[0]?.toUpperCase() ?? '?', tx, ty)
      })
    }
  }
}
