import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    // Check for custom auth cookie
    const cookieStore = cookies()
    const customAuthCookie = cookieStore.get("custom_auth_user")

    if (!customAuthCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = JSON.parse(customAuthCookie.value)

    // Create Supabase client
    const supabase = createClient()

    // Fetch room data
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", params.roomId)
      .eq("establishment_id", user.establishment_id)
      .single()

    if (roomError || !roomData) {
      console.error("[v0] Error fetching room:", roomError)
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Fetch room assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("room_assignments")
      .select(`
        *,
        sub_rooms (*)
      `)
      .eq("room_id", params.roomId)
      .order("class_name")

    if (assignmentsError) {
      console.error("[v0] Error fetching room assignments:", assignmentsError)
    }

    return NextResponse.json({
      room: roomData,
      assignments: assignments || [],
    })
  } catch (error) {
    console.error("[v0] Error in room API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
