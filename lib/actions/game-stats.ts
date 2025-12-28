"use server"

import { createClient } from "@/lib/supabase/server"

export async function getGameStats() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[Server] getGameStats - User not authenticated")
      // User not authenticated, return default stats
      return { stats: null }
    }

    console.log("[Server] getGameStats - User authenticated, ID:", user.id)

    const { data: stats, error } = await supabase
      .from("game_stats")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine for first-time users
      console.error("[Server] Error loading stats:", error)
      return { error: error.message }
    }

    console.log("[Server] Loaded stats:", stats)
    return { stats: stats || null }
  } catch (error) {
    console.error("[Server] Exception in getGameStats:", error)
    return { stats: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
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
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[Server] User not authenticated - authError:", authError, "user:", user)
      // User not authenticated, skip saving
      return { success: false, error: "Not authenticated" }
    }

    console.log("[Server] User authenticated, ID:", user.id)
    console.log("[Server] Saving stats:", stats)

    // Ensure profile exists first (required for foreign key)
    const { data: profileCheck } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!profileCheck) {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Player",
          email: user.email || "",
        })

      if (profileError) {
        console.error("[Server] Error creating profile:", profileError)
      }
    }

    // Try to update first, if no row exists, insert
    const { data, error: updateError } = await supabase
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
      .select()

    if (updateError) {
      console.error("[Server] Database error:", updateError)
      return { success: false, error: updateError.message }
    }

    console.log("[Server] ✅ Stats saved successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[Server] Exception in updateGameStats:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
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
