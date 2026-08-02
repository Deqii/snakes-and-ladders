// ─── Dice ────────────────────────────────────────────
export type DiceResult = 1 | 2 | 3 | 4 | 5 | 6

// ─── Board ───────────────────────────────────────────
export type CellType = 'normal' | 'snake-head' | 'ladder-bottom' | 'challenge'

export interface Cell {
  index: number
  type: CellType
}

export interface Snake {
  head: number
  tail: number
}

export interface Ladder {
  bottom: number
  top: number
}

// ─── Challenge ───────────────────────────────────────
export type ChallengeType = 'dare-card' | 'lucky-draw' | 'swap-position' | 'memory-match'

export interface ChallengeBlock {
  cellIndex: number
  challengeType: ChallengeType
}

// ─── Board ───────────────────────────────────────────
export interface Board {
  cells: Cell[]
  snakes: Snake[]
  ladders: Ladder[]
  challengeBlocks: ChallengeBlock[]
}

// ─── Player ──────────────────────────────────────────
export interface Player {
  id: string
  name: string
  color: string
  position: number
  isSkipNextTurn: boolean
  hasDoubleDice: boolean
}

// ─── Game Phase ──────────────────────────────────────
export type GamePhase = 'idle' | 'rolling' | 'moving' | 'on-challenge' | 'turn-end' | 'win'

// ─── Game Events ─────────────────────────────────────
export type GameEvent =
  | { type: 'snake'; player: string; from: number; to: number }
  | { type: 'ladder'; player: string; from: number; to: number }
  | { type: 'challenge'; player: string; cell: number; challengeType: ChallengeType }
  | { type: 'win'; player: string }

// ─── Game State ──────────────────────────────────────
export interface GameState {
  board: Board
  players: Player[]
  currentPlayerIndex: number
  phase: GamePhase
  lastDiceResult: DiceResult | null
  activeChallenge: { type: ChallengeType; cellIndex: number } | null
  eventLog: GameEvent[]
  seed: number
  winner: Player | null
}
