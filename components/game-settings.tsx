"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Spade } from "lucide-react"

interface GameSettingsProps {
  onBack: () => void
}

export default function GameSettings({ onBack }: GameSettingsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 p-4">
      <div className="container mx-auto max-w-4xl">
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
            <h1 className="text-3xl font-bold text-white">Game Rules</h1>
          </div>
          <div className="w-32" />
        </div>

        <Card className="bg-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Current Game Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-gray-700">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Deck Rules</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • <strong>Number of Decks:</strong> 6 (Standard Casino)
                    </li>
                    <li>
                      • <strong>Blackjack Payout:</strong> 3:2 (Traditional)
                    </li>
                    <li>
                      • <strong>Reshuffle:</strong> When &lt; 20 cards remain
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Dealer Rules</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • <strong>Dealer Hits Soft 17:</strong> Yes
                    </li>
                    <li>
                      • <strong>Dealer Peeks:</strong> Yes (for Blackjack)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Player Options</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • <strong>Surrender:</strong> Allowed (Early)
                    </li>
                    <li>
                      • <strong>Double After Split:</strong> Allowed
                    </li>
                    <li>
                      • <strong>Resplit Aces:</strong> Allowed
                    </li>
                    <li>
                      • <strong>Maximum Split Hands:</strong> 4
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Side Bets</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • <strong>Available in:</strong> Real Money Mode only
                    </li>
                    <li>
                      • <strong>Types:</strong> Perfect Pairs, 21+3, Lucky Ladies, Royal Match, Match Dealer
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* House Edge Information */}
        <Card className="bg-blue-50 border border-blue-200 mt-6">
          <CardHeader>
            <CardTitle className="text-blue-900">House Edge Information</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <p className="mb-4">
              <strong>Estimated House Edge: ~0.28%</strong> (with optimal basic strategy)
            </p>
            <p className="text-sm">
              These rules are player-friendly and represent optimal casino conditions. The low house edge is achieved
              through: 3:2 blackjack payouts, surrender allowed, double after split, resplit aces, and dealer hits soft
              17. Practice Mode will help you learn optimal strategy to achieve this theoretical house edge.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
