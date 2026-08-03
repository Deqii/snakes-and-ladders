import { describe, it, expect } from 'vitest'
import { transition } from '../GameStateMachine'
import type { GameState } from '../../types/index'

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

describe('eventLog population', () => {
  it('logs a snake event on MOVE_PLAYER', () => {
    const rollingState = {
      ...mockState,
      phase: 'rolling' as const,
      players: [{ ...mockState.players[0]!, position: 16 }],
    }
    const next = transition(rollingState, { type: 'MOVE_PLAYER', steps: 4 })
    expect(next.eventLog).toHaveLength(1)
    expect(next.eventLog[0]).toEqual({ type: 'snake', player: 'p1', from: 20, to: 5 })
  })

  it('logs a ladder event on MOVE_PLAYER', () => {
    const rollingState = {
      ...mockState,
      phase: 'rolling' as const,
      players: [{ ...mockState.players[0]!, position: 6 }],
    }
    const next = transition(rollingState, { type: 'MOVE_PLAYER', steps: 4 })
    expect(next.eventLog).toHaveLength(1)
    expect(next.eventLog[0]).toEqual({ type: 'ladder', player: 'p1', from: 10, to: 30 })
  })

  it('does not log an event on a normal move', () => {
    const rollingState = { ...mockState, phase: 'rolling' as const }
    const next = transition(rollingState, { type: 'MOVE_PLAYER', steps: 2 })
    expect(next.eventLog).toHaveLength(0)
  })

  it('logs a challenge event on LAND_ON_CELL', () => {
    const movingState = {
      ...mockState,
      phase: 'moving' as const,
      players: [{ ...mockState.players[0]!, position: 15 }],
    }
    const next = transition(movingState, { type: 'LAND_ON_CELL' })
    expect(next.eventLog).toHaveLength(1)
    expect(next.eventLog[0]).toEqual({
      type: 'challenge',
      player: 'p1',
      cell: 15,
      challengeType: 'dare-card',
    })
  })

  it('logs a win event on END_TURN when player reaches 100', () => {
    const turnEndState = {
      ...mockState,
      phase: 'turn-end' as const,
      players: [{ ...mockState.players[0]!, position: 100 }],
    }
    const next = transition(turnEndState, { type: 'END_TURN' })
    expect(next.eventLog).toHaveLength(1)
    expect(next.eventLog[0]).toEqual({ type: 'win', player: 'p1' })
  })

  it('appends to existing eventLog rather than overwriting', () => {
    const stateWithHistory = {
      ...mockState,
      phase: 'rolling' as const,
      players: [{ ...mockState.players[0]!, position: 16 }],
      eventLog: [{ type: 'ladder' as const, player: 'p2', from: 10, to: 30 }],
    }
    const next = transition(stateWithHistory, { type: 'MOVE_PLAYER', steps: 4 })
    expect(next.eventLog).toHaveLength(2)
    expect(next.eventLog[0]?.type).toBe('ladder')
    expect(next.eventLog[1]?.type).toBe('snake')
  })
})
