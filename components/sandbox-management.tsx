"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, Clock, CheckCircle2, XCircle, Eye, Edit, FileText, Trash2, ChevronRight, Users, BookOpen, RotateCcw, MessageSquare } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/components/ui/use-toast"
import { CreateProposalDialog } from "@/components/create-proposal-dialog"
import { ReviewProposalDialog } from "@/components/review-proposal-dialog"
import { SeatingPlanEditor } from "@/components/seating-plan-editor"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { ViewToggle } from "@/components/view-toggle"
import { RoomSeatPreview } from "@/components/room-seat-preview"

interface SandboxManagementProps {
  establishmentId: string
  userRole: string
  userId: string
  onBack: () => void
}

interface Proposal {
  id: string
  name: string
  status: "draft" | "pending" | "approved" | "rejected" | "returned"
  is_submitted: boolean
  created_at: string
  room_id: string
  class_id: string
  teacher_id: string
  sub_room_id?: string
  seat_assignments?: any[]
  comments?: string
  teacher_comments?: string
  proposed_by: string
  establishment_id?: string
  rooms: { name: string; code: string }
  classes: { name: string }
  teachers: { first_name: string; last_name: string }
  proposed_by_profile: { first_name: string; last_name: string }
  reviewed_by_profile?: { first_name: string; last_name: string }
  reviewed_at?: string
  rejection_reason?: string
}

export function SandboxManagement({ establishmentId, userRole, userId, onBack }: SandboxManagementProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [proposalsToDelete, setProposalsToDelete] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [rooms, setRooms] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchProposals()
    fetchRooms()
  }, [establishmentId, userRole, userId])

  async function fetchRooms() {
    const { data } = await supabase
      .from("rooms")
      .select("id, name, code, config, board_position")
      .eq("establishment_id", establishmentId)
    setRooms(data || [])
  }

  async function fetchProposals() {
    setIsLoading(true)
    try {

      let query = supabase
        .from("sub_room_proposals")
        .select(`
          id,
          name,
          status,
          is_submitted,
          created_at,
          reviewed_at,
          rejection_reason,
          teacher_comments,
          room_id,
          class_id,
          teacher_id,
          sub_room_id,
          seat_assignments,
          comments,
          proposed_by,
          establishment_id,
          rooms:room_id (name, code),
          classes:class_id (name),
          teachers:teacher_id (first_name, last_name),
          proposed_by_profile:proposed_by (first_name, last_name),
          reviewed_by_profile:reviewed_by (first_name, last_name)
        `)
        .order("created_at", { ascending: false })

      if (userRole === "delegue" || userRole === "eco-delegue") {
        query = query.eq("proposed_by", userId)
      } else if (userRole === "professeur") {
        const { data: teacherData } = await supabase.from("teachers").select("id").eq("profile_id", userId).single()

        if (teacherData) {
          query = query.eq("teacher_id", teacherData.id)
        }
      }

      const { data, error } = await query

      if (error) throw error

      setProposals((data as Proposal[]) || [])
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les propositions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (proposal: Proposal) => {
    // "returned" status means the proposal was sent back for revision (is_submitted becomes false again)
    // Check for teacher_comments to identify returned proposals
    if (!proposal.is_submitted && proposal.teacher_comments) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
          <RotateCcw className="w-3 h-3 mr-1" />
          À revoir
        </Badge>
      )
    }
    
    if (!proposal.is_submitted) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
          <FileText className="w-3 h-3 mr-1" />
          Brouillon
        </Badge>
      )
    }

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
      default:
        return null
    }
  }

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setIsEditorOpen(true)
  }

  const handleReviewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    // For teachers with pending proposals, show review dialog with validation options
    setIsReviewDialogOpen(true)
  }

  const handleEditInEditor = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setIsReviewDialogOpen(false)
    setIsEditorOpen(true)
  }

  const handleDeleteProposals = async () => {
    try {
      const { error } = await supabase.from("sub_room_proposals").delete().in("id", proposalsToDelete)

      if (error) throw error

      toast({
        title: "Suppression réussie",
        description: `${proposalsToDelete.length} brouillon(s) supprimé(s)`,
      })

      setSelectedProposalIds([])
      setProposalsToDelete([])
      fetchProposals()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les brouillons",
        variant: "destructive",
      })
    }
  }

  const handleToggleSelection = (proposalId: string) => {
    setSelectedProposalIds((prev) =>
      prev.includes(proposalId) ? prev.filter((id) => id !== proposalId) : [...prev, proposalId],
    )
  }

  const handleSelectAll = () => {
    const draftProposals = proposals.filter((p) => !p.is_submitted)
    if (selectedProposalIds.length === draftProposals.length) {
      setSelectedProposalIds([])
    } else {
      setSelectedProposalIds(draftProposals.map((p) => p.id))
    }
  }

  const openDeleteDialog = (proposalIds: string[]) => {
    setProposalsToDelete(proposalIds)
    setIsDeleteDialogOpen(true)
  }

  const isDelegateOrEco = userRole === "delegue" || userRole === "eco-delegue"
  const isTeacher = userRole === "professeur"

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bac à sable</h1>
            <p className="text-muted-foreground">
              {isDelegateOrEco && "Créez et proposez des plans de classe à vos professeurs"}
              {isTeacher && "Validez ou modifiez les propositions de plans de classe"}
              {userRole === "vie-scolaire" && "Consultez toutes les propositions de l'établissement"}
            </p>
          </div>
        </div>

        {isDelegateOrEco && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle proposition
          </Button>
        )}
      </div>

      {/* Selection controls for drafts */}
      {isDelegateOrEco && proposals.some((p) => !p.is_submitted) && (
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedProposalIds.length === proposals.filter((p) => !p.is_submitted).length &&
                proposals.filter((p) => !p.is_submitted).length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">Sélectionner tous les brouillons</span>
          </div>

          {selectedProposalIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openDeleteDialog(selectedProposalIds)}
              className="ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer ({selectedProposalIds.length})
            </Button>
          )}
        </div>
      )}

      {/* Proposals List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des propositions...</p>
          </div>
        </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {isDelegateOrEco && "Aucune proposition créée. Commencez par en créer une !"}
              {isTeacher && "Aucune proposition en attente de validation"}
              {userRole === "vie-scolaire" && "Aucune proposition dans l'établissement"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
        {/* View Toggle */}
        <div className="flex justify-end mb-4">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
        </div>
        
        {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => {
            const room = rooms.find(r => r.id === proposal.room_id)
            const columns = room?.config?.columns || []
            
            return (
            <Card key={proposal.id} className="hover:shadow-lg transition-shadow relative">
              {/* Checkbox for draft proposals */}
              {isDelegateOrEco && !proposal.is_submitted && (
                <div className="absolute top-4 left-4 z-10">
                  <Checkbox
                    checked={selectedProposalIds.includes(proposal.id)}
                    onCheckedChange={() => handleToggleSelection(proposal.id)}
                  />
                </div>
              )}

              <CardHeader className={isDelegateOrEco && !proposal.is_submitted ? "pl-12" : ""}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{proposal.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {proposal.rooms?.name} - {proposal.classes?.name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(proposal)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Seat Preview */}
                <div className="flex justify-center py-2">
                  <RoomSeatPreview 
                    columns={columns}
                    boardPosition={room?.board_position}
                    maxWidth={160}
                    maxHeight={90}
                  />
                </div>
                
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    Proposé par:{" "}
                    <span className="font-medium text-foreground">
                      {proposal.proposed_by_profile?.first_name} {proposal.proposed_by_profile?.last_name}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Pour:{" "}
                    <span className="font-medium text-foreground">
                      {proposal.teachers?.first_name} {proposal.teachers?.last_name}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(proposal.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {proposal.status === "rejected" && proposal.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-700">
                      <span className="font-semibold">Raison du refus:</span> {proposal.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Show teacher comments for returned proposals */}
                {!proposal.is_submitted && proposal.teacher_comments && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-2">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-orange-800 mb-1">Message du professeur :</p>
                        <p className="text-xs text-orange-700">{proposal.teacher_comments}</p>
                      </div>
                    </div>
                  </div>
                )}

                {proposal.status === "approved" && proposal.reviewed_by_profile && (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-xs text-green-700">
                      Validée par {proposal.reviewed_by_profile.first_name} {proposal.reviewed_by_profile.last_name}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {/* Draft proposals (new or returned) for delegates */}
                  {isDelegateOrEco && !proposal.is_submitted && (
                    <>
                      <Button
                        size="sm"
                        variant={proposal.teacher_comments ? "default" : "outline"}
                        onClick={() => handleEditProposal(proposal)}
                        className={`flex-1 ${proposal.teacher_comments ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {proposal.teacher_comments ? "Modifier et resoumettre" : "Éditer"}
                      </Button>
                      {!proposal.teacher_comments && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog([proposal.id])}
                          className="px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}

                  {isDelegateOrEco && proposal.status === "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => handleEditProposal(proposal)} className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier et resoumettre
                    </Button>
                  )}

                  {proposal.status === "pending" && isTeacher && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleReviewProposal(proposal)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Réviser
                    </Button>
                  )}

                  {(proposal.status === "approved" || (proposal.status === "pending" && isDelegateOrEco)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewProposal(proposal)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Voir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
        ) : (
        /* TABLE VIEW - Compact */
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {isDelegateOrEco && <th className="w-10 px-3 py-2"></th>}
                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Nom</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 hidden sm:table-cell">Salle / Classe</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell">Professeur</th>
                <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-300">Statut</th>
                <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-300 hidden sm:table-cell">Date</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {proposals.map((proposal) => (
                <tr 
                  key={proposal.id} 
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    selectedProposalIds.includes(proposal.id) ? "bg-amber-50 dark:bg-amber-900/20" : ""
                  }`}
                  onClick={() => handleReviewProposal(proposal)}
                >
                  {isDelegateOrEco && (
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      {!proposal.is_submitted && (
                        <Checkbox
                          checked={selectedProposalIds.includes(proposal.id)}
                          onCheckedChange={() => handleToggleSelection(proposal.id)}
                        />
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{proposal.name}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                    {proposal.rooms?.name} / {proposal.classes?.name}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">
                    {proposal.teachers?.first_name} {proposal.teachers?.last_name}
                  </td>
                  <td className="px-3 py-2 text-center">{getStatusBadge(proposal)}</td>
                  <td className="px-3 py-2 text-center text-muted-foreground text-xs hidden sm:table-cell">
                    {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {isDelegateOrEco && !proposal.is_submitted && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEditProposal(proposal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog([proposal.id])} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {proposal.status === "pending" && isTeacher && (
                        <Button variant="default" size="sm" onClick={() => handleReviewProposal(proposal)}>
                          Réviser
                        </Button>
                      )}
                      {(proposal.status === "approved" || proposal.status === "pending") && (
                        <Button variant="ghost" size="sm" onClick={() => handleReviewProposal(proposal)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        </>
      )}

      {/* Dialogs */}
      <CreateProposalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        establishmentId={establishmentId}
        userId={userId}
        userRole={userRole}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          fetchProposals()
        }}
      />

      {selectedProposal && isEditorOpen && (
        <SandboxEditor
          proposal={selectedProposal}
          userRole={userRole}
          userId={userId}
          establishmentId={establishmentId}
          onClose={() => {
            setIsEditorOpen(false)
            setSelectedProposal(null)
            fetchProposals()
          }}
        />
      )}

      <ReviewProposalDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        proposal={selectedProposal}
        userRole={userRole}
        userId={userId}
        onSuccess={() => {
          setIsReviewDialogOpen(false)
          fetchProposals()
        }}
        onEditInEditor={handleEditInEditor}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProposals}
        itemCount={proposalsToDelete.length}
        itemType="brouillon"
      />
    </div>
  )
}

interface SandboxEditorProps {
  proposal: Proposal
  userRole: string
  userId: string
  onClose: () => void
  establishmentId: string
}

function SandboxEditor({ proposal, userRole, userId, onClose, establishmentId }: SandboxEditorProps) {
  const [room, setRoom] = useState<any>(null)
  const [subRoom, setSubRoom] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadProposalData()
  }, [proposal])

  async function loadProposalData() {
    try {
      // Load room
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", proposal.room_id)
        .single()

      if (roomError) throw roomError
      setRoom(roomData)

      // Create a temporary sub_room object for the editor
      const tempSubRoom = {
        id: proposal.id,
        name: proposal.name,
        room_id: proposal.room_id,
        class_ids: [proposal.class_id],
        establishment_id: establishmentId,
        is_sandbox: true, // Flag to indicate this is a sandbox proposal
        proposal_data: {
          ...proposal,
          establishment_id: establishmentId,
        },
      }

      setSubRoom(tempSubRoom)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'éditeur...</p>
        </div>
      </div>
    )
  }

  if (!room || !subRoom) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur de chargement</p>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </div>
    )
  }

  return (
    <SeatingPlanEditor
      subRoom={subRoom}
      room={room}
      onClose={onClose}
      isSandbox={true}
      userRole={userRole}
      userId={userId}
      establishmentId={establishmentId}
    />
  )
}
