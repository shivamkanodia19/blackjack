"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { localTransport } from "@/lib/rooms/local-transport"
import type { Room, RoomConfig, RoomPlayer, RoomHandResult } from "@/lib/types/room"

export interface UseLiveRoomReturn {
  room: Room | null
  playerId: string
  isLoading: boolean
  error: string | null
  createRoom: (playerName: string, config?: Partial<RoomConfig>) => Promise<Room>
  joinRoom: (code: string, playerName: string) => Promise<Room | null>
  setReady: (playerId: string, ready: boolean) => Promise<void>
  startBetting: () => Promise<void>
  placeBet: (playerId: string, amount: number) => Promise<void>
  startDealing: () => Promise<void>
  nextPlayerTurn: (playerId: string) => Promise<void>
  completePlayerTurn: (playerId: string) => Promise<void>
  startDealerTurn: () => Promise<void>
  completeSettlement: (results: RoomHandResult[]) => Promise<void>
  nextRound: () => Promise<void>
  endSession: () => Promise<void>
  leaveRoom: (playerId: string) => Promise<void>
}

export function useLiveRoom(roomId: string | null): UseLiveRoomReturn {
  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable player ID generated once per hook instance
  const playerIdRef = useRef<string>(crypto.randomUUID())

  // Subscribe to room updates whenever roomId changes
  useEffect(() => {
    if (!roomId) return

    const unsubscribe = localTransport.subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom)
    })

    return unsubscribe
  }, [roomId])

  // ---------------------------------------------------------------------------
  // Helper: wrap async actions with loading/error state
  // ---------------------------------------------------------------------------
  const withState = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true)
      setError(null)
      try {
        return await fn()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred"
        setError(msg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Room lifecycle
  // ---------------------------------------------------------------------------
  const createRoom = useCallback(
    async (playerName: string, config?: Partial<RoomConfig>): Promise<Room> => {
      return withState(async () => {
        const hostPlayer: RoomPlayer = {
          id: playerIdRef.current,
          name: playerName,
          sessionChips: config?.startingChips ?? 1000,
          isReady: false,
          isConnected: true,
          seatIndex: 0,
        }
        const roomConfig: RoomConfig = {
          maxPlayers: config?.maxPlayers ?? 6,
          startingChips: config?.startingChips ?? 1000,
          sessionRounds: config?.sessionRounds,
        }
        const created = await localTransport.createRoom(roomConfig, hostPlayer)
        setRoom(created)
        return created
      })
    },
    [withState]
  )

  const joinRoom = useCallback(
    async (code: string, playerName: string): Promise<Room | null> => {
      return withState(async () => {
        const player: RoomPlayer = {
          id: playerIdRef.current,
          name: playerName,
          sessionChips: 1000, // will be set to room's startingChips by host config
          isReady: false,
          isConnected: true,
          seatIndex: 0, // will be assigned by room reducer
        }
        const joined = await localTransport.joinRoomByCode(code.toUpperCase().trim(), player)
        if (!joined) {
          setError("Room not found or is no longer accepting players")
          return null
        }
        setRoom(joined)
        return joined
      })
    },
    [withState]
  )

  const leaveRoom = useCallback(
    async (playerId: string): Promise<void> => {
      if (!roomId) return
      return withState(async () => {
        await localTransport.sendRoomAction(roomId, { type: "PLAYER_LEAVE", playerId })
      })
    },
    [roomId, withState]
  )

  // ---------------------------------------------------------------------------
  // Lobby / ready
  // ---------------------------------------------------------------------------
  const setReady = useCallback(
    async (playerId: string, ready: boolean): Promise<void> => {
      if (!roomId) return
      return withState(async () => {
        await localTransport.sendRoomAction(
          roomId,
          ready ? { type: "PLAYER_READY", playerId } : { type: "PLAYER_UNREADY", playerId }
        )
      })
    },
    [roomId, withState]
  )

  const startBetting = useCallback(async (): Promise<void> => {
    if (!roomId) return
    return withState(async () => {
      await localTransport.sendRoomAction(roomId, { type: "START_BETTING" })
    })
  }, [roomId, withState])

  // ---------------------------------------------------------------------------
  // Betting
  // ---------------------------------------------------------------------------
  const placeBet = useCallback(
    async (playerId: string, amount: number): Promise<void> => {
      if (!roomId) return
      return withState(async () => {
        await localTransport.sendRoomAction(roomId, { type: "PLACE_BET", playerId, amount })
      })
    },
    [roomId, withState]
  )

  const startDealing = useCallback(async (): Promise<void> => {
    if (!roomId) return
    return withState(async () => {
      await localTransport.sendRoomAction(roomId, { type: "START_DEALING" })
    })
  }, [roomId, withState])

  // ---------------------------------------------------------------------------
  // Player turns
  // ---------------------------------------------------------------------------
  const nextPlayerTurn = useCallback(
    async (playerId: string): Promise<void> => {
      if (!roomId) return
      return withState(async () => {
        await localTransport.sendRoomAction(roomId, { type: "NEXT_PLAYER_TURN", playerId })
      })
    },
    [roomId, withState]
  )

  const completePlayerTurn = useCallback(
    async (playerId: string): Promise<void> => {
      if (!roomId) return
      return withState(async () => {
        await localTransport.sendRoomAction(roomId, { type: "COMPLETE_PLAYER_TURN", playerId })
      })
    },
    [roomId, withState]
  )

  // ---------------------------------------------------------------------------
  // Dealer turn
  // ---------------------------------------------------------------------------
  const startDealerTurn = useCallback(async (): Promise<void> => {
    if (!roomId) return
    return withState(async () => {
      await localTransport.sendRoomAction(roomId, { type: "START_DEALER_TURN" })
    })
  }, [roomId, withState])

  // ---------------------------------------------------------------------------
  // Settlement & round management
  // ---------------------------------------------------------------------------
  const completeSettlement = useCallback(
    async (results: RoomHandResult[]): Promise<void> => {
      if (!roomId) return
      return withState(async () => {
        await localTransport.sendRoomAction(roomId, { type: "COMPLETE_SETTLEMENT", results })
      })
    },
    [roomId, withState]
  )

  const nextRound = useCallback(async (): Promise<void> => {
    if (!roomId) return
    return withState(async () => {
      await localTransport.sendRoomAction(roomId, { type: "NEXT_ROUND" })
    })
  }, [roomId, withState])

  const endSession = useCallback(async (): Promise<void> => {
    if (!roomId) return
    return withState(async () => {
      await localTransport.sendRoomAction(roomId, { type: "END_SESSION" })
    })
  }, [roomId, withState])

  return {
    room,
    playerId: playerIdRef.current,
    isLoading,
    error,
    createRoom,
    joinRoom,
    setReady,
    startBetting,
    placeBet,
    startDealing,
    nextPlayerTurn,
    completePlayerTurn,
    startDealerTurn,
    completeSettlement,
    nextRound,
    endSession,
    leaveRoom,
  }
}
