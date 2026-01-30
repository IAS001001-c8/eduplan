import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Increase timeout for this route
export const maxDuration = 30

// Use service role to bypass RLS
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { profileIds, userType } = await request.json()

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json({ error: "Profile IDs required" }, { status: 400 })
    }

    // Limit to 50 profiles at a time to avoid timeout
    const limitedIds = profileIds.slice(0, 50)
    
    const supabaseAdmin = getSupabaseAdmin()

    // Single query to get all needed data
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, password")
      .in("id", limitedIds)

    if (error) {
      console.error("Error fetching profiles:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user info based on type
    let userInfo: Record<string, any> = {}

    if (userType === "student") {
      const { data: students } = await supabaseAdmin
        .from("students")
        .select("profile_id, first_name, last_name, class_name, role")
        .in("profile_id", limitedIds)

      students?.forEach(s => {
        userInfo[s.profile_id] = {
          first_name: s.first_name,
          last_name: s.last_name,
          class_name: s.class_name,
          role: s.role || "eleve"
        }
      })
    } else if (userType === "teacher") {
      const { data: teachers } = await supabaseAdmin
        .from("teachers")
        .select("profile_id, first_name, last_name, subject")
        .in("profile_id", limitedIds)

      teachers?.forEach(t => {
        userInfo[t.profile_id] = {
          first_name: t.first_name,
          last_name: t.last_name,
          subject: t.subject,
          role: "professeur"
        }
      })
    }

    // Combine data
    const credentials = profiles?.map(profile => {
      const info = userInfo[profile.id] || {}
      return {
        username: profile.username,
        password: profile.password || "Mot de passe non défini",
        first_name: info.first_name || "",
        last_name: info.last_name || "",
        role: info.role || "eleve",
        class_name: info.class_name || info.subject || ""
      }
    }).filter(c => c.first_name && c.last_name) || []

    return NextResponse.json({ credentials })
  } catch (error: any) {
    console.error("Error in get-credentials:", error)
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}
