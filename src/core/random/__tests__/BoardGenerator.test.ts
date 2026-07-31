import { describe, it, expect } from 'vitest'
import { createPRNG } from '../prng'
import { generateSnakesAndLadders, generateChallengeBlocks } from '../BoardGenerator'

describe('BoardGenerator', () => {
  describe('generateSnakesAndLadders', () => {
    it('generates correct number of snakes and ladders', () => {
      const prng = createPRNG(42)
      const { snakes, ladders } = generateSnakesAndLadders(prng)
      expect(snakes).toHaveLength(6)
      expect(ladders).toHaveLength(6)
    })

    it('snake head is always above tail', () => {
      const prng = createPRNG(42)
      const { snakes } = generateSnakesAndLadders(prng)
      snakes.forEach((s) => {
        expect(s.head).toBeGreaterThan(s.tail)
      })
    })

    it('ladder top is always above bottom', () => {
      const prng = createPRNG(42)
      const { ladders } = generateSnakesAndLadders(prng)
      ladders.forEach((l) => {
        expect(l.top).toBeGreaterThan(l.bottom)
      })
    })

    it('no cell is used twice', () => {
      const prng = createPRNG(42)
      const { snakes, ladders } = generateSnakesAndLadders(prng)
      const cells: number[] = [
        ...snakes.map((s) => s.head),
        ...snakes.map((s) => s.tail),
        ...ladders.map((l) => l.bottom),
        ...ladders.map((l) => l.top),
      ]
      const unique = new Set(cells)
      expect(unique.size).toBe(cells.length)
    })

    it('no snake or ladder uses cell 1 or 100', () => {
      const prng = createPRNG(42)
      const { snakes, ladders } = generateSnakesAndLadders(prng)
      const cells = [
        ...snakes.map((s) => s.head),
        ...snakes.map((s) => s.tail),
        ...ladders.map((l) => l.bottom),
        ...ladders.map((l) => l.top),
      ]
      expect(cells).not.toContain(1)
      expect(cells).not.toContain(100)
    })

    it('is deterministic with same seed', () => {
      const { snakes: s1, ladders: l1 } = generateSnakesAndLadders(createPRNG(42))
      const { snakes: s2, ladders: l2 } = generateSnakesAndLadders(createPRNG(42))
      expect(s1).toEqual(s2)
      expect(l1).toEqual(l2)
    })

    it('produces different boards with different seeds', () => {
      const { snakes: s1 } = generateSnakesAndLadders(createPRNG(42))
      const { snakes: s2 } = generateSnakesAndLadders(createPRNG(99999))
      expect(s1).not.toEqual(s2)
    })
  })
})

describe('generateChallengeBlocks', () => {
  it('generates between 10 and 15 challenge blocks', () => {
    const prng = createPRNG(42)
    const { occupied } = generateSnakesAndLadders(createPRNG(42))
    const blocks = generateChallengeBlocks(prng, occupied)
    expect(blocks.length).toBeGreaterThanOrEqual(10)
    expect(blocks.length).toBeLessThanOrEqual(15)
  })

  it('no block on cell 1 or 100', () => {
    const prng = createPRNG(42)
    const { occupied } = generateSnakesAndLadders(createPRNG(42))
    const blocks = generateChallengeBlocks(prng, occupied)
    const cells = blocks.map((b) => b.cellIndex)
    expect(cells).not.toContain(1)
    expect(cells).not.toContain(100)
  })

  it('no overlap with snakes and ladders', () => {
    const { occupied } = generateSnakesAndLadders(createPRNG(42))
    const blocks = generateChallengeBlocks(createPRNG(42), occupied)
    blocks.forEach((b) => {
      expect(occupied.has(b.cellIndex)).toBe(false)
    })
  })

  it('minimum spacing of 3 between blocks', () => {
    const { occupied } = generateSnakesAndLadders(createPRNG(42))
    const blocks = generateChallengeBlocks(createPRNG(42), occupied)
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i]
        const b = blocks[j]
        if (a && b) {
          expect(Math.abs(a.cellIndex - b.cellIndex)).toBeGreaterThanOrEqual(3)
        }
      }
    }
  })

  it('is deterministic with same seed', () => {
    const { occupied } = generateSnakesAndLadders(createPRNG(42))
    const blocks1 = generateChallengeBlocks(createPRNG(42), occupied)
    const blocks2 = generateChallengeBlocks(createPRNG(42), occupied)
    expect(blocks1).toEqual(blocks2)
  })

  it('assigns valid challenge types', () => {
    const validTypes = ['dare-card', 'lucky-draw', 'swap-position', 'memory-match']
    const { occupied } = generateSnakesAndLadders(createPRNG(42))
    const blocks = generateChallengeBlocks(createPRNG(42), occupied)
    blocks.forEach((b) => {
      expect(validTypes).toContain(b.challengeType)
    })
  })
})
