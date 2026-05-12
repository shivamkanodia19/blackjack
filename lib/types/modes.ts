export type AppMode = "solo" | "training" | "live"

export type SoloGameMode = "practice"  // maps to existing engine mode
export type TrainingGameMode = "testing"  // maps to existing engine mode

export interface SoloSessionConfig {
  startingBankroll: number
  showHints: boolean  // optional strategy hints (user can toggle)
}

export interface TrainingSessionConfig {
  showImmediateFeedback: boolean
  drillCategory: "all" | "hard-totals" | "soft-totals" | "pairs"
}

export interface TrainingSessionState {
  handsPlayed: number
  correctDecisions: number
  totalDecisions: number
  currentStreak: number
  bestStreak: number
  mistakeLog: MistakeEntry[]
}

export interface MistakeEntry {
  handId: string
  playerAction: string
  recommendedAction: string
  reason: string
  playerTotal: number
  dealerUpCard: number
  isSoft: boolean
  wasPair: boolean
  timestamp: number
}

export type SessionPhase = "idle" | "active" | "complete"
