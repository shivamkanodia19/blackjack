import { useState, useCallback } from "react"
import type { SoloSessionConfig, SessionPhase } from "@/lib/types/modes"
import type { SessionStats } from "@/lib/types"

export interface SoloGameSession {
  config: SoloSessionConfig
  phase: SessionPhase
  stats: SessionStats
  startSession: (config: SoloSessionConfig) => void
  endSession: () => void
  updateStats: (stats: Partial<SessionStats>) => void
  resetSession: () => void
}

const DEFAULT_CONFIG: SoloSessionConfig = {
  startingBankroll: 1000,
  showHints: false,
}

const DEFAULT_STATS: SessionStats = {
  handsPlayed: 0,
  handsWon: 0,
  handsLost: 0,
  handsPushed: 0,
  totalMoves: 0,
  strategyDecisions: 0,
  strategyCorrect: 0,
  strategyStreak: 0,
}

export function useSoloGame(): SoloGameSession {
  const [config, setConfig] = useState<SoloSessionConfig>(DEFAULT_CONFIG)
  const [phase, setPhase] = useState<SessionPhase>("idle")
  const [stats, setStats] = useState<SessionStats>(DEFAULT_STATS)

  const startSession = useCallback((cfg: SoloSessionConfig) => {
    setConfig(cfg)
    setStats(DEFAULT_STATS)
    setPhase("active")
  }, [])

  const endSession = useCallback(() => {
    setPhase("complete")
  }, [])

  const updateStats = useCallback((partial: Partial<SessionStats>) => {
    setStats((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetSession = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setStats(DEFAULT_STATS)
    setPhase("idle")
  }, [])

  return { config, phase, stats, startSession, endSession, updateStats, resetSession }
}
