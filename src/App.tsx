import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BoardCanvas } from './components/board/BoardCanvas'
import { HUD } from './components/hud/HUD'
import { Dice } from './components/ui/Dice'
import { DareCard } from './components/challenge/DareCard'
import { LuckyDraw } from './components/challenge/LuckyDraw'
import { SwapPosition } from './components/challenge/SwapPosition'
import { MemoryMatch } from './components/challenge/MemoryMatch'
import { useGameStore } from './stores/gameStore'
import { useUIStore } from './stores/uiStore'
import { Confetti } from './components/ui/Confetti'

function App() {
  const phase = useGameStore((s) => s.gameState?.phase)
  const activeChallenge = useGameStore((s) => s.gameState?.activeChallenge)
  const resolveChallenge = useGameStore((s) => s.resolveChallenge)
  const endTurn = useGameStore((s) => s.endTurn)
  const [skipSteps] = useState(() => Math.floor(Math.random() * 6) + 1)
  const winner = useGameStore((s) => s.gameState?.winner)
  const startNewGame = useGameStore((s) => s.startNewGame)

  const handleDareDone = () => {
    resolveChallenge({ type: 'dare-done' })
    endTurn()
  }

  const handleDareSkip = () => {
    const currentPlayer =
      useGameStore.getState().gameState?.players[
        useGameStore.getState().gameState?.currentPlayerIndex ?? 0
      ]
    const boardRenderer = useUIStore.getState().boardRenderer
    const currentPlayerIndex = useGameStore.getState().gameState?.currentPlayerIndex ?? 0
    const startPos = currentPlayer?.position ?? 1

    // Build path going backwards using skipSteps
    const path: number[] = []
    for (let i = 1; i <= skipSteps; i++) {
      path.push(Math.max(startPos - i, 1))
    }

    resolveChallenge({ type: 'dare-skip', steps: skipSteps })

    if (boardRenderer) {
      boardRenderer.animatePlayerMove(currentPlayerIndex, path)
      setTimeout(
        () => {
          endTurn()
        },
        skipSteps * 200 + 100,
      )
    } else {
      endTurn()
    }
  }

  const challengeCooldownRef = useRef(false)
  const stayTurn = useGameStore((s) => s.stayTurn)

  const handleLuckyDraw = (result: 'buff' | 'debuff') => {
    if (result === 'buff') {
      resolveChallenge({ type: 'lucky-buff' })
      const currentPhase = useGameStore.getState().gameState?.phase
      if (currentPhase === 'turn-end') {
        challengeCooldownRef.current = true
        stayTurn()
        setTimeout(() => {
          challengeCooldownRef.current = false
        }, 500)
      }
    } else {
      const currentPlayer =
        useGameStore.getState().gameState?.players[
          useGameStore.getState().gameState?.currentPlayerIndex ?? 0
        ]
      const boardRenderer = useUIStore.getState().boardRenderer
      const currentPlayerIndex = useGameStore.getState().gameState?.currentPlayerIndex ?? 0
      const startPos = currentPlayer?.position ?? 1
      const steps = 3

      const path: number[] = []
      for (let i = 1; i <= steps; i++) {
        path.push(Math.max(startPos - i, 1))
      }

      resolveChallenge({ type: 'lucky-debuff' })

      if (boardRenderer) {
        boardRenderer.animatePlayerMove(currentPlayerIndex, path)
        setTimeout(
          () => {
            const latestPhase = useGameStore.getState().gameState?.phase
            if (latestPhase === 'turn-end') {
              endTurn()
            }
          },
          steps * 200 + 100,
        )
      } else {
        const latestPhase = useGameStore.getState().gameState?.phase
        if (latestPhase === 'turn-end') {
          endTurn()
        }
      }
    }
  }

  const handleSwapPosition = (targetPlayerId: string) => {
    const state = useGameStore.getState().gameState
    const players = state?.players ?? []
    const currentPlayerIndex = state?.currentPlayerIndex ?? 0
    const currentPlayer = players[currentPlayerIndex]
    const targetIndex = players.findIndex((p) => p.id === targetPlayerId)
    const targetPlayer = players[targetIndex]
    const boardRenderer = useUIStore.getState().boardRenderer

    resolveChallenge({ type: 'swap-done', targetPlayerId })

    if (boardRenderer && currentPlayer && targetPlayer && targetIndex !== -1) {
      boardRenderer.animatePlayerMove(currentPlayerIndex, [targetPlayer.position])
      boardRenderer.animatePlayerMove(targetIndex, [currentPlayer.position])
      setTimeout(() => {
        const latestPhase = useGameStore.getState().gameState?.phase
        if (latestPhase === 'turn-end') {
          endTurn()
        }
      }, 400)
    } else {
      endTurn()
    }
  }

  const handleMemoryMatch = (result: { success: boolean; bonus: number }) => {
    if (!result.success) {
      resolveChallenge({ type: 'memory-fail' })
      endTurn()
      return
    }

    const currentPlayer =
      useGameStore.getState().gameState?.players[
        useGameStore.getState().gameState?.currentPlayerIndex ?? 0
      ]
    const boardRenderer = useUIStore.getState().boardRenderer
    const currentPlayerIndex = useGameStore.getState().gameState?.currentPlayerIndex ?? 0
    const startPos = currentPlayer?.position ?? 1

    const path: number[] = []
    for (let i = 1; i <= result.bonus; i++) {
      const raw = startPos + i
      const step = raw > 100 ? 100 - (raw - 100) : raw
      path.push(step)
    }

    resolveChallenge({ type: 'memory-success', bonus: result.bonus })

    if (boardRenderer) {
      boardRenderer.animatePlayerMove(currentPlayerIndex, path)
      setTimeout(
        () => {
          const latestPhase = useGameStore.getState().gameState?.phase
          if (latestPhase === 'turn-end') {
            endTurn()
          }
        },
        result.bonus * 200 + 100,
      )
    } else {
      const latestPhase = useGameStore.getState().gameState?.phase
      if (latestPhase === 'turn-end') {
        endTurn()
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 p-4 lg:flex-row lg:items-start lg:justify-center lg:p-8">
      <div className="flex w-full flex-1 flex-col items-center gap-4 lg:w-auto">
        <BoardCanvas />
        <Dice challengeCooldownRef={challengeCooldownRef} />
      </div>
      <HUD />

      <AnimatePresence>
        {phase === 'on-challenge' && activeChallenge?.type === 'dare-card' && (
          <DareCard
            key="dare-card"
            onDone={handleDareDone}
            onSkip={handleDareSkip}
            skipSteps={skipSteps}
          />
        )}

        {phase === 'on-challenge' && activeChallenge?.type === 'lucky-draw' && (
          <LuckyDraw key="lucky-draw" onResult={handleLuckyDraw} />
        )}

        {phase === 'on-challenge' && activeChallenge?.type === 'swap-position' && (
          <SwapPosition key="swap-position" onSwap={handleSwapPosition} />
        )}

        {phase === 'on-challenge' && activeChallenge?.type === 'memory-match' && (
          <MemoryMatch key="memory-match" onResult={handleMemoryMatch} />
        )}

        {/* Temporary fallback for unimplemented challenges */}
        {phase === 'on-challenge' &&
          activeChallenge?.type !== 'dare-card' &&
          activeChallenge?.type !== 'lucky-draw' &&
          activeChallenge?.type !== 'swap-position' &&
          activeChallenge?.type !== 'memory-match' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="rounded-2xl bg-slate-800 p-8 text-center shadow-2xl">
                <div className="text-4xl">🚧</div>
                <h2 className="mt-2 text-xl font-bold text-white">
                  {activeChallenge?.type} — Coming Soon
                </h2>
                <button
                  onClick={() => endTurn()}
                  className="mt-6 rounded-full bg-slate-600 px-6 py-3 text-sm font-bold text-white hover:bg-slate-500"
                >
                  Skip →
                </button>
              </div>
            </div>
          )}

        {winner && <Confetti key="confetti" />}

        {winner && (
          <motion.div
            key="winner"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="rounded-2xl bg-slate-800 p-12 text-center shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-6xl">🎉</div>
              <h2 className="mt-4 font-display text-4xl font-bold text-white">
                {winner.name} Wins!
              </h2>
              <p className="mt-2 text-slate-400">Congratulations, you reached cell 100!</p>
              <button
                onClick={() => startNewGame(['Player 1', 'Player 2'])}
                className="mt-8 rounded-full bg-green-400 px-8 py-3 font-bold text-slate-900 hover:bg-green-300"
              >
                🎲 Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
