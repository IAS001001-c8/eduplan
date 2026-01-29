"use client"

import { useAuth } from "@/lib/use-auth"
import { ClassesManagement } from "@/components/classes-management"
import { useRouter } from "next/navigation"

export default function ClassesPage() {
  const { user, isLoading } = useAuth({ requireRole: "vie-scolaire" })
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <ClassesManagement establishmentId={user.establishmentId} onBack={() => router.push("/dashboard")} />
}
