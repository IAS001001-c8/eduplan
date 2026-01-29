"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/use-auth"
import { SandboxManagement } from "@/components/sandbox-management"
import { useRouter } from "next/navigation"

export default function SandboxPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setIsLoading(false)
    }
  }, [user])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <SandboxManagement
      establishmentId={user.establishmentId}
      userRole={user.role}
      userId={user.id}
      onBack={() => router.push("/dashboard")}
    />
  )
}
