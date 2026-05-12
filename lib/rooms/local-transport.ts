import type { Room, RoomAction, RoomConfig, RoomPlayer } from "@/lib/types/room"
import type { RoomTransport } from "./transport"
import { roomReducer, createInitialRoom } from "./room-reducer"

type RoomCallback = (room: Room) => void

class LocalRoomTransport implements RoomTransport {
  private rooms = new Map<string, Room>()
  private subscribers = new Map<string, Set<RoomCallback>>()

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private notify(roomId: string, room: Room): void {
    const subs = this.subscribers.get(roomId)
    if (!subs) return
    for (const cb of subs) {
      try {
        cb(room)
      } catch (err) {
        console.error(`[LocalRoomTransport] subscriber error for room ${roomId}:`, err)
      }
    }
  }

  private deepClone(room: Room): Room {
    // structuredClone is available in Node 17+ and modern browsers
    return structuredClone(room)
  }

  private dispatch(roomId: string, action: RoomAction): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) {
      console.warn(`[LocalRoomTransport] dispatch: room ${roomId} not found`)
      return null
    }
    const next = roomReducer(room, action)
    this.rooms.set(roomId, next)
    this.notify(roomId, this.deepClone(next))
    return next
  }

  // -------------------------------------------------------------------------
  // RoomTransport implementation
  // -------------------------------------------------------------------------

  subscribeToRoom(roomId: string, callback: RoomCallback): () => void {
    if (!this.subscribers.has(roomId)) {
      this.subscribers.set(roomId, new Set())
    }
    this.subscribers.get(roomId)!.add(callback)

    // Immediately emit current state if room exists
    const current = this.rooms.get(roomId)
    if (current) {
      try {
        callback(this.deepClone(current))
      } catch (err) {
        console.error(`[LocalRoomTransport] initial callback error for room ${roomId}:`, err)
      }
    }

    return () => {
      const subs = this.subscribers.get(roomId)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.subscribers.delete(roomId)
        }
      }
    }
  }

  async sendRoomAction(roomId: string, action: RoomAction): Promise<void> {
    this.dispatch(roomId, action)
  }

  async updatePresence(roomId: string, playerId: string, isConnected: boolean): Promise<void> {
    const action: RoomAction = isConnected
      ? { type: "PLAYER_RECONNECTED", playerId }
      : { type: "PLAYER_DISCONNECTED", playerId }
    this.dispatch(roomId, action)
  }

  async getRoomSnapshot(roomId: string): Promise<Room | null> {
    const room = this.rooms.get(roomId)
    return room ? this.deepClone(room) : null
  }

  async createRoom(config: RoomConfig, hostPlayer: RoomPlayer): Promise<Room> {
    const room = createInitialRoom(config, hostPlayer)
    this.rooms.set(room.id, room)
    this.notify(room.id, this.deepClone(room))
    return this.deepClone(room)
  }

  async joinRoomByCode(code: string, player: RoomPlayer): Promise<Room | null> {
    // Find room by code (linear scan — acceptable for local/dev use)
    let targetRoom: Room | undefined
    for (const room of this.rooms.values()) {
      if (room.code === code) {
        targetRoom = room
        break
      }
    }

    if (!targetRoom) {
      console.warn(`[LocalRoomTransport] joinRoomByCode: no room with code ${code}`)
      return null
    }

    if (targetRoom.players.length >= targetRoom.config.maxPlayers) {
      console.warn(`[LocalRoomTransport] joinRoomByCode: room ${code} is full`)
      return null
    }

    if (targetRoom.state !== "lobby") {
      console.warn(
        `[LocalRoomTransport] joinRoomByCode: room ${code} is not in lobby state (state=${targetRoom.state})`
      )
      return null
    }

    const updated = this.dispatch(targetRoom.id, { type: "PLAYER_JOIN", player })
    if (!updated) return null
    return this.deepClone(updated)
  }
}

export const localTransport = new LocalRoomTransport()
