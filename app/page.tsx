"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getUserProfile, signOut } from "@/lib/actions/game-stats"
import { useRouter } from "next/navigation"
import { LogIn, UserPlus, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FeltHome() {
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    getUserProfile().then((result) => {
      if (!result.error && result.profile) {
        setUserProfile({ name: result.profile.name, email: result.profile.email })
      }
    })
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUserProfile(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#070c09] text-[#e8dcc0] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[#c8a040] text-xl font-black tracking-widest uppercase" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              ♠ Felt
            </span>
          </div>
          {userProfile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-[#7a9a6a]">
                <User className="h-4 w-4" />
                <span>{userProfile.name}</span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white text-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white text-xs">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Log in
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-[#c8a040] hover:bg-[#e8c060] text-[#1a0c00] font-bold text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(18,92,44,0.3) 0%, transparent 70%)"
      }}>
        <div className="text-center mb-16">
          <div className="text-7xl mb-2 leading-none" style={{ color: "#c8a040", fontFamily: "'Playfair Display', Georgia, serif", filter: "drop-shadow(0 0 32px rgba(200,160,64,0.5))" }}>♠</div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e8cc", textShadow: "0 2px 16px rgba(200,160,64,0.35)" }}>
            Felt
          </h1>
          <p className="text-sm tracking-[4px] uppercase" style={{ color: "#7a9a6a" }}>Play cards sharper.</p>
          <p className="mt-4 text-sm text-gray-500 max-w-md mx-auto">
            Play-money poker and blackjack. Private tables, AI opponents, strategy coaching. No real money involved.
          </p>
        </div>

        {/* Game hubs */}
        <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Poker Hub */}
          <Link href="/poker" className="group block rounded-2xl p-8 border border-[rgba(200,160,64,0.2)] bg-[rgba(18,92,44,0.08)] hover:border-[#c8a040] hover:bg-[rgba(18,92,44,0.16)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a040]">
            <div className="text-5xl mb-4 leading-none" style={{ filter: "drop-shadow(0 0 12px rgba(200,160,64,0.3))" }}>♠</div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e8cc" }}>
              Poker
            </h2>
            <p className="text-sm mb-5" style={{ color: "#7a9a6a", lineHeight: 1.6 }}>
              No-Limit Texas Hold&apos;em. Play AI opponents, practice your decisions, or run a private table with friends.
            </p>
            <ul className="space-y-1.5 mb-6">
              {["AI opponents with distinct styles", "Decision training & coaching", "Private tables with friends"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#4a6050" }}>
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "rgba(200,160,64,0.6)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <span className="text-sm font-bold" style={{ color: "#c8a040" }}>
              Enter Poker Hub →
            </span>
          </Link>

          {/* Blackjack Hub */}
          <Link href="/blackjack" className="group block rounded-2xl p-8 border border-[rgba(52,152,219,0.2)] bg-[rgba(29,74,120,0.08)] hover:border-[rgba(52,152,219,0.5)] hover:bg-[rgba(29,74,120,0.14)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            <div className="text-5xl mb-4 leading-none" style={{ filter: "drop-shadow(0 0 12px rgba(52,152,219,0.3))" }}>♦</div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e8cc" }}>
              Blackjack
            </h2>
            <p className="text-sm mb-5" style={{ color: "#7a9a6a", lineHeight: 1.6 }}>
              Fast solo sessions, basic strategy coaching, or private friend tables. Quick reps, sharp decisions.
            </p>
            <ul className="space-y-1.5 mb-6">
              {["Solo sessions against the dealer", "Basic strategy training", "Private friend tables"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#4a6050" }}>
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "rgba(52,152,219,0.6)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <span className="text-sm font-bold text-blue-400">
              Enter Blackjack Hub →
            </span>
          </Link>
        </div>

        <p className="mt-12 text-xs text-center" style={{ color: "#4a6050" }}>
          Play-money only · No real-money gambling · Virtual chips have no real-world value · 18+
        </p>
      </main>
    </div>
  )
}
