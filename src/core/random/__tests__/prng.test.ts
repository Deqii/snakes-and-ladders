import { describe, it, expect } from 'vitest'
import { createPRNG, randomInt, randomPick, randomShuffle } from '../prng'

describe('PRNG', () => {
  describe('createPRNG', () => {
    it('same seed produces identical sequence', () => {
      const prng1 = createPRNG(12345)
      const prng2 = createPRNG(12345)
      const seq1 = Array.from({ length: 10 }, () => prng1())
      const seq2 = Array.from({ length: 10 }, () => prng2())
      expect(seq1).toEqual(seq2)
    })

    it('different seeds produce different sequences', () => {
      const prng1 = createPRNG(12345)
      const prng2 = createPRNG(99999)
      const seq1 = Array.from({ length: 10 }, () => prng1())
      const seq2 = Array.from({ length: 10 }, () => prng2())
      expect(seq1).not.toEqual(seq2)
    })

    it('returns values between 0 and 1', () => {
      const prng = createPRNG(42)
      for (let i = 0; i < 100; i++) {
        const val = prng()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThan(1)
      }
    })
  })

  describe('randomInt', () => {
    it('returns value within range', () => {
      const prng = createPRNG(42)
      for (let i = 0; i < 100; i++) {
        const val = randomInt(prng, 1, 6)
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(6)
      }
    })

    it('is deterministic with same seed', () => {
      const prng1 = createPRNG(42)
      const prng2 = createPRNG(42)
      const seq1 = Array.from({ length: 10 }, () => randomInt(prng1, 1, 100))
      const seq2 = Array.from({ length: 10 }, () => randomInt(prng2, 1, 100))
      expect(seq1).toEqual(seq2)
    })
  })

  describe('randomPick', () => {
    it('returns element from array', () => {
      const prng = createPRNG(42)
      const arr = ['a', 'b', 'c', 'd']
      for (let i = 0; i < 20; i++) {
        const pick = randomPick(prng, arr)
        expect(arr).toContain(pick)
      }
    })

    it('throws on empty array', () => {
      const prng = createPRNG(42)
      expect(() => randomPick(prng, [])).toThrow()
    })
  })

  describe('randomShuffle', () => {
    it('returns array with same elements', () => {
      const prng = createPRNG(42)
      const arr = [1, 2, 3, 4, 5]
      const shuffled = randomShuffle(prng, arr)
      expect(shuffled).toHaveLength(arr.length)
      expect(shuffled.sort()).toEqual([...arr].sort())
    })

    it('is deterministic with same seed', () => {
      const arr = [1, 2, 3, 4, 5]
      const shuffled1 = randomShuffle(createPRNG(42), arr)
      const shuffled2 = randomShuffle(createPRNG(42), arr)
      expect(shuffled1).toEqual(shuffled2)
    })

    it('does not mutate original array', () => {
      const prng = createPRNG(42)
      const arr = [1, 2, 3, 4, 5]
      randomShuffle(prng, arr)
      expect(arr).toEqual([1, 2, 3, 4, 5])
    })
  })
})
