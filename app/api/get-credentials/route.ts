import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { profileIds, userType } = await request.json()

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json({ error: "Profile IDs required" }, { status: 400 })
    }

    // Fetch profiles with service role (bypasses RLS)
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, password, first_name, last_name, role")
      .in("id", profileIds)

    if (error) {
      console.error("Error fetching profiles:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get additional info based on user type
    let additionalInfo: Record<string, any> = {}

    if (userType === "student") {
      const { data: students } = await supabaseAdmin
        .from("students")
        .select("profile_id, first_name, last_name, class_name, role")
        .in("profile_id", profileIds)

      if (students) {
        students.forEach(s => {
          additionalInfo[s.profile_id] = {
            first_name: s.first_name,
            last_name: s.last_name,
            class_name: s.class_name,
            role: s.role || "eleve"
          }
        })
      }
    } else if (userType === "teacher") {
      const { data: teachers } = await supabaseAdmin
        .from("teachers")
        .select("profile_id, first_name, last_name, subject")
        .in("profile_id", profileIds)

      if (teachers) {
        teachers.forEach(t => {
          additionalInfo[t.profile_id] = {
            first_name: t.first_name,
            last_name: t.last_name,
            subject: t.subject,
            role: "professeur"
          }
        })
      }
    }

    // Combine profile data with additional info
    const credentials = profiles?.map(profile => {
      const info = additionalInfo[profile.id] || {}
      return {
        username: profile.username,
        password: profile.password || "[Non défini]",
        first_name: info.first_name || profile.first_name || "",
        last_name: info.last_name || profile.last_name || "",
        role: info.role || profile.role || "eleve",
        class_name: info.class_name || info.subject || ""
      }
    }) || []

    return NextResponse.json({ credentials })
  } catch (error: any) {
    console.error("Error in get-credentials:", error)
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}
