# Blackjack Engine Contract

Source: `lib/blackjack/engine.ts` | Rules: `lib/blackjack/rules.ts`

---

## RulesConfig

All configurable table rules live in a single `RulesConfig` object passed to every engine function. Never hardcode rule values inside components.

```typescript
interface RulesConfig {
  numDecks: 1 | 2 | 4 | 6 | 8       // shoe size
  dealerHitsS17: boolean              // true = H17, false = S17
  blackjackPayout: number             // 1.5 (3:2) | 1.2 (6:5) | 1.0 (1:1)
  doubleAfterSplit: boolean
  maxSplitHands: number               // max total hands including the original
  allowSurrender: boolean             // late surrender on first two cards, non-split only
  reshuffleThreshold: number          // reshuffle when shoe length < this value
}
```

`DEFAULT_RULES` exports: 6-deck, S17, 3:2, DAS, max 4 hands, no surrender, threshold 20.

---

## Shoe functions

### `createShoe(numDecks, rng?)`
Builds and shuffles `numDecks` × 52 cards. Pass a seeded `rng` for deterministic output in tests.

```typescript
const shoe = createShoe(6)                         // production
const shoe = createShoe(1, seededRng(42))          // reproducible test
```

### `dealOne(shoe)`
Immutably draws the top card. Throws `"Shoe exhausted"` if empty.

```typescript
const { card, remaining } = dealOne(shoe)
```

### `needsReshuffle(shoe, rules?)`
Returns `true` when `shoe.length < rules.reshuffleThreshold`.

---

## Scoring

### `scoreHand(cards)`
Returns the best hand total and whether one ace is counted as 11.

```typescript
scoreHand([A, 7])       // { total: 18, soft: true }
scoreHand([K, Q])       // { total: 20, soft: false }
scoreHand([A, A, 9])    // { total: 21, soft: true }
scoreHand([A, A, 10])   // { total: 12, soft: false }
```

At most one ace can ever be 11 without busting, so a single upgrade check is sufficient and correct.

### `isNaturalBlackjack(cards)`
`true` only for a two-card hand totalling 21. Split-hand 21s are never naturals — callers must pass `isPlayerNatural = false` for all split hands.

### `isBust(cards)`
`true` when `scoreHand(cards).total > 21`.

---

## Legal actions

### `legalActions(cards, fromSplit, totalHands, rules?)`

Returns the set of `PlayerAction` values currently available:

| Action | Condition |
|--------|-----------|
| `"Hit"` | hand not complete (total < 21) |
| `"Stand"` | hand not complete |
| `"Double"` | first action (2 cards) AND (`!fromSplit` OR `rules.doubleAfterSplit`) |
| `"Split"` | first action, pair, `totalHands < rules.maxSplitHands` |
| `"Surrender"` | first action, `rules.allowSurrender`, `!fromSplit` |

Returns `[]` when the hand is complete (total >= 21, including bust).

```typescript
legalActions([c8, c8], false, 1, DEFAULT_RULES)
// → ["Hit", "Stand", "Double", "Split"]

legalActions([c8, c8], true, 2, { ...DEFAULT_RULES, doubleAfterSplit: false })
// → ["Hit", "Stand", "Split"]   (no Double)
```

---

## Dealer turn

### `runDealerTurn(initialCards, shoe, rules?)`

Draws cards until the dealer must stand. Immutable — returns new arrays.

- **S17** (`dealerHitsS17: false`): stands on all 17s, including soft 17
- **H17** (`dealerHitsS17: true`): hits soft 17 specifically, stands on hard 17+

```typescript
const { cards, shoe: remaining } = runDealerTurn(dealerCards, shoe, DEFAULT_RULES)
```

---

## Settlement

### `settleHand(playerTotal, dealerTotal, isPlayerNatural, isDealerNatural, surrendered, rules?)`

Returns `{ result, profitMultiplier }`. Multiply `profitMultiplier` by the original bet to get dollar P&L.

| Scenario | result | profitMultiplier |
|----------|--------|-----------------|
| Player busts | `"loss"` | -1 |
| Dealer busts | `"win"` | +1 |
| Both natural | `"push"` | 0 |
| Player natural, dealer not | `"win"` | `rules.blackjackPayout` (e.g. 1.5) |
| Dealer natural, player not | `"loss"` | -1 |
| Equal totals | `"push"` | 0 |
| Player higher | `"win"` | +1 |
| Dealer higher | `"loss"` | -1 |
| Surrendered | `"surrender"` | -0.5 |

**Split hands must always pass `isPlayerNatural = false`.** A split-hand 21 is a regular win (+1), not a blackjack payout.

### `profitDollars(profitMultiplier, bet)`

Converts the multiplier to a dollar amount, rounding down (important for fractional 3:2 payouts on odd bets).

```typescript
profitDollars(1.5, 15)   // 22  (not 22.50)
profitDollars(-1, 25)    // -25
profitDollars(0, 50)     // 0
```

---

## GameState serialization

`GameState` (defined in `lib/types.ts`) is a plain JSON-serializable object. All authoritative game state must live here — never in component-local `useRef` or derived state that isn't stored in `GameState`.

```typescript
interface GameState {
  deck: Card[]
  playerHands: Hand[]
  dealerHand: Card[]
  currentHandIndex: number
  dealerScore: number
  gamePhase: "betting" | "sideBets" | "playing" | "finished"
  message: string
  bankroll: number
  pendingBets: number
  mainBet: number
  sideBets: SideBet[]
  canSurrender: boolean
  mode: "real" | "practice" | "testing"
}
```

---

## Strategy

`getBasicStrategy()` in `lib/blackjack-logic.ts` implements EV-correct basic strategy for **multi-deck S17 with DAS**.

**Known limitation:** the strategy chart is not rule-aware for H17, single-deck, no-DAS, or 6:5 tables. For those configs the returned action may be suboptimal. A future improvement should accept `RulesConfig` and select from rule-specific strategy tables.

---

## Known limitations / next steps

1. **Strategy is not rule-aware.** `getBasicStrategy` always assumes multi-deck S17 DAS. Passing H17 rules will still produce S17-optimal decisions.
2. **Surrender UI not wired.** The engine supports `allowSurrender` and `settleHand(..., surrendered=true)` but the game-board component has no Surrender button yet.
3. **Insurance / even money not implemented.** The types include `SideBet` with `"insurance"` but no engine logic handles it. Call sites should explicitly disable it via `GameState.sideBets = []`.
4. **Shoe penetration tracking.** The engine has `needsReshuffle()` but `game-board.tsx` reinitializes the whole shoe (rather than tracking cut-card depth). For live-room simulation this should be modelled explicitly.
5. **Split aces draw restriction.** The rule "one card only to each split ace" is enforced in `game-board.tsx` (marks hands complete immediately), not in the engine's `legalActions`. A future refactor should express this via `Hand.fromSplitAce` and enforce it in `legalActions`.
