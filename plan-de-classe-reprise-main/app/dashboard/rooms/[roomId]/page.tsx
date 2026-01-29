"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RoomDetail } from "@/components/room-detail"
import { useAuth } from "@/lib/use-auth"

export default function RoomDetailPage({ params }: { params: { roomId: string } }) {
  const router = useRouter()
  const { user, profile, isLoading } = useAuth()
  const [room, setRoom] = useState<any>(null)
  const [roomAssignments, setRoomAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoomData = async () => {
      if (isLoading) return

      if (!user || !profile) {
        router.push("/auth/login")
        return
      }

      try {
        const response = await fetch(`/api/rooms/${params.roomId}`)

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/login")
            return
          }
          throw new Error("Failed to fetch room data")
        }

        const data = await response.json()
        setRoom(data.room)
        setRoomAssignments(data.assignments)
      } catch (err) {
        console.error("[v0] Error fetching room:", err)
        setError("Erreur lors du chargement de la salle")
      } finally {
        setLoading(false)
      }
    }

    fetchRoomData()
  }, [isLoading, user, profile, params.roomId, router])

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la salle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={() => router.push("/dashboard/rooms")} className="text-primary hover:underline">
            Retour aux salles
          </button>
        </div>
      </div>
    )
  }

  if (!room || !profile) {
    return null
  }

  return (
    <RoomDetail
      room={room}
      roomAssignments={roomAssignments}
      userRole={profile.role}
      userId={user?.id || profile.id}
      establishmentId={profile.establishment_id}
    />
  )
}
