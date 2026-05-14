import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/rooms
 * Returns a list of active (non-complete) rooms.
 * Intended for external applications that want to display or join rooms.
 *
 * Response: { rooms: Array<{ id, code, state, playerCount, maxPlayers, createdAt }> }
 */
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rooms")
    .select("id, code, state, config, current_round, created_at")
    .neq("state", "session_complete")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rooms = (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    state: r.state,
    currentRound: r.current_round,
    maxPlayers: (r.config as { maxPlayers?: number })?.maxPlayers ?? 6,
    createdAt: r.created_at,
  }))

  return NextResponse.json({ rooms })
}
