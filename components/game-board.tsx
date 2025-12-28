"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RotateCcw, Info, CheckCircle, XCircle, Target, DollarSign, Coins } from "lucide-react"
import { createDeck, shuffleDeck, dealCard, calculateHandValue, getBasicStrategy } from "@/lib/blackjack-logic"
import type { Card as PlayingCard, GameState, Hand, SideBet, SessionStats, ActionFeedback } from "@/lib/types"

interface GameBoardProps {
  mode: "real" | "practice" | "testing"
  onExit: () => void
  initialBankroll?: number // Added initialBankroll prop
}

type DealerScore = { total: number; isSoft: boolean }

// Helper: compute total + soft flag (needed for soft-17 rule and soft detection)
function valueWithSoft(cards: PlayingCard[]): DealerScore {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === "A") {
      aces += 1
      total += 1
    } else {
      total += c.value
    }
  }
  let isSoft = false
  if (aces > 0 && total + 10 <= 21) {
    total += 10
    isSoft = true
  }
  return { total, isSoft }
}

// Soft hand detector for player strategy determination
function isSoftHand(cards: PlayingCard[]): boolean {
  const v = valueWithSoft(cards)
  return v.isSoft
}

export default function GameBoard({ mode, onExit, initialBankroll = 1000 }: GameBoardProps) {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHands: [],
    dealerHand: [],
    currentHandIndex: 0,
    dealerScore: 0,
    gamePhase: "betting",
    message: "Choose your bet amount to start",
    bankroll: initialBankroll, // Use initialBankroll prop
    pendingBets: 0,
    mainBet: 0,
    sideBets: [],
    canSurrender: false,
    mode,
  })

  const [customBetAmount, setCustomBetAmount] = useState("")
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    handsPlayed: 0,
    handsWon: 0,
    handsLost: 0,
    handsPushed: 0,
    totalMoves: 0,
    strategyDecisions: 0,
    strategyCorrect: 0,
    strategyStreak: 0,
  })

  const [actionFeedback, setActionFeedback] = useState<ActionFeedback>({
    isCorrect: false,
    playerAction: "",
    recommendedAction: "",
    reason: "",
    show: false,
  })

  const [lastDecisionState, setLastDecisionState] = useState<string>("")
  const [gameOver, setGameOver] = useState(false)

  const [handDecisions, setHandDecisions] = useState(0)
  const handDecisionsRef = useRef(0)
  const [handCorrect, setHandCorrect] = useState(0)
  const handCorrectRef = useRef(0)

  // Store initial stats from database
  const initialStatsRef = useRef<{
    bankroll: number
    hands_played: number
    hands_won: number
    hands_lost: number
    hands_pushed: number
    total_moves: number
    strategy_decisions: number
    strategy_correct: number
    strategy_streak: number
  } | null>(null)

  // Debounce timer for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetHandCounters = () => {
    setHandDecisions(0)
    handDecisionsRef.current = 0
    setHandCorrect(0)
    handCorrectRef.current = 0
  }

  // Save game stats to database (only in real mode)
  const saveGameStats = async () => {
    if (mode !== "real") {
      console.log("[Stats] Skipping save - not in real mode")
      return
    }

    console.log("[Stats] Attempting to save game stats...")
    console.log("[Stats] Bankroll:", gameState.bankroll)
    console.log("[Stats] Session stats:", sessionStats)

    const { updateGameStats } = await import("@/lib/actions/game-stats")

    // Calculate cumulative stats (initial + session)
    const initial = initialStatsRef.current || {
      bankroll: initialBankroll,
      hands_played: 0,
      hands_won: 0,
      hands_lost: 0,
      hands_pushed: 0,
      total_moves: 0,
      strategy_decisions: 0,
      strategy_correct: 0,
      strategy_streak: 0,
    }

    const cumulativeStats = {
      bankroll: gameState.bankroll,
      hands_played: initial.hands_played + sessionStats.handsPlayed,
      hands_won: initial.hands_won + sessionStats.handsWon,
      hands_lost: initial.hands_lost + sessionStats.handsLost,
      hands_pushed: initial.hands_pushed + sessionStats.handsPushed,
      total_moves: initial.total_moves + sessionStats.totalMoves,
      strategy_decisions: initial.strategy_decisions + sessionStats.strategyDecisions,
      strategy_correct: initial.strategy_correct + sessionStats.strategyCorrect,
      strategy_streak: sessionStats.strategyStreak > initial.strategy_streak 
        ? sessionStats.strategyStreak 
        : initial.strategy_streak,
    }

    console.log("[Stats] Cumulative stats to save:", cumulativeStats)

    try {
      const result = await updateGameStats(cumulativeStats)
      if (result.success) {
        console.log("[Stats] ✅ Successfully saved game stats!")
      } else {
        console.error("[Stats] ❌ Failed to save game stats:", result.error)
      }
    } catch (error) {
      console.error("[Stats] ❌ Error saving game stats:", error)
    }
  }

  // Debounced auto-save function
  const autoSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveGameStats()
    }, 2000) // Save 2 seconds after last change
  }

  // Load initial stats from database on mount (only in real mode)
  useEffect(() => {
    if (mode === "real") {
      const loadInitialStats = async () => {
        const { getGameStats } = await import("@/lib/actions/game-stats")
        const result = await getGameStats()
        
        if (result.stats) {
          initialStatsRef.current = {
            bankroll: result.stats.bankroll || initialBankroll,
            hands_played: result.stats.hands_played || 0,
            hands_won: result.stats.hands_won || 0,
            hands_lost: result.stats.hands_lost || 0,
            hands_pushed: result.stats.hands_pushed || 0,
            total_moves: result.stats.total_moves || 0,
            strategy_decisions: result.stats.strategy_decisions || 0,
            strategy_correct: result.stats.strategy_correct || 0,
            strategy_streak: result.stats.strategy_streak || 0,
          }
          // Update bankroll to match database
          setGameState((prev) => ({
            ...prev,
            bankroll: initialStatsRef.current!.bankroll,
          }))
        } else {
          // No stats yet, use defaults
          initialStatsRef.current = {
            bankroll: initialBankroll,
            hands_played: 0,
            hands_won: 0,
            hands_lost: 0,
            hands_pushed: 0,
            total_moves: 0,
            strategy_decisions: 0,
            strategy_correct: 0,
            strategy_streak: 0,
          }
        }
      }
      loadInitialStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    initializeGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save on bankroll changes (debounced)
  useEffect(() => {
    if (mode === "real") {
      autoSave()
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.bankroll, mode])

  // Auto-save on session stats changes (debounced)
  useEffect(() => {
    if (mode === "real") {
      autoSave()
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sessionStats.handsPlayed,
    sessionStats.handsWon,
    sessionStats.handsLost,
    sessionStats.handsPushed,
    sessionStats.totalMoves,
    sessionStats.strategyDecisions,
    sessionStats.strategyCorrect,
    sessionStats.strategyStreak,
    mode,
  ])

  // Save immediately when game phase finishes
  useEffect(() => {
    if (mode === "real" && gameState.gamePhase === "finished") {
      saveGameStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gamePhase, mode])

  // Save on component unmount (when user exits)
  useEffect(() => {
    return () => {
      if (mode === "real") {
        saveGameStats()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const getAvailableMoney = () => {
    if (mode === "practice" || mode === "testing") return 999999
    return gameState.bankroll - gameState.pendingBets
  }

  const getTotalSideBets = () => gameState.sideBets.reduce((sum, b) => sum + b.amount, 0)
  const getCurrentHand = () => gameState.playerHands[gameState.currentHandIndex]

  const initializeGame = () => {
    const newDeck = shuffleDeck(createDeck(6))
    setGameState((prev) => ({
      ...prev,
      deck: newDeck,
      playerHands: [],
      dealerHand: [],
      currentHandIndex: 0,
      gamePhase: mode === "testing" ? "playing" : "betting",
      message: mode === "testing" ? "New hand dealt - choose your action" : "Choose your bet amount to start",
      mainBet: mode === "testing" ? 10 : 0,
      sideBets: [],
      canSurrender: false,
      pendingBets: mode === "testing" ? 10 : 0,
      dealerScore: 0,
    }))
    setCustomBetAmount("")
    setActionFeedback({ isCorrect: false, playerAction: "", recommendedAction: "", reason: "", show: false })
    setLastDecisionState("")
    setGameOver(false)
    resetHandCounters()

    if (mode === "testing") {
      setTimeout(() => dealCards(), 100)
    }
  }

  const processTestingFeedback = (playerAction: string) => {
    if (mode !== "testing") return
    const current = getCurrentHand()
    if (!current) return
    if (gameState.gamePhase !== "playing") return

    if (actionFeedback.show) {
      setActionFeedback((prev) => ({ ...prev, show: false }))
    }

    const dealerUpRank = gameState.dealerHand[0]?.rank ?? "?"
    const decisionState = [
      gameState.currentHandIndex,
      current.cards.length,
      current.value,
      dealerUpRank,
      current.canDouble ? 1 : 0,
      gameState.canSurrender ? 1 : 0,
      playerAction,
    ].join("-")

    if (decisionState === lastDecisionState) return

    const playerTotal = current.value
    const dealerUpCard = gameState.dealerHand[0]?.value || 0
    const soft = isSoftHand(current.cards)
    const isPair = current.cards.length === 2 && current.cards[0].rank === current.cards[1].rank

    const recommendation = getBasicStrategy(
      playerTotal,
      dealerUpCard,
      soft,
      isPair,
      current.canDouble,
      gameState.canSurrender,
    )
    const isCorrect = playerAction === recommendation.action

    setActionFeedback({
      isCorrect,
      playerAction,
      recommendedAction: recommendation.action,
      reason: recommendation.reason,
      show: true,
    })
    setLastDecisionState(decisionState)

    setHandDecisions((n) => {
      const next = n + 1
      handDecisionsRef.current = next
      return next
    })
    if (isCorrect) {
      setHandCorrect((n) => {
        const next = n + 1
        handCorrectRef.current = next
        return next
      })
    }

    setSessionStats((prev) => ({
      ...prev,
      strategyDecisions: prev.strategyDecisions + 1,
      strategyCorrect: prev.strategyCorrect + (isCorrect ? 1 : 0),
      strategyStreak: isCorrect ? prev.strategyStreak + 1 : 0,
    }))
  }

  const endGame = (result: string, finalDealerHand?: PlayingCard[], handsSnapshot?: Hand[]) => {
    const hands = handsSnapshot || gameState.playerHands
    const dealerHandToUse = finalDealerHand || gameState.dealerHand
    if (result === "surrender") return

    const dealerScore = valueWithSoft(dealerHandToUse)
    const finalDealerValue = dealerScore.total
    const dealerIsBlackjack = finalDealerValue === 21 && dealerHandToUse.length === 2

    let mainBetProfit = 0
    let sideBetProfit = 0
    let handsWon = 0
    let handsLost = 0
    let handsPushed = 0

    hands.forEach((hand) => {
      const finalPlayerValue = calculateHandValue(hand.cards)
      const playerIsBlackjack = hand.isBlackjack || (finalPlayerValue === 21 && hand.cards.length === 2)
      const { result: handResult, profit } = determineHandOutcome(
        finalPlayerValue,
        finalDealerValue,
        playerIsBlackjack,
        dealerIsBlackjack,
        hand.bet,
      )
      mainBetProfit += profit
      if (handResult === "win") handsWon++
      else if (handResult === "loss") handsLost++
      else handsPushed++
    })

    if (mode === "real") {
      gameState.sideBets.forEach((bet) => {
        if (bet.result === "win" && bet.payout) sideBetProfit += bet.payout - bet.amount
        else sideBetProfit -= bet.amount
      })
    }

    const totalProfit = mainBetProfit + sideBetProfit

    let message = ""
    if (mode === "testing") {
      const decisions = handDecisionsRef.current
      const correct = handCorrectRef.current
      const accuracyPct = decisions > 0 ? Math.round((correct / decisions) * 100) : 0

      const isSingleHand = hands.length === 1
      const firstHand = isSingleHand ? hands[0] : undefined
      const isNaturalBJSingle =
        isSingleHand &&
        !!firstHand &&
        (firstHand.isBlackjack === true || (firstHand.cards.length === 2 && calculateHandValue(firstHand.cards) === 21))

      if (result === "immediate-finish") {
        message = isNaturalBJSingle ? "Blackjack!" : "Dealer Blackjack!"
      } else if (decisions === 0) {
        if (isSingleHand) {
          if (isNaturalBJSingle) {
            message = "Blackjack!"
          } else if (mainBetProfit > 0) {
            message = "Win. No decisions this hand."
          } else if (mainBetProfit < 0) {
            message = "Loss. No decisions this hand."
          } else {
            message = "Push. No decisions this hand."
          }
        } else {
          message = "No decisions taken across split hands."
        }
      } else if (accuracyPct === 100) {
        if (totalProfit > 0) {
          message = `Perfect decisions led to a win (${correct}/${decisions}, 100%). Well played!`
        } else if (totalProfit < 0) {
          message = `Perfect decisions, just bad luck (${correct}/${decisions}, 100%).`
        } else {
          message = `Perfect decisions (${correct}/${decisions}, 100%).`
        }
      } else if (accuracyPct >= 80) {
        if (totalProfit > 0) {
          message = `Strong play (${correct}/${decisions}, ${accuracyPct}%).`
        } else if (totalProfit < 0) {
          message = `Good accuracy (${correct}/${decisions}, ${accuracyPct}%). Keep practicing.`
        } else {
          message = `Good accuracy (${correct}/${decisions}, ${accuracyPct}%).`
        }
      } else if (accuracyPct >= 50) {
        if (totalProfit > 0) {
          message = `Mixed decisions (${correct}/${decisions}, ${accuracyPct}%) — win leaned on luck.`
        } else if (totalProfit < 0) {
          message = `Mixed decisions (${correct}/${decisions}, ${accuracyPct}%). Study key spots.`
        } else {
          message = `Mixed decisions (${correct}/${decisions}, ${accuracyPct}%).`
        }
      } else {
        if (totalProfit > 0) {
          message = `Low accuracy, but lucky win (${correct}/${decisions}, ${accuracyPct}%).`
        } else if (totalProfit < 0) {
          message = `Low accuracy led to a loss (${correct}/${decisions}, ${accuracyPct}%).`
        } else {
          message = `Low accuracy (${correct}/${decisions}, ${accuracyPct}%).`
        }
      }
    } else {
      if (totalProfit > 0) {
        message = `You win! +$${totalProfit}`
      } else if (totalProfit < 0) {
        message = `You lose. -$${Math.abs(totalProfit)}`
      } else {
        message = hands.length > 1 ? "Split hands balanced out. $0" : "Push! $0"
      }
    }

    const newBankroll = mode === "testing" ? gameState.bankroll : gameState.bankroll + totalProfit

    setGameState((prev) => ({
      ...prev,
      bankroll: newBankroll,
      pendingBets: 0,
      message,
      dealerScore: valueWithSoft(dealerHandToUse).total,
    }))

    setSessionStats((prev) => ({
      ...prev,
      handsPlayed: prev.handsPlayed + hands.length,
      handsWon: prev.handsWon + handsWon,
      handsLost: prev.handsLost + handsLost,
      handsPushed: prev.handsPushed + handsPushed,
    }))

    resetHandCounters()

    if (mode === "real" && newBankroll <= 0) {
      setGameOver(true)
    }
  }

  const placeBet = (amount: number) => {
    if (mode !== "testing" && (amount > getAvailableMoney() || amount <= 0)) return

    setGameState((prev) => ({
      ...prev,
      mainBet: mode === "testing" ? 10 : amount,
      pendingBets: mode === "testing" ? 10 : amount,
      gamePhase: mode === "practice" || mode === "testing" ? "playing" : "sideBets",
      message: mode === "practice" || mode === "testing" ? "Choose your action" : "Place side bets or deal cards",
    }))

    if (mode === "practice" || mode === "testing") {
      setTimeout(() => dealCards(), 100)
    }
  }

  const placeSideBet = (type: SideBet["type"], amount: number) => {
    if (mode !== "real" || type !== "perfectPairs") return
    if (amount > getAvailableMoney() || amount <= 0) return
    const previous = gameState.sideBets.find((b) => b.type === type)
    const addPending = amount - (previous?.amount || 0)
    setGameState((prev) => ({
      ...prev,
      sideBets: [...prev.sideBets.filter((b) => b.type !== type), { type, amount }],
      pendingBets: prev.pendingBets + addPending,
    }))
  }

  const removeSideBet = (type: SideBet["type"]) => {
    if (mode !== "real") return
    const removed = gameState.sideBets.find((b) => b.type === type)
    if (!removed) return
    setGameState((prev) => ({
      ...prev,
      sideBets: prev.sideBets.filter((b) => b.type !== type),
      pendingBets: prev.pendingBets - removed.amount,
    }))
  }

  const dealCards = () => {
    setGameState((prev) => {
      let deck = [...prev.deck]
      if (deck.length < 20) {
        deck = shuffleDeck(createDeck(6))
      }

      const playerHand: PlayingCard[] = []
      const dealerHand: PlayingCard[] = []

      playerHand.push(dealCard(deck))
      dealerHand.push(dealCard(deck))
      playerHand.push(dealCard(deck))
      dealerHand.push(dealCard(deck))

      const playerScore = calculateHandValue(playerHand)
      const dealerFullScore = valueWithSoft(dealerHand).total

      const playerIsBlackjack = playerScore === 21
      const dealerIsBlackjack = dealerFullScore === 21 && dealerHand.length === 2

      const initialHand: Hand = {
        cards: playerHand,
        value: playerScore,
        bet: prev.mainBet,
        isComplete: dealerIsBlackjack || playerIsBlackjack,
        canDouble: !dealerIsBlackjack && !playerIsBlackjack,
        canSplit: !dealerIsBlackjack && !playerIsBlackjack && playerHand[0].rank === playerHand[1].rank,
        isBlackjack: playerIsBlackjack,
      }

      let processedSideBets: SideBet[] = []
      if (mode === "real") {
        processedSideBets = prev.sideBets
          .filter((s) => s.type === "perfectPairs")
          .map((sideBet) => {
            const result = evaluateSideBet(sideBet.type, playerHand, dealerHand[0], sideBet.amount)
            return {
              ...sideBet,
              result: result.win ? ("win" as const) : ("lose" as const),
              payout: result.payout,
            }
          })
      }

      if (dealerIsBlackjack || playerIsBlackjack) {
        const nextState: GameState = {
          ...prev,
          deck,
          playerHands: [initialHand],
          dealerHand,
          dealerScore: dealerFullScore,
          gamePhase: "finished",
          message: dealerIsBlackjack ? "Dealer Blackjack!" : "Player Blackjack!",
          sideBets: processedSideBets,
          canSurrender: false,
        }

        setTimeout(() => endGame("immediate-finish", dealerHand, [initialHand]), mode === "testing" ? 0 : 1000)

        return nextState
      }

      return {
        ...prev,
        deck,
        playerHands: [initialHand],
        dealerHand,
        dealerScore: dealerFullScore,
        currentHandIndex: 0,
        gamePhase: "playing",
        message: "Choose your action",
        canSurrender: true,
        sideBets: processedSideBets,
      }
    })
  }

  const evaluateSideBet = (
    type: SideBet["type"],
    playerHand: PlayingCard[],
    dealerUpCard: PlayingCard,
    betAmount: number,
  ) => {
    switch (type) {
      case "perfectPairs": {
        if (playerHand[0].rank === playerHand[1].rank) {
          if (playerHand[0].suit === playerHand[1].suit) return { win: true, payout: betAmount + betAmount * 25 }
          const isBothBlackOrBothRed =
            (playerHand[0].suit === "♠" || playerHand[0].suit === "♣") ===
            (playerHand[1].suit === "♠" || playerHand[1].suit === "♣")
          if (isBothBlackOrBothRed) return { win: true, payout: betAmount + betAmount * 12 }
          return { win: true, payout: betAmount + betAmount * 6 }
        }
        return { win: false, payout: 0 }
      }
      default:
        return { win: false, payout: 0 }
    }
  }

  const hit = () => {
    if (gameState.gamePhase !== "playing") return
    const current = getCurrentHand()
    if (!current || current.isComplete) return // Prevent hitting on completed hands

    processTestingFeedback("Hit")

    setGameState((prev) => {
      let deck = [...prev.deck]
      if (deck.length < 5) {
        deck = shuffleDeck(createDeck(6))
      }

      const newPlayerHands = [...prev.playerHands]
      const idx = prev.currentHandIndex
      const hand = { ...newPlayerHands[idx] }

      hand.cards = [...hand.cards, dealCard(deck)]
      hand.value = calculateHandValue(hand.cards)
      hand.canDouble = false
      hand.canSplit = false

      if (hand.value >= 21) {
        hand.isComplete = true
      }

      newPlayerHands[idx] = hand

      return {
        ...prev,
        deck,
        playerHands: newPlayerHands,
        canSurrender: false,
      }
    })

    setSessionStats((prev) => ({ ...prev, totalMoves: prev.totalMoves + 1 }))

    setTimeout(() => {
      const handNow = getCurrentHand()
      if (handNow && handNow.isComplete) {
        moveToNextHand()
      }
    }, 0)
  }

  const stand = () => {
    if (gameState.gamePhase !== "playing") return
    const current = getCurrentHand()
    if (!current || current.isComplete) return // Prevent standing on completed hands

    processTestingFeedback("Stand")

    setGameState((prev) => {
      const newPlayerHands = [...prev.playerHands]
      newPlayerHands[prev.currentHandIndex] = { ...newPlayerHands[prev.currentHandIndex], isComplete: true }
      return { ...prev, playerHands: newPlayerHands, canSurrender: false }
    })

    setSessionStats((prev) => ({ ...prev, totalMoves: prev.totalMoves + 1 }))
    moveToNextHand()
  }

  const doubleDown = () => {
    const current = getCurrentHand()
    if (!current?.canDouble || current.isComplete) return // Added isComplete check
    if (gameState.gamePhase !== "playing") return
    if (mode !== "testing" && current.bet > getAvailableMoney()) return

    processTestingFeedback("Double")

    setGameState((prev) => {
      let deck = [...prev.deck]
      if (deck.length < 5) {
        deck = shuffleDeck(createDeck(6))
      }

      const newPlayerHands = [...prev.playerHands]
      const idx = prev.currentHandIndex
      const hand = { ...newPlayerHands[idx] }

      const originalBet = hand.bet
      hand.originalBet = originalBet
      hand.bet = originalBet * 2
      hand.isDoubled = true

      hand.cards = [...hand.cards, dealCard(deck)]
      hand.value = calculateHandValue(hand.cards)
      hand.isComplete = true
      hand.canDouble = false
      hand.canSplit = false

      newPlayerHands[idx] = hand

      const nextPending = mode === "testing" ? prev.pendingBets : prev.pendingBets + originalBet

      return {
        ...prev,
        deck,
        playerHands: newPlayerHands,
        canSurrender: false,
        pendingBets: nextPending,
      }
    })

    setSessionStats((prev) => ({ ...prev, totalMoves: prev.totalMoves + 1 }))
    moveToNextHand()
  }

  const split = () => {
    const current = getCurrentHand()
    if (!current?.canSplit || current.isComplete) return // Added isComplete check
    if (gameState.gamePhase !== "playing") return
    if (mode !== "testing" && current.bet > getAvailableMoney()) return

    processTestingFeedback("Split")

    setGameState((prev) => {
      let deck = [...prev.deck]
      if (deck.length < 10) {
        deck = shuffleDeck(createDeck(6))
      }

      const newPlayerHands = [...prev.playerHands]
      const originalHand = { ...current }

      const mkHand = (card: PlayingCard): Hand => ({
        cards: [card],
        value: calculateHandValue([card]),
        bet: originalHand.bet,
        isComplete: false,
        canDouble: true,
        canSplit: false,
      })

      const firstHand = mkHand(originalHand.cards[0])
      const secondHand = mkHand(originalHand.cards[1])

      firstHand.cards.push(dealCard(deck))
      secondHand.cards.push(dealCard(deck))

      firstHand.value = calculateHandValue(firstHand.cards)
      secondHand.value = calculateHandValue(secondHand.cards)

      const allowFurtherSplit = (cards: PlayingCard[]) =>
        cards.length === 2 && cards[0].rank === cards[1].rank && newPlayerHands.length < 4

      firstHand.canSplit = allowFurtherSplit(firstHand.cards)
      secondHand.canSplit = allowFurtherSplit(secondHand.cards)

      if (originalHand.cards[0].rank === "A") {
        firstHand.isComplete = true
        secondHand.isComplete = true
        firstHand.canDouble = false
        secondHand.canDouble = false
        firstHand.canSplit = false
        secondHand.canSplit = false
      } else {
        if (firstHand.value === 21) {
          firstHand.isComplete = true
          firstHand.canDouble = false
          firstHand.canSplit = false
        }
        if (secondHand.value === 21) {
          secondHand.isComplete = true
          secondHand.canDouble = false
          secondHand.canSplit = false
        }
      }

      newPlayerHands.splice(prev.currentHandIndex, 1, firstHand, secondHand)

      const nextPending = mode === "testing" ? prev.pendingBets : prev.pendingBets + originalHand.bet

      return {
        ...prev,
        deck,
        playerHands: newPlayerHands,
        message: "Playing split hand 1",
        canSurrender: false,
        pendingBets: nextPending,
      }
    })

    setSessionStats((prev) => ({ ...prev, totalMoves: prev.totalMoves + 1 }))
    moveToNextHand()
  }

  const surrender = () => {
    if (!gameState.canSurrender) return
    processTestingFeedback("Surrender")
    setSessionStats((prev) => ({ ...prev, totalMoves: prev.totalMoves + 1 }))

    const loss = gameState.mainBet / 2

    setGameState((prev) => ({
      ...prev,
      bankroll: mode === "testing" ? prev.bankroll : prev.bankroll - loss,
      pendingBets: 0,
      message: mode === "testing" ? "Surrendered" : `Surrendered. -$${loss}`,
      gamePhase: "finished",
      dealerScore: valueWithSoft(prev.dealerHand).total,
    }))

    setSessionStats((prev) => ({
      ...prev,
      handsPlayed: prev.handsPlayed + 1,
      handsLost: prev.handsLost + 1,
    }))
  }

  const moveToNextHand = () => {
    setTimeout(() => {
      setGameState((prev) => {
        let nextHandIndex = prev.currentHandIndex

        if (prev.playerHands[nextHandIndex]?.isComplete) {
          nextHandIndex++
          while (nextHandIndex < prev.playerHands.length && prev.playerHands[nextHandIndex].isComplete) {
            nextHandIndex++
          }
        }

        if (nextHandIndex < prev.playerHands.length) {
          return {
            ...prev,
            currentHandIndex: nextHandIndex,
            message: `Playing hand ${nextHandIndex + 1}`,
          }
        } else {
          const allHandsBusted = prev.playerHands.every((hand) => calculateHandValue(hand.cards) > 21)
          if (allHandsBusted) {
            const dealerTotal = valueWithSoft(prev.dealerHand).total
            const snapshotHands = [...prev.playerHands]
            const snapshotDealer = [...prev.dealerHand]

            setTimeout(() => endGame("all-busted", snapshotDealer, snapshotHands), mode === "testing" ? 0 : 500)

            return {
              ...prev,
              gamePhase: "finished",
              dealerScore: dealerTotal,
              message: "All hands busted",
            }
          } else {
            setTimeout(() => dealerPlay(), 0)
            return {
              ...prev,
              gamePhase: "finished",
              message: "Dealer playing...",
            }
          }
        }
      })
    }, 100)
  }

  const dealerPlay = () => {
    const snapshotDealer = [...gameState.dealerHand]
    let snapshotDeck = [...gameState.deck]

    if (snapshotDeck.length < 10) {
      snapshotDeck = shuffleDeck(createDeck(6))
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const v = valueWithSoft(snapshotDealer)
      if (v.total < 17 || (v.total === 17 && v.isSoft)) {
        snapshotDealer.push(dealCard(snapshotDeck))
        continue
      }
      break
    }

    const finalDealerScore = valueWithSoft(snapshotDealer).total
    const snapshotHands = [...gameState.playerHands]

    setGameState((prev) => ({
      ...prev,
      deck: snapshotDeck,
      dealerHand: snapshotDealer,
      dealerScore: finalDealerScore,
      gamePhase: "finished",
    }))

    setTimeout(() => endGame("dealer-complete", snapshotDealer, snapshotHands), mode === "testing" ? 0 : 1000)
  }

  const determineHandOutcome = (
    playerValue: number,
    dealerValue: number,
    playerIsBlackjack: boolean,
    dealerIsBlackjack: boolean,
    bet: number,
  ) => {
    if (playerValue > 21) return { result: "loss" as const, profit: -bet }
    if (dealerValue > 21) return { result: "win" as const, profit: bet }
    if (playerIsBlackjack && dealerIsBlackjack) return { result: "push", profit: 0 }
    if (playerIsBlackjack && !dealerIsBlackjack) return { result: "win", profit: Math.floor(bet * 1.5) }
    if (dealerIsBlackjack && !playerIsBlackjack) return { result: "loss", profit: -bet }
    if (playerValue === dealerValue) return { result: "push", profit: 0 }
    if (playerValue > dealerValue) return { result: "win", profit: bet }
    return { result: "loss", profit: -bet }
  }

  const getStrategyRecommendation = () => {
    if (mode !== "practice" || gameState.gamePhase !== "playing") return null
    const current = getCurrentHand()
    if (!current) return null

    const playerTotal = current.value
    const dealerUpCard = gameState.dealerHand[0]?.value || 0
    const soft = isSoftHand(current.cards)
    const isPair = current.cards.length === 2 && current.cards[0].rank === current.cards[1].rank

    return getBasicStrategy(playerTotal, dealerUpCard, soft, isPair, current.canDouble, gameState.canSurrender)
  }

  const getModeConfig = () => {
    switch (mode) {
      case "real":
        return {
          title: "Real Money Simulator",
          variant: "destructive" as const,
          showHints: false,
          showFeedback: false,
          allowSideBets: true,
        }
      case "practice":
        return {
          title: "Practice Mode",
          variant: "secondary" as const,
          showHints: true,
          showFeedback: false,
          allowSideBets: false,
        }
      case "testing":
        return {
          title: "Testing Mode",
          variant: "default" as const,
          showHints: false,
          showFeedback: true,
          allowSideBets: false,
        }
      default:
        return { title: "", variant: "outline" as const, showHints: false, showFeedback: false, allowSideBets: false }
    }
  }

  const modeConfig = getModeConfig()
  const strategyRecommendation = getStrategyRecommendation()
  const currentHand = getCurrentHand()
  const decidedHands = sessionStats.handsWon + sessionStats.handsLost
  const winRate = decidedHands > 0 ? Math.round((sessionStats.handsWon / decidedHands) * 100) : 0

  if (gameOver && mode === "real") {
    return (
      <div className="min-h-screen casino-felt p-4 flex items-center justify-center">
        <Card className="casino-card max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">Game Over</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white text-lg">You're out of money!</p>
            <div className="space-y-2 text-green-200">
              <p>Hands Played: {sessionStats.handsPlayed}</p>
              <p>Win Rate: {winRate}%</p>
            </div>
            <div className="space-y-2">
              <Button onClick={initializeGame} className="casino-button w-full">
                Start New Game
              </Button>
              <Button onClick={onExit} variant="outline" className="casino-button bg-transparent w-full">
                Exit to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen casino-felt p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onExit} className="casino-button bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Game
          </Button>
          <div className="text-center">
            <Badge variant={modeConfig.variant} className="text-lg px-4 py-1 casino-gold">
              {modeConfig.title}
            </Badge>
          </div>
          {mode !== "testing" && (
            <div className="money-display rounded-lg p-3 text-right">
              <div className="text-sm opacity-75">Bankroll</div>
              <div className="text-xl font-bold flex items-center justify-end">
                <DollarSign className="h-5 w-5 mr-1" />
                {gameState.bankroll}
              </div>
              {gameState.pendingBets > 0 && (
                <div className="text-sm text-yellow-300 mt-1">At Risk: ${gameState.pendingBets}</div>
              )}
            </div>
          )}
          {mode === "testing" && <div className="w-24" />}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="dealer-area casino-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <Coins className="mr-2 h-5 w-5" />
                    Dealer
                  </span>
                  <span className="text-lg">{gameState.gamePhase === "playing" ? "?" : gameState.dealerScore}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {gameState.dealerHand.map((card, index) => (
                    <div
                      key={index}
                      className={`w-16 h-24 rounded-lg border-2 flex items-center justify-center text-sm font-bold casino-card ${
                        gameState.gamePhase === "playing" && index === 1
                          ? "bg-blue-900 border-blue-700 text-blue-300"
                          : card.suit === "♠" || card.suit === "♣"
                            ? "text-black"
                            : "text-red-600"
                      }`}
                    >
                      {gameState.gamePhase === "playing" && index === 1 ? "?" : `${card.rank}${card.suit}`}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {gameState.playerHands.map((hand, handIndex) => (
              <Card
                key={handIndex}
                className={`player-area casino-card ${
                  handIndex === gameState.currentHandIndex && gameState.gamePhase === "playing"
                    ? "ring-4 ring-yellow-400"
                    : ""
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    {gameState.playerHands.length > 1 ? `Hand ${handIndex + 1}` : "Your Hand"}
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${hand.value > 21 ? "text-red-400" : ""}`}>
                        {hand.value}
                        {hand.isBlackjack && <span className="text-yellow-400 ml-1">BJ</span>}
                      </span>
                      {mode !== "testing" && (
                        <div className="flex flex-col items-end">
                          <Badge
                            variant={hand.isDoubled ? "destructive" : "outline"}
                            className={`casino-chip ${hand.isDoubled ? "text-white" : "text-white border-white/20"}`}
                          >
                            ${hand.bet}
                            {hand.isDoubled && " (2x)"}
                          </Badge>
                          {hand.isDoubled && hand.originalBet && (
                            <span className="text-xs text-green-200 mt-1">Doubled from ${hand.originalBet}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {hand.cards.map((card, idx) => (
                      <div
                        key={idx}
                        className={`w-16 h-24 rounded-lg border-2 flex items-center justify-center text-sm font-bold casino-card ${
                          card.suit === "♠" || card.suit === "♣" ? "text-black" : "text-red-600"
                        }`}
                      >
                        {card.rank}
                        {card.suit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {mode === "testing" && actionFeedback.show && (
              <Card
                className={`casino-card border-4 ${actionFeedback.isCorrect ? "border-green-400" : "border-red-400"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {actionFeedback.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className={`font-bold ${actionFeedback.isCorrect ? "text-green-400" : "text-red-400"}`}>
                      {actionFeedback.isCorrect ? "Correct!" : "Incorrect"}
                    </span>
                  </div>
                  <div className="text-white text-sm">
                    <p>
                      You chose: <strong>{actionFeedback.playerAction}</strong>
                    </p>
                    {!actionFeedback.isCorrect && (
                      <p>
                        Recommended: <strong>{actionFeedback.recommendedAction}</strong>
                      </p>
                    )}
                    <p className="mt-1 text-green-200">{actionFeedback.reason}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="casino-card bg-gradient-to-br from-gray-800 to-gray-900">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <p className="text-white text-lg font-semibold">{gameState.message}</p>
                  {mode !== "testing" && gameState.mainBet > 0 && (
                    <div className="text-green-200 space-y-1 mt-2">
                      <div className="flex justify-center gap-4">
                        <div className="money-display rounded px-3 py-1">
                          <span className="text-sm">Main Bet: </span>
                          <span className="font-bold">${gameState.mainBet}</span>
                        </div>
                        {getTotalSideBets() > 0 && (
                          <div className="side-bet-area rounded px-3 py-1 text-amber-200">
                            <span className="text-sm">Side Bets: </span>
                            <span className="font-bold">${getTotalSideBets()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {gameState.gamePhase === "betting" && (
                  <div className="space-y-4">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => placeBet(amount)}
                          disabled={amount > getAvailableMoney()}
                          className="casino-button"
                        >
                          Bet ${amount}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-center items-center">
                      <Input
                        type="number"
                        placeholder="Custom amount"
                        value={customBetAmount}
                        onChange={(e) => setCustomBetAmount(e.target.value)}
                        className="w-32 bg-gray-800 border-yellow-600 text-white placeholder:text-white/50"
                        min="1"
                        max={getAvailableMoney()}
                      />
                      <Button
                        onClick={() => {
                          const amount = Number.parseInt(customBetAmount)
                          if (amount > 0 && amount <= getAvailableMoney()) {
                            placeBet(amount)
                          }
                        }}
                        disabled={
                          !customBetAmount ||
                          Number.parseInt(customBetAmount) <= 0 ||
                          Number.parseInt(customBetAmount) > getAvailableMoney()
                        }
                        className="casino-button bg-green-700 hover:bg-green-600"
                      >
                        Bet
                      </Button>
                    </div>
                  </div>
                )}

                {gameState.gamePhase === "sideBets" && modeConfig.allowSideBets && (
                  <div className="space-y-4">
                    <h3 className="text-white text-lg font-semibold text-center">Side Bets (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[{ type: "perfectPairs" as const, name: "Perfect Pairs", maxPayout: "25:1" }].map((sideBet) => {
                        const currentBet = gameState.sideBets.find((bet) => bet.type === sideBet.type)
                        return (
                          <div key={sideBet.type} className="side-bet-area p-3">
                            <div className="text-amber-200 text-sm font-medium">{sideBet.name}</div>
                            <div className="text-amber-300 text-xs">Max payout: {sideBet.maxPayout}</div>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {[5, 10, 25].map((amount) => (
                                <Button
                                  key={amount}
                                  size="sm"
                                  onClick={() => placeSideBet(sideBet.type, amount)}
                                  disabled={amount > getAvailableMoney()}
                                  className={`text-xs casino-button ${currentBet?.amount === amount ? "bg-yellow-600" : ""}`}
                                >
                                  ${amount}
                                </Button>
                              ))}
                              {currentBet && (
                                <Button
                                  size="sm"
                                  onClick={() => removeSideBet(sideBet.type)}
                                  className="bg-red-600 hover:bg-red-700 text-xs"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            {currentBet && (
                              <div className="text-yellow-200 text-xs mt-1">Bet: ${currentBet.amount}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-center">
                      <Button onClick={dealCards} className="casino-button bg-green-700 hover:bg-green-600">
                        Deal Cards
                      </Button>
                    </div>
                  </div>
                )}

                {gameState.gamePhase === "playing" && currentHand && !currentHand.isComplete && (
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button onClick={hit} className="casino-button bg-red-700 hover:bg-red-600">
                      Hit
                    </Button>
                    <Button onClick={stand} className="casino-button bg-yellow-700 hover:bg-yellow-600">
                      Stand
                    </Button>
                    {currentHand.canDouble && getAvailableMoney() >= currentHand.bet && (
                      <Button onClick={doubleDown} className="casino-button bg-purple-700 hover:bg-purple-600">
                        Double
                      </Button>
                    )}
                    {currentHand.canSplit && getAvailableMoney() >= currentHand.bet && (
                      <Button onClick={split} className="casino-button bg-orange-700 hover:bg-orange-600">
                        Split
                      </Button>
                    )}
                    {gameState.canSurrender && gameState.playerHands.length === 1 && (
                      <Button onClick={surrender} className="casino-button bg-gray-700 hover:bg-gray-600">
                        Surrender
                      </Button>
                    )}
                  </div>
                )}

                {gameState.gamePhase === "finished" && (
                  <div className="text-center">
                    <Button onClick={initializeGame} className="casino-button bg-green-700 hover:bg-green-600">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      New Hand
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {modeConfig.showHints && strategyRecommendation && gameState.gamePhase === "playing" && (
              <Card className="casino-card bg-blue-900/30 border-blue-400">
                <CardHeader>
                  <CardTitle className="text-blue-200 flex items-center">
                    <Info className="mr-2 h-4 w-4" />
                    Strategy Hint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-blue-800/30 border-blue-400/50">
                    <AlertDescription className="text-blue-100">
                      <strong>Recommended: {strategyRecommendation.action}</strong>
                      <br />
                      <span className="text-sm">{strategyRecommendation.reason}</span>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {mode === "testing" && (
              <Card className="casino-card bg-green-900/30 border-green-400">
                <CardHeader>
                  <CardTitle className="text-green-200 flex items-center">
                    <Target className="mr-2 h-4 w-4" />
                    Testing Scoreboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-white">
                    <span>Decisions:</span>
                    <span>{sessionStats.strategyDecisions}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Correct:</span>
                    <span>{sessionStats.strategyCorrect}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Accuracy:</span>
                    <span>
                      {sessionStats.strategyDecisions > 0
                        ? `${Math.round((sessionStats.strategyCorrect / sessionStats.strategyDecisions) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Streak:</span>
                    <span>{sessionStats.strategyStreak}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {gameState.sideBets.length > 0 &&
              gameState.gamePhase !== "betting" &&
              gameState.gamePhase !== "sideBets" && (
                <Card className="side-bet-area casino-card">
                  <CardHeader>
                    <CardTitle className="text-amber-200">Side Bet Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {gameState.sideBets.map((bet, index) => (
                      <div key={index} className="flex justify-between text-white">
                        <span className="capitalize">{bet.type.replace(/([A-Z])/g, " $1").trim()}:</span>
                        <span className={bet.result === "win" ? "text-green-400" : "text-red-400"}>
                          {bet.result === "win" ? `+$${bet.payout! - bet.amount}` : `-$${bet.amount}`}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            <Card className="money-display casino-card">
              <CardHeader>
                <CardTitle className="text-yellow-300">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-white">
                  <span>Hands Played:</span>
                  <span>{sessionStats.handsPlayed}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Hands Won:</span>
                  <span>{sessionStats.handsWon}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Hands Lost:</span>
                  <span>{sessionStats.handsLost}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Pushes:</span>
                  <span>{sessionStats.handsPushed}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Win Rate:</span>
                  <span>{winRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="casino-card bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Quick Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-green-200 text-sm space-y-1">
                <p>• Get as close to 21 as possible</p>
                <p>• Dealer hits on soft 17</p>
                <p>• Blackjack pays 3:2</p>
                <p>• Split same ranks only</p>
                <p>• Double after split allowed</p>
                <p>• Surrender available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
