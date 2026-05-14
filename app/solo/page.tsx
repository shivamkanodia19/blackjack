"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home, RotateCcw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import GameBoard from "@/components/game-board"
import { useSoloGame } from "@/hooks/useSoloGame"
import type { SoloSessionConfig } from "@/lib/types/modes"

export default function SoloPage() {
  const router = useRouter()
  const { config, phase, stats, startSession, endSession, resetSession } = useSoloGame()

  const [formBankroll, setFormBankroll] = useState<number>(1000)
  const [formShowHints, setFormShowHints] = useState<boolean>(false)

  const handleStartSession = () => {
    const cfg: SoloSessionConfig = {
      startingBankroll: formBankroll,
      showHints: formShowHints,
    }
    startSession(cfg)
  }

  const handlePlayAgain = () => {
    resetSession()
  }

  const strategyAccuracy =
    stats.strategyDecisions > 0
      ? Math.round((stats.strategyCorrect / stats.strategyDecisions) * 100)
      : null

  // ── Active: GameBoard view ──────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <GameBoard
        mode="practice"
        onExit={endSession}
        initialBankroll={config.startingBankroll}
        showHints={config.showHints}
      />
    )
  }

  // ── Complete: Summary view ──────────────────────────────────────────────────
  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-emerald-950 text-white flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-emerald-800">
          <button
            onClick={() => router.push("/")}
            className="text-emerald-400 hover:text-emerald-200 transition-colors"
            aria-label="Go home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-emerald-100">Session Summary</h1>
        </header>

        {/* Summary card */}
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md bg-emerald-900 border-emerald-700">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-700">
                <TrendingUp className="w-7 h-7 text-emerald-200" />
              </div>
              <CardTitle className="text-emerald-100 text-2xl">Session Complete</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Hands Played" value={stats.handsPlayed} />
                <StatBox label="Hands Won" value={stats.handsWon} highlight="green" />
                <StatBox label="Hands Lost" value={stats.handsLost} highlight="red" />
                <StatBox label="Pushes" value={stats.handsPushed} />
              </div>

              {/* Strategy accuracy */}
              <div className="rounded-lg bg-emerald-800/60 p-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                  Strategy
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-emerald-100">
                    {strategyAccuracy !== null ? `${strategyAccuracy}%` : "—"}
                  </span>
                  <span className="text-sm text-emerald-400">
                    {stats.strategyCorrect}/{stats.strategyDecisions} correct
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <span>Current streak:</span>
                  <span className="font-semibold text-emerald-100">{stats.strategyStreak}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-1">
                <Button
                  onClick={handlePlayAgain}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full border-emerald-600 text-emerald-300 hover:bg-emerald-800 hover:text-emerald-100"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ── Idle: Setup view ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-emerald-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-emerald-800">
        <button
          onClick={() => router.push("/")}
          className="text-emerald-400 hover:text-emerald-200 transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-emerald-100">Solo Mode</h1>
      </header>

      {/* Setup form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-emerald-900 border-emerald-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-100 text-xl">Configure Session</CardTitle>
            <p className="text-sm text-emerald-400 mt-1">
              Play at your own pace with optional strategy hints.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Starting bankroll */}
            <div className="space-y-2">
              <label
                htmlFor="bankroll"
                className="block text-sm font-medium text-emerald-300"
              >
                Starting Bankroll ($)
              </label>
              <Input
                id="bankroll"
                type="number"
                min={100}
                max={10000}
                step={100}
                value={formBankroll}
                onChange={(e) => setFormBankroll(Number(e.target.value))}
                className="bg-emerald-800 border-emerald-600 text-emerald-100 placeholder:text-emerald-500 focus-visible:ring-emerald-500"
              />
              <p className="text-xs text-emerald-500">Min $100 · Max $10,000</p>
            </div>

            {/* Show hints toggle */}
            <div className="flex items-center gap-3">
              <input
                id="showHints"
                type="checkbox"
                checked={formShowHints}
                onChange={(e) => setFormShowHints(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="showHints"
                className="text-sm font-medium text-emerald-300 cursor-pointer select-none"
              >
                Show strategy hints
              </label>
            </div>

            {/* Start button */}
            <Button
              onClick={handleStartSession}
              disabled={formBankroll < 100 || formBankroll > 10000}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3"
            >
              Start Session
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// ── Small helper component ────────────────────────────────────────────────────

interface StatBoxProps {
  label: string
  value: number
  highlight?: "green" | "red"
}

function StatBox({ label, value, highlight }: StatBoxProps) {
  const valueClass =
    highlight === "green"
      ? "text-emerald-300"
      : highlight === "red"
      ? "text-red-400"
      : "text-emerald-100"

  return (
    <div className="rounded-lg bg-emerald-800/60 p-3 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}
