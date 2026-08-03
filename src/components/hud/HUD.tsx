import { useGameStore } from '../../stores/gameStore'
import type { GameEvent, Player } from '../../core/types/index'

function getPlayerName(players: Player[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name ?? playerId
}

function describeEvent(event: GameEvent, players: Player[]): string {
  const name = getPlayerName(players, event.player)

  switch (event.type) {
    case 'snake':
      return `🐍 ${name} hit a snake, from ${event.from} to ${event.to}`
    case 'ladder':
      return `🪜 ${name} climbed a ladder, from ${event.from} to ${event.to}`
    case 'challenge':
      return `❓ ${name} landed on a Challenge at cell ${event.cell}`
    case 'challenge-result':
      return `${name}: ${event.description}`
    case 'win':
      return `🎉 ${name} wins!`
  }
}

function PlayerRow({ player, isActive }: { player: Player; isActive: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
        isActive ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: player.color }}
        >
          {player.name.charAt(0).toUpperCase()}
        </span>
        <span className={`text-sm font-medium ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
          {player.name}
        </span>
        {isActive && <span className="text-xs text-amber-400">← turn</span>}
      </div>
      <span className="text-sm text-slate-400">Cell {player.position}</span>
    </div>
  )
}

function EventLogList({ eventLog, players }: { eventLog: GameEvent[]; players: Player[] }) {
  if (eventLog.length === 0) {
    return <p className="text-sm text-slate-500">No events yet.</p>
  }

  return (
    <div className="flex max-h-64 flex-col-reverse gap-2 overflow-y-auto pr-1">
      {eventLog
        .slice()
        .reverse()
        .map((event, i) => (
          // eventLog entries aren't individually unique-keyed; index is stable
          // within a single render since the array only grows (never reorders).
          <p key={eventLog.length - i} className="text-xs text-slate-400">
            {describeEvent(event, players)}
          </p>
        ))}
    </div>
  )
}

const EMPTY_PLAYERS: Player[] = []
const EMPTY_EVENT_LOG: GameEvent[] = []

function LastResultBanner({ eventLog, players }: { eventLog: GameEvent[]; players: Player[] }) {
  const lastResult = [...eventLog].reverse().find((e) => e.type === 'challenge-result')
  if (!lastResult) return null

  return (
    <div className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-4">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">
        Last Result
      </h2>
      <p className="text-sm text-slate-200">{describeEvent(lastResult, players)}</p>
    </div>
  )
}

export function HUD() {
  const players = useGameStore((s) => s.gameState?.players ?? EMPTY_PLAYERS)
  const currentPlayerIndex = useGameStore((s) => s.gameState?.currentPlayerIndex ?? 0)
  const eventLog = useGameStore((s) => s.gameState?.eventLog ?? EMPTY_EVENT_LOG)

  if (players.length === 0) return null

  return (
    <div className="flex w-full flex-col gap-4 lg:w-72">
      <LastResultBanner eventLog={eventLog} players={players} />
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Players
        </h2>
        <div className="flex flex-col gap-2">
          {players.map((player, i) => (
            <PlayerRow key={player.id} player={player} isActive={i === currentPlayerIndex} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          History
        </h2>
        <EventLogList eventLog={eventLog} players={players} />
      </div>
    </div>
  )
}
