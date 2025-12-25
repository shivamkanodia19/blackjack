"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, GraduationCap, Beaker, BookOpen, FileText, Spade } from "lucide-react"
import GameBoard from "@/components/game-board"
import StrategyGuide from "@/components/strategy-guide"
import GameSettings from "@/components/game-settings"

type GameMode = "practice" | "real" | "testing" | null
type View = "home" | "game" | "strategy" | "settings"

export default function BlackjackApp() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [initialBankroll] = useState(1000)

  const handleGameModeClick = (mode: GameMode) => {
    setGameMode(mode)
    setCurrentView("game")
  }

  const goHome = () => {
    setCurrentView("home")
    setGameMode(null)
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
        {/* Top Navigation Bar */}
        <div className="flex justify-center items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Spade className="h-7 w-7 text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Blackjack</h1>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 className="text-6xl font-bold text-white mb-6">
            Master the Art of Blackjack
          </h2>
          <p className="text-2xl text-white/90 mb-4">
            Experience professional-grade blackjack gameplay with multiple game modes designed for every skill level.
          </p>
          <p className="text-lg text-white/80">
            Whether you're a beginner learning the basics or a seasoned player refining your strategy, 
            our comprehensive platform offers the perfect environment to practice, compete, and improve your skills.
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Real Play */}
          <Card className="bg-red-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-xl flex items-center justify-center">
                  <Heart className="h-10 w-10 text-red-500" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">Real Play</h3>
              <p className="text-gray-700 text-center mb-8 min-h-[60px] leading-relaxed">
                Compete with authentic blackjack rules and test your skills in a realistic casino environment. 
                Track your bankroll, make strategic decisions, and see how you stack up against the dealer.
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Authentic casino rules
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Bankroll tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Side bets available
                </li>
              </ul>
              <Button
                onClick={() => handleGameModeClick("real")}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-6 rounded-xl shadow-lg text-lg"
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
          <Card className="bg-blue-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-10 w-10 text-blue-500" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">Practice Mode</h3>
              <p className="text-gray-700 text-center mb-8 min-h-[60px] leading-relaxed">
                Hone your strategy and learn the game without any pressure or risk. Perfect for beginners 
                and intermediate players looking to improve their decision-making skills.
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Strategy hints and tips
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Risk-free learning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Focus on skill building
                </li>
              </ul>
              <Button
                onClick={() => handleGameModeClick("practice")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-6 rounded-xl shadow-lg text-lg"
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
          <Card className="bg-green-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-xl flex items-center justify-center">
                  <Beaker className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">Testing Mode</h3>
              <p className="text-gray-700 text-center mb-8 min-h-[60px] leading-relaxed">
                Experiment with different scenarios and analyze game mechanics in depth. Ideal for 
                advanced players and strategy researchers testing various approaches.
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Detailed feedback and analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Scenario testing
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Performance metrics
                </li>
              </ul>
              <Button
                onClick={() => handleGameModeClick("testing")}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6 rounded-xl shadow-lg text-lg"
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

        {/* Additional Features Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">Additional Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Button
                variant="outline"
                onClick={() => setCurrentView("strategy")}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-6 rounded-xl font-semibold h-auto flex flex-col items-center gap-3"
              >
                <BookOpen className="h-8 w-8" />
                <div className="text-center">
                  <div className="text-lg font-bold">Strategy Guide</div>
                  <div className="text-sm opacity-80 mt-1">Learn optimal blackjack strategies</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentView("settings")}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-6 rounded-xl font-semibold h-auto flex flex-col items-center gap-3"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="text-lg font-bold">Game Rules</div>
                  <div className="text-sm opacity-80 mt-1">Understand the rules of blackjack</div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-white/80 text-sm mb-2">Ready to test your skills? Choose a game mode above to get started!</p>
          <p className="text-white/60 text-xs">Good luck! Remember to play responsibly.</p>
        </div>
      </div>
    </div>
  )
}
