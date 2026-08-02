import { describe, it, expect } from 'vitest'
import { transition } from '../GameStateMachine'
import type { GameState } from '../../types/index'

// ─── Mock State ──────────────────────────────────────
const mockState: GameState = {
  board: {
    cells: [],
    snakes: [{ head: 20, tail: 5 }],
    ladders: [{ bottom: 10, top: 30 }],
    challengeBlocks: [{ cellIndex: 15, challengeType: 'dare-card' }],
  },
  players: [
    {
      id: 'p1',
      name: 'Player 1',
      color: '#4ade80',
      position: 1,
      isSkipNextTurn: false,
      hasDoubleDice: false,
    },
    {
      id: 'p2',
      name: 'Player 2',
      color: '#f472b6',
      position: 1,
      isSkipNextTurn: false,
      hasDoubleDice: false,
    },
  ],
  currentPlayerIndex: 0,
  phase: 'idle',
  lastDiceResult: null,
  activeChallenge: null,
  eventLog: [],
  seed: 12345,
  winner: null,
}

// ─── Tests ───────────────────────────────────────────
describe('GameStateMachine', () => {
  describe('ROLL_DICE', () => {
    it('transitions from idle to rolling', () => {
      const next = transition(mockState, { type: 'ROLL_DICE' })
      expect(next.phase).toBe('rolling')
    })

    it('sets lastDiceResult between 1 and 6', () => {
      const next = transition(mockState, { type: 'ROLL_DICE' })
      expect(next.lastDiceResult).toBeGreaterThanOrEqual(1)
      expect(next.lastDiceResult).toBeLessThanOrEqual(6)
    })

    it('throws on invalid transition', () => {
      const rollingState = { ...mockState, phase: 'rolling' as const }
      expect(() => transition(rollingState, { type: 'ROLL_DICE' })).toThrow()
    })
  })

  describe('MOVE_PLAYER', () => {
    it('moves player forward by steps', () => {
      const rollingState = { ...mockState, phase: 'rolling' as const }
      const next = transition(rollingState, { type: 'MOVE_PLAYER', steps: 4 })
      expect(next.players[0]?.position).toBe(5)
    })

    it('sends player down a snake', () => {
      const rollingState = {
        ...mockState,
        phase: 'rolling' as const,
        players: [{ ...mockState.players[0]!, position: 16 }],
      }
      const next = transition(rollingState, { type: 'MOVE_PLAYER', steps: 4 })
      expect(next.players[0]?.position).toBe(5)
    })

    it('sends player up a ladder', () => {
      const rollingState = {
        ...mockState,
        phase: 'rolling' as const,
        players: [{ ...mockState.players[0]!, position: 6 }],
      }
      const next = transition(rollingState, { type: 'MOVE_PLAYER', steps: 4 })
      expect(next.players[0]?.position).toBe(30)
    })

    it('clamps position with bounce back rule', () => {
      const rollingState = {
        ...mockState,
        phase: 'rolling' as const,
        players: [{ ...mockState.players[0]!, position: 98 }],
      }
      const next = transition(rollingState, { type: 'MOVE_PLAYER', steps: 6 })
      expect(next.players[0]?.position).toBe(96)
    })
  })

  describe('LAND_ON_CELL', () => {
    it('transitions to on-challenge when landing on challenge block', () => {
      const movingState = {
        ...mockState,
        phase: 'moving' as const,
        players: [{ ...mockState.players[0]!, position: 15 }],
      }
      const next = transition(movingState, { type: 'LAND_ON_CELL' })
      expect(next.phase).toBe('on-challenge')
      expect(next.activeChallenge?.type).toBe('dare-card')
    })

    it('transitions to turn-end on normal cell', () => {
      const movingState = {
        ...mockState,
        phase: 'moving' as const,
        players: [{ ...mockState.players[0]!, position: 7 }],
      }
      const next = transition(movingState, { type: 'LAND_ON_CELL' })
      expect(next.phase).toBe('turn-end')
    })
  })

  describe('END_TURN', () => {
    it('transitions to idle and moves to next player', () => {
      const turnEndState = { ...mockState, phase: 'turn-end' as const }
      const next = transition(turnEndState, { type: 'END_TURN' })
      expect(next.phase).toBe('idle')
      expect(next.currentPlayerIndex).toBe(1)
    })

    it('transitions to win when player reaches 100', () => {
      const turnEndState = {
        ...mockState,
        phase: 'turn-end' as const,
        players: [{ ...mockState.players[0]!, position: 100 }],
      }
      const next = transition(turnEndState, { type: 'END_TURN' })
      expect(next.phase).toBe('win')
      expect(next.winner?.id).toBe('p1')
    })
  })

  describe('RESOLVE_CHALLENGE', () => {
    it('moves player back on dare-skip', () => {
      const challengeState = {
        ...mockState,
        phase: 'on-challenge' as const,
        players: [{ ...mockState.players[0]!, position: 15 }],
      }
      const next = transition(challengeState, {
        type: 'RESOLVE_CHALLENGE',
        result: { type: 'dare-skip', steps: 1 },
      })
      expect(next.players[0]?.position).toBe(14)
    })

    it('moves player forward on memory-success', () => {
      const challengeState = {
        ...mockState,
        phase: 'on-challenge' as const,
        players: [{ ...mockState.players[0]!, position: 15 }],
      }
      const next = transition(challengeState, {
        type: 'RESOLVE_CHALLENGE',
        result: { type: 'memory-success', bonus: 3 },
      })
      expect(next.players[0]?.position).toBe(18)
    })
  })
})
