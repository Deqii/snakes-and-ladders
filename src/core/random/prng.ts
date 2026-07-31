// ─── Types ───────────────────────────────────────────
export type PRNG = () => number

// ─── mulberry32 ──────────────────────────────────────
/**
 * Seedable PRNG using mulberry32 algorithm.
 * Same seed always produces identical sequence.
 * Returns float in [0, 1).
 */
export function createPRNG(seed: number): PRNG {
  let s = seed
  return () => {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

// ─── Helpers ─────────────────────────────────────────
/**
 * Random integer inclusive [min, max].
 */
export function randomInt(prng: PRNG, min: number, max: number): number {
  return Math.floor(prng() * (max - min + 1)) + min
}

/**
 * Pick a random element from an array.
 */
export function randomPick<T>(prng: PRNG, array: readonly T[]): T {
  if (array.length === 0) throw new Error('Cannot pick from empty array')
  const index = Math.floor(prng() * array.length)
  const item = array[index]
  if (item === undefined) throw new Error('Index out of bounds')
  return item
}

/**
 * Fisher-Yates shuffle — returns new shuffled array.
 */
export function randomShuffle<T>(prng: PRNG, array: readonly T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1))
    const temp = result[i]
    const swap = result[j]
    if (temp !== undefined && swap !== undefined) {
      result[i] = swap
      result[j] = temp
    }
  }
  return result
}
