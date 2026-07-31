import type { Board, Player } from '../types/index'
import { useUIStore } from '../../stores/uiStore'

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

// ─── Helpers ─────────────────────────────────────────

/**
 * Convert cell index (1-100) to canvas x,y coordinates.
 * Board layout: zigzag — row 1 (bottom) left→right, row 2 right→left, etc.
 */
export function cellToXY(index: number, cellSize: number): { x: number; y: number } {
  const row = Math.floor((index - 1) / 10)
  const col = (index - 1) % 10
  const x = row % 2 === 0 ? col * cellSize : (9 - col) * cellSize
  const y = (9 - row) * cellSize
  return { x, y }
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    this.observer = new ResizeObserver(() => {
      this.resize()
      this.draw()
    })
    this.observer.observe(canvas.parentElement ?? canvas)

    this.resize()
  }

  // ─── Public API ────────────────────────────────────
  setBoard(board: Board): void {
    this.board = board
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

    const duration = 150
    const startTime = performance.now()

    const step = (now: number) => {
      this.animProgress = Math.min((now - startTime) / duration, 1)

      // Update player position visually
      if (this.players[this.animatingPlayerIndex]) {
        this.players = this.players.map((p, i) =>
          i === this.animatingPlayerIndex
            ? { ...p, position: this.animProgress < 1 ? this.animFromPos : this.animToPos }
            : p,
        )
      }

      this.draw()

      if (this.animProgress < 1) {
        requestAnimationFrame(step)
      } else {
        this.playNextStep()
      }
    }

    requestAnimationFrame(step)
  }

  start(): void {
    const loop = () => {
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
  }

  // ─── Resize ────────────────────────────────────────
  private resize(): void {
    const dpr = window.devicePixelRatio ?? 1
    const parent = this.canvas.parentElement
    const size = parent ? Math.min(parent.clientWidth, parent.clientHeight) : 500

    this.canvas.width = size * dpr
    this.canvas.height = size * dpr
    this.canvas.style.width = `${size}px`
    this.canvas.style.height = `${size}px`
    this.ctx.scale(dpr, dpr)
    this.cellSize = size / 10
  }

  // ─── Draw ──────────────────────────────────────────
  private draw(): void {
    const { ctx, cellSize } = this
    const size = cellSize * 10

    // Clear
    ctx.clearRect(0, 0, size, size)

    this.drawCells()
    if (this.board) {
      this.drawSnakes()
      this.drawLadders()
      this.drawChallengeBlocks()
      this.drawTokens()
    }
  }

  // ─── Draw Cells ────────────────────────────────────
  private drawCells(): void {
    const { ctx, cellSize } = this

    for (let i = 1; i <= 100; i++) {
      const { x, y } = cellToXY(i, cellSize)

      // Background
      ctx.fillStyle = i % 2 === 0 ? COLORS.cellBg : COLORS.cellAlt
      ctx.fillRect(x, y, cellSize, cellSize)

      // Border
      ctx.strokeStyle = COLORS.cellBorder
      ctx.lineWidth = 0.5
      ctx.strokeRect(x, y, cellSize, cellSize)

      // Number
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

      // Head circle
      ctx.beginPath()
      ctx.arc(hx, hy, cellSize * 0.18, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.snake
      ctx.fill()

      // Head emoji
      ctx.font = `${cellSize * 0.35}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🐍', hx, hy)
    }
  }

  // ─── Draw Ladders ──────────────────────────────────
  private drawLadders(): void {
    if (!this.board) return
    const { ctx, cellSize } = this

    for (const ladder of this.board.ladders) {
      const bottom = cellToXY(ladder.bottom, cellSize)
      const top = cellToXY(ladder.top, cellSize)

      const bx = bottom.x + cellSize / 2
      const by = bottom.y + cellSize / 2
      const tx = top.x + cellSize / 2
      const ty = top.y + cellSize / 2

      // Main line
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(tx, ty)
      ctx.strokeStyle = COLORS.ladder
      ctx.lineWidth = cellSize * 0.1
      ctx.lineCap = 'round'
      ctx.stroke()

      // Bottom circle
      ctx.beginPath()
      ctx.arc(bx, by, cellSize * 0.15, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.ladder
      ctx.fill()

      // Top arrow
      ctx.beginPath()
      ctx.arc(tx, ty, cellSize * 0.18, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.ladder
      ctx.fill()

      // Top emoji
      ctx.font = `${cellSize * 0.35}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🪜', tx, ty)
    }
  }

  // ─── Draw Challenge Blocks ─────────────────────────
  private drawChallengeBlocks(): void {
    if (!this.board) return
    const { ctx, cellSize } = this

    for (const block of this.board.challengeBlocks) {
      const { x, y } = cellToXY(block.cellIndex, cellSize)

      // Amber overlay
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'
      ctx.fillRect(x, y, cellSize, cellSize)

      // Question mark
      ctx.fillStyle = COLORS.challenge
      ctx.font = `bold ${cellSize * 0.4}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', x + cellSize / 2, y + cellSize / 2)
    }
  }

  // ─── Draw Tokens ───────────────────────────────────
  private drawTokens(): void {
    const { ctx, cellSize } = this

    // Group players by position
    const grouped = new Map<number, Player[]>()
    for (const player of this.players) {
      const existing = grouped.get(player.position) ?? []
      grouped.set(player.position, [...existing, player])
    }

    for (const [position, players] of grouped) {
      const { x, y } = cellToXY(position, cellSize)
      const cx = x + cellSize / 2
      const cy = y + cellSize / 2

      // Offset layout for multiple players on same cell
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

        // Circle
        ctx.beginPath()
        ctx.arc(tx, ty, radius, 0, Math.PI * 2)
        ctx.fillStyle = player.color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Initial
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${radius * 1.1}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(player.name[0]?.toUpperCase() ?? '?', tx, ty)
      })
    }
  }
}
