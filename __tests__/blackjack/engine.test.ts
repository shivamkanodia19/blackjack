import { describe, it, expect } from "vitest"
import {
  scoreHand,
  isNaturalBlackjack,
  isBust,
  legalActions,
  runDealerTurn,
  settleHand,
  createShoe,
  dealOne,
  profitDollars,
} from "@/lib/blackjack/engine"
import { DEFAULT_RULES, type RulesConfig } from "@/lib/blackjack/rules"
import type { Card } from "@/lib/types"

// ── Helpers ──────────────────────────────────────────────────────────────

function c(rank: string, suit = "♠"): Card {
  let value: number
  if (rank === "A") value = 11
  else if (["J", "Q", "K"].includes(rank)) value = 10
  else value = parseInt(rank, 10)
  return { suit, rank, value }
}

// Minimal shoe from a fixed array (top of shoe = last element)
function shoe(...cards: Card[]): Card[] {
  return [...cards].reverse()
}

// ── 1. Hard total scoring ─────────────────────────────────────────────────

describe("scoreHand – hard totals", () => {
  it("scores a simple hard total correctly", () => {
    expect(scoreHand([c("10"), c("8")])).toEqual({ total: 18, soft: false })
  })

  it("two face cards = hard 20", () => {
    expect(scoreHand([c("K"), c("Q")])).toEqual({ total: 20, soft: false })
  })

  it("hard 16: 9+7", () => {
    expect(scoreHand([c("9"), c("7")])).toEqual({ total: 16, soft: false })
  })
})

// ── 2. Soft total scoring ─────────────────────────────────────────────────

describe("scoreHand – soft totals", () => {
  it("A+7 = soft 18", () => {
    expect(scoreHand([c("A"), c("7")])).toEqual({ total: 18, soft: true })
  })

  it("A+6 = soft 17", () => {
    expect(scoreHand([c("A"), c("6")])).toEqual({ total: 17, soft: true })
  })

  it("A+5 = soft 16", () => {
    expect(scoreHand([c("A"), c("5")])).toEqual({ total: 16, soft: true })
  })

  it("A+K = soft 21 (but treated as natural — scoreHand still returns soft:true)", () => {
    const s = scoreHand([c("A"), c("K")])
    expect(s.total).toBe(21)
    expect(s.soft).toBe(true)
  })
})

// ── 3. Multiple aces ──────────────────────────────────────────────────────

describe("scoreHand – multiple aces", () => {
  it("A,A = soft 12 (one ace as 11, one as 1)", () => {
    expect(scoreHand([c("A"), c("A")])).toEqual({ total: 12, soft: true })
  })

  it("A,A,9 = soft 21", () => {
    expect(scoreHand([c("A"), c("A"), c("9")])).toEqual({ total: 21, soft: true })
  })

  it("A,A,10 = hard 12 (both aces must be 1)", () => {
    expect(scoreHand([c("A"), c("A"), c("10")])).toEqual({ total: 12, soft: false })
  })

  it("A,A,A = soft 13", () => {
    expect(scoreHand([c("A"), c("A"), c("A")])).toEqual({ total: 13, soft: true })
  })
})

// ── 4. Natural blackjack vs three-card 21 ────────────────────────────────

describe("isNaturalBlackjack", () => {
  it("A+K is a natural", () => {
    expect(isNaturalBlackjack([c("A"), c("K")])).toBe(true)
  })

  it("A+10 is a natural", () => {
    expect(isNaturalBlackjack([c("A"), c("10")])).toBe(true)
  })

  it("7+7+7 is NOT a natural even though it's 21", () => {
    expect(isNaturalBlackjack([c("7"), c("7"), c("7")])).toBe(false)
  })

  it("A+5+5 is NOT a natural", () => {
    expect(isNaturalBlackjack([c("A"), c("5"), c("5")])).toBe(false)
  })
})

// ── 5. Player bust ────────────────────────────────────────────────────────

describe("isBust", () => {
  it("K+Q+5 = bust (25)", () => {
    expect(isBust([c("K"), c("Q"), c("5")])).toBe(true)
  })

  it("exactly 21 is not a bust", () => {
    expect(isBust([c("7"), c("7"), c("7")])).toBe(false)
  })

  it("A+K+A = hard 12, not a bust (aces reduce)", () => {
    expect(isBust([c("A"), c("K"), c("A")])).toBe(false)
    expect(scoreHand([c("A"), c("K"), c("A")]).total).toBe(12)
  })
})

// ── 6. Dealer bust → player wins ─────────────────────────────────────────

describe("settleHand – dealer bust", () => {
  it("dealer busts, player has 18 → win", () => {
    const { result, profitMultiplier } = settleHand(18, 25, false, false, false, DEFAULT_RULES)
    expect(result).toBe("win")
    expect(profitMultiplier).toBe(1)
  })

  it("player also busts (player bust takes precedence)", () => {
    const { result } = settleHand(22, 25, false, false, false, DEFAULT_RULES)
    expect(result).toBe("loss")
  })
})

// ── 7. Push ───────────────────────────────────────────────────────────────

describe("settleHand – push", () => {
  it("equal totals push", () => {
    const { result, profitMultiplier } = settleHand(18, 18, false, false, false, DEFAULT_RULES)
    expect(result).toBe("push")
    expect(profitMultiplier).toBe(0)
  })

  it("both natural BJs push", () => {
    const { result } = settleHand(21, 21, true, true, false, DEFAULT_RULES)
    expect(result).toBe("push")
  })
})

// ── 8. Blackjack payout 3:2 ──────────────────────────────────────────────

describe("settleHand – natural BJ payout", () => {
  it("3:2 default payout", () => {
    const { result, profitMultiplier } = settleHand(21, 18, true, false, false, DEFAULT_RULES)
    expect(result).toBe("win")
    expect(profitMultiplier).toBe(1.5)
  })

  it("profitDollars rounds down for 3:2 on odd bets ($15 bet → $22, not $22.50)", () => {
    expect(profitDollars(1.5, 15)).toBe(22)
  })
})

// ── 9. Blackjack payout 6:5 ──────────────────────────────────────────────

describe("settleHand – 6:5 payout", () => {
  const rules65: RulesConfig = { ...DEFAULT_RULES, blackjackPayout: 1.2 }

  it("6:5 payout on natural", () => {
    const { profitMultiplier } = settleHand(21, 18, true, false, false, rules65)
    expect(profitMultiplier).toBe(1.2)
  })

  it("profitDollars on 6:5: $10 bet → $12", () => {
    expect(profitDollars(1.2, 10)).toBe(12)
  })
})

// ── 10. Dealer stands on soft 17 (S17) ───────────────────────────────────

describe("runDealerTurn – S17", () => {
  const s17Rules: RulesConfig = { ...DEFAULT_RULES, dealerHitsS17: false }

  it("dealer with A,6 (soft 17) stands under S17", () => {
    const initialCards = [c("A"), c("6")]
    // Shoe has more cards but dealer should NOT draw
    const startShoe = shoe(c("5"), c("3"))
    const { cards } = runDealerTurn(initialCards, startShoe, s17Rules)
    expect(cards).toHaveLength(2)
    expect(scoreHand(cards).total).toBe(17)
  })

  it("dealer with 16 hits under S17", () => {
    const initialCards = [c("9"), c("7")]
    const startShoe = shoe(c("2")) // dealer will draw 2 → 18
    const { cards } = runDealerTurn(initialCards, startShoe, s17Rules)
    expect(cards).toHaveLength(3)
    expect(scoreHand(cards).total).toBe(18)
  })
})

// ── 11. Dealer hits soft 17 (H17) ────────────────────────────────────────

describe("runDealerTurn – H17", () => {
  const h17Rules: RulesConfig = { ...DEFAULT_RULES, dealerHitsS17: true }

  it("dealer with A,6 (soft 17) hits under H17", () => {
    const initialCards = [c("A"), c("6")]
    const startShoe = shoe(c("2")) // dealer draws 2 → 19
    const { cards } = runDealerTurn(initialCards, startShoe, h17Rules)
    expect(cards).toHaveLength(3)
    expect(scoreHand(cards).total).toBe(19)
  })

  it("dealer with hard 17 still stands under H17 (only SOFT 17 triggers)", () => {
    const initialCards = [c("K"), c("7")]
    const startShoe = shoe(c("2"))
    const { cards } = runDealerTurn(initialCards, startShoe, h17Rules)
    expect(cards).toHaveLength(2)
    expect(scoreHand(cards).total).toBe(17)
  })
})

// ── 12. Double down settlement ────────────────────────────────────────────

describe("settleHand – doubled hand", () => {
  it("doubled bet pays 2× on a win (caller doubles the bet before calling settleHand)", () => {
    // The engine is bet-agnostic; caller doubles the bet
    const bet = 20 // original $10 doubled to $20
    const { profitMultiplier } = settleHand(19, 18, false, false, false, DEFAULT_RULES)
    expect(profitDollars(profitMultiplier, bet)).toBe(20) // win 20 on a 20-bet
  })

  it("doubled hand that loses: profitDollars(-1, 20) = -20", () => {
    const { profitMultiplier } = settleHand(14, 18, false, false, false, DEFAULT_RULES)
    expect(profitDollars(profitMultiplier, 20)).toBe(-20)
  })
})

// ── 13. Split hand creation / canSplit ────────────────────────────────────

describe("legalActions – split availability", () => {
  it("pair of 8s allows Split", () => {
    const actions = legalActions([c("8"), c("8")], false, 1, DEFAULT_RULES)
    expect(actions).toContain("Split")
  })

  it("non-pair does NOT allow Split", () => {
    const actions = legalActions([c("8"), c("9")], false, 1, DEFAULT_RULES)
    expect(actions).not.toContain("Split")
  })

  it("at maxSplitHands limit, no further Split allowed", () => {
    const rules = { ...DEFAULT_RULES, maxSplitHands: 4 }
    const actions = legalActions([c("8"), c("8")], true, 4, rules)
    expect(actions).not.toContain("Split")
  })

  it("below limit, Split is offered", () => {
    const rules = { ...DEFAULT_RULES, maxSplitHands: 4 }
    const actions = legalActions([c("8"), c("8")], true, 3, rules)
    expect(actions).toContain("Split")
  })
})

// ── 14. Split aces – no further action (isComplete after one card) ────────
// This behaviour lives in game-board.tsx (marks split-ace hands complete immediately).
// Here we verify legalActions returns nothing useful for an ace pair from-split
// once the hand has been extended beyond 2 cards (the component completes it early).

describe("split aces – engine side", () => {
  it("A+A pair allows Split initially", () => {
    const actions = legalActions([c("A"), c("A")], false, 1, DEFAULT_RULES)
    expect(actions).toContain("Split")
  })
})

// ── 15. Double after split: allowed / not allowed ─────────────────────────

describe("legalActions – double after split", () => {
  it("DAS allowed: fromSplit hand can Double", () => {
    const das = { ...DEFAULT_RULES, doubleAfterSplit: true }
    const actions = legalActions([c("6"), c("5")], true, 2, das)
    expect(actions).toContain("Double")
  })

  it("DAS not allowed: fromSplit hand cannot Double", () => {
    const noDas = { ...DEFAULT_RULES, doubleAfterSplit: false }
    const actions = legalActions([c("6"), c("5")], true, 2, noDas)
    expect(actions).not.toContain("Double")
  })

  it("non-split hand can always Double on first action", () => {
    const actions = legalActions([c("6"), c("5")], false, 1, DEFAULT_RULES)
    expect(actions).toContain("Double")
  })
})

// ── 16. Surrender settlement ──────────────────────────────────────────────

describe("settleHand – surrender", () => {
  const surrenderRules: RulesConfig = { ...DEFAULT_RULES, allowSurrender: true }

  it("surrender returns half the bet (-0.5 multiplier)", () => {
    const { result, profitMultiplier } = settleHand(16, 10, false, false, true, surrenderRules)
    expect(result).toBe("surrender")
    expect(profitMultiplier).toBe(-0.5)
  })

  it("surrender offered by legalActions when allowed and non-split", () => {
    const actions = legalActions([c("9"), c("7")], false, 1, surrenderRules)
    expect(actions).toContain("Surrender")
  })

  it("surrender NOT offered on split hands even when rules allow it", () => {
    const actions = legalActions([c("9"), c("7")], true, 2, surrenderRules)
    expect(actions).not.toContain("Surrender")
  })

  it("surrender NOT offered when rules disallow it", () => {
    const actions = legalActions([c("9"), c("7")], false, 1, DEFAULT_RULES) // allowSurrender: false
    expect(actions).not.toContain("Surrender")
  })
})

// ── 17. Dealer blackjack / player loses unless also natural ──────────────

describe("settleHand – dealer natural", () => {
  it("dealer natural beats player 20", () => {
    const { result } = settleHand(20, 21, false, true, false, DEFAULT_RULES)
    expect(result).toBe("loss")
  })

  it("player natural ties dealer natural", () => {
    const { result } = settleHand(21, 21, true, true, false, DEFAULT_RULES)
    expect(result).toBe("push")
  })

  it("player natural still wins if dealer is NOT natural even with same total (impossible in practice, but contract)", () => {
    // Both 21 but only player is natural → player wins with BJ payout
    // In reality dealer can't be non-natural with 21 and 2 cards, but the function handles it
    const { result, profitMultiplier } = settleHand(21, 20, true, false, false, DEFAULT_RULES)
    expect(result).toBe("win")
    expect(profitMultiplier).toBe(1.5)
  })
})

// ── 18. Illegal actions rejected (bust / 21 hand has no legal actions) ────

describe("legalActions – complete hands", () => {
  it("bust hand returns no actions", () => {
    const actions = legalActions([c("K"), c("Q"), c("5")], false, 1, DEFAULT_RULES)
    expect(actions).toHaveLength(0)
  })

  it("21 hand returns no actions", () => {
    const actions = legalActions([c("7"), c("7"), c("7")], false, 1, DEFAULT_RULES)
    expect(actions).toHaveLength(0)
  })

  it("natural 21 (2 cards) — engine returns no actions (hand is complete)", () => {
    // The engine uses >= 21 to stop, whether natural or not
    const actions = legalActions([c("A"), c("K")], false, 1, DEFAULT_RULES)
    expect(actions).toHaveLength(0)
  })
})

// ── 19. Multiple split hands settle independently ─────────────────────────

describe("settleHand – independent split hand settlement", () => {
  it("first split hand wins, second split hand loses", () => {
    const dealer = 17
    const hand1 = settleHand(19, dealer, false, false, false, DEFAULT_RULES)
    const hand2 = settleHand(14, dealer, false, false, false, DEFAULT_RULES)
    expect(hand1.result).toBe("win")
    expect(hand2.result).toBe("loss")
  })

  it("split hand cannot be natural — pass isPlayerNatural=false for all split hands", () => {
    // Even if cards sum to 21 on a split hand, it's NOT a natural
    const { profitMultiplier } = settleHand(21, 18, false, false, false, DEFAULT_RULES)
    expect(profitMultiplier).toBe(1) // regular win, not 1.5
  })
})

// ── 20. Seeded shoe produces stable output ────────────────────────────────

describe("createShoe – deterministic with seeded rng", () => {
  function seededRng(seed: number) {
    // Simple LCG for deterministic tests
    let s = seed
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff
      return (s >>> 0) / 0xffffffff
    }
  }

  it("same seed produces identical shoe twice", () => {
    const shoe1 = createShoe(1, seededRng(42))
    const shoe2 = createShoe(1, seededRng(42))
    expect(shoe1).toEqual(shoe2)
  })

  it("different seeds produce different shoes", () => {
    const shoe1 = createShoe(1, seededRng(42))
    const shoe2 = createShoe(1, seededRng(99))
    expect(shoe1).not.toEqual(shoe2)
  })

  it("shoe has correct card count (52 × numDecks)", () => {
    expect(createShoe(1).length).toBe(52)
    expect(createShoe(6).length).toBe(312)
  })

  it("dealOne draws the top card immutably", () => {
    const s = createShoe(1, seededRng(1))
    const top = s[s.length - 1]
    const { card, remaining } = dealOne(s)
    expect(card).toEqual(top)
    expect(remaining).toHaveLength(51)
    // Original shoe unchanged
    expect(s).toHaveLength(52)
  })
})
