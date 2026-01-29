import { createClient } from "@/lib/supabase/client"

// Simple password hashing (matches SQL function)
// In production, use bcrypt or similar
function hashPassword(password: string): string {
  // This is a placeholder - the actual hashing happens in SQL
  return password
}

export interface AuthUser {
  id: string
  username: string
  role: "vie-scolaire" | "professeur" | "delegue"
  establishment_id: string
  establishment_code: string
  establishment_name: string
  first_name?: string
  last_name?: string
  email?: string
}

export async function authenticateUser(
  establishmentCode: string,
  role: string,
  username: string,
  password: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = createClient()

  try {
    

    const { data: establishment, error: estError } = await supabase
      .from("establishments")
      .select("id, code, name")
      .eq("code", establishmentCode)
      .single()

    
    if (estError) {
      
        message: estError.message,
        details: estError.details,
        hint: estError.hint,
        code: estError.code,
      })
    }

    if (estError || !establishment) {
      return { user: null, error: "Code établissement invalide" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .eq("establishment_id", establishment.id)
      .eq("role", role)
      .single()

    
    if (profileError) {
      
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      })
    }

    if (profileError || !profile) {
      return { user: null, error: "Identifiant ou mot de passe incorrect" }
    }

    const { data: isValid, error: verifyError } = await supabase.rpc("verify_password", {
      password: password,
      password_hash: profile.password_hash,
    })

    
    if (verifyError) {
      
        message: verifyError.message,
        details: verifyError.details,
        hint: verifyError.hint,
        code: verifyError.code,
      })
    }

    if (verifyError || !isValid) {
      return { user: null, error: "Identifiant ou mot de passe incorrect" }
    }

    return {
      user: {
        id: profile.id,
        username: profile.username,
        role: role as "vie-scolaire" | "professeur" | "delegue",
        establishment_id: establishment.id,
        establishment_code: establishment.code,
        establishment_name: establishment.name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      },
      error: null,
    }
  } catch (error) {
    
    return { user: null, error: "Erreur de connexion - vérifiez votre configuration Supabase" }
  }
}

export function setUserSession(user: AuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem("custom_auth_user", JSON.stringify(user))
    // Also set a cookie for server-side access
    document.cookie = `custom_auth_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
  }
}

export function getUserSession(): AuthUser | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("custom_auth_user")
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearUserSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("custom_auth_user")
    document.cookie = "custom_auth_user=; path=/; max-age=0"
  }
}
