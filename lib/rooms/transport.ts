import type { Room, RoomAction, RoomConfig, RoomPlayer } from "@/lib/types/room"

export interface RoomTransport {
  /** Subscribe to room state changes. Returns unsubscribe function. */
  subscribeToRoom(roomId: string, callback: (room: Room) => void): () => void
  /** Dispatch an action to the room. */
  sendRoomAction(roomId: string, action: RoomAction): Promise<void>
  /** Update player presence (connected/disconnected). */
  updatePresence(roomId: string, playerId: string, isConnected: boolean): Promise<void>
  /** Get current room snapshot. */
  getRoomSnapshot(roomId: string): Promise<Room | null>
  /** Create a new room. Returns the created room. */
  createRoom(config: RoomConfig, hostPlayer: RoomPlayer): Promise<Room>
  /** Join existing room by code. Returns the room or null if not found/full. */
  joinRoomByCode(code: string, player: RoomPlayer): Promise<Room | null>
}
