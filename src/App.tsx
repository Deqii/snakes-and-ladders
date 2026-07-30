import { useEffect } from 'react'
import { BoardCanvas } from './components/board/BoardCanvas'
import { useGameStore } from './stores/gameStore'

function App() {
  const startNewGame = useGameStore((s) => s.startNewGame)

  useEffect(() => {
    startNewGame(['Player 1', 'Player 2'])
  }, [startNewGame])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-8">
      <BoardCanvas />
    </div>
  )
}

export default App
