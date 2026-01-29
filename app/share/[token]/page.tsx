import { createClient } from "@/lib/supabase/server"
import { SharedRoomView } from "@/components/shared-room-view"
import { redirect } from "next/navigation"

export default async function SharedRoomPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Get the room share by token (no auth required)
  const { data: roomShare } = await supabase.from("room_shares").select("*").eq("share_token", token).single()

  if (!roomShare) {
    redirect("/")
  }

  // Check if expired
  if (roomShare.expires_at && new Date(roomShare.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lien expiré</h1>
          <p className="text-muted-foreground">Ce lien de partage a expiré</p>
        </div>
      </div>
    )
  }

  // Get the room assignment and room details
  const { data: roomAssignment } = await supabase
    .from("room_assignments")
    .select("*, rooms(*)")
    .eq("id", roomShare.room_assignment_id)
    .single()

  if (!roomAssignment) {
    redirect("/")
  }

  return <SharedRoomView roomAssignment={roomAssignment} />
}
