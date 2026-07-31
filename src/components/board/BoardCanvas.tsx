import { useEffect, useRef } from 'react'
import { BoardRenderer } from '../../core/engine/BoardRenderer'
import { useBoard, usePlayers } from '../../stores/gameStore'

export function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BoardRenderer | null>(null)
  const board = useBoard()
  const players = usePlayers()

  useEffect(() => {
    if (!canvasRef.current) return
    rendererRef.current = new BoardRenderer(canvasRef.current)
    rendererRef.current.start()

    return () => {
      rendererRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!board || !rendererRef.current) return
    rendererRef.current.setBoard(board)
  }, [board])

  useEffect(() => {
    if (!players || !rendererRef.current) return
    rendererRef.current.setPlayers(players)
  }, [players])

  return (
    <div className="aspect-square w-full max-w-150">
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
