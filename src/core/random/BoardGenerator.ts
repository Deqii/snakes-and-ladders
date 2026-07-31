import type { Snake, Ladder } from '../types/index'
import { type PRNG, randomInt } from './prng'

const SNAKE_COUNT = 6
const LADDER_COUNT = 6
const MAX_RETRY = 100

// ─── Helpers ─────────────────────────────────────────
function isOccupied(cell: number, occupied: Set<number>): boolean {
  return occupied.has(cell) || cell === 1 || cell === 100
}

// ─── Generate Snakes ─────────────────────────────────
export function generateSnakes(prng: PRNG, occupied: Set<number>): Snake[] {
  const snakes: Snake[] = []
  const localOccupied = new Set(occupied)

  for (let i = 0; i < SNAKE_COUNT; i++) {
    let head: number
    let tail: number
    let attempts = 0

    do {
      if (attempts++ > MAX_RETRY) throw new Error('Could not place snake after max retries')
      head = randomInt(prng, 12, 99)
      tail = randomInt(prng, 2, head - 10)
    } while (isOccupied(head, localOccupied) || isOccupied(tail, localOccupied))

    snakes.push({ head, tail })
    localOccupied.add(head)
    localOccupied.add(tail)
  }

  return snakes
}

// ─── Generate Ladders ────────────────────────────────
export function generateLadders(prng: PRNG, occupied: Set<number>): Ladder[] {
  const ladders: Ladder[] = []
  const localOccupied = new Set(occupied)

  for (let i = 0; i < LADDER_COUNT; i++) {
    let bottom: number
    let top: number
    let attempts = 0

    do {
      if (attempts++ > MAX_RETRY) throw new Error('Could not place ladder after max retries')
      bottom = randomInt(prng, 2, 88)
      top = randomInt(prng, bottom + 10, 99)
    } while (isOccupied(bottom, localOccupied) || isOccupied(top, localOccupied))

    ladders.push({ bottom, top })
    localOccupied.add(bottom)
    localOccupied.add(top)
  }

  return ladders
}

// ─── Generate Board ──────────────────────────────────
export function generateSnakesAndLadders(
  prng: PRNG,
  existingOccupied: Set<number> = new Set(),
): { snakes: Snake[]; ladders: Ladder[]; occupied: Set<number> } {
  const occupied = new Set(existingOccupied)

  const snakes = generateSnakes(prng, occupied)
  snakes.forEach((s) => {
    occupied.add(s.head)
    occupied.add(s.tail)
  })

  const ladders = generateLadders(prng, occupied)
  ladders.forEach((l) => {
    occupied.add(l.bottom)
    occupied.add(l.top)
  })

  return { snakes, ladders, occupied }
}
