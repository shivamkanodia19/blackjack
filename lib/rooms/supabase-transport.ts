import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js"
import type { Room, RoomAction, RoomConfig, RoomPlayer } from "@/lib/types/room"
import type { RoomTransport } from "./transport"
import { roomReducer, createInitialRoom } from "./room-reducer"

type RoomCallback = (room: Room) => void

/**
 * Host-authoritative Supabase transport.
 *
 * The host applies actions through the room reducer client-side and writes the
 * resulting state_json back to Supabase. All clients subscribe to Realtime
 * postgres_changes on the rooms row and receive the latest snapshot.
 *
 * This avoids server-side RPCs while still enabling real-time multiplayer.
 * For production with untrusted clients, replace sendRoomAction with an
 * Edge Function that runs the reducer server-side.
 */
export class SupabaseRoomTransport implements RoomTransport {
  private supabase: SupabaseClient
  private channels = new Map<string, RealtimeChannel>()

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // -------------------------------------------------------------------------
  // subscribeToRoom
  // -------------------------------------------------------------------------

  subscribeToRoom(roomId: string, callback: RoomCallback): () => void {
    const channel = this.supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const snap = (payload.new as { state_json?: Room }).state_json
          if (snap) callback(snap)
        }
      )
      .subscribe()

    this.channels.set(roomId, channel)

    // Emit current state immediately
    this.getRoomSnapshot(roomId).then((room) => {
      if (room) callback(room)
    })

    return () => {
      const ch = this.channels.get(roomId)
      if (ch) {
        this.supabase.removeChannel(ch)
        this.channels.delete(roomId)
      }
    }
  }

  // -------------------------------------------------------------------------
  // sendRoomAction — fetch → reduce → write back
  // -------------------------------------------------------------------------

  async sendRoomAction(roomId: string, action: RoomAction): Promise<void> {
    const current = await this.getRoomSnapshot(roomId)
    if (!current) throw new Error(`Room ${roomId} not found`)

    const next = roomReducer(current, action)

    const { error } = await this.supabase
      .from("rooms")
      .update({
        state_json: next,
        state: next.state,
        current_round: next.currentRound,
        current_player_id: next.currentPlayerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId)

    if (error) throw new Error(`sendRoomAction failed: ${error.message}`)
  }

  // -------------------------------------------------------------------------
  // updatePresence
  // -------------------------------------------------------------------------

  async updatePresence(roomId: string, playerId: string, isConnected: boolean): Promise<void> {
    const action: RoomAction = isConnected
      ? { type: "PLAYER_RECONNECTED", playerId }
      : { type: "PLAYER_DISCONNECTED", playerId }
    await this.sendRoomAction(roomId, action)
  }

  // -------------------------------------------------------------------------
  // getRoomSnapshot
  // -------------------------------------------------------------------------

  async getRoomSnapshot(roomId: string): Promise<Room | null> {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("state_json")
      .eq("id", roomId)
      .single()

    if (error || !data) return null
    return (data as { state_json: Room }).state_json ?? null
  }

  // -------------------------------------------------------------------------
  // createRoom
  // -------------------------------------------------------------------------

  async createRoom(config: RoomConfig, hostPlayer: RoomPlayer): Promise<Room> {
    const room = createInitialRoom(config, hostPlayer)

    const { error } = await this.supabase.from("rooms").insert({
      id: room.id,
      code: room.code,
      host_id: hostPlayer.id,
      state: room.state,
      config: room.config,
      current_round: room.currentRound,
      current_player_id: room.currentPlayerId,
      state_json: room,
    })

    if (error) throw new Error(`createRoom failed: ${error.message}`)
    return room
  }

  // -------------------------------------------------------------------------
  // joinRoomByCode
  // -------------------------------------------------------------------------

  async joinRoomByCode(code: string, player: RoomPlayer): Promise<Room | null> {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("state_json")
      .eq("code", code)
      .single()

    if (error || !data) return null

    const current = (data as { state_json: Room }).state_json
    if (!current) return null

    if (current.players.length >= current.config.maxPlayers) return null
    if (current.state !== "lobby") return null

    const next = roomReducer(current, { type: "PLAYER_JOIN", player })

    const { error: updateErr } = await this.supabase
      .from("rooms")
      .update({ state_json: next })
      .eq("code", code)

    if (updateErr) throw new Error(`joinRoomByCode failed: ${updateErr.message}`)
    return next
  }
}
