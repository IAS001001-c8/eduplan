"use client"

import { useAuth } from "@/lib/use-auth"
import { DashboardContent } from "@/components/dashboard-content"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types"

export default function Dashboard() {
  const { user: authUser, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return null
  }

  const mockUser = {
    id: authUser.id,
    email: authUser.email || `${authUser.username}@local`,
  } as User

  const mockProfile = {
    id: authUser.id,
    establishment_id: authUser.establishmentId,
    role: authUser.role,
    username: authUser.username,
    first_name: authUser.firstName,
    last_name: authUser.lastName,
    email: authUser.email,
    phone: null,
    can_create_subrooms: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    establishments: {
      name: "Établissement",
    },
  } as Profile & { establishments: { name: string } }

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardContent user={mockUser} profile={mockProfile} />
    </main>
  )
}
