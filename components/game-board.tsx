"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PlayingCard } from "@/components/ui/playing-card"
import { ArrowLeft, RotateCcw, Info, CheckCircle, XCircle, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { createDeck, shuffleDeck, dealCard, calculateHandValue, getBasicStrategy } from "@/lib/blackjack-logic"
import { scoreHand, settleHand, runDealerTurn, profitDollars } from "@/lib/blackjack/engine"
import { DEFAULT_RULES } from "@/lib/blackjack/rules"
import type { Card as PlayingCardType, GameState, Hand, SessionStats, ActionFeedback } from "@/lib/types"

interface GameBoardProps {
  mode: "real" | "practice" | "testing"
  onExit: () => void
  initialBankroll?: number
  /** Override whether strategy hints are shown (default: true for practice, false otherwise) */
  showHints?: boolean
  /** Called after every strategy decision in testing/training mode */
  onStrategyDecision?: (isCorrect: boolean, playerAction: string, recommendedAction: string, reason: string) => void
  /** Called when a hand fully settles — useful for live room turn advancement */
  onHandComplete?: (profit: number, outcome: "win" | "loss" | "push") => void
}

export default function GameBoard({ mode, onExit, initialBankroll = 1000, showHints: showHintsProp, onStrategyDecision, onHandComplete }: GameBoardProps) {
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
        // Show visual feedback (optional - can be removed if too intrusive)
        // You could add a toast notification here if you want
      } else {
        console.error("[Stats] ❌ Failed to save game stats:", result.error)
        if (result.error === "Not authenticated") {
          console.warn("[Stats] ⚠️ User not logged in - stats cannot be saved")
          alert("Please log in to save your game stats. Your progress will not be saved until you log in.")
        }
      }
    } catch (error) {
      console.error("[Stats] ❌ Error saving game stats:", error)
      console.error("[Stats] Full error details:", JSON.stringify(error, null, 2))
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
    // eslint-disable-next-line
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
      0,
      playerAction,
    ].join("-")

    if (decisionState === lastDecisionState) return

    const playerTotal = current.value
    const dealerUpCard = gameState.dealerHand[0]?.value || 0
    const soft = scoreHand(current.cards).soft
    const pr1 = current.cards.length === 2 ? current.cards[0].rank : null
    const pr2 = current.cards.length === 2 ? current.cards[1].rank : null

    const recommendation = getBasicStrategy(
      playerTotal,
      dealerUpCard,
      soft,
      current.canDouble,
      false,
      true,
      pr1,
      pr2,
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

    onStrategyDecision?.(isCorrect, playerAction, recommendation.action, recommendation.reason)

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

  const endGame = (result: string, finalDealerHand?: PlayingCardType[], handsSnapshot?: Hand[]) => {
    const hands = handsSnapshot || gameState.playerHands
    const dealerHandToUse = finalDealerHand || gameState.dealerHand
    if (result === "surrender") return

    const finalDealerValue = scoreHand(dealerHandToUse).total
    const dealerIsBlackjack = finalDealerValue === 21 && dealerHandToUse.length === 2

    let mainBetProfit = 0
    let handsWon = 0
    let handsLost = 0
    let handsPushed = 0

    hands.forEach((hand) => {
      const finalPlayerValue = calculateHandValue(hand.cards)
      const isNatural = hand.isNaturalBlackjack === true
      const { result: handResult, profitMultiplier } = settleHand(
        finalPlayerValue,
        finalDealerValue,
        isNatural,
        dealerIsBlackjack,
        false,
        DEFAULT_RULES,
      )
      mainBetProfit += profitDollars(profitMultiplier, hand.bet)
      if (handResult === "win") handsWon++
      else if (handResult === "loss") handsLost++
      else handsPushed++
    })

    const totalProfit = mainBetProfit

    let message = ""
    if (mode === "testing") {
      const decisions = handDecisionsRef.current
      const correct = handCorrectRef.current
      const accuracyPct = decisions > 0 ? Math.round((correct / decisions) * 100) : 0

      const isSingleHand = hands.length === 1
      const firstHand = isSingleHand ? hands[0] : undefined
      const isNaturalBJSingle =
        isSingleHand && !!firstHand && firstHand.isNaturalBlackjack === true

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
    if (newBankroll < 0) {
      console.warn("[Blackjack] Bankroll negative after settlement — check payout logic", {
        newBankroll,
        totalProfit,
        mainBetProfit,
      })
    }

    setGameState((prev) => ({
      ...prev,
      bankroll: newBankroll,
      pendingBets: 0,
      message,
      dealerScore: scoreHand(dealerHandToUse).total,
    }))

    setSessionStats((prev) => ({
      ...prev,
      handsPlayed: prev.handsPlayed + hands.length,
      handsWon: prev.handsWon + handsWon,
      handsLost: prev.handsLost + handsLost,
      handsPushed: prev.handsPushed + handsPushed,
    }))

    resetHandCounters()

    if (onHandComplete) {
      const outcome = handsWon > handsLost ? "win" : handsLost > handsWon ? "loss" : "push"
      onHandComplete(totalProfit, outcome)
    }

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
      gamePhase: "playing",
      message: "Choose your action",
    }))

    setTimeout(() => dealCards(), 100)
  }

  const dealCards = () => {
    setGameState((prev) => {
      let deck = [...prev.deck]
      if (deck.length < 20) {
        deck = shuffleDeck(createDeck(6))
      }

      const playerHand: PlayingCardType[] = []
      const dealerHand: PlayingCardType[] = []

      playerHand.push(dealCard(deck))
      dealerHand.push(dealCard(deck))
      playerHand.push(dealCard(deck))
      dealerHand.push(dealCard(deck))

      const playerScore = calculateHandValue(playerHand)
      const dealerFullScore = scoreHand(dealerHand).total

      const playerIsNatural = playerScore === 21 && playerHand.length === 2
      const dealerIsBlackjack = dealerFullScore === 21 && dealerHand.length === 2

      const initialHand: Hand = {
        cards: playerHand,
        value: playerScore,
        bet: prev.mainBet,
        isComplete: dealerIsBlackjack || playerIsNatural,
        canDouble: !dealerIsBlackjack && !playerIsNatural,
        canSplit: !dealerIsBlackjack && !playerIsNatural && playerHand[0].rank === playerHand[1].rank,
        isNaturalBlackjack: playerIsNatural,
        isBlackjack: playerIsNatural,
      }

      if (dealerIsBlackjack || playerIsNatural) {
        const nextState: GameState = {
          ...prev,
          deck,
          playerHands: [initialHand],
          dealerHand,
          dealerScore: dealerFullScore,
          gamePhase: "finished",
          message: dealerIsBlackjack ? "Dealer Blackjack!" : "Player Blackjack!",
          sideBets: [],
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
        canSurrender: false,
        sideBets: [],
      }
    })
  }

  const hit = () => {
    if (gameState.gamePhase !== "playing") {
      console.warn("[Blackjack] Hit ignored: invalid phase", gameState.gamePhase)
      return
    }
    const current = getCurrentHand()
    if (!current || current.isComplete) {
      console.warn("[Blackjack] Hit ignored: no active hand")
      return
    }

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
    if (gameState.gamePhase !== "playing") {
      console.warn("[Blackjack] Stand ignored: invalid phase", gameState.gamePhase)
      return
    }
    const current = getCurrentHand()
    if (!current || current.isComplete) {
      console.warn("[Blackjack] Stand ignored: no active hand")
      return
    }

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
    if (!current?.canDouble || current.isComplete) {
      console.warn("[Blackjack] Double ignored: not allowed or hand complete")
      return
    }
    if (gameState.gamePhase !== "playing") {
      console.warn("[Blackjack] Double ignored: invalid phase", gameState.gamePhase)
      return
    }
    if (mode !== "testing" && current.bet > getAvailableMoney()) {
      console.warn("[Blackjack] Double ignored: insufficient bankroll")
      return
    }

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
    if (!current?.canSplit || current.isComplete) {
      console.warn("[Blackjack] Split ignored: not allowed or hand complete")
      return
    }
    if (gameState.gamePhase !== "playing") {
      console.warn("[Blackjack] Split ignored: invalid phase", gameState.gamePhase)
      return
    }
    if (mode !== "testing" && current.bet > getAvailableMoney()) {
      console.warn("[Blackjack] Split ignored: insufficient bankroll")
      return
    }

    processTestingFeedback("Split")

    setGameState((prev) => {
      let deck = [...prev.deck]
      if (deck.length < 10) {
        deck = shuffleDeck(createDeck(6))
      }

      const newPlayerHands = [...prev.playerHands]
      const originalHand = { ...current }

      const mkHand = (card: PlayingCardType): Hand => ({
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

      const allowFurtherSplit = (cards: PlayingCardType[]) =>
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
            const dealerTotal = scoreHand(prev.dealerHand).total
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
    let snapshotDeck = [...gameState.deck]
    if (snapshotDeck.length < 10) {
      snapshotDeck = shuffleDeck(createDeck(6))
    }

    const { cards: finalDealerCards, shoe: remainingDeck } = runDealerTurn(
      gameState.dealerHand,
      snapshotDeck,
      DEFAULT_RULES,
    )
    const snapshotHands = [...gameState.playerHands]

    setGameState((prev) => ({
      ...prev,
      deck: remainingDeck,
      dealerHand: finalDealerCards,
      dealerScore: scoreHand(finalDealerCards).total,
      gamePhase: "finished",
    }))

    setTimeout(() => endGame("dealer-complete", finalDealerCards, snapshotHands), mode === "testing" ? 0 : 1000)
  }

  const getStrategyRecommendation = () => {
    if (mode !== "practice" || gameState.gamePhase !== "playing") return null
    const current = getCurrentHand()
    if (!current) return null

    const playerTotal = current.value
    const dealerUpCard = gameState.dealerHand[0]?.value || 0
    const soft = scoreHand(current.cards).soft
    const pr1 = current.cards.length === 2 ? current.cards[0].rank : null
    const pr2 = current.cards.length === 2 ? current.cards[1].rank : null

    return getBasicStrategy(playerTotal, dealerUpCard, soft, current.canDouble, false, true, pr1, pr2)
  }

  const getModeConfig = () => {
    switch (mode) {
      case "real":
        return { title: "Solo Session", showHints: showHintsProp ?? false, showFeedback: false }
      case "practice":
        return { title: "Practice Mode", showHints: showHintsProp ?? true, showFeedback: false }
      case "testing":
        return { title: "Training Mode", showHints: showHintsProp ?? false, showFeedback: true }
      default:
        return { title: "", showHints: false, showFeedback: false }
    }
  }

  const modeConfig = getModeConfig()
  const strategyRecommendation = getStrategyRecommendation()
  const currentHand = getCurrentHand()
  const decidedHands = sessionStats.handsWon + sessionStats.handsLost
  const winRate = decidedHands > 0 ? Math.round((sessionStats.handsWon / decidedHands) * 100) : 0

  if (gameOver && mode === "real") {
    return (
      <div className="table-felt min-h-screen flex items-center justify-center p-4">
        <div
          className="max-w-sm w-full rounded-2xl p-8 text-center space-y-5"
          style={{ background: "rgba(15,23,42,0.97)", border: "1px solid rgba(71,85,105,0.4)" }}
        >
          <div className="text-5xl">🃏</div>
          <div>
            <h2 className="text-2xl font-bold text-white">Session Over</h2>
            <p className="text-gray-400 text-sm mt-1">Your session stack ran out.</p>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(30,41,59,0.6)" }}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Hands played</span>
              <span className="text-white font-semibold">{sessionStats.handsPlayed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Win rate</span>
              <span className="text-white font-semibold">{winRate}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              onClick={initializeGame}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5"
            >
              New Session
            </Button>
            <Button
              onClick={onExit}
              variant="outline"
              className="w-full border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white py-2.5"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const strategyAccuracy =
    sessionStats.strategyDecisions > 0
      ? Math.round((sessionStats.strategyCorrect / sessionStats.strategyDecisions) * 100)
      : 0

  return (
    <div className="table-felt min-h-screen pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(3,7,18,0.92)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(10px)" }}>
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Menu</span>
        </button>

        <span
          className={cn(
            "text-xs font-semibold px-3 py-1 rounded-full",
            mode === "real" ? "mode-badge-real" : mode === "practice" ? "mode-badge-practice" : "mode-badge-testing"
          )}
        >
          {modeConfig.title}
        </span>

        {mode !== "testing" ? (
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Stack</div>
            <div className="text-base font-bold text-amber-400">${gameState.bankroll}</div>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Accuracy</div>
            <div className="text-base font-bold text-emerald-400">{strategyAccuracy}%</div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="container mx-auto max-w-5xl px-4 pt-5">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">

          {/* Center column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Dealer panel */}
            <div className="dealer-panel rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-red-300/70">Dealer</span>
                <span className="text-sm font-bold text-white">
                  {gameState.gamePhase === "playing" ? "?" : gameState.dealerScore}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {gameState.dealerHand.map((card, index) => (
                  <PlayingCard
                    key={index}
                    rank={card.rank}
                    suit={card.suit}
                    faceDown={gameState.gamePhase === "playing" && index === 1}
                    size="md"
                  />
                ))}
              </div>
            </div>

            {/* Player hands */}
            {gameState.playerHands.map((hand, handIndex) => {
              const isActive = handIndex === gameState.currentHandIndex && gameState.gamePhase === "playing"
              return (
                <div
                  key={handIndex}
                  className={cn("rounded-2xl p-4 transition-all", isActive ? "player-panel-active" : "player-panel")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">
                        {gameState.playerHands.length > 1 ? `Hand ${handIndex + 1}` : "You"}
                      </span>
                      {isActive && <span className="turn-pill">Your turn</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", hand.value > 21 ? "text-red-400" : "text-white")}>
                        {hand.value}
                        {(hand.isNaturalBlackjack || hand.isBlackjack) && (
                          <span className="text-amber-400 ml-1 text-xs">BJ</span>
                        )}
                      </span>
                      {mode !== "testing" && (
                        <span className="bet-chip">
                          ${hand.bet}{hand.isDoubled ? " ×2" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {hand.cards.map((card, idx) => (
                      <PlayingCard key={idx} rank={card.rank} suit={card.suit} size="md" />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Training feedback */}
            {mode === "testing" && actionFeedback.show && (
              <div className={cn("rounded-2xl p-4", actionFeedback.isCorrect ? "feedback-correct" : "feedback-incorrect")}>
                <div className="flex items-center gap-2 mb-1">
                  {actionFeedback.isCorrect ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  )}
                  <span className={cn("text-sm font-bold", actionFeedback.isCorrect ? "text-emerald-300" : "text-red-300")}>
                    {actionFeedback.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <div className="text-xs text-gray-300 space-y-0.5 pl-6">
                  <div>You played: <span className="font-semibold text-white">{actionFeedback.playerAction}</span></div>
                  {!actionFeedback.isCorrect && (
                    <div>Correct play: <span className="font-semibold text-white">{actionFeedback.recommendedAction}</span></div>
                  )}
                  <div className="text-gray-400 mt-1">{actionFeedback.reason}</div>
                </div>
              </div>
            )}

            {/* Practice hint — mobile only */}
            {modeConfig.showHints && strategyRecommendation && gameState.gamePhase === "playing" && (
              <div className="lg:hidden hint-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">Strategy Hint</span>
                </div>
                <div className="pl-6 text-sm">
                  <span className="font-bold text-white">{strategyRecommendation.action}</span>
                  <span className="text-gray-400 ml-2 text-xs">{strategyRecommendation.reason}</span>
                </div>
              </div>
            )}

            {/* Status message */}
            {gameState.message && (
              <div className="text-center py-1">
                <p className="text-sm font-semibold text-gray-200">{gameState.message}</p>
              </div>
            )}

            {/* Mobile compact stats */}
            <div className="lg:hidden grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Played", value: sessionStats.handsPlayed },
                { label: "Won", value: sessionStats.handsWon },
                { label: "Lost", value: sessionStats.handsLost },
                { label: "Win %", value: `${winRate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="stat-panel rounded-xl py-2 px-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
                  <div className="text-sm font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:flex flex-col gap-4 pt-0">

            {/* Practice hint */}
            {modeConfig.showHints && strategyRecommendation && gameState.gamePhase === "playing" && (
              <div className="hint-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">Strategy Hint</span>
                </div>
                <div className="text-sm font-bold text-white">{strategyRecommendation.action}</div>
                <div className="text-xs text-gray-400 mt-1">{strategyRecommendation.reason}</div>
              </div>
            )}

            {/* Training scoreboard */}
            {mode === "testing" && (
              <div className="stat-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Training</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Decisions", value: sessionStats.strategyDecisions },
                    { label: "Correct", value: sessionStats.strategyCorrect },
                    { label: "Accuracy", value: `${strategyAccuracy}%` },
                    { label: "Streak", value: sessionStats.strategyStreak },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session stats */}
            <div className="stat-panel rounded-2xl p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Session</div>
              <div className="space-y-2">
                {[
                  { label: "Hands", value: sessionStats.handsPlayed },
                  { label: "Won", value: sessionStats.handsWon },
                  { label: "Lost", value: sessionStats.handsLost },
                  { label: "Push", value: sessionStats.handsPushed },
                  { label: "Win rate", value: `${winRate}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active bet */}
            {mode !== "testing" && gameState.mainBet > 0 && (
              <div className="stat-panel rounded-2xl p-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Active bet</div>
                <div className="text-2xl font-bold text-amber-400">${gameState.mainBet}</div>
              </div>
            )}

            {/* Table rules */}
            <div className="stat-panel rounded-2xl p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Rules</div>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li>6 decks · S17</li>
                <li>Blackjack pays 3:2</li>
                <li>Double after split</li>
                <li>No insurance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action dock */}
      <div className="action-dock fixed bottom-0 left-0 right-0 px-4 py-3 safe-area-inset-bottom">

        {/* Betting phase */}
        {gameState.gamePhase === "betting" && (
          <div className="max-w-lg mx-auto space-y-2">
            <div className="flex gap-2 justify-center">
              {[10, 25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => placeBet(amount)}
                  disabled={amount > getAvailableMoney()}
                  className={cn(
                    "flex-1 h-12 rounded-xl text-sm font-bold transition-all",
                    amount > getAvailableMoney()
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : "bg-gray-700 hover:bg-gray-600 text-white active:scale-95"
                  )}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom"
                value={customBetAmount}
                onChange={(e) => setCustomBetAmount(e.target.value)}
                className="flex-1 h-11 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 text-sm"
                min="1"
                max={getAvailableMoney()}
              />
              <Button
                onClick={() => {
                  const amount = Number.parseInt(customBetAmount)
                  if (amount > 0 && amount <= getAvailableMoney()) placeBet(amount)
                }}
                disabled={
                  !customBetAmount ||
                  Number.parseInt(customBetAmount) <= 0 ||
                  Number.parseInt(customBetAmount) > getAvailableMoney()
                }
                className="h-11 px-5 bg-amber-600 hover:bg-amber-500 text-white font-semibold disabled:opacity-40"
              >
                Bet
              </Button>
            </div>
          </div>
        )}

        {/* Playing phase */}
        {gameState.gamePhase === "playing" && currentHand && !currentHand.isComplete && (
          <div className="max-w-lg mx-auto flex gap-2">
            <button
              onClick={hit}
              className="flex-1 h-14 rounded-xl bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold text-sm transition-all active:scale-95"
            >
              Hit
            </button>
            <button
              onClick={stand}
              className="flex-1 h-14 rounded-xl bg-amber-700 hover:bg-amber-600 active:bg-amber-800 text-white font-bold text-sm transition-all active:scale-95"
            >
              Stand
            </button>
            {currentHand.canDouble && getAvailableMoney() >= currentHand.bet && (
              <button
                onClick={doubleDown}
                className="flex-1 h-14 rounded-xl bg-violet-700 hover:bg-violet-600 active:bg-violet-800 text-white font-bold text-sm transition-all active:scale-95"
              >
                Double
              </button>
            )}
            {currentHand.canSplit && getAvailableMoney() >= currentHand.bet && (
              <button
                onClick={split}
                className="flex-1 h-14 rounded-xl bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-sm transition-all active:scale-95"
              >
                Split
              </button>
            )}
          </div>
        )}

        {/* Playing phase — hand complete, waiting */}
        {gameState.gamePhase === "playing" && currentHand && currentHand.isComplete && (
          <div className="max-w-lg mx-auto text-center text-sm text-gray-400 py-3">
            Resolving hand…
          </div>
        )}

        {/* Finished phase */}
        {gameState.gamePhase === "finished" && (
          <div className="max-w-lg mx-auto">
            <button
              onClick={initializeGame}
              className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              New Hand
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
