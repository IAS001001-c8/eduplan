import { createClient } from "./supabase/client"

export async function logAction(
  actionType: "create" | "update" | "delete" | "view",
  entityType: "student" | "teacher" | "room" | "class" | "sub_room",
  entityId: string,
  entityName: string,
  details?: Record<string, any>,
) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("log_action", {
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_entity_name: entityName,
      p_details: details || {},
    })

    if (error) {
    }

    return data
  } catch (err) {
  }
}

export async function getActionLogs(limit = 100) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("action_logs")
    .select(`
      *,
      user:profiles(first_name, last_name, role)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return []
  }

  return data || []
}
