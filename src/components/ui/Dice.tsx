import { useState, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'] as const

export function Dice() {
  const [isRolling, setIsRolling] = useState(false)
  const [rollingFace, setRollingFace] = useState<string>('⚀')

  const phase = useGameStore((s) => s.gameState?.phase)
  const lastDiceResult = useGameStore((s) => s.gameState?.lastDiceResult)
  const currentPlayerIndex = useGameStore((s) => s.gameState?.currentPlayerIndex)
  const players = useGameStore((s) => s.gameState?.players)
  const isAnimating = useUIStore((s) => s.isAnimating)
  const boardRenderer = useUIStore((s) => s.boardRenderer)

  const rollDice = useGameStore((s) => s.rollDice)
  const movePlayer = useGameStore((s) => s.movePlayer)
  const landOnCell = useGameStore((s) => s.landOnCell)
  const endTurn = useGameStore((s) => s.endTurn)

  // Derived: show final face when not rolling
  const finalFace = lastDiceResult ? DICE_FACES[lastDiceResult - 1] : '⚀'
  const displayFace = isRolling ? rollingFace : finalFace

  const handleRoll = useCallback(() => {
    if (phase !== 'idle' || isAnimating || isRolling) return

    rollDice()
    setIsRolling(true)

    const interval = setInterval(() => {
      const randomFace = DICE_FACES[Math.floor(Math.random() * 6)]
      if (randomFace) setRollingFace(randomFace)
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      setIsRolling(false)

      // Build path for animation
      const currentPlayer = players?.[currentPlayerIndex ?? 0]
      const steps = useGameStore.getState().gameState?.lastDiceResult ?? 1
      const startPos = currentPlayer?.position ?? 1
      const path: number[] = []

      for (let i = 1; i <= steps; i++) {
        path.push(Math.min(startPos + i, 100))
      }

      // Animate then update state
      if (boardRenderer && currentPlayerIndex !== undefined) {
        boardRenderer.animatePlayerMove(currentPlayerIndex, path)
        setTimeout(
          () => {
            movePlayer()
            landOnCell()
            endTurn()
          },
          steps * 150 + 100,
        )
      } else {
        movePlayer()
        landOnCell()
        endTurn()
      }
    }, 1000)
  }, [
    phase,
    isAnimating,
    isRolling,
    rollDice,
    movePlayer,
    landOnCell,
    endTurn,
    boardRenderer,
    currentPlayerIndex,
    players,
  ])

  const isDisabled = phase !== 'idle' || isAnimating || isRolling

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`text-8xl text-white ml-4 transition-transform duration-100 ${isRolling ? 'scale-110' : 'scale-100'}`}
      >
        {displayFace}
      </div>
      <button
        onClick={handleRoll}
        disabled={isDisabled}
        className="min-w-40 rounded-full bg-green-400 ml-4 px-6 py-3 font-bold text-slate-900 transition-all hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isRolling ? 'Rolling...' : 'Roll Dice 🎲'}
      </button>
    </div>
  )
}
