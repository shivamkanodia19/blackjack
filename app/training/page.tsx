"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Target, Flame, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import GameBoard from "@/components/game-board"
import { useTrainingGame } from "@/hooks/useTrainingGame"
import type { TrainingSessionConfig } from "@/lib/types/modes"

const DRILL_CATEGORIES: {
  value: TrainingSessionConfig["drillCategory"]
  label: string
}[] = [
  { value: "all", label: "All Hands" },
  { value: "hard-totals", label: "Hard Totals" },
  { value: "soft-totals", label: "Soft Totals" },
  { value: "pairs", label: "Pairs" },
]

export default function TrainingPage() {
  const { config, phase, state, startSession, endSession, resetSession, accuracyPct } =
    useTrainingGame()

  // Local setup form state
  const [feedbackOn, setFeedbackOn] = useState(true)
  const [drillCategory, setDrillCategory] =
    useState<TrainingSessionConfig["drillCategory"]>("all")

  function handleStart() {
    startSession({ showImmediateFeedback: feedbackOn, drillCategory })
  }

  // ─── Setup view ───────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-blue-800/40">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-blue-300 hover:text-white hover:bg-blue-800/40 gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">Training Mode</h1>
        </header>

        {/* Setup card */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md bg-blue-900/40 border-blue-700/50 text-white shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-blue-100 text-lg">Configure Session</CardTitle>
              </div>
              <p className="text-blue-300 text-sm">
                Practice basic strategy. Get instant feedback on every decision.
              </p>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              {/* Immediate feedback toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Immediate Feedback</p>
                  <p className="text-xs text-blue-400">Show correct action after each decision</p>
                </div>
                <button
                  onClick={() => setFeedbackOn((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    feedbackOn ? "bg-blue-500" : "bg-slate-600"
                  }`}
                  aria-label="Toggle immediate feedback"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      feedbackOn ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Drill category */}
              <div>
                <p className="text-sm font-medium text-blue-100 mb-2">Drill Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {DRILL_CATEGORIES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDrillCategory(value)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        drillCategory === value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-blue-900/30 border-blue-700/40 text-blue-300 hover:bg-blue-800/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStart}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3"
              >
                Start Training
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ─── Game view ────────────────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex flex-col">
        {/* Stats overlay */}
        <div className="w-full px-4 pt-4 pb-2 flex justify-center">
          <div className="flex items-center gap-4 bg-blue-900/60 border border-blue-700/40 rounded-xl px-5 py-2 text-sm text-blue-200 shadow">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="font-semibold text-white">
                {accuracyPct.toFixed(0)}%
              </span>
              <span className="text-blue-400 text-xs">(stats tracked inside game)</span>
            </span>
            <span className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Streak:</span>
              <span className="font-semibold text-white">{state.currentStreak}</span>
            </span>
            <span className="text-blue-300">
              {state.correctDecisions}/{state.totalDecisions} decisions
            </span>
          </div>
        </div>

        {/* GameBoard */}
        <div className="flex-1">
          <GameBoard mode="testing" onExit={endSession} initialBankroll={999999} />
        </div>
      </div>
    )
  }

  // ─── Summary view ─────────────────────────────────────────────────────────
  const recentMistakes = state.mistakeLog.slice(-5).reverse()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex flex-col">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-blue-800/40">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-blue-300 hover:text-white hover:bg-blue-800/40 gap-1">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Session Complete!</h1>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-5">
          {/* Stats summary card */}
          <Card className="bg-blue-900/40 border-blue-700/50 text-white shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-100 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Your Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-800/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{state.totalDecisions}</p>
                  <p className="text-xs text-blue-400 mt-0.5">Total Decisions</p>
                </div>
                <div className="bg-blue-800/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{state.correctDecisions}</p>
                  <p className="text-xs text-blue-400 mt-0.5">Correct</p>
                </div>
                <div className="bg-blue-800/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-300">{accuracyPct.toFixed(1)}%</p>
                  <p className="text-xs text-blue-400 mt-0.5">Accuracy</p>
                </div>
                <div className="bg-blue-800/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-400">{state.bestStreak}</p>
                  <p className="text-xs text-blue-400 mt-0.5">Best Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mistakes card */}
          {recentMistakes.length > 0 && (
            <Card className="bg-blue-900/40 border-blue-700/50 text-white shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-100 flex items-center gap-2 text-base">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Recent Mistakes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMistakes.map((m) => (
                  <div key={m.handId} className="bg-blue-800/20 rounded-lg p-3 text-sm border border-blue-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-600/70 text-white text-xs border-0">
                        You: {m.playerAction}
                      </Badge>
                      <span className="text-blue-400">→</span>
                      <Badge className="bg-green-600/70 text-white text-xs border-0">
                        Best: {m.recommendedAction}
                      </Badge>
                    </div>
                    <p className="text-blue-300 text-xs">{m.reason}</p>
                    <p className="text-blue-500 text-xs mt-0.5">
                      Total: {m.playerTotal} vs dealer {m.dealerUpCard}
                      {m.isSoft ? " (soft)" : ""}
                      {m.wasPair ? " (pair)" : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {recentMistakes.length === 0 && state.totalDecisions === 0 && (
            <p className="text-center text-blue-400 text-sm">
              No decisions recorded — stats are tracked inside the game engine.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={resetSession}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-blue-600 text-blue-300 hover:bg-blue-800/40 hover:text-white"
              >
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
