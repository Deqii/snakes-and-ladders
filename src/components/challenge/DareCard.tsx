import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { DARE_CARDS } from '../../core/engine/dareCards'

interface DareCardProps {
  onDone: () => void
  onSkip: () => void
  skipSteps: number
}

export function DareCard({ onDone, onSkip, skipSteps }: DareCardProps) {
  const [card] = useState(() => {
    const index = Math.floor(Math.random() * DARE_CARDS.length)
    return DARE_CARDS[index] ?? DARE_CARDS[0]
  })

  const currentPlayer = useGameStore((s) => s.gameState?.players[s.gameState.currentPlayerIndex])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-1 shadow-2xl">
          <div className="rounded-xl bg-slate-900 p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="text-4xl">🎴</div>
              <h2 className="mt-2 font-bold text-rose-400">Dare Card</h2>
              <p className="text-sm text-slate-400">
                {currentPlayer?.name ?? 'Player'} must complete this challenge!
              </p>
            </div>

            {/* Card */}
            <div className="mb-8 rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
              <p className="text-lg font-medium leading-relaxed text-white">{card}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 rounded-full border border-slate-600 py-3 text-sm font-semibold text-slate-400 transition-all hover:border-slate-400 hover:text-slate-200"
              >
                🏳️ Skip (−{skipSteps} cell{skipSteps === 1 ? '' : 's'})
              </button>
              <button
                onClick={onDone}
                className="flex-1 rounded-full bg-rose-500 py-3 text-sm font-semibold text-white transition-all hover:bg-rose-400"
              >
                ✅ Done!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
