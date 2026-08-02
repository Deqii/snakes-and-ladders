import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'

type CardResult = 'buff' | 'debuff'

interface LuckyDrawProps {
  onResult: (result: CardResult) => void
}

export function LuckyDraw({ onResult }: LuckyDrawProps) {
  const [flipped, setFlipped] = useState<number | null>(null)
  const [result, setResult] = useState<CardResult | null>(null)

  const currentPlayer = useGameStore((s) => s.gameState?.players[s.gameState.currentPlayerIndex])

  const [cards] = useState<CardResult[]>(() => {
    const arr: CardResult[] = ['buff', 'debuff', 'debuff']
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      const swap = arr[j]
      if (temp !== undefined && swap !== undefined) {
        arr[i] = swap
        arr[j] = temp
      }
    }
    return arr
  })

  const handlePick = (index: number) => {
    if (flipped !== null) return
    const picked = cards[index]
    if (!picked) return
    setFlipped(index)
    setResult(picked)
    setTimeout(() => {
      onResult(picked)
    }, 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-slate-800 p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="text-4xl">🃏</div>
            <h2 className="mt-2 text-xl font-bold text-amber-400">Lucky Draw</h2>
            <p className="mt-1 text-sm text-slate-400">
              {currentPlayer?.name ?? 'Player'}, pilih 1 kartu!
            </p>
          </div>

          {/* Cards */}
          <div className="mb-6 flex justify-center gap-4 style={{ perspective: '600px' }}">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handlePick(i)
                }}
                className={`relative h-32 w-20 cursor pointer transition-all duration-500 ${flipped !== null ? 'cursor-not-allowed' : 'hover:scale-105'}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: flipped === i ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.6s',
                }}
              >
                {/* Back face */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-3xl shadow-lg"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  🂠
                </div>

                {/* Front face */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl shadow-lg"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background:
                      cards[i] === 'buff'
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  }}
                >
                  <span className="text-4xl">{cards[i] === 'buff' ? '⭐' : '💀'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl p-4 text-center ${
                result === 'buff' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {result === 'buff' ? (
                <p className="font-bold">⭐ Beruntung! Lempar dadu 2x giliran berikutnya!</p>
              ) : (
                <p className="font-bold">💀 Sial! Mundur 3 kotak!</p>
              )}
            </div>
          )}

          {!result && (
            <p className="text-center text-xs text-slate-500">1 kartu beruntung, 2 kartu sial</p>
          )}
        </div>
      </div>
    </div>
  )
}
