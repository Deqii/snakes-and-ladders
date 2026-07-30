import { useEffect, useRef } from 'react'
import { BoardRenderer } from '../../core/engine/BoardRenderer'
import { useBoard } from '../../stores/gameStore'

export function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BoardRenderer | null>(null)
  const board = useBoard()

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

  return (
    <div className="aspect-square w-full max-w-150">
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
