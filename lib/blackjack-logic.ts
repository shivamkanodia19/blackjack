import type { Card, StrategyRecommendation } from "./types"

// Build N standard decks
export function createDeck(numDecks = 6): Card[] {
  const suits = ["♠", "♣", "♥", "♦"]
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  const deck: Card[] = []
  for (let d = 0; d < numDecks; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        let value: number
        if (rank === "A") value = 11
        else if (rank === "J" || rank === "Q" || rank === "K") value = 10
        else value = Number.parseInt(rank, 10)
        deck.push({ suit, rank, value })
      }
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function dealCard(deck: Card[]): Card {
  if (deck.length === 0) throw new Error("Cannot deal from empty deck - reshuffle needed")
  const card = deck.pop()
  if (!card) throw new Error("Deck is empty")
  return card
}

// Returns best total (Aces as 11, reduce to 1 as needed)
export function calculateHandValue(hand: Card[]): number {
  let total = 0
  let aces = 0
  for (const c of hand) {
    if (c.rank === "A") {
      total += 1 // Start with ace as 1
      aces++
    } else {
      total += c.value
    }
  }
  while (aces > 0 && total + 10 <= 21) {
    total += 10 // Upgrade one ace from 1 to 11
    aces--
  }
  return total
}

// Softness: true if at least one Ace is still counted as 11 after adjustment
export function isSoftHand(hand: Card[]): boolean {
  let total = 0
  let aces = 0
  for (const c of hand) {
    if (c.rank === "A") {
      total += 11
      aces++
    } else {
      total += c.value
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return aces > 0
}

function normalizeUpcard(v: number): number {
  if (v === 1) return 11 // treat Ace as 11
  return v
}

function isTenValueRank(rank: string): boolean {
  return rank === "10" || rank === "J" || rank === "Q" || rank === "K"
}

/**
 * Multi-deck S17, DAS. Pair detection uses card ranks (not hand total) so A,A is correct.
 * pairRank1/pairRank2: when both set and equal, pair splitting rules apply.
 * Surrender is not offered by the table — keep canSurrender false at call sites.
 */
export function getBasicStrategy(
  playerTotal: number,
  dealerUpCard: number,
  isSoft: boolean,
  canDouble: boolean,
  canSurrender: boolean,
  das = true,
  pairRank1: string | null = null,
  pairRank2: string | null = null,
): StrategyRecommendation {
  const up = normalizeUpcard(dealerUpCard)

  const isPairHand = pairRank1 != null && pairRank2 != null && pairRank1 === pairRank2

  if (isPairHand && pairRank1) {
    const r = pairRank1

    if (r === "A") {
      return { action: "Split", reason: "Always split Aces" }
    }

    if (isTenValueRank(r)) {
      return { action: "Stand", reason: "Never split 10-value pairs; 20 is already strong" }
    }

    if (r === "9") {
      if ((up >= 2 && up <= 6) || up === 8 || up === 9) {
        return { action: "Split", reason: "Split 9s vs 2–9 (except 10/A)" }
      }
      return { action: "Stand", reason: "Stand 18 vs 10 or Ace" }
    }

    if (r === "8") {
      return { action: "Split", reason: "Always split 8s" }
    }

    if (r === "7") {
      if (up >= 2 && up <= 7) return { action: "Split", reason: "Split 7s vs 2–7" }
      return { action: "Hit", reason: "Hit 14 vs 8–Ace" }
    }

    if (r === "6") {
      if (up >= 2 && up <= 6) return { action: "Split", reason: "Split 6s vs 2–6" }
      return { action: "Hit", reason: "Hit 12 vs 7–Ace" }
    }

    if (r === "5") {
      if (canDouble && up >= 2 && up <= 9) {
        return { action: "Double", reason: "Double hard 10 vs 2–9; hit vs 10/A" }
      }
      return { action: "Hit", reason: "Hit hard 10 if doubling unavailable or vs 10/A" }
    }

    if (r === "4") {
      if (das && (up === 5 || up === 6)) {
        return { action: "Split", reason: "Split 4s vs 5–6 with DAS" }
      }
      return { action: "Hit", reason: "Hit 8 otherwise" }
    }

    if (r === "3" || r === "2") {
      if (das) {
        if (up >= 2 && up <= 7) return { action: "Split", reason: "Split 2s/3s vs 2–7 with DAS" }
      } else {
        if (up >= 3 && up <= 7) return { action: "Split", reason: "Split 2s/3s vs 3–7 without DAS" }
      }
      return { action: "Hit", reason: "Hit small pairs vs strong dealer cards" }
    }
  }

  const isTrulySoft = isSoft && playerTotal >= 13 && playerTotal <= 21

  if (isTrulySoft) {
    if (playerTotal >= 20) {
      return { action: "Stand", reason: "Soft 20–21 are premium totals" }
    }

    // S17: soft 19 vs 6 — stand (no double)
    if (playerTotal === 19) {
      return { action: "Stand", reason: "Stand soft 19 (S17)" }
    }

    // Soft 18 (A,7): S17 — stand vs 2; double vs 3–6; stand vs 7–8; hit vs 9–A
    if (playerTotal === 18) {
      if (canDouble && up >= 3 && up <= 6) {
        return { action: "Double", reason: "Double soft 18 vs 3–6 (S17)" }
      }
      if (up === 2 || up === 7 || up === 8) {
        return { action: "Stand", reason: "Stand soft 18 vs 2 or 7–8" }
      }
      return { action: "Hit", reason: "Hit soft 18 vs 9–Ace" }
    }

    if (playerTotal === 17) {
      if (canDouble && up >= 3 && up <= 6) {
        return { action: "Double", reason: "Double soft 17 vs 3–6" }
      }
      return { action: "Hit", reason: "Hit soft 17 otherwise" }
    }

    if (playerTotal === 16 || playerTotal === 15) {
      if (canDouble && up >= 4 && up <= 6) {
        return { action: "Double", reason: "Double soft 15–16 vs 4–6" }
      }
      return { action: "Hit", reason: "Hit soft 15–16 otherwise" }
    }

    if (playerTotal === 14 || playerTotal === 13) {
      if (canDouble && (up === 5 || up === 6)) {
        return { action: "Double", reason: "Double soft 13–14 vs 5–6" }
      }
      return { action: "Hit", reason: "Hit soft 13–14 otherwise" }
    }

    return { action: "Hit", reason: "Improve weak soft totals" }
  }

  // HARD HANDS

  if (playerTotal >= 17) {
    return { action: "Stand", reason: "Stand on hard 17+ due to bust risk" }
  }

  if (playerTotal === 16) {
    if (up >= 7) return { action: "Hit", reason: "Hit 16 vs 7–Ace" }
    return { action: "Stand", reason: "Stand 16 vs 2–6" }
  }

  if (playerTotal === 15) {
    if (up >= 7) return { action: "Hit", reason: "Hit 15 vs 7–Ace" }
    return { action: "Stand", reason: "Stand 15 vs 2–6" }
  }

  if (playerTotal >= 13 && playerTotal <= 14) {
    if (up >= 7) return { action: "Hit", reason: "Hit 13–14 vs 7–Ace" }
    return { action: "Stand", reason: "Stand 13–14 vs 2–6" }
  }

  if (playerTotal === 12) {
    if (up >= 4 && up <= 6) return { action: "Stand", reason: "Stand 12 vs 4–6" }
    return { action: "Hit", reason: "Hit 12 vs 2–3 and 7–Ace" }
  }

  if (playerTotal === 11) {
    if (canDouble) {
      return { action: "Double", reason: "Double 11 vs any upcard" }
    }
    return { action: "Hit", reason: "Hit 11 if doubling not allowed" }
  }

  if (playerTotal === 10) {
    if (canDouble && up >= 2 && up <= 9) {
      return { action: "Double", reason: "Double 10 vs 2–9" }
    }
    return { action: "Hit", reason: "Hit 10 vs 10/A or if doubling unavailable" }
  }

  if (playerTotal === 9) {
    if (canDouble && up >= 3 && up <= 6) {
      return { action: "Double", reason: "Double 9 vs 3–6" }
    }
    return { action: "Hit", reason: "Hit 9 otherwise" }
  }

  return { action: "Hit", reason: "Totals 8 or less cannot bust; improve the hand" }
}

export function needsReshuffle(deck: Card[], minCards = 20): boolean {
  return deck.length < minCards
}
