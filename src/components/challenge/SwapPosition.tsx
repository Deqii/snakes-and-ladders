import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/gameStore'

interface SwapPositionProps {
  onSwap: (targetPlayerId: string) => void
}

export function SwapPosition({ onSwap }: SwapPositionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const players = useGameStore((s) => s.gameState?.players ?? [])
  const currentPlayerIndex = useGameStore((s) => s.gameState?.currentPlayerIndex ?? 0)
  const currentPlayer = players[currentPlayerIndex]
  const opponents = players.filter((_, i) => i !== currentPlayerIndex)
  const isTwoPlayer = players.length === 2

  // Two-player games have only one possible target — auto-select and swap.
  useEffect(() => {
    if (!isTwoPlayer) return
    const onlyOpponent = opponents[0]
    if (!onlyOpponent) return

    const revealTimer = setTimeout(() => {
      setSelectedId(onlyOpponent.id)
    }, 0)

    const swapTimer = setTimeout(() => {
      onSwap(onlyOpponent.id)
    }, 1400)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(swapTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTwoPlayer])

  const handlePick = (targetId: string) => {
    if (selectedId) return
    setSelectedId(targetId)
    setTimeout(() => {
      onSwap(targetId)
    }, 1000)
  }

  const selectedPlayer = players.find((p) => p.id === selectedId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-1 shadow-2xl">
          <div className="rounded-xl bg-slate-900 p-8">
            <div className="mb-6 text-center">
              <div className="text-4xl">🔄</div>
              <h2 className="mt-2 text-xl font-bold text-sky-400">Swap Position</h2>
              <p className="mt-1 text-sm text-slate-400">
                {isTwoPlayer
                  ? `${currentPlayer?.name ?? 'Player'} is about to swap positions!`
                  : `${currentPlayer?.name ?? 'Player'}, pick an opponent to swap with!`}
              </p>
            </div>

            {!isTwoPlayer && (
              <div className="mb-2 flex flex-col gap-3">
                {opponents.map((opponent) => {
                  const isSelected = selectedId === opponent.id
                  const isDisabled = selectedId !== null && !isSelected

                  return (
                    <button
                      key={opponent.id}
                      onClick={() => handlePick(opponent.id)}
                      disabled={selectedId !== null}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-sky-400 bg-sky-500/20'
                          : isDisabled
                            ? 'border-slate-700 bg-slate-800/50 opacity-40'
                            : 'border-slate-700 bg-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: opponent.color }}
                        >
                          {opponent.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-white">{opponent.name}</span>
                      </div>
                      <span className="text-sm text-slate-400">Cell {opponent.position}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {isTwoPlayer && selectedPlayer && currentPlayer && (
              <div className="mb-2 flex items-center justify-center gap-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-6">
                <div className="text-center">
                  <span
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: currentPlayer.color }}
                  >
                    {currentPlayer.name.charAt(0).toUpperCase()}
                  </span>
                  <p className="mt-2 text-xs text-slate-400">Cell {currentPlayer.position}</p>
                </div>
                <span className="text-2xl text-sky-400">⇄</span>
                <div className="text-center">
                  <span
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: selectedPlayer.color }}
                  >
                    {selectedPlayer.name.charAt(0).toUpperCase()}
                  </span>
                  <p className="mt-2 text-xs text-slate-400">Cell {selectedPlayer.position}</p>
                </div>
              </div>
            )}

            {selectedId && (
              <p className="mt-4 text-center text-xs font-medium text-sky-400">
                Swapping positions...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
