interface PlayingCardProps {
  rank: string
  suit: string
  faceDown?: boolean
  size?: "sm" | "md"
}

const isRed = (suit: string) => suit === "♥" || suit === "♦"

export function PlayingCard({ rank, suit, faceDown = false, size = "md" }: PlayingCardProps) {
  const dims = size === "sm" ? "w-10 h-14" : "w-14 h-20"
  const text = size === "sm" ? "text-[9px]" : "text-xs"

  if (faceDown) {
    return (
      <div
        className={`${dims} rounded-lg shrink-0 select-none`}
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #1e3a8a 100%)",
          border: "1px solid #3b82f6",
          boxShadow: "0 3px 10px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)",
        }}
        aria-label="Face-down card"
      >
        <div className="w-full h-full rounded-[7px] flex items-center justify-center"
          style={{ background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)" }}
        >
          <span className="text-blue-400/60 text-lg">♦</span>
        </div>
      </div>
    )
  }

  const colorClass = isRed(suit) ? "text-red-600" : "text-gray-900"

  return (
    <div
      className={`${dims} rounded-lg shrink-0 select-none flex flex-col justify-between p-1`}
      style={{
        background: "#ffffff",
        border: "1px solid #d1d5db",
        boxShadow: "0 3px 10px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)",
      }}
      aria-label={`${rank} of ${suit}`}
    >
      <div className={`${text} font-bold leading-none ${colorClass}`}>
        <div>{rank}</div>
        <div>{suit}</div>
      </div>
      <div className={`${text} font-bold leading-none rotate-180 self-end ${colorClass}`}>
        <div>{rank}</div>
        <div>{suit}</div>
      </div>
    </div>
  )
}
