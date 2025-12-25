"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, GraduationCap, Beaker, BookOpen, FileText, Spade, LogOut, User } from "lucide-react"
import GameBoard from "@/components/game-board"
import StrategyGuide from "@/components/strategy-guide"
import GameSettings from "@/components/game-settings"
import { getUserProfile, signOut } from "@/lib/actions/game-stats"
import { useRouter } from "next/navigation"

type GameMode = "practice" | "real" | "testing" | null
type View = "home" | "game" | "strategy" | "settings"

export default function BlackjackApp() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null)
  const [initialBankroll, setInitialBankroll] = useState(1000)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const result = await getUserProfile()
    if (result.error) {
      router.push("/auth/login")
    } else if (result.profile) {
      setUserProfile({ name: result.profile.name, email: result.profile.email })
      const { getGameStats } = await import("@/lib/actions/game-stats")
      const statsResult = await getGameStats()
      if (statsResult.stats) {
        setInitialBankroll(statsResult.stats.bankroll)
      }
    }
    setIsLoading(false)
  }

  const startGame = (mode: GameMode) => {
    setGameMode(mode)
    setCurrentView("game")
  }

  const goHome = () => {
    setCurrentView("home")
    setGameMode(null)
    loadUserData()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (currentView === "game" && gameMode) {
    return <GameBoard mode={gameMode} onExit={goHome} initialBankroll={initialBankroll} />
  }

  if (currentView === "strategy") {
    return <StrategyGuide onBack={() => setCurrentView("home")} />
  }

  if (currentView === "settings") {
    return <GameSettings onBack={() => setCurrentView("home")} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800">
      <div className="container mx-auto px-4 py-16">
        {userProfile && (
          <div className="flex justify-end mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                <div>
                  <div className="font-semibold">{userProfile.name}</div>
                  <div className="text-xs opacity-80">{userProfile.email}</div>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Spade className="h-12 w-12 text-white" fill="white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Blackjack</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Select your game mode and start playing. Each mode offers a unique experience tailored to your needs.
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {/* Real Play */}
          <Card className="bg-red-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Real Play</h2>
              <p className="text-gray-600 text-center mb-8 min-h-[48px]">
                Compete with authentic blackjack rules and test your skills.
              </p>
              <Button
                onClick={() => startGame("real")}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-6 rounded-xl shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </span>
                  Start Game
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Practice Mode */}
          <Card className="bg-blue-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Practice Mode</h2>
              <p className="text-gray-600 text-center mb-8 min-h-[48px]">
                Hone your strategy and learn the game without any pressure or risk.
              </p>
              <Button
                onClick={() => startGame("practice")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-6 rounded-xl shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </span>
                  Start Game
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Testing Mode */}
          <Card className="bg-green-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                  <Beaker className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Testing Mode</h2>
              <p className="text-gray-600 text-center mb-8 min-h-[48px]">
                Experiment with different scenarios and analyze game mechanics.
              </p>
              <Button
                onClick={() => startGame("testing")}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6 rounded-xl shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </span>
                  Start Game
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setCurrentView("strategy")}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-6 rounded-xl font-semibold"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Strategy Guide
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentView("settings")}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-6 rounded-xl font-semibold"
          >
            <FileText className="mr-2 h-5 w-5" />
            Rules
          </Button>
        </div>

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-white/80 text-sm">Good luck! Remember to play responsibly.</p>
        </div>
      </div>
    </div>
  )
}
