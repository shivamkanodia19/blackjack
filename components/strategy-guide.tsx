"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Spade } from "lucide-react"

interface StrategyGuideProps {
  onBack: () => void
}

export default function StrategyGuide({ onBack }: StrategyGuideProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null)

  // Basic Strategy Chart Data
  const hardTotals = [
    { player: "8", dealer: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"] },
    { player: "9", dealer: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"] },
    { player: "10", dealer: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"] },
    { player: "11", dealer: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "H"] },
    { player: "12", dealer: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"] },
    { player: "13", dealer: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"] },
    { player: "14", dealer: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"] },
    { player: "15", dealer: ["S", "S", "S", "S", "S", "H", "H", "H", "R", "H"] },
    { player: "16", dealer: ["S", "S", "S", "S", "S", "H", "H", "R", "R", "R"] },
    { player: "17", dealer: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"] },
  ]

  const softTotals = [
    { player: "A,2", dealer: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"] },
    { player: "A,3", dealer: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"] },
    { player: "A,4", dealer: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"] },
    { player: "A,5", dealer: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"] },
    { player: "A,6", dealer: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"] },
    { player: "A,7", dealer: ["S", "D", "D", "D", "D", "S", "S", "H", "H", "H"] },
    { player: "A,8", dealer: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"] },
    { player: "A,9", dealer: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"] },
  ]

  const pairs = [
    { player: "A,A", dealer: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"] },
    { player: "10,10", dealer: ["N", "N", "N", "N", "N", "N", "N", "N", "N", "N"] },
    { player: "9,9", dealer: ["Y", "Y", "Y", "Y", "Y", "N", "Y", "Y", "N", "N"] },
    { player: "8,8", dealer: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"] },
    { player: "7,7", dealer: ["Y", "Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N"] },
    { player: "6,6", dealer: ["Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N", "N"] },
    { player: "5,5", dealer: ["N", "N", "N", "N", "N", "N", "N", "N", "N", "N"] },
    { player: "4,4", dealer: ["N", "N", "N", "Y", "Y", "N", "N", "N", "N", "N"] },
    { player: "3,3", dealer: ["Y", "Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N"] },
    { player: "2,2", dealer: ["Y", "Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N"] },
  ]

  const dealerHeaders = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"]

  const getActionColor = (action: string) => {
    switch (action) {
      case "H":
        return "bg-red-500 text-white hover:bg-red-600"
      case "S":
        return "bg-green-500 text-white hover:bg-green-600"
      case "D":
        return "bg-blue-500 text-white hover:bg-blue-600"
      case "R":
        return "bg-yellow-500 text-black hover:bg-yellow-600"
      case "Y":
        return "bg-green-500 text-white hover:bg-green-600"
      case "N":
        return "bg-red-500 text-white hover:bg-red-600"
      default:
        return "bg-gray-500 text-white hover:bg-gray-600"
    }
  }

  const StrategyChart = ({ data, title }: { data: any[]; title: string }) => (
    <div className="overflow-x-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 text-gray-900 p-3 font-bold">Player</th>
            {dealerHeaders.map((header) => (
              <th key={header} className="border border-gray-300 bg-gray-100 text-gray-900 p-3 text-sm font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border border-gray-300 bg-gray-50 text-gray-900 p-3 font-bold text-sm">{row.player}</td>
              {row.dealer.map((action: string, colIndex: number) => (
                <td key={colIndex} className="border border-gray-300 p-2 text-center">
                  <div className={`rounded-lg p-2 text-sm font-bold transition-all ${getActionColor(action)}`}>
                    {action}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3">
            <Spade className="h-8 w-8 text-white" fill="white" />
            <h1 className="text-3xl font-bold text-white">Strategy Guide</h1>
          </div>
          <div className="w-32" />
        </div>

        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger
              value="charts"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Strategy Charts
            </TabsTrigger>
            <TabsTrigger
              value="basics"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Basic Rules
            </TabsTrigger>
            <TabsTrigger
              value="sidebets"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Side Bets
            </TabsTrigger>
            <TabsTrigger
              value="terms"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Terminology
            </TabsTrigger>
            <TabsTrigger
              value="tips"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Pro Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-8">
            <Card className="bg-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Basic Strategy Charts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-4 mb-6">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded"></div>
                      <span className="text-gray-700">H = Hit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded"></div>
                      <span className="text-gray-700">S = Stand</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded"></div>
                      <span className="text-gray-700">D = Double</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                      <span className="text-gray-700">R = Surrender</span>
                    </div>
                  </div>
                </div>

                <StrategyChart data={hardTotals} title="Hard Totals" />
                <StrategyChart data={softTotals} title="Soft Totals" />
                <StrategyChart data={pairs} title="Pairs (Y = Split, N = Don't Split)" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="basics">
            <Card className="bg-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Basic Blackjack Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Objective</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Get as close to 21 as possible without going over</li>
                      <li>• Beat the dealer's hand</li>
                      <li>• Blackjack (21 with first 2 cards) pays 3:2</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Card Values</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Number cards: Face value (2-10)</li>
                      <li>• Face cards: 10 points each</li>
                      <li>• Aces: 1 or 11 (whichever is better)</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Dealer Rules</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Must hit on 16 or less</li>
                      <li>• Must stand on 17 or more</li>
                      <li>• Hits on soft 17 (A,6)</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Player Options</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Hit: Take another card</li>
                      <li>• Stand: Keep current total</li>
                      <li>• Double: Double bet, take one card</li>
                      <li>• Split: Split pairs into two hands</li>
                      <li>• Surrender: Give up half your bet</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sidebets">
            <Card className="bg-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Side Bets Guide</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Important Note</h4>
                  <p className="text-gray-700 text-sm">
                    Side bets have higher house edges than the main blackjack game. They're designed for entertainment
                    and should be played responsibly. The house edge on side bets typically ranges from 3% to 25%.
                  </p>
                </div>
                {/* Side bet details would continue here */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card className="bg-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Blackjack Terminology</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">Hard Hand</h4>
                      <p className="text-sm">A hand without an Ace, or with an Ace counted as 1</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">Soft Hand</h4>
                      <p className="text-sm">A hand with an Ace counted as 11</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">Bust</h4>
                      <p className="text-sm">Going over 21 points</p>
                    </div>
                  </div>
                  {/* More terms would continue here */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips">
            <Card className="bg-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Professional Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Strategy Tips</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Always follow basic strategy charts</li>
                      <li>• Never take insurance</li>
                      <li>• Always split Aces and 8s</li>
                      <li>• Never split 10s or 5s</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Money Management</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Set a budget and stick to it</li>
                      <li>• Never chase losses</li>
                      <li>• Take breaks regularly</li>
                      <li>• Know when to walk away</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
