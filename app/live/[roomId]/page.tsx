// MVP: This page manages room/lobby state. Per-player blackjack hands are
// simulated via placeholder actions. Full per-player game boards would require
// integration work tracked in docs/mode-architecture.md.

"use client"

import { useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, Check, Crown, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLiveRoom } from "@/hooks/useLiveRoom"
import GameBoard from "@/components/game-board"
import type { RoomPlayer, RoomHandResult } from "@/lib/types/room"

// ---------------------------------------------------------------------------
// Leaderboard component (inline)
// ---------------------------------------------------------------------------
function Leaderboard({ players, hostId }: { players: RoomPlayer[]; hostId: string }) {
  const sorted = [...players].sort((a, b) => b.sessionChips - a.sessionChips)
  return (
    <div className="overflow-hidden rounded-lg border border-violet-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-violet-900/60 text-violet-300">
            <th className="px-3 py-2 text-left font-medium">Rank</th>
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-right font-medium">Chips</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, idx) => (
            <tr
              key={player.id}
              className="border-t border-violet-800 hover:bg-violet-900/30"
            >
              <td className="px-3 py-2 text-violet-400 font-mono">#{idx + 1}</td>
              <td className="px-3 py-2 text-white flex items-center gap-1">
                {player.id === hostId && (
                  <Crown className="w-3 h-3 text-yellow-400 inline" />
                )}
                {player.name}
              </td>
              <td className="px-3 py-2 text-right font-mono font-medium text-green-400">
                {player.sessionChips.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settlement form: for each player pick outcome + bet amount, then apply
// ---------------------------------------------------------------------------
function SettlementPanel({
  players,
  onApply,
  isLoading,
}: {
  players: RoomPlayer[]
  onApply: (results: RoomHandResult[]) => void
  isLoading: boolean
}) {
  const [outcomes, setOutcomes] = useState<Record<string, RoomHandResult["outcome"]>>(() =>
    Object.fromEntries(players.map((p) => [p.id, "loss"]))
  )
  const [bets, setBets] = useState<Record<string, string>>(() =>
    Object.fromEntries(players.map((p) => [p.id, "100"]))
  )

  const handleApply = () => {
    const results: RoomHandResult[] = players.map((p) => {
      const outcome = outcomes[p.id]
      const bet = parseInt(bets[p.id], 10) || 0
      let payout = 0
      if (outcome === "win") payout = bet
      else if (outcome === "blackjack") payout = Math.floor(bet * 1.5)
      else if (outcome === "loss") payout = -bet
      else payout = 0 // push
      return { playerId: p.id, outcome, bet, payout }
    })
    onApply(results)
  }

  return (
    <div className="space-y-3">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-violet-900/40 border border-violet-700"
        >
          <span className="text-white font-medium flex-1 min-w-0 truncate">{player.name}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Input
              type="number"
              min={1}
              value={bets[player.id]}
              onChange={(e) => setBets((prev) => ({ ...prev, [player.id]: e.target.value }))}
              className="w-24 bg-violet-950/50 border-violet-600 text-white text-sm"
              placeholder="Bet"
            />
            <select
              value={outcomes[player.id]}
              onChange={(e) =>
                setOutcomes((prev) => ({
                  ...prev,
                  [player.id]: e.target.value as RoomHandResult["outcome"],
                }))
              }
              className="bg-violet-950 border border-violet-600 text-white text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="win">Win</option>
              <option value="blackjack">Blackjack</option>
              <option value="loss">Loss</option>
              <option value="push">Push</option>
            </select>
          </div>
        </div>
      ))}
      <Button
        onClick={handleApply}
        disabled={isLoading}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white"
      >
        {isLoading ? "Applying..." : "Apply Settlement"}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Copy-to-clipboard chip
// ---------------------------------------------------------------------------
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-xl font-bold tracking-widest text-violet-200 hover:text-white bg-violet-900/60 hover:bg-violet-800/60 border border-violet-600 rounded-lg px-4 py-2 transition-colors"
    >
      {code}
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 opacity-60" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function LiveRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const {
    room,
    playerId,
    isLoading,
    error,
    setReady,
    startBetting,
    placeBet,
    startDealing,
    nextPlayerTurn,
    completePlayerTurn,
    startDealerTurn,
    completeSettlement,
    nextRound,
    endSession,
    leaveRoom,
  } = useLiveRoom(roomId)

  // Bet input state (indexed by playerId)
  const [betInputs, setBetInputs] = useState<Record<string, string>>({})

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-violet-300">Loading room...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-violet-900 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-violet-800/50">
        <Link href="/live">
          <Button
            variant="ghost"
            size="icon"
            className="text-violet-200 hover:text-white hover:bg-violet-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg leading-tight">Live Room</h1>
          <p className="text-violet-400 text-xs">Round {room.currentRound}</p>
        </div>
        <Badge
          className="bg-violet-700 text-violet-100 text-xs capitalize"
          variant="secondary"
        >
          {room.state.replace("_", " ")}
        </Badge>
      </header>

      {/* Error banner */}
      {error && (
        <div className="px-4 pt-3">
          <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <main className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* ------------------------------------------------------------------ */}
        {/* LOBBY / READY CHECK                                                  */}
        {/* ------------------------------------------------------------------ */}
        {(room.state === "lobby" || room.state === "ready_check") && (
          <>
            {/* Room code */}
            <Card className="bg-violet-900/50 border-violet-700">
              <CardContent className="pt-4 pb-4">
                <p className="text-violet-300 text-sm mb-2 text-center">Room Code — share with friends</p>
                <div className="flex justify-center">
                  <CopyCode code={room.code} />
                </div>
              </CardContent>
            </Card>

            {/* Player list */}
            <Card className="bg-violet-900/50 border-violet-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">
                  Players ({room.players.length}/{room.config.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {room.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-violet-950/40"
                  >
                    <span className="text-violet-400 text-sm w-4 text-center">
                      {player.seatIndex + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {player.id === room.hostId && (
                          <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        )}
                        <span className="text-white font-medium truncate">{player.name}</span>
                      </div>
                      <span className="text-violet-400 text-xs">
                        {player.sessionChips.toLocaleString()} chips
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {player.isReady ? (
                        <Badge className="bg-green-700 text-green-100 text-xs">Ready</Badge>
                      ) : (
                        <Badge className="bg-violet-700 text-violet-200 text-xs" variant="secondary">
                          Not ready
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-violet-600 text-violet-200 hover:bg-violet-700 hover:text-white text-xs h-7 px-2"
                        onClick={() => setReady(player.id, !player.isReady)}
                        disabled={isLoading}
                      >
                        Toggle
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Start button (host only, only when ready_check) */}
            {room.state === "ready_check" && (
              <Button
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3"
                onClick={() => startBetting()}
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Start Game"}
              </Button>
            )}
            {room.state === "lobby" && (
              <p className="text-center text-violet-400 text-sm">
                All players must be ready to start
              </p>
            )}
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* BETTING                                                              */}
        {/* ------------------------------------------------------------------ */}
        {room.state === "betting" && (
          <Card className="bg-violet-900/50 border-violet-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Place Bets — Round {room.currentRound + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-violet-950/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{player.name}</p>
                    <p className="text-violet-400 text-xs">
                      {player.sessionChips.toLocaleString()} chips available
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={player.sessionChips}
                      value={betInputs[player.id] ?? "100"}
                      onChange={(e) =>
                        setBetInputs((prev) => ({ ...prev, [player.id]: e.target.value }))
                      }
                      className="w-24 bg-violet-950/50 border-violet-600 text-white text-sm"
                    />
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
                      onClick={() => {
                        const amount = parseInt(betInputs[player.id] ?? "100", 10)
                        if (!isNaN(amount) && amount > 0) placeBet(player.id, amount)
                      }}
                      disabled={isLoading}
                    >
                      Bet
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                className="w-full bg-green-600 hover:bg-green-500 text-white mt-2"
                onClick={() => startDealing()}
                disabled={isLoading}
              >
                {isLoading ? "Dealing..." : "Start Dealing"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* DEALING (transitional — should move quickly to player_turn)         */}
        {/* ------------------------------------------------------------------ */}
        {room.state === "dealing" && (
          <Card className="bg-violet-900/50 border-violet-700">
            <CardContent className="py-8 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-violet-200">Dealing cards...</p>
              <div className="flex flex-col gap-2">
                {room.players.map((player) => (
                  <Button
                    key={player.id}
                    variant="outline"
                    className="border-violet-600 text-violet-200 hover:bg-violet-700"
                    onClick={() => nextPlayerTurn(player.id)}
                    disabled={isLoading}
                  >
                    Start {player.name}&apos;s Turn
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PLAYER TURN                                                          */}
        {/* ------------------------------------------------------------------ */}
        {room.state === "player_turn" && (
          <>
            {/* If it's this device's player's turn, show the full game board */}
            {room.currentPlayerId === playerId ? (
              <div className="flex-1">
                <GameBoard
                  mode="practice"
                  onExit={() => completePlayerTurn(playerId)}
                  onHandComplete={() => completePlayerTurn(playerId)}
                  initialBankroll={room.players.find((p) => p.id === playerId)?.sessionChips ?? 1000}
                />
              </div>
            ) : (
              <Card className="bg-violet-900/50 border-violet-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Player Turns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {room.players.map((player) => {
                    const isCurrentTurn = room.currentPlayerId === player.id
                    return (
                      <div
                        key={player.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isCurrentTurn
                            ? "bg-yellow-900/30 border-yellow-600"
                            : "bg-violet-950/40 border-violet-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Circle
                            className={`w-2.5 h-2.5 flex-shrink-0 ${
                              isCurrentTurn ? "fill-yellow-400 text-yellow-400" : "text-violet-600"
                            }`}
                          />
                          <span className="text-white font-medium truncate">{player.name}</span>
                          {isCurrentTurn && (
                            <Badge className="bg-yellow-700 text-yellow-100 text-xs flex-shrink-0">
                              Playing...
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Host controls to advance turns manually */}
                  {room.hostId === playerId && (
                    <div className="pt-1 space-y-2 border-t border-violet-700">
                      <p className="text-violet-400 text-xs text-center">Host: advance turn</p>
                      {room.players.map((player) => (
                        <Button
                          key={player.id}
                          size="sm"
                          variant="outline"
                          className="w-full border-violet-600 text-violet-200 hover:bg-violet-700 text-xs"
                          onClick={() => nextPlayerTurn(player.id)}
                          disabled={isLoading || room.currentPlayerId === player.id}
                        >
                          {player.name}&apos;s Turn
                        </Button>
                      ))}
                      <Button
                        className="w-full bg-amber-700 hover:bg-amber-600 text-white"
                        onClick={() => startDealerTurn()}
                        disabled={isLoading}
                      >
                        Dealer&apos;s Turn
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* DEALER TURN                                                          */}
        {/* ------------------------------------------------------------------ */}
        {room.state === "dealer_turn" && (
          <Card className="bg-violet-900/50 border-violet-700">
            <CardContent className="py-8 text-center space-y-4">
              <div className="text-4xl">🃏</div>
              <p className="text-white text-lg font-semibold">Dealer Plays...</p>
              <p className="text-violet-300 text-sm">
                Simulate the dealer&apos;s hand, then click to proceed to settlement.
              </p>
              <Button
                className="w-full bg-amber-700 hover:bg-amber-600 text-white"
                onClick={() => {
                  // For the MVP settlement, pass empty results — SettlementPanel handles it next
                  // We transition to dealer_turn → settlement via completeSettlement with placeholder results
                  // Trigger a dummy settlement to transition state; user will adjust in settlement UI
                  const placeholderResults: RoomHandResult[] = room.players.map((p) => ({
                    playerId: p.id,
                    outcome: "push",
                    bet: 0,
                    payout: 0,
                  }))
                  completeSettlement(placeholderResults)
                }}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Complete Dealer Turn"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SETTLEMENT                                                           */}
        {/* NOTE: This state is reached after COMPLETE_SETTLEMENT which already  */}
        {/* transitions to round_complete. So this view may flash briefly.       */}
        {/* In practice, dealer_turn → completeSettlement → round_complete.      */}
        {/* ------------------------------------------------------------------ */}
        {room.state === "settlement" && (
          <Card className="bg-violet-900/50 border-violet-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <SettlementPanel
                players={room.players}
                onApply={(results) => completeSettlement(results)}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ROUND COMPLETE                                                       */}
        {/* ------------------------------------------------------------------ */}
        {room.state === "round_complete" && (
          <>
            <Card className="bg-violet-900/50 border-violet-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">
                  Round {room.currentRound} Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard players={room.players} hostId={room.hostId} />
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                onClick={() => nextRound()}
                disabled={isLoading}
              >
                {isLoading ? "..." : "Next Round"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-violet-600 text-violet-200 hover:bg-violet-800"
                onClick={() => endSession()}
                disabled={isLoading}
              >
                End Session
              </Button>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SESSION COMPLETE                                                     */}
        {/* ------------------------------------------------------------------ */}
        {room.state === "session_complete" && (
          <>
            <Card className="bg-violet-900/50 border-violet-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Final Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard players={room.players} hostId={room.hostId} />
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                onClick={() => router.push("/live")}
              >
                Play Again
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-violet-600 text-violet-200 hover:bg-violet-800"
                onClick={() => router.push("/")}
              >
                Go Home
              </Button>
            </div>
          </>
        )}

        {/* Player count / room footer */}
        <p className="text-center text-violet-500 text-xs pb-2">
          {room.players.length} player{room.players.length !== 1 ? "s" : ""} · Room {room.code}
        </p>
      </main>
    </div>
  )
}
