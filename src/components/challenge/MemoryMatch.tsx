import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/gameStore'

const TIME_LIMIT_SECONDS = 30
const PAIR_COUNT = 3
const MIN_BONUS = 3
const MAX_BONUS = 7
const ICONS = ['🍀', '⭐', '🎯', '🔥', '💎', '🌙']

type CardState = {
  id: number
  icon: string
  isFlipped: boolean
  isMatched: boolean
}

function buildShuffledCards(): CardState[] {
  const icons = ICONS.slice(0, PAIR_COUNT)
  const pairIcons = [...icons, ...icons]

  for (let i = pairIcons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = pairIcons[i]
    const swap = pairIcons[j]
    if (temp !== undefined && swap !== undefined) {
      pairIcons[i] = swap
      pairIcons[j] = temp
    }
  }

  return pairIcons.map((icon, id) => ({
    id,
    icon,
    isFlipped: false,
    isMatched: false,
  }))
}

interface MemoryMatchProps {
  onResult: (result: { success: boolean; bonus: number }) => void
}

export function MemoryMatch({ onResult }: MemoryMatchProps) {
  const [cards, setCards] = useState<CardState[]>(() => buildShuffledCards())
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [matchedCount, setMatchedCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(TIME_LIMIT_SECONDS)
  const [isLocked, setIsLocked] = useState(false)
  const [outcome, setOutcome] = useState<'success' | 'fail' | null>(null)
  const [earnedBonus, setEarnedBonus] = useState<number | null>(null)

  const currentPlayer = useGameStore((s) => s.gameState?.players[s.gameState.currentPlayerIndex])

  const allMatched = matchedCount === PAIR_COUNT

  // Countdown timer
  useEffect(() => {
    if (outcome) return

    if (secondsLeft <= 0) {
      const timer = setTimeout(() => {
        setOutcome('fail')
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, outcome])

  // Win check
  useEffect(() => {
    if (!allMatched || outcome) return

    const timer = setTimeout(() => {
      setOutcome('success')
    }, 0)
    return () => clearTimeout(timer)
  }, [allMatched, outcome])

  // Report result once outcome is decided
  useEffect(() => {
    if (!outcome) return

    const bonus =
      outcome === 'success'
        ? Math.floor(Math.random() * (MAX_BONUS - MIN_BONUS + 1)) + MIN_BONUS
        : 0

    const revealTimer = setTimeout(() => {
      setEarnedBonus(bonus)
    }, 0)

    const resultTimer = setTimeout(() => {
      onResult({ success: outcome === 'success', bonus })
    }, 2000)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(resultTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome])

  const handleFlip = (id: number) => {
    if (isLocked || outcome) return
    const card = cards.find((c) => c.id === id)
    if (!card || card.isFlipped || card.isMatched) return
    if (flippedIds.length === 2) return

    const nextFlipped = [...flippedIds, id]
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))
    setFlippedIds(nextFlipped)

    if (nextFlipped.length === 2) {
      setIsLocked(true)
      const [firstId, secondId] = nextFlipped
      const first = cards.find((c) => c.id === firstId)
      const second = cards.find((c) => c.id === secondId)

      setTimeout(() => {
        if (first && second && first.icon === second.icon) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c,
            ),
          )
          setMatchedCount((n) => n + 1)
        } else {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c,
            ),
          )
        }
        setFlippedIds([])
        setIsLocked(false)
      }, 700)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-1 shadow-2xl">
          <div className="rounded-xl bg-slate-900 p-8">
            <div className="mb-4 text-center">
              <div className="text-4xl">🧠</div>
              <h2 className="mt-2 text-xl font-bold text-violet-400">Memory Match</h2>
              <p className="mt-1 text-sm text-slate-400">
                {currentPlayer?.name ?? 'Player'}, match {PAIR_COUNT} pairs of cards!
              </p>
            </div>

            {!outcome && (
              <div className="mb-4 text-center">
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    secondsLeft <= 10 ? 'text-red-400' : 'text-violet-300'
                  }`}
                >
                  {secondsLeft}s
                </span>
              </div>
            )}

            <div className="mb-6 grid grid-cols-3 gap-3" style={{ perspective: '600px' }}>
              {cards.map((card) => {
                const isRevealed = card.isFlipped || card.isMatched
                return (
                  <button
                    key={card.id}
                    onClick={() => handleFlip(card.id)}
                    disabled={isRevealed || isLocked || !!outcome}
                    className="relative h-20 w-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.5s',
                    }}
                  >
                    <div
                      className={`absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-2xl shadow-lg ${
                        !isRevealed && !isLocked && !outcome ? 'hover:scale-105' : ''
                      }`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      🂠
                    </div>

                    <div
                      className={`absolute inset-0 flex items-center justify-center rounded-xl text-3xl shadow-lg ${
                        card.isMatched ? 'bg-green-500/30' : 'bg-slate-700'
                      }`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      {card.icon}
                    </div>
                  </button>
                )
              })}
            </div>

            {outcome === 'success' && (
              <div className="rounded-xl bg-green-500/20 p-4 text-center text-green-400">
                <p className="font-bold">
                  {' '}
                  {earnedBonus !== null
                    ? `🎉 Success! Moved forward ${earnedBonus} cell${earnedBonus === 1 ? '' : 's'}!`
                    : '🎉 Success!'}
                </p>
              </div>
            )}
            {outcome === 'fail' && (
              <div className="rounded-xl bg-red-500/20 p-4 text-center text-red-400">
                <p className="font-bold">⏰ Time's up! No effect.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
