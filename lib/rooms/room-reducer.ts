import type { Room, RoomAction, RoomConfig, RoomPlayer, RoomHandResult } from "@/lib/types/room"

// Characters that avoid visual ambiguity (no I, O, 0, 1)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateRoomCode(): string {
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export function createInitialRoom(config: RoomConfig, hostPlayer: RoomPlayer): Room {
  return {
    id: crypto.randomUUID(),
    code: generateRoomCode(),
    hostId: hostPlayer.id,
    state: "lobby",
    players: [{ ...hostPlayer, seatIndex: 0, isReady: false, isConnected: true }],
    config,
    currentRound: 0,
    currentPlayerId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function now(): number {
  return Date.now()
}

function warn(msg: string): void {
  console.warn(`[roomReducer] ${msg}`)
}

export function roomReducer(room: Room, action: RoomAction): Room {
  switch (action.type) {
    // -----------------------------------------------------------------------
    // Presence / lobby management — valid in any state
    // -----------------------------------------------------------------------
    case "PLAYER_JOIN": {
      if (room.players.find((p) => p.id === action.player.id)) {
        // Player already in the room — reconnect path handled separately
        return room
      }
      if (room.players.length >= room.config.maxPlayers) {
        warn(`PLAYER_JOIN ignored: room ${room.id} is full`)
        return room
      }
      if (room.state !== "lobby") {
        warn(`PLAYER_JOIN ignored: room ${room.id} is not in lobby state (state=${room.state})`)
        return room
      }
      const nextSeat = room.players.length
      const newPlayer: RoomPlayer = { ...action.player, seatIndex: nextSeat, isConnected: true }
      return { ...room, players: [...room.players, newPlayer], updatedAt: now() }
    }

    case "PLAYER_LEAVE": {
      const remaining = room.players.filter((p) => p.id !== action.playerId)
      // If host leaves, promote next player
      let newHostId = room.hostId
      if (action.playerId === room.hostId && remaining.length > 0) {
        newHostId = remaining[0].id
      }
      // Re-assign seat indexes sequentially
      const reseated = remaining.map((p, idx) => ({ ...p, seatIndex: idx }))
      // If the room is empty, state stays but it will be abandoned naturally
      const newState = reseated.length === 0 ? room.state : room.state
      return {
        ...room,
        state: newState,
        players: reseated,
        hostId: newHostId,
        currentPlayerId:
          room.currentPlayerId === action.playerId ? null : room.currentPlayerId,
        updatedAt: now(),
      }
    }

    case "PLAYER_DISCONNECTED": {
      const players = room.players.map((p) =>
        p.id === action.playerId ? { ...p, isConnected: false } : p
      )
      return { ...room, players, updatedAt: now() }
    }

    case "PLAYER_RECONNECTED": {
      const players = room.players.map((p) =>
        p.id === action.playerId ? { ...p, isConnected: true } : p
      )
      return { ...room, players, updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // Lobby → ready_check
    // -----------------------------------------------------------------------
    case "PLAYER_READY": {
      if (room.state !== "lobby" && room.state !== "ready_check") {
        warn(`PLAYER_READY ignored: invalid state ${room.state}`)
        return room
      }
      const players = room.players.map((p) =>
        p.id === action.playerId ? { ...p, isReady: true } : p
      )
      // Transition to ready_check when all players are ready (min 1 player)
      const allReady = players.length > 0 && players.every((p) => p.isReady)
      return {
        ...room,
        state: allReady ? "ready_check" : "lobby",
        players,
        updatedAt: now(),
      }
    }

    case "PLAYER_UNREADY": {
      if (room.state !== "lobby" && room.state !== "ready_check") {
        warn(`PLAYER_UNREADY ignored: invalid state ${room.state}`)
        return room
      }
      const players = room.players.map((p) =>
        p.id === action.playerId ? { ...p, isReady: false } : p
      )
      return { ...room, state: "lobby", players, updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // ready_check → betting
    // -----------------------------------------------------------------------
    case "START_BETTING": {
      if (room.state !== "ready_check") {
        warn(`START_BETTING ignored: expected ready_check, got ${room.state}`)
        return room
      }
      return { ...room, state: "betting", updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // betting: PLACE_BET (no state transition — that's START_DEALING)
    // -----------------------------------------------------------------------
    case "PLACE_BET": {
      if (room.state !== "betting") {
        warn(`PLACE_BET ignored: expected betting, got ${room.state}`)
        return room
      }
      // Validate it's a player in the room
      const player = room.players.find((p) => p.id === action.playerId)
      if (!player) {
        warn(`PLACE_BET ignored: player ${action.playerId} not in room`)
        return room
      }
      if (action.amount <= 0 || action.amount > player.sessionChips) {
        warn(`PLACE_BET ignored: invalid bet amount ${action.amount} for player ${action.playerId}`)
        return room
      }
      // Bets are tracked externally (RoomRound); the reducer just acks the action
      // by bumping updatedAt so subscribers are notified
      return { ...room, updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // betting → dealing
    // -----------------------------------------------------------------------
    case "START_DEALING": {
      if (room.state !== "betting") {
        warn(`START_DEALING ignored: expected betting, got ${room.state}`)
        return room
      }
      return { ...room, state: "dealing", currentRound: room.currentRound + 1, updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // dealing / player_turn → player_turn  OR  player_turn → dealer_turn
    // -----------------------------------------------------------------------
    case "NEXT_PLAYER_TURN": {
      if (room.state !== "dealing" && room.state !== "player_turn") {
        warn(`NEXT_PLAYER_TURN ignored: expected dealing|player_turn, got ${room.state}`)
        return room
      }
      const player = room.players.find((p) => p.id === action.playerId)
      if (!player) {
        warn(`NEXT_PLAYER_TURN ignored: player ${action.playerId} not in room`)
        return room
      }
      return { ...room, state: "player_turn", currentPlayerId: action.playerId, updatedAt: now() }
    }

    case "COMPLETE_PLAYER_TURN": {
      if (room.state !== "player_turn") {
        warn(`COMPLETE_PLAYER_TURN ignored: expected player_turn, got ${room.state}`)
        return room
      }
      if (room.currentPlayerId !== action.playerId) {
        warn(
          `COMPLETE_PLAYER_TURN ignored: out of turn — expected ${room.currentPlayerId}, got ${action.playerId}`
        )
        return room
      }
      // Caller is responsible for calling either NEXT_PLAYER_TURN or START_DEALER_TURN next
      return { ...room, updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // player_turn → dealer_turn
    // -----------------------------------------------------------------------
    case "START_DEALER_TURN": {
      if (room.state !== "player_turn") {
        warn(`START_DEALER_TURN ignored: expected player_turn, got ${room.state}`)
        return room
      }
      return { ...room, state: "dealer_turn", currentPlayerId: null, updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // dealer_turn → settlement → round_complete
    // -----------------------------------------------------------------------
    case "COMPLETE_SETTLEMENT": {
      if (room.state !== "dealer_turn") {
        warn(`COMPLETE_SETTLEMENT ignored: expected dealer_turn, got ${room.state}`)
        return room
      }

      // Apply payouts to sessionChips for each player
      const payoutMap = new Map<string, number>(
        action.results.map((r: RoomHandResult) => [r.playerId, r.payout])
      )
      const players = room.players.map((p) => {
        const payout = payoutMap.get(p.id) ?? 0
        return { ...p, sessionChips: p.sessionChips + payout, isReady: false }
      })

      return { ...room, state: "round_complete", players, currentPlayerId: null, updatedAt: now() }
    }

    // -----------------------------------------------------------------------
    // round_complete → betting  OR  round_complete → session_complete
    // -----------------------------------------------------------------------
    case "NEXT_ROUND": {
      if (room.state !== "round_complete") {
        warn(`NEXT_ROUND ignored: expected round_complete, got ${room.state}`)
        return room
      }
      // Check session round limit
      const limitReached =
        room.config.sessionRounds != null && room.currentRound >= room.config.sessionRounds
      if (limitReached) {
        warn(`NEXT_ROUND ignored: session round limit (${room.config.sessionRounds}) reached`)
        return room
      }
      return { ...room, state: "betting", updatedAt: now() }
    }

    case "END_SESSION": {
      if (room.state !== "round_complete") {
        warn(`END_SESSION ignored: expected round_complete, got ${room.state}`)
        return room
      }
      return { ...room, state: "session_complete", updatedAt: now() }
    }

    default: {
      // Exhaustive check — TypeScript will warn if a new action type is added
      const _exhaustive: never = action
      warn(`Unknown action type: ${(_exhaustive as RoomAction & { type: string }).type}`)
      return room
    }
  }
}
