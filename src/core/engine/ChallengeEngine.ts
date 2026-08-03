import type { GameState } from '../types/index'
import type { ChallengeResult } from './GameStateMachine'

// ─── Helpers ─────────────────────────────────────────
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function updateCurrentPlayer(
  state: GameState,
  updates: Partial<GameState['players'][number]>,
): GameState {
  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex ? { ...p, ...updates } : p,
    ),
  }
}

// ─── Trigger Challenge ───────────────────────────────
export function triggerChallenge(state: GameState, cellIndex: number): GameState {
  const challenge = state.board.challengeBlocks.find((c) => c.cellIndex === cellIndex)

  if (!challenge) return state

  return {
    ...state,
    phase: 'on-challenge',
    activeChallenge: {
      type: challenge.challengeType,
      cellIndex: challenge.cellIndex,
    },
  }
}

// ─── Resolve Challenge ───────────────────────────────
export function resolveChallenge(state: GameState, result: ChallengeResult): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) return state

  let newState: GameState = { ...state, phase: 'turn-end' as const, activeChallenge: null }

  switch (result.type) {
    case 'dare-done':
      // No position effect
      break

    case 'dare-skip':
      newState = updateCurrentPlayer(newState, {
        position: clamp(player.position - result.steps, 1, 100),
      })
      break

    case 'lucky-buff':
      newState = updateCurrentPlayer(newState, {
        hasDoubleDice: true,
      })
      break

    case 'lucky-debuff':
      newState = updateCurrentPlayer(newState, {
        position: clamp(player.position - 3, 1, 100),
      })
      break

    case 'swap-done': {
      const targetIndex = state.players.findIndex((p) => p.id === result.targetPlayerId)
      if (targetIndex !== -1) {
        const target = state.players[targetIndex]
        if (target) {
          newState = {
            ...newState,
            players: newState.players.map((p, i) => {
              if (i === state.currentPlayerIndex) return { ...p, position: target.position }
              if (i === targetIndex) return { ...p, position: player.position }
              return p
            }),
          }
        }
      }
      break
    }

    case 'memory-success': {
      const rawPosition = player.position + result.bonus
      const bouncedPosition = rawPosition > 100 ? 100 - (rawPosition - 100) : rawPosition
      newState = updateCurrentPlayer(newState, {
        position: clamp(bouncedPosition, 1, 100),
      })
      break
    }

    case 'memory-fail':
      // No position effect
      break
  }
  return newState
}
