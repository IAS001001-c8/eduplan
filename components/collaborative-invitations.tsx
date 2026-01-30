"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  Mail, 
  User,
  DoorOpen,
  Loader2
} from "lucide-react"

interface RoomInvitation {
  id: string
  room_id: string
  sub_room_id: string
  invited_teacher_id: string
  invited_by: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
  updated_at: string
  // Joined data
  rooms?: { name: string; code: string }
  sub_rooms?: { name: string; custom_name: string }
  invited_by_profile?: { first_name: string; last_name: string }
  invited_teacher?: { first_name: string; last_name: string }
}

interface CollaborativeInvitationsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  establishmentId: string
  currentTeacherId: string
  onInvitationResponse?: () => void
}

export function CollaborativeInvitations({ 
  open, 
  onOpenChange, 
  establishmentId, 
  currentTeacherId,
  onInvitationResponse 
}: CollaborativeInvitationsProps) {
  const [pendingInvitations, setPendingInvitations] = useState<RoomInvitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<RoomInvitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (open) {
      fetchInvitations()
    }
  }, [open])

  // Écouter les nouvelles invitations en temps réel
  useEffect(() => {
    const channel = supabase
      .channel("room_invitations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_invitations",
        },
        () => {
          fetchInvitations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchInvitations() {
    setIsLoading(true)
    try {
      // Invitations reçues (en attente)
      const { data: received, error: receivedError } = await supabase
        .from("room_invitations")
        .select(`
          *,
          rooms(name, code),
          sub_rooms(name, custom_name),
          invited_by_profile:profiles!room_invitations_invited_by_fkey(first_name, last_name)
        `)
        .eq("invited_teacher_id", currentTeacherId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (receivedError) throw receivedError
      setPendingInvitations(received || [])

      // Invitations envoyées
      const { data: sent, error: sentError } = await supabase
        .from("room_invitations")
        .select(`
          *,
          rooms(name, code),
          sub_rooms(name, custom_name),
          invited_teacher:teachers!room_invitations_invited_teacher_id_fkey(first_name, last_name)
        `)
        .eq("invited_by", currentTeacherId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (sentError) throw sentError
      setSentInvitations(sent || [])

    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResponse(invitationId: string, accept: boolean) {
    try {
      const { error } = await supabase
        .from("room_invitations")
        .update({ 
          status: accept ? "accepted" : "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", invitationId)

      if (error) throw error

      // Créer une notification pour l'inviteur
      const invitation = pendingInvitations.find(i => i.id === invitationId)
      if (invitation) {
        await supabase.from("notifications").insert({
          user_id: invitation.invited_by,
          establishment_id: establishmentId,
          type: "room_invitation",
          title: accept ? "Invitation acceptée" : "Invitation refusée",
          message: accept 
            ? "Votre invitation a été acceptée"
            : "Votre invitation a été refusée",
          invitation_id: invitationId,
          triggered_by: currentTeacherId
        })

        // Si accepté, enregistrer l'approbation pour les futures salles
        if (accept) {
          await supabase.from("collaborative_approvals").upsert({
            teacher_id: currentTeacherId,
            approved_teacher_id: invitation.invited_by,
            establishment_id: establishmentId
          }, {
            onConflict: "teacher_id,approved_teacher_id"
          })
        }
      }

      toast({
        title: accept ? "Invitation acceptée" : "Invitation refusée",
        description: accept 
          ? "Vous pouvez maintenant accéder à cette salle collaborative"
          : "L'invitation a été refusée"
      })

      fetchInvitations()
      onInvitationResponse?.()

    } catch (error) {
      console.error("Error responding to invitation:", error)
      toast({
        title: "Erreur",
        description: "Impossible de répondre à l'invitation",
        variant: "destructive"
      })
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invitations salles collaboratives
          </DialogTitle>
          <DialogDescription>
            Gérez vos invitations pour les salles collaboratives
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === "received" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("received")}
          >
            <Mail className="h-4 w-4 mr-2" />
            Reçues
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingInvitations.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "sent" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sent")}
          >
            Envoyées
            <Badge variant="outline" className="ml-2">
              {sentInvitations.length}
            </Badge>
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeTab === "received" ? (
            pendingInvitations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Aucune invitation en attente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.map((invitation) => (
                  <div 
                    key={invitation.id}
                    className="border rounded-lg p-4 space-y-3 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">
                          {invitation.sub_rooms?.custom_name || invitation.sub_rooms?.name}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <DoorOpen className="h-3 w-3" />
                          {invitation.rooms?.name} ({invitation.rooms?.code})
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        Invitation de{" "}
                        <strong className="text-foreground">
                          {invitation.invited_by_profile?.first_name}{" "}
                          {invitation.invited_by_profile?.last_name}
                        </strong>
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(invitation.created_at)}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleResponse(invitation.id, true)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResponse(invitation.id, false)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            sentInvitations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Aucune invitation envoyée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentInvitations.map((invitation) => (
                  <div 
                    key={invitation.id}
                    className="border rounded-lg p-4 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {invitation.invited_teacher?.first_name}{" "}
                          {invitation.invited_teacher?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {invitation.sub_rooms?.custom_name || invitation.sub_rooms?.name}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          invitation.status === "accepted" 
                            ? "bg-green-50 text-green-700"
                            : invitation.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }
                      >
                        {invitation.status === "accepted" && <Check className="h-3 w-3 mr-1" />}
                        {invitation.status === "rejected" && <X className="h-3 w-3 mr-1" />}
                        {invitation.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {invitation.status === "accepted" ? "Acceptée" : 
                         invitation.status === "rejected" ? "Refusée" : "En attente"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(invitation.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook pour envoyer des invitations
export function useSendInvitation(establishmentId: string, currentTeacherId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function checkApproval(otherTeacherId: string): Promise<boolean> {
    const { data } = await supabase
      .from("collaborative_approvals")
      .select("id")
      .eq("teacher_id", otherTeacherId)
      .eq("approved_teacher_id", currentTeacherId)
      .single()
    
    return !!data
  }

  async function sendInvitation(
    roomId: string, 
    subRoomId: string, 
    teacherId: string
  ): Promise<{ needsApproval: boolean; invitationId?: string }> {
    
    // Vérifier si le prof a déjà approuvé
    const alreadyApproved = await checkApproval(teacherId)
    
    if (alreadyApproved) {
      // Pas besoin d'invitation, ajouter directement
      return { needsApproval: false }
    }

    // Créer l'invitation
    const { data, error } = await supabase
      .from("room_invitations")
      .insert({
        room_id: roomId,
        sub_room_id: subRoomId,
        invited_teacher_id: teacherId,
        invited_by: currentTeacherId,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    // Créer notification
    const { data: teacher } = await supabase
      .from("teachers")
      .select("profile_id")
      .eq("id", teacherId)
      .single()

    if (teacher?.profile_id) {
      await supabase.from("notifications").insert({
        user_id: teacher.profile_id,
        establishment_id: establishmentId,
        type: "room_invitation",
        title: "Nouvelle invitation collaborative",
        message: "Vous avez reçu une invitation pour une salle collaborative",
        invitation_id: data.id,
        triggered_by: currentTeacherId
      })
    }

    return { needsApproval: true, invitationId: data.id }
  }

  return { sendInvitation, checkApproval }
}
