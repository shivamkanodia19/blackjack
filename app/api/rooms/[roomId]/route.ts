import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/rooms/[roomId]
 * Returns the full room state snapshot for a given room ID.
 * Intended for external applications that want to read live room state.
 *
 * Response: { room: Room } | { error: string }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rooms")
    .select("state_json")
    .eq("id", roomId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  return NextResponse.json({ room: data.state_json })
}
