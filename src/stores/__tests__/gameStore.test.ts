import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

beforeEach(() => {
  useGameStore.getState().startNewGame(['Player 1', 'Player 2'])
})

describe('gameStore', () => {
  describe('startNewGame', () => {
    it('initializes game with correct number of players', () => {
      const { gameState } = useGameStore.getState()
      expect(gameState?.players).toHaveLength(2)
    })

    it('sets initial phase to idle', () => {
      const { gameState } = useGameStore.getState()
      expect(gameState?.phase).toBe('idle')
    })

    it('sets all players to position 1', () => {
      const { gameState } = useGameStore.getState()
      gameState?.players.forEach((p) => {
        expect(p.position).toBe(1)
      })
    })

    it('assigns correct player names', () => {
      const { gameState } = useGameStore.getState()
      expect(gameState?.players[0]?.name).toBe('Player 1')
      expect(gameState?.players[1]?.name).toBe('Player 2')
    })
  })

  describe('rollDice', () => {
    it('transitions phase to rolling', () => {
      useGameStore.getState().rollDice()
      const { gameState } = useGameStore.getState()
      expect(gameState?.phase).toBe('rolling')
    })

    it('sets lastDiceResult between 1 and 6', () => {
      useGameStore.getState().rollDice()
      const { gameState } = useGameStore.getState()
      expect(gameState?.lastDiceResult).toBeGreaterThanOrEqual(1)
      expect(gameState?.lastDiceResult).toBeLessThanOrEqual(6)
    })
  })

  describe('movePlayer', () => {
    it('transitions phase to moving', () => {
      useGameStore.getState().rollDice()
      useGameStore.getState().movePlayer()
      const { gameState } = useGameStore.getState()
      expect(gameState?.phase).toBe('moving')
    })

    it('updates player position', () => {
      useGameStore.getState().rollDice()
      useGameStore.getState().movePlayer()
      const { gameState } = useGameStore.getState()
      expect(gameState?.players[0]?.position).toBeGreaterThan(1)
    })
  })

  describe('endTurn', () => {
    it('moves to next player after turn ends', () => {
      useGameStore.getState().rollDice()
      useGameStore.getState().movePlayer()
      useGameStore.getState().landOnCell()

      const phase = useGameStore.getState().gameState?.phase
      if (phase === 'turn-end') {
        useGameStore.getState().endTurn()
        const { gameState } = useGameStore.getState()
        expect(gameState?.currentPlayerIndex).toBe(1)
      }
    })
  })
})
