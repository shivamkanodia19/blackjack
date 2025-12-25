"use server"

import { createClient } from "@/lib/supabase/server"

export async function getGameStats() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    // User not authenticated, return default stats
    return { stats: null }
  }

  const { data: stats, error } = await supabase
    .from("game_stats")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" which is fine for first-time users
    return { error: error.message }
  }

  return { stats: stats || null }
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
    // User not authenticated, skip saving
    return { success: false, error: "Not authenticated" }
  }

  // Try to update first, if no row exists, insert
  const { error: updateError } = await supabase
    .from("game_stats")
    .upsert(
      {
        user_id: user.id,
        ...stats,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )

  if (updateError) {
    return { success: false, error: updateError.message }
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { profile }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
