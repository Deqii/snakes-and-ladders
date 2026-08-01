import { useEffect, useRef } from 'react'
import { BoardRenderer } from '../../core/engine/BoardRenderer'
import { useBoard, usePlayers, useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'

export function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BoardRenderer | null>(null)
  const board = useBoard()
  const players = usePlayers()
  const setBoardRenderer = useUIStore((s) => s.setBoardRenderer)
  const startNewGame = useGameStore((s) => s.startNewGame)

  useEffect(() => {
    if (!canvasRef.current) return
    const renderer = new BoardRenderer(canvasRef.current)
    rendererRef.current = renderer
    setBoardRenderer(renderer)
    renderer.start()

    return () => {
      renderer.destroy()
      setBoardRenderer(null)
    }
  }, [setBoardRenderer])

  useEffect(() => {
    startNewGame(['Player 1', 'Player 2'])
  }, [startNewGame])

  useEffect(() => {
    if (!board || !rendererRef.current) return
    rendererRef.current.setBoard(board)
  }, [board])

  useEffect(() => {
    if (!players || !rendererRef.current) return
    rendererRef.current.setPlayers(players)
  }, [players])

  return (
    <div className="aspect-square w-full max-w-150" style={{ minHeight: '300px' }}>
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
