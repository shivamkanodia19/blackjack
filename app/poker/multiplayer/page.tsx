"use client"

import { useState } from "react"
import Link from "next/link"

export default function PokerMultiplayerPage() {
  const [displayName, setDisplayName] = useState("Player")
  const [buyIn, setBuyIn] = useState(1000)
  const [mpMode, setMpMode] = useState<"create" | "join">("create")
  const [roomCode, setRoomCode] = useState("")

  return (
    <div className="min-h-screen bg-[#070c09] text-[#e8dcc0] flex flex-col items-center justify-center px-4 py-12" style={{
      background: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(18,92,44,0.35) 0%, transparent 70%), #070c09"
    }}>
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center mb-2">
          <div className="text-5xl mb-1" style={{ color: "#c8a040", fontFamily: "'Playfair Display', Georgia, serif" }}>♠</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e8cc" }}>Multiplayer Poker</h1>
          <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: "#7a9a6a" }}>Private Tables</p>
        </div>

        {/* Notice */}
        <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: "rgba(200,160,64,0.07)", border: "1px solid rgba(200,160,64,0.22)", color: "#c8a040" }}>
          <span className="mr-2">🚧</span>
          The multiplayer framework is wired and ready. A live WebSocket relay is needed to connect real players across devices. Local testing works without a server.
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a9a6a" }}>Your Name</span>
          <input
            className="px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8dcc0" }}
            type="text"
            maxLength={18}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
          />
        </label>

        {/* Mode tabs */}
        <div className="flex gap-0 rounded-lg p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
          {(["create", "join"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMpMode(m)}
              className="flex-1 py-2 rounded-md text-sm font-bold capitalize transition"
              style={{
                background: mpMode === m ? "rgba(200,160,64,0.18)" : "transparent",
                color: mpMode === m ? "#c8a040" : "#7a9a6a",
              }}
            >
              {m === "create" ? "Create Room" : "Join Room"}
            </button>
          ))}
        </div>

        {mpMode === "join" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a9a6a" }}>Room Code</span>
            <input
              className="px-4 py-2.5 rounded-lg text-sm outline-none text-center font-bold tracking-[6px]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#c8a040", fontFamily: "'Space Mono', monospace" }}
              type="text"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
            />
          </label>
        )}

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
                  fontFamily: "'Space Mono', monospace"
                }}
              >
                ${v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled
          className="w-full py-3 rounded-lg font-bold text-sm opacity-50 cursor-not-allowed"
          style={{ background: "linear-gradient(to bottom, #d8b048, #b88830)", color: "#1a0c00" }}
        >
          {mpMode === "create" ? "Create Room (server needed)" : "Join Room (server needed)"}
        </button>

        <Link href="/poker" className="text-center text-xs" style={{ color: "#4a6050" }}>← Back to Poker Hub</Link>
      </div>
    </div>
  )
}
