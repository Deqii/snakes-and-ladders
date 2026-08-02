import { create } from 'zustand'
import { transition } from '../core/engine/GameStateMachine'
import { createPRNG } from '../core/random/prng'
import { generateSnakesAndLadders } from '../core/random/BoardGenerator'
import { generateChallengeBlocks } from '../core/random/BoardGenerator'
import type { GameState, Player } from '../core/types/index'
import type { ChallengeResult } from '../core/engine/GameStateMachine'
import { resolveChallenge as engineResolveChallenge } from '../core/engine/ChallengeEngine'

// ─── Store Types ─────────────────────────────────────
interface GameStore {
  gameState: GameState | null

  startNewGame: (playerNames: string[], seed?: number) => void
  rollDice: () => void
  movePlayer: () => void
  landOnCell: () => void
  resolveChallenge: (result: ChallengeResult) => void
  stayTurn: () => void
  endTurn: () => void
}

// ─── Store ───────────────────────────────────────────
export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,

  startNewGame: (playerNames, seed) => {
    const gameSeed = seed ?? Math.floor(Math.random() * 2 ** 32)
    const prng = createPRNG(gameSeed)

    const { snakes, ladders, occupied } = generateSnakesAndLadders(prng)
    const challengeBlocks = generateChallengeBlocks(prng, occupied)

    const colors = ['#4ade80', '#f472b6', '#60a5fa', '#fb923c']
    const players: Player[] = playerNames.map((name, i) => ({
      id: `p${i + 1}`,
      name,
      color: colors[i] ?? '#ffffff',
      position: 1,
      isSkipNextTurn: false,
      hasDoubleDice: false,
    }))

    const initialState: GameState = {
      board: {
        cells: [],
        snakes,
        ladders,
        challengeBlocks,
      },
      players,
      currentPlayerIndex: 0,
      phase: 'idle',
      lastDiceResult: null,
      activeChallenge: null,
      eventLog: [],
      seed: gameSeed,
      winner: null,
    }

    set({ gameState: initialState })
  },

  rollDice: () => {
    const { gameState } = get()
    if (!gameState) return
    set({ gameState: transition(gameState, { type: 'ROLL_DICE' }) })
  },

  movePlayer: () => {
    const { gameState } = get()
    if (!gameState?.lastDiceResult) return
    set({
      gameState: transition(gameState, {
        type: 'MOVE_PLAYER',
        steps: gameState.lastDiceResult,
      }),
    })
  },

  landOnCell: () => {
    const { gameState } = get()
    if (!gameState) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (!currentPlayer) return

    const challengeBlock = gameState.board.challengeBlocks.find(
      (c) => c.cellIndex === currentPlayer.position,
    )

    if (challengeBlock) {
      set({
        gameState: {
          ...gameState,
          phase: 'on-challenge',
          activeChallenge: {
            type: challengeBlock.challengeType,
            cellIndex: challengeBlock.cellIndex,
          },
        },
      })
    } else {
      set({ gameState: transition(gameState, { type: 'LAND_ON_CELL' }) })
    }
  },

  resolveChallenge: (result) => {
    const { gameState } = get()
    if (!gameState) return
    set({
      gameState: engineResolveChallenge(gameState, result),
    })
  },

  stayTurn: () => {
    const { gameState } = get()
    if (!gameState) return
    set({
      gameState: {
        ...gameState,
        phase: 'idle',
      },
    })
  },

  endTurn: () => {
    const { gameState } = get()
    if (!gameState) return
    set({ gameState: transition(gameState, { type: 'END_TURN' }) })
  },
}))

// ─── Selectors ───────────────────────────────────────
export const useCurrentPlayer = () =>
  useGameStore((s) => s.gameState?.players[s.gameState.currentPlayerIndex])

export const useGamePhase = () => useGameStore((s) => s.gameState?.phase)

export const usePlayers = () => useGameStore((s) => s.gameState?.players)

export const useBoard = () => useGameStore((s) => s.gameState?.board)
