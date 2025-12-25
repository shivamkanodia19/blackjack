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

/**
 * Basic strategy for multi-deck H17, DAS, late surrender optional.
 * Inputs mirror your existing API for easy drop-in.
 * - playerTotal: best total after Ace adjustments
 * - dealerUpCard: 2–10 or 11 for Ace
 * - hasAce: player's hand contains an Ace (we still infer true softness via total range)
 * - isPair: first two cards same rank (or equal value for 10s)
 * - canDouble: table allows double (and double after split for pair logic via das flag)
 * - canSurrender: late surrender available
 * - das: double after split allowed (default true)
 */
export function getBasicStrategy(
  playerTotal: number,
  dealerUpCard: number,
  hasAce: boolean,
  isPair: boolean,
  canDouble: boolean,
  canSurrender: boolean,
  das = true,
): StrategyRecommendation {
  const up = normalizeUpcard(dealerUpCard)

  // PAIR HANDS (assume initial 2 cards)
  if (isPair) {
    const pairValue = Math.floor(playerTotal / 2)

    // A,A
    if (pairValue === 11) {
      return { action: "Split", reason: "Always split Aces to start two strong hands" }
    }

    // 10,10
    if (pairValue === 10) {
      return { action: "Stand", reason: "Never split 10s; 20 is already strong" }
    }

    // 9,9
    if (pairValue === 9) {
      if ((up >= 2 && up <= 6) || up === 8 || up === 9) {
        return { action: "Split", reason: "Split 9s vs 2-9 (except 10/A) for higher EV" }
      }
      return { action: "Stand", reason: "Stand 18 vs 10/A" }
    }

    // 8,8
    if (pairValue === 8) {
      return { action: "Split", reason: "Always split 8s; hard 16 is a weak hand" }
    }

    // 7,7
    if (pairValue === 7) {
      if (up >= 2 && up <= 7) return { action: "Split", reason: "Split 7s vs 2–7" }
      return { action: "Hit", reason: "Hit 14 vs 8–A" }
    }

    // 6,6
    if (pairValue === 6) {
      if (up >= 2 && up <= 6) return { action: "Split", reason: "Split 6s vs 2–6" }
      return { action: "Hit", reason: "Hit 12 vs 7–A" }
    }

    // 5,5 (treat as hard 10)
    if (pairValue === 5) {
      if (canDouble && up >= 2 && up <= 9) {
        return { action: "Double", reason: "Double 10 vs 2–9; hit vs 10/A" }
      }
      return { action: "Hit", reason: "Hit 10 if doubling unavailable or vs 10/A" }
    }

    // 4,4
    if (pairValue === 4) {
      if (das && (up === 5 || up === 6)) {
        return { action: "Split", reason: "Split 4s vs 5–6 with DAS" }
      }
      return { action: "Hit", reason: "Hit 8 otherwise" }
    }

    // 3,3 and 2,2
    if (pairValue === 3 || pairValue === 2) {
      if (das) {
        if (up >= 2 && up <= 7) return { action: "Split", reason: "Split 2s/3s vs 2–7 with DAS" }
      } else {
        if (up >= 3 && up <= 7) return { action: "Split", reason: "Split 2s/3s vs 3–7; hit vs 2,8–A" }
      }
      return { action: "Hit", reason: "Hit small pairs vs strong dealer cards" }
    }
  }

  // SOFT HANDS (true soft if an Ace counted as 11 without bust)
  const isTrulySoft = hasAce && playerTotal >= 13 && playerTotal <= 21

  if (isTrulySoft) {
    // Soft 20–21
    if (playerTotal >= 20) {
      return { action: "Stand", reason: "Soft 20–21 are premium totals" }
    }

    // Soft 19 (A,8): H17 double vs 6; otherwise stand
    if (playerTotal === 19) {
      if (canDouble && up === 6) {
        return { action: "Double", reason: "Double A,8 vs 6 in H17 for extra value" }
      }
      return { action: "Stand", reason: "Stand soft 19 in other spots" }
    }

    // Soft 18 (A,7): H17 adds double vs 2
    if (playerTotal === 18) {
      if (canDouble && ((up >= 3 && up <= 6) || up === 2)) {
        return { action: "Double", reason: "Double A,7 vs 2–6 in H17" }
      }
      if (up === 7 || up === 8) {
        return { action: "Stand", reason: "Stand A,7 vs 7–8" }
      }
      return { action: "Hit", reason: "Hit A,7 vs 9–A to improve EV" }
    }

    // Soft 17 (A,6)
    if (playerTotal === 17) {
      if (canDouble && up >= 3 && up <= 6) {
        return { action: "Double", reason: "Double A,6 vs 3–6" }
      }
      return { action: "Hit", reason: "Hit soft 17 otherwise" }
    }

    // Soft 15–16 (A,4 / A,5)
    if (playerTotal === 16 || playerTotal === 15) {
      if (canDouble && up >= 4 && up <= 6) {
        return { action: "Double", reason: "Double soft 15–16 vs 4–6" }
      }
      return { action: "Hit", reason: "Hit soft 15–16 otherwise" }
    }

    // Soft 13–14 (A,2 / A,3)
    if (playerTotal === 14 || playerTotal === 13) {
      if (canDouble && (up === 5 || up === 6)) {
        return { action: "Double", reason: "Double soft 13–14 vs 5–6" }
      }
      return { action: "Hit", reason: "Hit soft 13–14 otherwise" }
    }

    return { action: "Hit", reason: "Improve weak soft totals" }
  }

  // HARD HANDS

  // 17+
  if (playerTotal >= 17) {
    return { action: "Stand", reason: "Stand on hard 17+ due to bust risk" }
  }

  // 16
  if (playerTotal === 16) {
    if (canSurrender && (up === 9 || up === 10 || up === 11)) {
      return { action: "Surrender", reason: "Surrender 16 vs 9/10/A if allowed" }
    }
    if (up >= 7) return { action: "Hit", reason: "Hit 16 vs 7–A" }
    return { action: "Stand", reason: "Stand 16 vs 2–6" }
  }

  // 15
  if (playerTotal === 15) {
    if (canSurrender && up === 10) {
      return { action: "Surrender", reason: "Surrender 15 vs 10 if allowed" }
    }
    if (up >= 7) return { action: "Hit", reason: "Hit 15 vs 7–A" }
    return { action: "Stand", reason: "Stand 15 vs 2–6" }
  }

  // 13–14
  if (playerTotal >= 13 && playerTotal <= 14) {
    if (up >= 7) return { action: "Hit", reason: "Hit 13–14 vs 7–A" }
    return { action: "Stand", reason: "Stand 13–14 vs 2–6" }
  }

  // 12
  if (playerTotal === 12) {
    if (up >= 4 && up <= 6) return { action: "Stand", reason: "Stand 12 vs 4–6" }
    return { action: "Hit", reason: "Hit 12 vs 2–3 and 7–A" }
  }

  // 11: H17 doubles vs Ace
  if (playerTotal === 11) {
    if (canDouble) {
      return { action: "Double", reason: "Double 11 vs any upcard including Ace in H17" }
    }
    return { action: "Hit", reason: "Hit 11 if doubling not allowed" }
  }

  // 10
  if (playerTotal === 10) {
    if (canDouble && up >= 2 && up <= 9) {
      return { action: "Double", reason: "Double 10 vs 2–9" }
    }
    return { action: "Hit", reason: "Hit 10 vs 10/A or if doubling unavailable" }
  }

  // 9
  if (playerTotal === 9) {
    if (canDouble && up >= 3 && up <= 6) {
      return { action: "Double", reason: "Double 9 vs 3–6" }
    }
    return { action: "Hit", reason: "Hit 9 otherwise" }
  }

  // 8 or less
  return { action: "Hit", reason: "Totals 8 or less cannot bust; improve the hand" }
}

export function needsReshuffle(deck: Card[], minCards = 20): boolean {
  return deck.length < minCards
}
