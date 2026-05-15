"use client"

import { useEffect, useMemo, useRef } from "react"
import { LocalTransport } from "@/lib/poker/transport/LocalTransport"
import { useGame } from "@/lib/poker/state/useGame"
import { PokerTable } from "@/components/poker/PokerTable"
import "@/styles/poker.css"

type Props = {
  displayName: string
  buyIn: number
  botCount: number
  onExit: () => void
}

export function PokerSinglePlayer({ displayName, buyIn, botCount, onExit }: Props) {
  const idRef = useRef(`human-${Date.now()}`)

  const transport = useMemo(
    () =>
      new LocalTransport({
        tableId: `local-${Date.now()}`,
        humanPlayerId: idRef.current,
        humanDisplayName: displayName,
        buyIn,
        botCount,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    return () => transport.dispose()
  }, [transport])

  const { snapshot, privateSnapshot, infoLog } = useGame(transport)

  if (!snapshot) {
    return (
      <div className="poker-shell">
        <div className="loading-screen">
          <div className="loading-screen__spinner" />
          <p>Setting up table…</p>
        </div>
      </div>
    )
  }

  const lastAction = infoLog.length > 0 ? infoLog[infoLog.length - 1].message : undefined

  return (
    <div className="poker-shell">
      <div className="game-screen">
        <PokerTable
          snapshot={snapshot}
          privateSnapshot={privateSnapshot}
          transport={transport}
          onExit={onExit}
          lastAction={lastAction}
        />
        {infoLog.length > 0 && (
          <div className="info-log">
            {infoLog.map((entry) => (
              <div key={entry.id} className={`info-log__entry info-log__entry--${entry.level}`}>
                {entry.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
