import { createClient } from "@/lib/supabase/client"

interface NotificationData {
  user_id?: string
  userId?: string
  establishment_id?: string
  establishmentId?: string
  type: string
  title: string
  message: string
  sub_room_id?: string
  subRoomId?: string
  proposal_id?: string
  proposalId?: string
  triggered_by?: string
  triggeredBy?: string
}

export async function sendNotification(data: NotificationData) {
  const supabase = createClient()
  
  // Normalize to snake_case
  const normalizedData = {
    user_id: data.user_id || data.userId,
    establishment_id: data.establishment_id || data.establishmentId,
    type: data.type,
    title: data.title,
    message: data.message,
    sub_room_id: data.sub_room_id || data.subRoomId || null,
    proposal_id: data.proposal_id || data.proposalId || null,
    triggered_by: data.triggered_by || data.triggeredBy || null,
    is_read: false,
  }

  if (!normalizedData.user_id || !normalizedData.establishment_id) {
    console.error("[Notifications] Missing user_id or establishment_id")
    return
  }

  try {
    // Insert directly into Supabase instead of using API route
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert(normalizedData)
      .select()
      .single()

    if (error) {
      console.error("[Notifications] Supabase error:", error)
      return
    }

    console.log("[Notifications] Notification created:", notification?.id)
    return notification
  } catch (error) {
    console.error("[Notifications] Exception:", error)
  }
}

// Notify all users in an establishment (for room/sub-room creation/deletion)
interface NotifyEstablishmentUsersParams {
  establishmentId: string
  type: string
  title: string
  message: string
  triggeredBy?: string
  excludeUserId?: string // User to exclude from notification (usually the creator)
  subRoomId?: string
}

export async function notifyEstablishmentUsers({
  establishmentId,
  type,
  title,
  message,
  triggeredBy,
  excludeUserId,
  subRoomId,
}: NotifyEstablishmentUsersParams) {
  const supabase = createClient()

  try {
    // Get all profiles in the establishment (professeurs and vie-scolaire)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("establishment_id", establishmentId)
      .in("role", ["professeur", "vie-scolaire"])

    if (error || !profiles) {
      console.error("[Notifications] Error fetching profiles:", error)
      return
    }

    // Send notification to each user (except the one who triggered it)
    for (const profile of profiles) {
      if (excludeUserId && profile.id === excludeUserId) continue

      await sendNotification({
        user_id: profile.id,
        establishment_id: establishmentId,
        type,
        title,
        message,
        triggered_by: triggeredBy,
        sub_room_id: subRoomId,
      })
    }

    console.log(`[Notifications] Notified ${profiles.length} users about ${type}`)
  } catch (error) {
    console.error("[Notifications] Error notifying establishment users:", error)
  }
}

export async function notifyPlanModified(
  subRoomId: string,
  subRoomName: string,
  classIds: string[],
  establishmentId: string,
) {
  const supabase = createClient()

  const { data: students, error } = await supabase
    .from("students")
    .select("profile_id")
    .in("class_id", classIds)
    .not("profile_id", "is", null)

  if (error || !students) {
    return
  }

  for (const student of students) {
    await sendNotification({
      user_id: student.profile_id!,
      establishment_id: establishmentId,
      type: "plan_modified",
      title: "Plan de classe modifié",
      message: `Le plan "${subRoomName}" a été mis à jour`,
      sub_room_id: subRoomId,
    })
  }
}

export async function notifyProposalStatusChange(
  proposalId: string,
  delegateUserId: string,
  status: "approved" | "rejected" | "returned",
  subRoomName: string,
  establishmentId: string,
  rejectionReason?: string,
) {
  if (status === "approved") {
    await sendNotification({
      user_id: delegateUserId,
      establishment_id: establishmentId,
      type: "plan_validated",
      title: "Proposition validée",
      message: `Votre proposition "${subRoomName}" a été validée et est maintenant active`,
      proposal_id: proposalId,
    })
  } else if (status === "rejected") {
    await sendNotification({
      user_id: delegateUserId,
      establishment_id: establishmentId,
      type: "plan_rejected",
      title: "Proposition refusée",
      message: rejectionReason || `Votre proposition "${subRoomName}" a été refusée`,
      proposal_id: proposalId,
    })
  } else if (status === "returned") {
    await sendNotification({
      user_id: delegateUserId,
      establishment_id: establishmentId,
      type: "plan_returned",
      title: "Proposition à revoir",
      message: rejectionReason || `Le professeur demande des modifications pour "${subRoomName}"`,
      proposal_id: proposalId,
    })
  }
}

export async function notifyPlanCreated(
  subRoomId: string,
  subRoomName: string,
  classIds: string[],
  establishmentId: string,
) {
  const supabase = createClient()

  const { data: students, error } = await supabase
    .from("students")
    .select("profile_id")
    .in("class_id", classIds)
    .not("profile_id", "is", null)

  if (error || !students) {
    return
  }

  for (const student of students) {
    await sendNotification({
      user_id: student.profile_id!,
      establishment_id: establishmentId,
      type: "plan_created",
      title: "Nouveau plan de classe",
      message: `Un nouveau plan "${subRoomName}" a été créé pour votre classe`,
      sub_room_id: subRoomId,
    })
  }
}

export async function notifyPlanDeleted(subRoomName: string, classIds: string[], establishmentId: string) {
  const supabase = createClient()

  const { data: students, error } = await supabase
    .from("students")
    .select("profile_id")
    .in("class_id", classIds)
    .not("profile_id", "is", null)

  if (error || !students) {
    return
  }

  for (const student of students) {
    await sendNotification({
      user_id: student.profile_id!,
      establishment_id: establishmentId,
      type: "plan_deleted",
      title: "Plan de classe supprimé",
      message: `Le plan "${subRoomName}" a été supprimé`,
    })
  }
}

export async function notifyProposalSubmitted(
  proposalId: string,
  teacherUserId: string,
  subRoomName: string,
  delegateName: string,
  establishmentId: string,
) {
  await sendNotification({
    user_id: teacherUserId,
    establishment_id: establishmentId,
    type: "proposal_submitted",
    title: "Nouvelle proposition",
    message: `${delegateName} a soumis une proposition pour "${subRoomName}"`,
    proposal_id: proposalId,
  })
}
