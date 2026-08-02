import { BoardCanvas } from './components/board/BoardCanvas'
import { Dice } from './components/ui/Dice'
import { DareCard } from './components/challenge/DareCard'
import { LuckyDraw } from './components/challenge/LuckyDraw'
import { useGameStore } from './stores/gameStore'
import { useUIStore } from './stores/uiStore'
import { useRef, useState } from 'react'

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
        skipSteps * 150 + 100,
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
          steps * 150 + 100,
        )
      } else {
        const latestPhase = useGameStore.getState().gameState?.phase
        if (latestPhase === 'turn-end') {
          endTurn()
        }
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-8">
      <BoardCanvas />
      <Dice challengeCooldownRef={challengeCooldownRef} />

      {phase === 'on-challenge' && activeChallenge?.type === 'dare-card' && (
        <DareCard onDone={handleDareDone} onSkip={handleDareSkip} skipSteps={skipSteps} />
      )}

      {phase === 'on-challenge' && activeChallenge?.type === 'lucky-draw' && (
        <LuckyDraw onResult={handleLuckyDraw} />
      )}

      {/* Temporary fallback for unimplemented challenges */}
      {phase === 'on-challenge' &&
        activeChallenge?.type !== 'dare-card' &&
        activeChallenge?.type !== 'lucky-draw' && (
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

      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="rounded-2xl bg-slate-800 p-12 text-center shadow-2xl">
            <div className="text-6xl">🎉</div>
            <h2 className="mt-4 font-display text-4xl font-bold text-white">
              {winner.name} Menang!
            </h2>
            <p className="mt-2 text-slate-400">Selamat telah mencapai kotak 100!</p>
            <button
              onClick={() => startNewGame(['Player 1', 'Player 2'])}
              className="mt-8 rounded-full bg-green-400 px-8 py-3 font-bold text-slate-900 hover:bg-green-300"
            >
              🎲 Main Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
