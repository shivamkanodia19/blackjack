# Supabase Realtime Migration Plan

## Overview

The current live mode uses `LocalRoomTransport` (in-memory, single device). This document describes the migration to Supabase for production multiplayer.

**Why Supabase:**
- Persistent rooms: players can rejoin after disconnect
- Real-time sync: Supabase Realtime channels broadcast state changes to all connected clients
- User profiles: tie session chips and hand history to authenticated users
- Hand history: append-only audit log enables replay, stats, and dispute resolution
- Presence: detect who is connected vs. disconnected per room

The migration is designed to be a transport swap — no changes to the room reducer or UI components.

---

## Database Schema

```sql
-- Rooms: one row per active game session
CREATE TABLE rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,          -- human-readable join code (e.g. "XKCD")
  host_id          UUID REFERENCES auth.users(id),
  state            TEXT NOT NULL DEFAULT 'lobby', -- matches RoomState enum
  config           JSONB NOT NULL DEFAULT '{}',   -- RoomConfig (limits, decks, rules)
  current_round    INT DEFAULT 0,
  current_player_id UUID,                         -- whose turn it is
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Room players: one row per seat per room
CREATE TABLE room_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  seat_index      INT NOT NULL,
  session_chips   INT NOT NULL DEFAULT 1000,
  is_ready        BOOLEAN DEFAULT false,
  is_connected    BOOLEAN DEFAULT true,
  joined_at       TIMESTAMPTZ DEFAULT now()
);

-- Room events: append-only event log (never update, never delete)
CREATE TABLE room_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id   UUID,                    -- null for system events (deal, shuffle)
  event_type  TEXT NOT NULL,           -- matches RoomAction.type
  payload     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Hand history: materialized results per player per round
CREATE TABLE hand_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID REFERENCES rooms(id),
  round_number  INT NOT NULL,
  player_id     UUID NOT NULL,
  outcome       TEXT NOT NULL,   -- 'win' | 'loss' | 'push' | 'blackjack' | 'bust'
  bet           INT NOT NULL,
  payout        INT NOT NULL,    -- net chip delta (positive = profit)
  cards         JSONB,           -- snapshot of final hand for display/replay
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**Index recommendations:**

```sql
CREATE INDEX ON rooms (code);
CREATE INDEX ON room_players (room_id);
CREATE INDEX ON room_players (user_id);
CREATE INDEX ON room_events (room_id, created_at);
CREATE INDEX ON hand_history (room_id, round_number);
CREATE INDEX ON hand_history (player_id);
```

---

## RLS Policies

All tables require Row Level Security enabled. Policies below describe intent; adapt syntax to your Supabase project's auth setup.

### `rooms`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Anyone | Always (public lobbies) |
| INSERT | Authenticated users | `auth.uid() = host_id` |
| UPDATE state/config | Host only | `auth.uid() = host_id` |
| UPDATE `updated_at` | RPC/service role | Via `settle-round` edge function only |

### `room_players`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Room members | `EXISTS (SELECT 1 FROM room_players WHERE room_id = room_players.room_id AND user_id = auth.uid())` |
| INSERT | Authenticated users | `auth.uid() = user_id` (joining) |
| UPDATE | Own row only | `auth.uid() = user_id` |

### `room_events`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Room members | Same room membership check as above |
| INSERT | Room members | Same room membership check |
| DELETE | Nobody | Explicitly denied — events are immutable |

### `hand_history`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Room members or own records | `auth.uid() = player_id OR is_room_member(room_id)` |
| INSERT | Service role only | Written by `settle-round` edge function |

---

## SupabaseRoomTransport Implementation Plan

File: `lib/rooms/supabase-transport.ts`

Implement the `RoomTransport` interface from `lib/rooms/transport.ts`. All methods below map 1:1 to the existing interface — no changes to callers.

### `subscribeToRoom(roomId, onSnapshot)`

```
1. Open a Supabase Realtime channel: `room:${roomId}`
2. Subscribe to postgres_changes on `rooms` WHERE id = roomId
3. Subscribe to postgres_changes on `room_players` WHERE room_id = roomId
4. On any change: fetch fresh snapshot (rooms JOIN room_players) and call onSnapshot()
5. Return unsubscribe function that removes the channel
```

### `sendRoomAction(roomId, action)`

```
1. INSERT into room_events: { room_id, player_id: auth.uid(), event_type: action.type, payload: action }
2. If action requires state transition: call RPC `handle_room_action(room_id, action_type, payload)`
   - RPC runs in a transaction: validates current state, applies reducer logic, updates rooms.state
3. Return the inserted event row
```

### `updatePresence(roomId, presenceData)`

```
1. Use Supabase Presence API on the room channel
2. Track: { user_id, display_name, is_connected, last_seen }
3. On join/leave: update room_players.is_connected via a separate PATCH call
```

### `getRoomSnapshot(roomId)`

```sql
SELECT
  r.*,
  json_agg(rp ORDER BY rp.seat_index) AS players
FROM rooms r
LEFT JOIN room_players rp ON rp.room_id = r.id
WHERE r.id = $1
GROUP BY r.id
```

### `getRecentEvents(roomId, since?)`

```sql
SELECT * FROM room_events
WHERE room_id = $1
  AND created_at > $2
ORDER BY created_at ASC
```

---

## Migration Steps

Execute in order. Each step is independently deployable.

**Step 1: Implement `SupabaseRoomTransport`**
- Create `lib/rooms/supabase-transport.ts`
- Implement all `RoomTransport` methods
- Unit test against a local Supabase instance (`supabase start`)

**Step 2: Add environment variable**
```
# .env.local
NEXT_PUBLIC_USE_SUPABASE_ROOMS=true
```
Keep `false` (or absent) for local development without Supabase running.

**Step 3: Swap transport in `useLiveRoom`**
```ts
// hooks/useLiveRoom.ts
const transport = process.env.NEXT_PUBLIC_USE_SUPABASE_ROOMS === 'true'
  ? new SupabaseRoomTransport(supabase)
  : new LocalRoomTransport()
```
No other hook or component changes required.

**Step 4: Apply RLS policies**
- Run migration SQL in Supabase dashboard or via `supabase db push`
- Verify with a test user that SELECT works and unauthorized UPDATE is blocked

**Step 5: End-to-end test with two browser tabs**
- Open `/live` in Tab A → create room → copy room code
- Open `/live` in Tab B → join with code
- Verify both tabs reflect the same `RoomState` in real time
- No UI code changes needed; the transport swap is sufficient

---

## Server-Authoritative Settlement

**Do not trust client-side settlement for chip deltas.** A cheating client can send fabricated `SETTLE_COMPLETE` payloads. All chip mutations must happen server-side.

### Edge Function: `settle-round`

Deploy at `supabase/functions/settle-round/index.ts`.

```
POST /functions/v1/settle-round
Body: { room_id: string, round_number: number }
Auth: Service role key (called by host client after dealer_turn completes)
```

**Function logic:**

```
1. Fetch all room_events for this room + round where event_type IN ('PLACE_BET', 'PLAYER_ACTION', 'DEAL_COMPLETE', 'DEALER_DONE')
2. Reconstruct hand state by replaying events through the game engine (same engine used client-side)
3. Calculate payout per player using engine.settleSplit / engine.settleHand
4. For each player:
   a. UPDATE room_players SET session_chips = session_chips + payout WHERE id = player_id
   b. INSERT INTO hand_history (room_id, round_number, player_id, outcome, bet, payout, cards)
5. UPDATE rooms SET state = 'round_complete', updated_at = now() WHERE id = room_id
6. Return { success: true, results: [{ player_id, payout, outcome }] }
```

**Why this is safe:**
- Engine logic runs identically server-side (pure functions, no DOM dependencies)
- All inputs come from the `room_events` log, which is append-only and RLS-protected
- `room_players.session_chips` is never written by the client directly
- If the function fails, the round stays in `dealer_turn` state and can be retried

**Client behavior after calling `settle-round`:**
- Wait for the `rooms.state` Realtime update to `round_complete`
- Refresh `room_players` to show updated chip counts
- Do not apply any local chip delta — treat the server value as canonical
