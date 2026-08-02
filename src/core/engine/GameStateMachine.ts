import type { GameState, GamePhase, DiceResult, Player } from '../types/index'

// ─── Actions ─────────────────────────────────────────
export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'MOVE_PLAYER'; steps: DiceResult }
  | { type: 'LAND_ON_CELL' }
  | { type: 'RESOLVE_CHALLENGE'; result: ChallengeResult }
  | { type: 'END_TURN' }

export type ChallengeResult =
  | { type: 'dare-done' }
  | { type: 'dare-skip'; steps: number }
  | { type: 'lucky-buff' }
  | { type: 'lucky-debuff' }
  | { type: 'swap-done'; targetPlayerId: string }
  | { type: 'memory-success'; bonus: number }
  | { type: 'memory-fail' }

// ─── Valid transitions ────────────────────────────────
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  idle: ['rolling'],
  rolling: ['moving'],
  moving: ['on-challenge', 'turn-end'],
  'on-challenge': ['turn-end'],
  'turn-end': ['idle', 'win'],
  win: [],
}

function assertValidTransition(from: GamePhase, to: GamePhase): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
  }
}

// ─── Helpers ─────────────────────────────────────────
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getCurrentPlayer(state: GameState): Player {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('Current player not found')
  return player
}

function updateCurrentPlayer(state: GameState, updates: Partial<Player>): GameState {
  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex ? { ...p, ...updates } : p,
    ),
  }
}

// ─── Transition ──────────────────────────────────────
export function transition(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROLL_DICE': {
      assertValidTransition(state.phase, 'rolling')
      const steps = (Math.floor(Math.random() * 6) + 1) as DiceResult
      return {
        ...state,
        phase: 'rolling',
        lastDiceResult: steps,
      }
    }

    case 'MOVE_PLAYER': {
      assertValidTransition(state.phase, 'moving')
      const player = getCurrentPlayer(state)
      const rawPosition = player.position + action.steps

      // Bounce back if exceeds 100
      let newPosition: number
      if (rawPosition > 100) {
        const overflow = rawPosition - 100
        newPosition = 100 - overflow
      } else {
        newPosition = rawPosition
      }

      // Check snake
      const snake = state.board.snakes.find((s) => s.head === newPosition)
      if (snake) {
        newPosition = snake.tail
      }

      // Check ladder
      const ladder = state.board.ladders.find((l) => l.bottom === newPosition)
      if (ladder) {
        newPosition = ladder.top
      }

      return updateCurrentPlayer(
        { ...state, phase: 'moving' },
        { position: newPosition, hasDoubleDice: false },
      )
    }

    case 'LAND_ON_CELL': {
      const player = getCurrentPlayer(state)
      const challenge = state.board.challengeBlocks.find((c) => c.cellIndex === player.position)

      if (challenge) {
        assertValidTransition(state.phase, 'on-challenge')
        return {
          ...state,
          phase: 'on-challenge',
          activeChallenge: {
            type: challenge.challengeType,
            cellIndex: challenge.cellIndex,
          },
        }
      }

      assertValidTransition(state.phase, 'turn-end')
      return { ...state, phase: 'turn-end' }
    }

    case 'RESOLVE_CHALLENGE': {
      assertValidTransition(state.phase, 'turn-end')
      const player = getCurrentPlayer(state)
      let newPosition = player.position

      switch (action.result.type) {
        case 'dare-skip':
          newPosition = clamp(player.position - action.result.steps, 1, 100)
          break
        case 'lucky-buff':
          // handled in next turn via isSkipNextTurn flag repurposed as buff
          break
        case 'lucky-debuff':
          newPosition = clamp(player.position - 3, 1, 100)
          break
        case 'swap-done': {
          const targetIndex = state.players.findIndex((p) => p.id === action.result.type)
          if (targetIndex !== -1) {
            const target = state.players[targetIndex]
            if (target) {
              newPosition = target.position
            }
          }
          break
        }
        case 'memory-success':
          newPosition = clamp(player.position + action.result.bonus, 1, 100)
          break
      }

      return updateCurrentPlayer(
        { ...state, phase: 'turn-end', activeChallenge: null },
        { position: newPosition },
      )
    }

    case 'END_TURN': {
      const player = getCurrentPlayer(state)

      // Check win
      if (player.position >= 100) {
        assertValidTransition(state.phase, 'win')
        return {
          ...state,
          phase: 'win',
          winner: player,
        }
      }

      assertValidTransition(state.phase, 'idle')

      let nextIndex = (state.currentPlayerIndex + 1) % state.players.length
      if (state.players[nextIndex]?.isSkipNextTurn) {
        const skippedPlayer = state.players[nextIndex]
        if (skippedPlayer) {
          const resetState = {
            ...state,
            players: state.players.map((p, i) =>
              i === nextIndex ? { ...p, isSkipNextTurn: false } : p,
            ),
          }
          nextIndex = (nextIndex + 1) % resetState.players.length
          return {
            ...resetState,
            phase: 'idle',
            currentPlayerIndex: nextIndex,
          }
        }
      }

      return {
        ...state,
        phase: 'idle',
        currentPlayerIndex: nextIndex,
      }
    }
  }
}
