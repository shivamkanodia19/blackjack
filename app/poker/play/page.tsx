"use client"

import { useState } from "react"
import { PokerSinglePlayer } from "@/components/poker/PokerSinglePlayer"

type SetupState = {
  displayName: string
  buyIn: number
  botCount: number
}

export default function PokerPlayPage() {
  const [setup, setSetup] = useState<SetupState | null>(null)
  const [displayName, setDisplayName] = useState("Player")
  const [buyIn, setBuyIn] = useState(1000)
  const [botCount, setBotCount] = useState(5)

  if (setup) {
    return (
      <PokerSinglePlayer
        displayName={setup.displayName}
        buyIn={setup.buyIn}
        botCount={setup.botCount}
        onExit={() => setSetup(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#070c09] text-[#e8dcc0] flex flex-col items-center justify-center px-4 py-12" style={{
      background: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(18,92,44,0.35) 0%, transparent 70%), #070c09"
    }}>
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center mb-2">
          <div className="text-5xl mb-1" style={{ color: "#c8a040", fontFamily: "'Playfair Display', Georgia, serif" }}>♠</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e8cc" }}>AI Poker</h1>
          <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: "#7a9a6a" }}>No-Limit Texas Hold&apos;em</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a9a6a" }}>Your Name</span>
          <input
            className="px-4 py-2.5 rounded-lg text-sm outline-none transition"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8dcc0", fontFamily: "inherit" }}
            type="text"
            maxLength={18}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            onFocus={(e) => { e.target.style.borderColor = "#c8a040"; e.target.style.boxShadow = "0 0 0 3px rgba(200,160,64,0.12)" }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none" }}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a9a6a" }}>Buy-In</span>
          <div className="flex gap-2 flex-wrap">
            {[500, 1000, 2500, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setBuyIn(v)}
                className="px-4 py-1.5 rounded-full text-sm font-bold transition"
                style={{
                  background: buyIn === v ? "rgba(200,160,64,0.22)" : "rgba(255,255,255,0.04)",
                  border: buyIn === v ? "1px solid #c8a040" : "1px solid rgba(255,255,255,0.1)",
                  color: buyIn === v ? "#c8a040" : "#e8dcc0",
                  fontFamily: "'Space Mono', 'Courier New', monospace"
                }}
              >
                ${v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a9a6a" }}>Opponents</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setBotCount(v)}
                className="w-10 h-10 rounded-lg text-sm font-bold transition"
                style={{
                  background: botCount === v ? "rgba(200,160,64,0.22)" : "rgba(255,255,255,0.04)",
                  border: botCount === v ? "1px solid #c8a040" : "1px solid rgba(255,255,255,0.1)",
                  color: botCount === v ? "#c8a040" : "#e8dcc0",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setSetup({ displayName: displayName.trim() || "Player", buyIn, botCount })}
          disabled={!displayName.trim()}
          className="w-full py-3 rounded-lg font-bold text-sm transition"
          style={{
            background: "linear-gradient(to bottom, #d8b048, #b88830)",
            color: "#1a0c00",
            boxShadow: "0 2px 8px rgba(200,160,64,0.3)",
            opacity: displayName.trim() ? 1 : 0.4,
            cursor: displayName.trim() ? "pointer" : "not-allowed"
          }}
        >
          Take a Seat
        </button>

        <a href="/poker" className="text-center text-xs" style={{ color: "#4a6050" }}>← Back to Poker Hub</a>
      </div>
    </div>
  )
}
