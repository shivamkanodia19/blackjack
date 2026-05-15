"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Layers, GraduationCap, Beaker, Users } from "lucide-react"
import GameBoard from "@/components/game-board"
import StrategyGuide from "@/components/strategy-guide"
import GameSettings from "@/components/game-settings"
import { getUserProfile, signOut, getGameStats } from "@/lib/actions/game-stats"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus, User, LogOut } from "lucide-react"

type GameMode = "practice" | "real" | "testing" | null
type View = "hub" | "game" | "strategy" | "settings"

export default function BlackjackHub() {
  const [currentView, setCurrentView] = useState<View>("hub")
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [initialBankroll, setInitialBankroll] = useState(1000)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    getUserProfile().then((result) => {
      if (!result.error && result.profile) {
        setUserProfile({ name: result.profile.name, email: result.profile.email })
      }
    })
  }, [])

  const handleGameModeClick = async (mode: GameMode) => {
    if (mode === "real") {
      const profileResult = await getUserProfile()
      if (profileResult.error || !profileResult.profile) {
        alert("Please log in to play Solo Mode. Your session stats will be saved to your account.")
        router.push("/auth/login")
        return
      }
      try {
        const result = await getGameStats()
        if (result.stats?.bankroll) setInitialBankroll(result.stats.bankroll)
      } catch {}
    } else {
      setInitialBankroll(1000)
    }
    setGameMode(mode)
    setCurrentView("game")
  }

  const goHub = () => {
    setCurrentView("hub")
    setGameMode(null)
    getUserProfile().then((result) => {
      if (!result.error && result.profile) {
        setUserProfile({ name: result.profile.name, email: result.profile.email })
      } else {
        setUserProfile(null)
      }
    })
  }

  const handleSignOut = async () => {
    await signOut()
    setUserProfile(null)
    router.refresh()
  }

  if (currentView === "game" && gameMode) {
    return <GameBoard mode={gameMode} onExit={goHub} initialBankroll={initialBankroll} />
  }
  if (currentView === "strategy") return <StrategyGuide onBack={() => setCurrentView("hub")} />
  if (currentView === "settings") return <GameSettings onBack={() => setCurrentView("hub")} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-400 transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-[#c8a040] font-black tracking-widest uppercase text-sm" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>♠ Felt</span>
            </Link>
            <span className="text-gray-600 text-xs">/</span>
            <span className="text-white text-sm font-semibold">Blackjack</span>
          </div>

          {userProfile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
                <User className="h-4 w-4 text-gray-400" />
                <span>{userProfile.name}</span>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white text-xs">
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
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="text-6xl mb-2 leading-none" style={{ filter: "drop-shadow(0 0 12px rgba(52,152,219,0.4))" }}>♦</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Blackjack
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Play solo, train your strategy, or run a private session with friends. No luck required — just skill.
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <button onClick={() => handleGameModeClick("real")} className="group text-left rounded-2xl p-6 bg-gray-900/60 border border-gray-700/50 hover:border-amber-500/40 hover:bg-gray-900/80 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <Layers className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Solo Play</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Play a full session and track your stack over time. Log in to save your session history.
            </p>
            <ul className="space-y-1.5">
              {["Session stack tracking", "Standard 6-deck rules", "Saved session history"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <span className="inline-flex items-center text-sm font-semibold text-amber-400 group-hover:text-amber-300">Start session →</span>
            </div>
          </button>

          <button onClick={() => handleGameModeClick("practice")} className="group text-left rounded-2xl p-6 bg-gray-900/60 border border-gray-700/50 hover:border-blue-500/40 hover:bg-gray-900/80 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <GraduationCap className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Practice Mode</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Hints shown on every decision. Learn correct basic strategy at your own pace with no pressure.
            </p>
            <ul className="space-y-1.5">
              {["Strategy hints on every hand", "Unlimited practice chips", "No account required"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-blue-500/60" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <span className="inline-flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300">Start practice →</span>
            </div>
          </button>

          <button onClick={() => handleGameModeClick("testing")} className="group text-left rounded-2xl p-6 bg-gray-900/60 border border-gray-700/50 hover:border-emerald-500/40 hover:bg-gray-900/80 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Beaker className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Training Mode</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Immediate feedback after every decision. Track your accuracy, streaks, and weak spots.
            </p>
            <ul className="space-y-1.5">
              {["Instant decision feedback", "Accuracy & streak tracking", "Detailed strategy explanations"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <span className="inline-flex items-center text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">Start training →</span>
            </div>
          </button>
        </div>

        {/* Beta modes */}
        <div className="mt-10 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <hr className="flex-1 border-gray-700/50" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 px-2">Extended Modes</span>
            <hr className="flex-1 border-gray-700/50" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/blackjack/solo" className="group text-left rounded-2xl p-6 bg-gray-900/60 border border-gray-700/50 hover:border-emerald-500/40 hover:bg-gray-900/80 transition-all duration-200 block">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Layers className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Solo Bankroll</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">Practice with session chips. Track your bankroll across hands with optional strategy hints.</p>
              <span className="inline-flex items-center text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">Play Solo →</span>
            </Link>

            <Link href="/blackjack/training" className="group text-left rounded-2xl p-6 bg-gray-900/60 border border-gray-700/50 hover:border-blue-500/40 hover:bg-gray-900/80 transition-all duration-200 block">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <GraduationCap className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Strategy Training</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">Master basic strategy with immediate feedback on every decision you make.</p>
              <span className="inline-flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300">Start Training →</span>
            </Link>

            <Link href="/blackjack/live" className="group text-left rounded-2xl p-6 bg-gray-900/60 border border-gray-700/50 hover:border-violet-500/40 hover:bg-gray-900/80 transition-all duration-200 block">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Friend Table</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">Create a private room and play with friends. Automated dealer. Session chips.</p>
              <span className="inline-flex items-center text-sm font-semibold text-violet-400 group-hover:text-violet-300">Create Room →</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => setCurrentView("strategy")} className="border-gray-700 bg-gray-900/40 text-gray-300 hover:bg-gray-800 hover:text-white gap-2">
            Strategy guide
          </Button>
          <Button variant="outline" onClick={() => setCurrentView("settings")} className="border-gray-700 bg-gray-900/40 text-gray-300 hover:bg-gray-800 hover:text-white gap-2">
            Game rules
          </Button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-10">
          All chips are session chips only — no real money involved.
        </p>
      </div>
    </div>
  )
}
