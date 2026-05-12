# Mode Architecture

## Overview

The app ships three distinct play modes, each served from its own route:

| Mode | Route | Purpose |
|------|-------|---------|
| Solo Bankroll | `/solo` | Session-based solo play with persistent bankroll tracking |
| Training | `/training` | Strategy practice with per-decision feedback and accuracy stats |
| Live Friend Table | `/live`, `/live/[roomId]` | Local-first multiplayer with automated dealer |

Each mode is a thin shell around the shared game engine. The engine handles all card logic; modes own everything else (navigation, membership, UI state, persistence).

---

## Mode Mapping to Engine

### Solo → `GameBoard mode="practice"`

- No auth required
- Chips are session-local (stored in `useSoloGame` hook, optionally persisted to localStorage)
- `SoloSessionConfig` passed down to configure chip totals, table limits, and hint visibility
- Engine runs in `"practice"` mode: no strategy grading, no external side effects

### Training → `GameBoard mode="testing"`

- No auth required
- Strategy feedback is rendered inline by the engine's `"testing"` mode
- `useTrainingGame` tracks per-session accuracy (correct decisions / total decisions)
- Stats are hook-local; not yet wired to the engine's internal strategy tracking

### Live → Custom Room State Machine (`LocalRoomTransport`)

- Auth optional for local mode; required for Supabase mode
- `useLiveRoom` manages room subscription and action dispatch
- Room state machine (`room-reducer.ts`) drives phase transitions
- Each phase delegates the appropriate game actions to the engine
- Transport layer is swappable: `LocalRoomTransport` (in-memory) today, `SupabaseRoomTransport` later

---

## File Structure

```
lib/
  types/
    modes.ts            — SoloSessionConfig, TrainingSessionConfig, SessionPhase
    room.ts             — Room, RoomState, RoomAction, RoomPlayer types
  rooms/
    transport.ts        — RoomTransport interface (adapter for Supabase later)
    local-transport.ts  — LocalRoomTransport (in-memory, local-first)
    room-reducer.ts     — pure state machine for room actions

hooks/
  useSoloGame.ts        — solo session lifecycle (chips, phase, config)
  useTrainingGame.ts    — training accuracy tracking (correct/total decisions)
  useLiveRoom.ts        — live room subscription + action dispatch

app/
  solo/
    page.tsx            — solo mode entry point
  training/
    page.tsx            — training mode entry point
  live/
    page.tsx            — lobby (create room / join by code)
    [roomId]/
      page.tsx          — game table for a specific room
```

---

## Engine Boundary

The engine is the source of truth for all game correctness. Modes must not reimplement any of the following.

**Engine owns:**
- Card values and deck management
- Legal action enumeration (hit, stand, double, split, surrender)
- Dealer behavior (S17: stand on soft 17)
- Hand outcome evaluation (bust, natural blackjack, push, win, loss)
- Payout calculations (3:2 naturals, 1:1 wins, insurance)
- Round settlement

**Modes own:**
- Route navigation and page lifecycle
- Room membership and seat assignment
- Ready state and lobby coordination
- localStorage reads/writes (session persistence)
- Training accuracy counters and session stats
- UI state (modal visibility, recap overlays, error banners)
- Lobby state (room code display, player list before game starts)
- Round recap state (results shown between rounds)

If logic touches a card value or a chip delta, it belongs in the engine.

---

## Room State Machine (Live Mode)

```
lobby
  │  (all players ready)
  ▼
ready_check
  │  (host confirms)
  ▼
betting
  │  (all bets placed)
  ▼
dealing
  │  (initial cards dealt)
  ▼
player_turn          ◄─────────────────────┐
  │  (active player acts)                  │
  │  (next player exists)──────────────────┘
  │  (all players done)
  ▼
dealer_turn
  │  (dealer resolves hand)
  ▼
settlement
  │  (chips updated)
  ▼
round_complete
  │  NEXT_ROUND ──► betting
  │  END_SESSION ──► session_complete
  ▼
session_complete
```

**Actions that trigger transitions:**

| Action | From State | To State |
|--------|-----------|----------|
| `PLAYER_READY` | `lobby` | `lobby` (accumulates readiness) |
| `ALL_READY` | `lobby` | `ready_check` |
| `START_BETTING` | `ready_check` | `betting` |
| `PLACE_BET` | `betting` | `betting` (accumulates bets) |
| `ALL_BETS_PLACED` | `betting` | `dealing` |
| `DEAL_COMPLETE` | `dealing` | `player_turn` |
| `PLAYER_ACTION` | `player_turn` | `player_turn` or `dealer_turn` |
| `DEALER_DONE` | `dealer_turn` | `settlement` |
| `SETTLE_COMPLETE` | `settlement` | `round_complete` |
| `NEXT_ROUND` | `round_complete` | `betting` |
| `END_SESSION` | `round_complete` | `session_complete` |

---

## Known Limitations

These are honest gaps in the current MVP — not aspirational items.

1. **Live mode per-player GameBoard not integrated.** The room state machine tracks turns, but the UI uses placeholder turn management rather than one `GameBoard` instance per seated player. Hit/stand in live mode does not yet flow through the engine.

2. **`showHints` not threaded into GameBoard.** `SoloSessionConfig.showHints` is stored in the solo hook but not passed as a prop to `GameBoard`. Hints do not appear in solo mode regardless of config.

3. **Training hook stats not wired to engine.** `useTrainingGame` tracks accuracy locally but does not receive `onStrategyDecision` callbacks from `GameBoard`'s internal strategy evaluator. Stats are currently a stub.

4. **Live mode is single-device only.** `LocalRoomTransport` is in-memory. Two browser tabs on the same device share nothing. True multiplayer requires the Supabase transport (see `docs/supabase-realtime-plan.md`).

---

## Recommended Next Steps

Listed in priority order:

1. **Wire `showHints` to GameBoard** — Add a `showHints?: boolean` prop to `GameBoard` and pass `soloConfig.showHints` from the solo page.

2. **Add `onStrategyDecision` callback to GameBoard** — Emit `{ action, isCorrect, optimalAction }` on each player decision so `useTrainingGame` can consume it without polling internal state.

3. **Implement per-player game state in live mode** — Mount one `GameBoard` per `RoomPlayer` in `live/[roomId]/page.tsx`, keyed by `player.id`. Feed each board only that player's hand state from the room reducer.

4. **Add Supabase transport** — Implement `SupabaseRoomTransport` as a drop-in replacement for `LocalRoomTransport`. See `docs/supabase-realtime-plan.md` for the full migration plan.
