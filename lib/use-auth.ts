"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getAdminSession } from "@/lib/admin-auth"

export interface AuthUser {
  id: string
  establishmentId: string
  role: string
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  authType: "custom" | "admin" | "supabase"
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

export function useAuth(options?: { requireRole?: string; redirectTo?: string }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (typeof window === "undefined") {
        return
      }

      try {
        // Try cookie first
        const cookieSession = getCookie("custom_auth_user")
        let sessionData = null
        
        if (cookieSession) {
          try {
            sessionData = JSON.parse(decodeURIComponent(cookieSession))
          } catch {
            // Invalid cookie, will try localStorage
          }
        }

        // Fallback to localStorage
        if (!sessionData) {
          const localSession = localStorage.getItem("custom_auth_user")
          if (localSession) {
            try {
              sessionData = JSON.parse(localSession)
            } catch {
              // Invalid localStorage
            }
          }
        }

        if (sessionData) {
          // Support both establishment_id and establishmentId formats
          const establishmentId = sessionData.establishment_id || sessionData.establishmentId
          
          if (!sessionData.id || !establishmentId || !sessionData.role) {
            localStorage.removeItem("custom_auth_user")
            document.cookie = "custom_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          } else {
            const authUser: AuthUser = {
              id: sessionData.id,
              establishmentId: establishmentId,
              role: sessionData.role,
              username: sessionData.username,
              firstName: sessionData.first_name || sessionData.firstName,
              lastName: sessionData.last_name || sessionData.lastName,
              email: sessionData.email,
              authType: "custom",
            }

            if (options?.requireRole && authUser.role !== options.requireRole) {
              router.push(options.redirectTo || "/dashboard")
              setIsLoading(false)
              return
            }

            setUser(authUser)
            setIsLoading(false)
            return
          }
        }
      } catch {
        localStorage.removeItem("custom_auth_user")
        document.cookie = "custom_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }

      try {
        const adminSession = getAdminSession()
        if (adminSession) {
          const supabase = createClient()
          const { data: establishment } = await supabase
            .from("establishments")
            .select("id")
            .eq("code", adminSession.code)
            .single()

          const authUser: AuthUser = {
            id: "admin-" + adminSession.code,
            establishmentId: establishment?.id || "mock-establishment-id",
            role: "vie-scolaire",
            username: adminSession.code,
            authType: "admin",
          }

          if (options?.requireRole && authUser.role !== options.requireRole) {
            router.push(options.redirectTo || "/dashboard")
            setIsLoading(false)
            return
          }

          setUser(authUser)
          setIsLoading(false)
          return
        }
      } catch {
        // Admin session check failed
      }

      try {
        const supabase = createClient()
        const {
          data: { user: supabaseUser },
          error,
        } = await supabase.auth.getUser()

        if (!error && supabaseUser) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", supabaseUser.id).single()

          if (profile) {
            const authUser: AuthUser = {
              id: supabaseUser.id,
              establishmentId: profile.establishment_id,
              role: profile.role,
              username: profile.username,
              firstName: profile.first_name,
              lastName: profile.last_name,
              email: profile.email,
              authType: "supabase",
            }

            if (options?.requireRole && authUser.role !== options.requireRole) {
              router.push(options.redirectTo || "/dashboard")
              setIsLoading(false)
              return
            }

            setUser(authUser)
            setIsLoading(false)
            return
          }
        }
      } catch {
        // Supabase auth check failed
      }

      setIsLoading(false)
      router.push(options?.redirectTo || "/auth/login")
    }

    checkAuth()
  }, [router, options?.requireRole, options?.redirectTo])

  return { user, isLoading }
}
