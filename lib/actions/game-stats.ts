"use server"

// Authentication removed - stats tracking disabled for now
export async function getGameStats(userId?: string) {
  // No authentication required - return default stats
  return { stats: null }
}

// Authentication removed - stats tracking disabled for now
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
  // No authentication required - stats updates disabled
  return { success: true }
}

// Authentication removed - no user profile required
export async function getUserProfile() {
  return { error: "No authentication" }
}

// Authentication removed - sign out no longer needed
export async function signOut() {
  // No-op since there's no authentication
}
