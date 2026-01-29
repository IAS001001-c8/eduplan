import { createClient } from "@supabase/supabase-js"
import * as crypto from "crypto"

const supabaseUrl = process.env.SUPABASE_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseKey) {
  console.error("[ERROR] Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createVieScolaireProfile() {
  try {
    console.log("[v0] Starting to create vie scolaire profile for Sainte-Marie...")

    // 1. Find or create establishment
    console.log("[v0] Finding establishment: ST-MARIE 14000")
    const { data: establishment, error: estError } = await supabase
      .from("establishments")
      .select("id")
      .eq("code", "ST-MARIE 14000")
      .single()

    if (estError && estError.code !== "PGRST116") {
      throw new Error(`Failed to find establishment: ${estError.message}`)
    }

    let establishmentId: string

    if (!establishment) {
      console.log("[v0] Creating new establishment: ST-MARIE 14000")
      const { data: newEst, error: createEstError } = await supabase
        .from("establishments")
        .insert({
          code: "ST-MARIE 14000",
          name: "Sainte-Marie Caen",
        })
        .select()
        .single()

      if (createEstError) {
        throw new Error(`Failed to create establishment: ${createEstError.message}`)
      }
      establishmentId = newEst.id
      console.log("[v0] Establishment created:", establishmentId)
    } else {
      establishmentId = establishment.id
      console.log("[v0] Establishment found:", establishmentId)
    }

    // 2. Hash password
    const passwordHash = crypto.createHash("sha256").update("Feunard2017").digest("hex")

    console.log("[v0] Password hashed")

    // 3. Create vie scolaire profile
    const vieScolaireData = {
      username: "admin.vs.stm",
      first_name: "Vie",
      last_name: "Scolaire",
      email: "vie.scolaire@sainte-marie.fr",
      role: "vie-scolaire",
      establishment_id: establishmentId,
      password_hash: passwordHash,
      phone: null,
      can_create_subrooms: true,
    }

    console.log("[v0] Creating vie scolaire profile...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert(vieScolaireData)
      .select()
      .single()

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    console.log("[v0] ✅ Profile created successfully!")
    console.log("[v0] Profile ID:", profile.id)
    console.log("[v0] Username: admin.vs.stm")
    console.log("[v0] Password: Feunard2017")
    console.log("[v0] Role: vie-scolaire")
    console.log("[v0] Establishment: ST-MARIE 14000")

    return profile
  } catch (error) {
    console.error("[ERROR] Failed to create profile:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

createVieScolaireProfile()
