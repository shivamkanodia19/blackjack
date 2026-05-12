export type RoomState =
  | "lobby"
  | "ready_check"
  | "betting"
  | "dealing"
  | "player_turn"
  | "dealer_turn"
  | "settlement"
  | "round_complete"
  | "session_complete"

export interface RoomPlayer {
  id: string
  name: string
  sessionChips: number
  isReady: boolean
  isConnected: boolean
  seatIndex: number
}

export interface RoomConfig {
  maxPlayers: number  // 2-6
  startingChips: number  // default 1000
  sessionRounds?: number  // optional round limit
}

export interface Room {
  id: string
  code: string  // 6-char join code
  hostId: string
  state: RoomState
  players: RoomPlayer[]
  config: RoomConfig
  currentRound: number
  currentPlayerId: string | null  // whose turn it is
  createdAt: number
  updatedAt: number
}

export interface RoomRound {
  roundNumber: number
  bets: Record<string, number>  // playerId -> bet amount
  handResults: RoomHandResult[]
  leaderboard: LeaderboardEntry[]
}

export interface RoomHandResult {
  playerId: string
  outcome: "win" | "loss" | "push" | "blackjack"
  bet: number
  payout: number  // net chips change (positive = won, negative = lost)
}

export interface LeaderboardEntry {
  playerId: string
  playerName: string
  sessionChips: number
  handsPlayed: number
  handsWon: number
}

export type RoomAction =
  | { type: "PLAYER_JOIN"; player: RoomPlayer }
  | { type: "PLAYER_LEAVE"; playerId: string }
  | { type: "PLAYER_READY"; playerId: string }
  | { type: "PLAYER_UNREADY"; playerId: string }
  | { type: "START_BETTING" }
  | { type: "PLACE_BET"; playerId: string; amount: number }
  | { type: "START_DEALING" }
  | { type: "NEXT_PLAYER_TURN"; playerId: string }
  | { type: "COMPLETE_PLAYER_TURN"; playerId: string }
  | { type: "START_DEALER_TURN" }
  | { type: "COMPLETE_SETTLEMENT"; results: RoomHandResult[] }
  | { type: "NEXT_ROUND" }
  | { type: "END_SESSION" }
  | { type: "PLAYER_DISCONNECTED"; playerId: string }
  | { type: "PLAYER_RECONNECTED"; playerId: string }
