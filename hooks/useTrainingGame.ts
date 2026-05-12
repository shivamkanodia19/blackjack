"use client"

import { useState, useCallback } from "react"
import type {
  TrainingSessionConfig,
  TrainingSessionState,
  MistakeEntry,
  SessionPhase,
} from "@/lib/types/modes"

export interface TrainingGameSession {
  config: TrainingSessionConfig
  phase: SessionPhase
  state: TrainingSessionState
  startSession: (config: TrainingSessionConfig) => void
  endSession: () => void
  recordDecision: (
    entry: Omit<MistakeEntry, "handId" | "timestamp">,
    isCorrect: boolean
  ) => void
  resetSession: () => void
  accuracyPct: number
}

const DEFAULT_CONFIG: TrainingSessionConfig = {
  showImmediateFeedback: true,
  drillCategory: "all",
}

const DEFAULT_STATE: TrainingSessionState = {
  handsPlayed: 0,
  correctDecisions: 0,
  totalDecisions: 0,
  currentStreak: 0,
  bestStreak: 0,
  mistakeLog: [],
}

export function useTrainingGame(): TrainingGameSession {
  const [config, setConfig] = useState<TrainingSessionConfig>(DEFAULT_CONFIG)
  const [phase, setPhase] = useState<SessionPhase>("idle")
  const [state, setState] = useState<TrainingSessionState>(DEFAULT_STATE)

  const startSession = useCallback((newConfig: TrainingSessionConfig) => {
    setConfig(newConfig)
    setState(DEFAULT_STATE)
    setPhase("active")
  }, [])

  const endSession = useCallback(() => {
    setPhase("complete")
  }, [])

  const recordDecision = useCallback(
    (entry: Omit<MistakeEntry, "handId" | "timestamp">, isCorrect: boolean) => {
      setState((prev) => {
        const newTotal = prev.totalDecisions + 1
        const newCorrect = isCorrect ? prev.correctDecisions + 1 : prev.correctDecisions
        const newStreak = isCorrect ? prev.currentStreak + 1 : 0
        const newBest = Math.max(prev.bestStreak, newStreak)

        const newMistakeLog = isCorrect
          ? prev.mistakeLog
          : [
              ...prev.mistakeLog,
              {
                ...entry,
                handId: Date.now().toString(),
                timestamp: Date.now(),
              } satisfies MistakeEntry,
            ]

        return {
          ...prev,
          totalDecisions: newTotal,
          correctDecisions: newCorrect,
          currentStreak: newStreak,
          bestStreak: newBest,
          mistakeLog: newMistakeLog,
        }
      })
    },
    []
  )

  const resetSession = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setState(DEFAULT_STATE)
    setPhase("idle")
  }, [])

  const accuracyPct =
    state.totalDecisions > 0
      ? (state.correctDecisions / state.totalDecisions) * 100
      : 0

  return {
    config,
    phase,
    state,
    startSession,
    endSession,
    recordDecision,
    resetSession,
    accuracyPct,
  }
}
