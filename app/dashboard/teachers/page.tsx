"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/use-auth"
import { TeachersManagement } from "@/components/teachers-management"
import { useRouter } from "next/navigation"

export default function TeachersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true)

  useEffect(() => {
    async function loadTeachers() {
      if (!user) return

      const supabase = createClient()
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("*")
        .eq("establishment_id", user.establishmentId)
        .order("last_name")

      setTeachers(teachersData || [])
      setIsLoadingTeachers(false)
    }

    if (user) {
      loadTeachers()
    }
  }, [user])

  if (isLoading || isLoadingTeachers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <TeachersManagement
      teachers={teachers}
      establishmentId={user.establishmentId}
      userRole={user.role}
      userId={user.id}
      onBack={() => router.push("/dashboard")}
    />
  )
}
