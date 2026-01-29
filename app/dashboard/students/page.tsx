"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/use-auth"
import { StudentsManagement } from "@/components/students-management"
import { useRouter } from "next/navigation"

export default function StudentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)

  useEffect(() => {
    async function loadStudents() {
      if (!user) return

      const supabase = createClient()
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .eq("establishment_id", user.establishmentId)
        .order("last_name")

      setStudents(studentsData || [])
      setIsLoadingStudents(false)
    }

    if (user) {
      loadStudents()
    }
  }, [user])

  if (isLoading || isLoadingStudents) {
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
    <StudentsManagement
      students={students}
      establishmentId={user.establishmentId}
      userRole={user.role}
      userId={user.id}
      onBack={() => router.push("/dashboard")}
    />
  )
}
