import type { Card } from "@/lib/types"
import { DEFAULT_RULES, type RulesConfig } from "./rules"

// ── Types ──────────────────────────────────────────────────────────────────

export interface HandScore {
  total: number
  soft: boolean
}

export type PlayerAction = "Hit" | "Stand" | "Double" | "Split" | "Surrender"

export type HandOutcomeResult = "win" | "loss" | "push" | "surrender"

export interface HandOutcome {
  result: HandOutcomeResult
  /** Net profit as a multiplier of the original bet (e.g. 1.5 for 3:2 BJ, -1 for loss). Caller multiplies by bet. */
  profitMultiplier: number
}

// ── Shoe ──────────────────────────────────────────────────────────────────

/**
 * Builds and shuffles a shoe of `numDecks` standard 52-card decks.
 * Pass a seeded `rng` for deterministic output in tests.
 */
export function createShoe(numDecks: number, rng: () => number = Math.random): Card[] {
  const suits = ["♠", "♣", "♥", "♦"]
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  const cards: Card[] = []
  for (let d = 0; d < numDecks; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        let value: number
        if (rank === "A") value = 11
        else if (rank === "J" || rank === "Q" || rank === "K") value = 10
        else value = parseInt(rank, 10)
        cards.push({ suit, rank, value })
      }
    }
  }
  // Fisher-Yates
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

/** Immutably draws the top card from the shoe. Throws if shoe is empty. */
export function dealOne(shoe: Card[]): { card: Card; remaining: Card[] } {
  if (shoe.length === 0) throw new Error("Shoe exhausted — reshuffle before dealing")
  return { card: shoe[shoe.length - 1], remaining: shoe.slice(0, -1) }
}

export function needsReshuffle(shoe: Card[], rules: RulesConfig = DEFAULT_RULES): boolean {
  return shoe.length < rules.reshuffleThreshold
}

// ── Scoring ───────────────────────────────────────────────────────────────

/**
 * Returns the best hand total and whether one ace is still counted as 11.
 * At most one ace can ever be 11 without busting, so a single upgrade check suffices.
 */
export function scoreHand(cards: Card[]): HandScore {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === "A") {
      aces++
      total += 1
    } else {
      total += c.value
    }
  }
  if (aces > 0 && total + 10 <= 21) {
    return { total: total + 10, soft: true }
  }
  return { total, soft: false }
}

/** True only for a two-card hand totalling 21 (natural blackjack). */
export function isNaturalBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && scoreHand(cards).total === 21
}

export function isBust(cards: Card[]): boolean {
  return scoreHand(cards).total > 21
}

// ── Legal actions ─────────────────────────────────────────────────────────

/**
 * Returns the set of actions currently available to the player.
 *
 * @param cards        Current cards in the hand
 * @param fromSplit    True if this hand was created by splitting
 * @param totalHands   Total number of player hands (for split limits)
 * @param rules        Table rule configuration
 */
export function legalActions(
  cards: Card[],
  fromSplit: boolean,
  totalHands: number,
  rules: RulesConfig = DEFAULT_RULES,
): PlayerAction[] {
  const { total } = scoreHand(cards)
  // Complete hands (bust or 21) have no legal actions
  if (total >= 21) return []

  const isFirstAction = cards.length === 2
  const actions: PlayerAction[] = ["Hit", "Stand"]

  if (isFirstAction) {
    if (!fromSplit || rules.doubleAfterSplit) actions.push("Double")

    if (cards[0].rank === cards[1].rank && totalHands < rules.maxSplitHands) {
      actions.push("Split")
    }

    if (rules.allowSurrender && !fromSplit) actions.push("Surrender")
  }

  return actions
}

// ── Dealer turn ───────────────────────────────────────────────────────────

/**
 * Runs the dealer drawing sequence until the dealer must stand.
 * Respects H17/S17 from rules.  Immutable — returns new card array and remaining shoe.
 */
export function runDealerTurn(
  initialCards: Card[],
  shoe: Card[],
  rules: RulesConfig = DEFAULT_RULES,
): { cards: Card[]; shoe: Card[] } {
  let cards = [...initialCards]
  let remaining = [...shoe]

  while (true) {
    const { total, soft } = scoreHand(cards)
    const mustHit = total < 17 || (rules.dealerHitsS17 && total === 17 && soft)
    if (!mustHit) break

    if (remaining.length === 0) {
      // Emergency reshuffle mid-dealer-turn (extremely rare with standard penetration)
      remaining = createShoe(rules.numDecks)
    }

    const { card, remaining: next } = dealOne(remaining)
    cards = [...cards, card]
    remaining = next
  }

  return { cards, remaining }
}

// ── Settlement ────────────────────────────────────────────────────────────

/**
 * Determines the outcome of a single player hand against the dealer.
 *
 * @param playerTotal          Best hand total for the player
 * @param dealerTotal          Best hand total for the dealer
 * @param isPlayerNatural      True if player was dealt a natural 21 (initial two cards, non-split)
 * @param isDealerNatural      True if dealer holds a natural blackjack
 * @param surrendered          True if player chose late surrender
 * @param rules                Table rule configuration
 * @returns result and profitMultiplier (multiply by original bet to get dollar P&L)
 */
export function settleHand(
  playerTotal: number,
  dealerTotal: number,
  isPlayerNatural: boolean,
  isDealerNatural: boolean,
  surrendered: boolean,
  rules: RulesConfig = DEFAULT_RULES,
): HandOutcome {
  if (surrendered) return { result: "surrender", profitMultiplier: -0.5 }
  if (playerTotal > 21) return { result: "loss", profitMultiplier: -1 }
  if (dealerTotal > 21) return { result: "win", profitMultiplier: 1 }
  if (isPlayerNatural && isDealerNatural) return { result: "push", profitMultiplier: 0 }
  if (isPlayerNatural) return { result: "win", profitMultiplier: rules.blackjackPayout }
  if (isDealerNatural) return { result: "loss", profitMultiplier: -1 }
  if (playerTotal === dealerTotal) return { result: "push", profitMultiplier: 0 }
  if (playerTotal > dealerTotal) return { result: "win", profitMultiplier: 1 }
  return { result: "loss", profitMultiplier: -1 }
}

/** Converts a profitMultiplier from settleHand into a dollar profit, rounding down for BJ payouts. */
export function profitDollars(profitMultiplier: number, bet: number): number {
  return Math.floor(profitMultiplier * bet)
}
