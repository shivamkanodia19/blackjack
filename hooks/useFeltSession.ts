"use client"

import { useEffect, useState } from "react"

export type FeltGame = "poker" | "blackjack"
export type FeltIntent = "play" | "train" | "friends"

export type FeltSessionData = {
  lastGame: FeltGame | null
  lastIntent: FeltIntent | null
  pokerSessions: number
  blackjackSessions: number
  trainingStreak: number
  lastPlayedDate: string | null
  onboardingDone: boolean
}

const DEFAULT: FeltSessionData = {
  lastGame: null,
  lastIntent: null,
  pokerSessions: 0,
  blackjackSessions: 0,
  trainingStreak: 0,
  lastPlayedDate: null,
  onboardingDone: false,
}

const KEY = "felt_session"

function load(): FeltSessionData {
  if (typeof window === "undefined") return DEFAULT
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT
  }
}

function save(data: FeltSessionData) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function useFeltSession() {
  const [data, setData] = useState<FeltSessionData>(DEFAULT)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setData(load())
    setReady(true)
  }, [])

  const update = (patch: Partial<FeltSessionData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }

  const recordGameStart = (game: FeltGame, intent: FeltIntent) => {
    setData((prev) => {
      const today = new Date().toDateString()
      const streakIncrement =
        intent === "train" && prev.lastPlayedDate !== today ? 1 : 0
      const next: FeltSessionData = {
        ...prev,
        lastGame: game,
        lastIntent: intent,
        pokerSessions: prev.pokerSessions + (game === "poker" ? 1 : 0),
        blackjackSessions: prev.blackjackSessions + (game === "blackjack" ? 1 : 0),
        trainingStreak: intent === "train" ? prev.trainingStreak + streakIncrement : prev.trainingStreak,
        lastPlayedDate: today,
      }
      save(next)
      return next
    })
  }

  const completeOnboarding = (game: FeltGame, intent: FeltIntent) => {
    update({ onboardingDone: true, lastGame: game, lastIntent: intent })
  }

  return { data, ready, update, recordGameStart, completeOnboarding }
}
