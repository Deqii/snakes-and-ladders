import { create } from 'zustand'
import { transition } from '../core/engine/GameStateMachine'
import type { GameState, Player } from '../core/types/index'
import type { ChallengeResult } from '../core/engine/GameStateMachine'

// ─── Initial Board ───────────────────────────────────
const INITIAL_BOARD: GameState['board'] = {
  cells: [],
  snakes: [
    { head: 17, tail: 7 },
    { head: 54, tail: 34 },
    { head: 62, tail: 19 },
    { head: 64, tail: 60 },
    { head: 87, tail: 24 },
    { head: 93, tail: 73 },
  ],
  ladders: [
    { bottom: 4, top: 14 },
    { bottom: 9, top: 31 },
    { bottom: 20, top: 38 },
    { bottom: 28, top: 84 },
    { bottom: 40, top: 59 },
    { bottom: 51, top: 67 },
  ],
  challengeBlocks: [
    { cellIndex: 10, challengeType: 'dare-card' },
    { cellIndex: 25, challengeType: 'lucky-draw' },
    { cellIndex: 44, challengeType: 'memory-match' },
    { cellIndex: 56, challengeType: 'swap-position' },
    { cellIndex: 70, challengeType: 'dare-card' },
    { cellIndex: 80, challengeType: 'lucky-draw' },
  ],
}

// ─── Store Types ─────────────────────────────────────
interface GameStore {
  // State
  gameState: GameState | null

  // Actions
  startNewGame: (playerNames: string[]) => void
  rollDice: () => void
  movePlayer: () => void
  landOnCell: () => void
  resolveChallenge: (result: ChallengeResult) => void
  endTurn: () => void
}

// ─── Store ───────────────────────────────────────────
export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,

  startNewGame: (playerNames) => {
    const colors = ['#4ade80', '#f472b6', '#60a5fa', '#fb923c']
    const players: Player[] = playerNames.map((name, i) => ({
      id: `p${i + 1}`,
      name,
      color: colors[i] ?? '#ffffff',
      position: 1,
      isSkipNextTurn: false,
    }))

    const initialState: GameState = {
      board: INITIAL_BOARD,
      players,
      currentPlayerIndex: 0,
      phase: 'idle',
      lastDiceResult: null,
      activeChallenge: null,
      eventLog: [],
      seed: Math.floor(Math.random() * 2 ** 32),
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
    set({ gameState: transition(gameState, { type: 'LAND_ON_CELL' }) })
  },

  resolveChallenge: (result) => {
    const { gameState } = get()
    if (!gameState) return
    set({
      gameState: transition(gameState, {
        type: 'RESOLVE_CHALLENGE',
        result,
      }),
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
