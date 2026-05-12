export interface RulesConfig {
  /** Number of standard 52-card decks in the shoe */
  numDecks: 1 | 2 | 4 | 6 | 8
  /** true = H17 (dealer hits soft 17); false = S17 (dealer stands on all 17s) */
  dealerHitsS17: boolean
  /** Profit multiplier for a natural blackjack: 1.5 (3:2), 1.2 (6:5), 1.0 (1:1) */
  blackjackPayout: number
  /** Player may double down on split hands */
  doubleAfterSplit: boolean
  /** Maximum total hands after splitting (including the original) */
  maxSplitHands: number
  /** Late surrender available on first two cards (non-split only) */
  allowSurrender: boolean
  /** Reshuffle shoe when remaining cards fall below this threshold */
  reshuffleThreshold: number
}

export const DEFAULT_RULES: RulesConfig = {
  numDecks: 6,
  dealerHitsS17: false,      // S17
  blackjackPayout: 1.5,      // 3:2
  doubleAfterSplit: true,
  maxSplitHands: 4,
  allowSurrender: false,
  reshuffleThreshold: 20,
}
