import { describe, it, expect } from 'vitest'
import { triggerChallenge, resolveChallenge } from '../ChallengeEngine'
import type { GameState } from '../../types/index'

// ─── Mock State ──────────────────────────────────────
const mockState: GameState = {
  board: {
    cells: [],
    snakes: [],
    ladders: [],
    challengeBlocks: [
      { cellIndex: 15, challengeType: 'dare-card' },
      { cellIndex: 30, challengeType: 'lucky-draw' },
      { cellIndex: 45, challengeType: 'swap-position' },
      { cellIndex: 60, challengeType: 'memory-match' },
    ],
  },
  players: [
    { id: 'p1', name: 'Player 1', color: '#4ade80', position: 15, isSkipNextTurn: false },
    { id: 'p2', name: 'Player 2', color: '#f472b6', position: 30, isSkipNextTurn: false },
  ],
  currentPlayerIndex: 0,
  phase: 'moving',
  lastDiceResult: null,
  activeChallenge: null,
  eventLog: [],
  seed: 12345,
  winner: null,
}

// ─── Tests ───────────────────────────────────────────
describe('ChallengeEngine', () => {
  describe('triggerChallenge', () => {
    it('sets phase to on-challenge when landing on challenge block', () => {
      const next = triggerChallenge(mockState, 15)
      expect(next.phase).toBe('on-challenge')
    })

    it('sets activeChallenge with correct type', () => {
      const next = triggerChallenge(mockState, 15)
      expect(next.activeChallenge?.type).toBe('dare-card')
      expect(next.activeChallenge?.cellIndex).toBe(15)
    })

    it('returns unchanged state if no challenge block at cellIndex', () => {
      const next = triggerChallenge(mockState, 99)
      expect(next).toEqual(mockState)
    })
  })

  describe('resolveChallenge', () => {
    const challengeState: GameState = {
      ...mockState,
      phase: 'on-challenge',
      activeChallenge: { type: 'dare-card', cellIndex: 15 },
    }

    it('dare-done: no position change', () => {
      const next = resolveChallenge(challengeState, { type: 'dare-done' })
      expect(next.players[0]?.position).toBe(15)
      expect(next.phase).toBe('turn-end')
    })

    it('dare-skip: moves player back 1', () => {
      const next = resolveChallenge(challengeState, { type: 'dare-skip', steps: 1 })
      expect(next.players[0]?.position).toBe(14)
    })

    it('lucky-debuff: moves player back 3', () => {
      const next = resolveChallenge(challengeState, { type: 'lucky-debuff' })
      expect(next.players[0]?.position).toBe(12)
    })

    it('memory-success: moves player forward by bonus', () => {
      const next = resolveChallenge(challengeState, { type: 'memory-success', bonus: 5 })
      expect(next.players[0]?.position).toBe(20)
    })

    it('memory-fail: no position change', () => {
      const next = resolveChallenge(challengeState, { type: 'memory-fail' })
      expect(next.players[0]?.position).toBe(15)
    })

    it('swap-done: swaps positions between players', () => {
      const next = resolveChallenge(challengeState, {
        type: 'swap-done',
        targetPlayerId: 'p2',
      })
      expect(next.players[0]?.position).toBe(30)
      expect(next.players[1]?.position).toBe(15)
    })

    it('clamps position to minimum 1', () => {
      const lowState: GameState = {
        ...challengeState,
        players: [{ ...mockState.players[0]!, position: 2 }],
      }
      const next = resolveChallenge(lowState, { type: 'lucky-debuff' })
      expect(next.players[0]?.position).toBe(1)
    })

    it('clamps position to maximum 100', () => {
      const highState: GameState = {
        ...challengeState,
        players: [{ ...mockState.players[0]!, position: 98 }],
      }
      const next = resolveChallenge(highState, { type: 'memory-success', bonus: 10 })
      expect(next.players[0]?.position).toBe(100)
    })

    it('clears activeChallenge after resolve', () => {
      const next = resolveChallenge(challengeState, { type: 'dare-done' })
      expect(next.activeChallenge).toBeNull()
    })
  })
})
