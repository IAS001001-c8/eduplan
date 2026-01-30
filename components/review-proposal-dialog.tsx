"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, CheckCircle2, XCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/components/ui/use-toast"
import { notifyProposalStatusChange } from "@/lib/notifications"

interface ReviewProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: any
  userRole: string
  userId: string
  onSuccess: () => void
  onEditInEditor?: (proposal: any) => void
}

export function ReviewProposalDialog({
  open,
  onOpenChange,
  proposal,
  userRole,
  userId,
  onSuccess,
  onEditInEditor,
}: ReviewProposalDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | "return" | null>(null)
  const [returnComments, setReturnComments] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const isTeacher = userRole === "professeur"
  const isPending = proposal?.status === "pending"

  async function handleApprove() {
    if (!proposal) return

    setIsLoading(true)
    setAction("approve")

    try {

      if (proposal.sub_room_id) {
        // Update existing sub-room

        // Delete old assignments
        const { error: deleteError } = await supabase
          .from("seating_assignments")
          .delete()
          .eq("sub_room_id", proposal.sub_room_id)

        if (deleteError) {
          throw deleteError
        }

        // Insert new assignments if they exist
        if (proposal.seat_assignments && proposal.seat_assignments.length > 0) {
          const assignments = proposal.seat_assignments.map((assignment: any) => ({
            sub_room_id: proposal.sub_room_id,
            seat_id: assignment.seat_id,
            student_id: assignment.student_id,
            seat_position: assignment.seat_number, // Use seat_position instead of seat_number
          }))

          const { error: assignmentsError } = await supabase.from("seating_assignments").insert(assignments)

          if (assignmentsError) {
            throw assignmentsError
          }

        }
      } else {
        // Create new sub-room

        const { data: subRoomData, error: subRoomError } = await supabase
          .from("sub_rooms")
          .insert({
            room_id: proposal.room_id,
            teacher_id: proposal.teacher_id,
            name: proposal.name,
            class_ids: [proposal.class_id],
            created_by: userId,
          })
          .select()
          .single()

        if (subRoomError) {
          throw subRoomError
        }


        // Copy seating assignments if they exist
        if (proposal.seat_assignments && proposal.seat_assignments.length > 0) {
          const assignments = proposal.seat_assignments.map((assignment: any) => ({
            sub_room_id: subRoomData.id,
            seat_id: assignment.seat_id,
            student_id: assignment.student_id,
            seat_position: assignment.seat_number, // Use seat_position instead of seat_number
          }))

          const { error: assignmentsError } = await supabase.from("seating_assignments").insert(assignments)

          if (assignmentsError) {
          } else {
          }
        }

        // Update proposal with sub_room_id
        const { error: updateProposalError } = await supabase
          .from("sub_room_proposals")
          .update({
            sub_room_id: subRoomData.id,
            status: "approved",
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", proposal.id)

        if (updateProposalError) {
          throw updateProposalError
        }

      }

      // Update proposal status if not already done
      if (proposal.sub_room_id) {
        const { error: updateError } = await supabase
          .from("sub_room_proposals")
          .update({
            status: "approved",
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", proposal.id)

        if (updateError) throw updateError
      }

      const { data: profileData } = await supabase.from("profiles").select("establishment_id").eq("id", userId).single()

      await notifyProposalStatusChange(
        proposal.id,
        proposal.proposed_by,
        "approved",
        proposal.name,
        profileData?.establishment_id || "",
      )

      toast({
        title: "Succès",
        description: proposal.sub_room_id
          ? "Sous-salle mise à jour avec succès"
          : "Proposition validée et sous-salle créée",
        className: "z-[9999]", // Added z-index for toast visibility
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de valider la proposition",
        variant: "destructive",
        className: "z-[9999]",
      })
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  async function handleReject() {
    if (!proposal || !rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison pour le refus",
        variant: "destructive",
        className: "z-[9999]",
      })
      return
    }

    setIsLoading(true)
    setAction("reject")

    try {
      const { data: profileData } = await supabase.from("profiles").select("establishment_id").eq("id", userId).single()

      const { error } = await supabase
        .from("sub_room_proposals")
        .update({
          status: "rejected",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", proposal.id)

      if (error) throw error

      await notifyProposalStatusChange(
        proposal.id,
        proposal.proposed_by,
        "rejected",
        proposal.name,
        profileData?.establishment_id || "",
        rejectionReason,
      )

      toast({
        title: "Proposition refusée",
        description: "Le délégué a été notifié du refus",
        className: "z-[9999]",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de refuser la proposition",
        variant: "destructive",
        className: "z-[9999]",
      })
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  async function handleReturn() {
    if (!proposal || !returnComments.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer des commentaires pour le délégué",
        variant: "destructive",
        className: "z-[9999]",
      })
      return
    }

    setIsLoading(true)
    setAction("return")

    try {
      const { data: profileData } = await supabase.from("profiles").select("establishment_id").eq("id", userId).single()

      const { error } = await supabase
        .from("sub_room_proposals")
        .update({
          status: "draft",
          teacher_comments: returnComments,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", proposal.id)

      if (error) throw error

      await notifyProposalStatusChange(
        proposal.id,
        proposal.proposed_by,
        "returned",
        proposal.name,
        profileData?.establishment_id || "",
        returnComments,
      )

      toast({
        title: "Proposition renvoyée",
        description: "Le délégué a été notifié et peut maintenant modifier la proposition",
        className: "z-[9999]",
      })

      onSuccess()
      onOpenChange(false)
      setReturnComments("")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de renvoyer la proposition",
        variant: "destructive",
        className: "z-[9999]",
      })
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  if (!proposal) return null

  const getStatusBadge = () => {
    switch (proposal.status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Validée
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Refusée
          </Badge>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl z-[9999]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{proposal.name}</DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogDescription>Proposition de plan de classe pour {proposal.classes?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Salle</p>
              <p className="font-medium">
                {proposal.rooms?.name} ({proposal.rooms?.code})
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Classe</p>
              <p className="font-medium">{proposal.classes?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Proposé par</p>
              <p className="font-medium">
                {proposal.proposed_by_profile?.first_name} {proposal.proposed_by_profile?.last_name}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Pour</p>
              <p className="font-medium">
                {proposal.teachers?.first_name} {proposal.teachers?.last_name}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Date de création</p>
              <p className="font-medium">
                {new Date(proposal.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {proposal.reviewed_at && (
              <div>
                <p className="text-muted-foreground">Date de révision</p>
                <p className="font-medium">
                  {new Date(proposal.reviewed_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {proposal.comments && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="font-semibold text-sm mb-1">Commentaires</p>
              <p className="text-sm">{proposal.comments}</p>
            </div>
          )}

          {proposal.status === "rejected" && proposal.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="font-semibold text-red-900 mb-1">Raison du refus</p>
              <p className="text-sm text-red-700">{proposal.rejection_reason}</p>
            </div>
          )}

          {proposal.status === "approved" && proposal.reviewed_by_profile && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-sm text-green-700">
                Cette proposition a été validée par {proposal.reviewed_by_profile.first_name}{" "}
                {proposal.reviewed_by_profile.last_name}
                {proposal.sub_room_id && " et une sous-salle a été créée."}
              </p>
            </div>
          )}

          {isPending && isTeacher && (
            <div className="space-y-4 pt-4">
              {/* Button to edit in editor */}
              {onEditInEditor && (
                <Button
                  variant="outline"
                  onClick={() => onEditInEditor(proposal)}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier le plan dans l'éditeur
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="return-comments">Commentaires pour le délégué (optionnel)</Label>
                <Textarea
                  id="return-comments"
                  placeholder="Ex: Pouvez-vous placer les élèves turbulents plus près du tableau..."
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Raison du refus définitif (si refusée)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Ex: Le plan ne convient pas pour ce type de cours..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReturn}
                  disabled={isLoading || !returnComments.trim()}
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  {isLoading && action === "return" ? "Renvoi..." : "Renvoyer avec commentaires"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={isLoading || !rejectionReason.trim()}
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  {isLoading && action === "reject" ? "Refus..." : "Refuser définitivement"}
                </Button>
                <Button onClick={handleApprove} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-2" />
                  {isLoading && action === "approve" ? "Validation..." : "Valider"}
                </Button>
              </div>
            </div>
          )}

          {!isPending && (
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
