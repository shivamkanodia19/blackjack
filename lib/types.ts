export interface Card {
  suit: string
  rank: string
  value: number
}

export interface SideBet {
  type: "perfectPairs" | "twentyOnePlus3" | "insurance" | "luckyLadies" | "royalMatch" | "overUnder13" | "matchDealer"
  amount: number
  result?: "win" | "lose"
  payout?: number
}

export interface Hand {
  cards: Card[]
  value: number
  bet: number
  originalBet?: number
  isDoubled?: boolean
  result?: "win" | "loss" | "push"
  isComplete: boolean
  canDouble: boolean
  canSplit: boolean
  isBlackjack?: boolean
}

export interface GameState {
  deck: Card[]
  playerHands: Hand[]
  dealerHand: Card[]
  currentHandIndex: number
  dealerScore: number
  gamePhase: "betting" | "sideBets" | "playing" | "finished"
  message: string
  bankroll: number
  pendingBets: number // single pool for all at-risk funds
  mainBet: number
  sideBets: SideBet[]
  canSurrender: boolean
  mode: "real" | "practice" | "testing"
}

export interface SessionStats {
  handsPlayed: number
  handsWon: number
  handsLost: number
  handsPushed: number
  totalMoves: number
  strategyDecisions: number
  strategyCorrect: number
  strategyStreak: number
}

export interface StrategyRecommendation {
  action: "Hit" | "Stand" | "Double" | "Split" | "Surrender"
  reason: string
}

export interface ActionFeedback {
  isCorrect: boolean
  playerAction: string
  recommendedAction: string
  reason: string
  show: boolean
}

export interface MoneyFlow {
  mainBetProfit: number
  sideBetProfit: number
  totalProfit: number
  breakdown: string[]
}
