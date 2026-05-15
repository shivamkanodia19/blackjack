"use client"

import Link from "next/link"
import { ArrowLeft, Bot, Users, GraduationCap } from "lucide-react"

export default function PokerHub() {
  return (
    <div className="min-h-screen bg-[#070c09] text-[#e8dcc0] flex flex-col">
      {/* Header */}
      <header className="border-b border-[rgba(200,160,64,0.12)] bg-black/40 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-[#7a9a6a] hover:text-[#c8a040] transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-black tracking-widest uppercase text-[#c8a040]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>♠ Felt</span>
          </Link>
          <span className="text-[#4a6050] text-xs">/</span>
          <span className="text-[#f0e8cc] text-sm font-semibold">Poker</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 py-14" style={{
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(18,92,44,0.35) 0%, transparent 65%)"
      }}>
        <div className="text-center mb-12">
          <div className="text-6xl mb-2" style={{ color: "#c8a040", fontFamily: "'Playfair Display', Georgia, serif", filter: "drop-shadow(0 0 28px rgba(200,160,64,0.45))" }}>♠</div>
          <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e8cc" }}>Poker</h1>
          <p className="text-sm" style={{ color: "#7a9a6a", letterSpacing: "3px", textTransform: "uppercase" }}>No-Limit Texas Hold&apos;em</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {/* Play AI */}
          <Link href="/poker/play" className="group block rounded-2xl p-6 border border-[rgba(200,160,64,0.2)] bg-[rgba(18,92,44,0.08)] hover:border-[#c8a040] hover:bg-[rgba(18,92,44,0.16)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a040]">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(200,160,64,0.1)", border: "1px solid rgba(200,160,64,0.2)" }}>
              <Bot className="h-5 w-5" style={{ color: "#c8a040" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#f0e8cc" }}>Play AI</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "#7a9a6a" }}>
              Sit down against AI opponents with distinct playing styles. Fast, repeatable sessions.
            </p>
            <ul className="space-y-1.5">
              {["Up to 5 AI opponents", "Adjustable buy-in", "Blind levels & stack play"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#4a6050" }}>
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "rgba(200,160,64,0.6)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <span className="text-sm font-bold" style={{ color: "#c8a040" }}>Take a seat →</span>
            </div>
          </Link>

          {/* Play with Friends */}
          <Link href="/poker/multiplayer" className="group block rounded-2xl p-6 border border-[rgba(139,92,246,0.2)] bg-[rgba(88,28,220,0.06)] hover:border-[rgba(139,92,246,0.5)] hover:bg-[rgba(88,28,220,0.1)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#f0e8cc" }}>Play with Friends</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "#7a9a6a" }}>
              Create a private table and invite up to 5 friends. Session chips, rejoinable seats.
            </p>
            <ul className="space-y-1.5">
              {["Private room code", "Up to 6 players", "Rejoinable seats"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#4a6050" }}>
                  <span className="w-1 h-1 rounded-full flex-shrink-0 bg-violet-500/60" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <span className="text-sm font-bold text-violet-400">Create table →</span>
            </div>
          </Link>

          {/* Train */}
          <div className="rounded-2xl p-6 border border-[rgba(52,152,219,0.2)] bg-[rgba(29,74,120,0.06)] opacity-60 cursor-not-allowed">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(52,152,219,0.1)", border: "1px solid rgba(52,152,219,0.2)" }}>
              <GraduationCap className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#f0e8cc" }}>Train</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "#7a9a6a" }}>
              Decision coaching and spot drills. Post-action feedback tied to real game state.
            </p>
            <ul className="space-y-1.5">
              {["Spot drill mode", "Post-action feedback", "Accuracy tracking"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#4a6050" }}>
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "rgba(52,152,219,0.6)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(200,160,64,0.15)", border: "1px solid rgba(200,160,64,0.3)", color: "#c8a040" }}>Coming Soon</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
