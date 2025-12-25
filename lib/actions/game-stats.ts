"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// TODO: When Clerk is integrated, replace userId parameter with Clerk user ID
export async function getGameStats(userId?: string) {
  const supabase = await createClient()

  // Auth check disabled - will use Clerk later
  // const {
  //   data: { user },
  //   error: authError,
  // } = await supabase.auth.getUser()

  // if (authError || !user) {
  //   return { error: "Not authenticated" }
  // }

  // For now, if no userId provided, return error
  // When Clerk is integrated, get userId from Clerk session
  if (!userId) {
    return { error: "User ID required. Will be provided by Clerk when integrated." }
  }

  const { data: stats, error } = await supabase.from("game_stats").select("*").eq("user_id", userId).single()

  if (error) {
    return { error: error.message }
  }

  return { stats }
}

// TODO: When Clerk is integrated, replace userId parameter with Clerk user ID
export async function updateGameStats(
  stats: {
    bankroll: number
    hands_played: number
    hands_won: number
    hands_lost: number
    hands_pushed: number
    total_moves: number
    strategy_decisions: number
    strategy_correct: number
    strategy_streak: number
  },
  userId?: string
) {
  const supabase = await createClient()

  // Auth check disabled - will use Clerk later
  // const {
  //   data: { user },
  //   error: authError,
  // } = await supabase.auth.getUser()

  // if (authError || !user) {
  //   return { error: "Not authenticated" }
  // }

  // For now, if no userId provided, return error
  // When Clerk is integrated, get userId from Clerk session
  if (!userId) {
    return { error: "User ID required. Will be provided by Clerk when integrated." }
  }

  const { error } = await supabase
    .from("game_stats")
    .update({
      ...stats,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// TODO: When Clerk is integrated, replace userId parameter with Clerk user ID
export async function getUserProfile(userId?: string) {
  const supabase = await createClient()

  // Auth check disabled - will use Clerk later
  // const {
  //   data: { user },
  //   error: authError,
  // } = await supabase.auth.getUser()

  // if (authError || !user) {
  //   return { error: "Not authenticated" }
  // }

  // For now, if no userId provided, return error
  // When Clerk is integrated, get userId from Clerk session
  if (!userId) {
    return { error: "User ID required. Will be provided by Clerk when integrated." }
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    return { error: error.message }
  }

  return { profile }
}

// TODO: When Clerk is integrated, use Clerk's signOut instead
export async function signOut() {
  // Auth disabled - will use Clerk later
  // const supabase = await createClient()
  // await supabase.auth.signOut()
  redirect("/auth/login")
}
