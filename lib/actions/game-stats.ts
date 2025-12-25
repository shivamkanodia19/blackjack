"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function getGameStats(userId?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const { data: stats, error } = await supabase.from("game_stats").select("*").eq("user_id", user.id).single()

  if (error) {
    return { error: error.message }
  }

  return { stats }
}

export async function updateGameStats(stats: {
  bankroll: number
  hands_played: number
  hands_won: number
  hands_lost: number
  hands_pushed: number
  total_moves: number
  strategy_decisions: number
  strategy_correct: number
  strategy_streak: number
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("game_stats")
    .update({
      ...stats,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    return { error: error.message }
  }

  return { profile }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
