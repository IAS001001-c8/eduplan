"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, MoreVertical, Plus, Trash, Share2, Copy } from "lucide-react"
import { SubRoomDialog } from "@/components/sub-room-dialog"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Room, RoomAssignment, SubRoom, UserRole } from "@/lib/types"

interface RoomDetailProps {
  room: Room
  roomAssignments: (RoomAssignment & { sub_rooms: SubRoom[] })[]
  userRole: UserRole
  userId: string
  establishmentId: string
}

export function RoomDetail({ room, roomAssignments: initialAssignments, userRole, userId }: RoomDetailProps) {
  const router = useRouter()
  const [roomAssignments, setRoomAssignments] = useState(initialAssignments)
  const [isSubRoomDialogOpen, setIsSubRoomDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  const handleCreateSubRoom = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId)
    setIsSubRoomDialogOpen(true)
  }

  const handleDeleteSubRoom = async (subRoomId: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("sub_rooms").delete().eq("id", subRoomId)

      if (error) throw error

      toast({
        title: "Sous-salle supprimée",
        description: "La sous-salle a été supprimée avec succès",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la sous-salle",
        variant: "destructive",
      })
    }
  }

  const handleToggleDelegatePermission = async (assignmentId: string, currentValue: boolean) => {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("room_assignments")
        .update({ is_modifiable_by_delegates: !currentValue })
        .eq("id", assignmentId)

      if (error) throw error

      toast({
        title: "Permissions mises à jour",
        description: !currentValue
          ? "Les délégués peuvent maintenant modifier cette salle"
          : "Les délégués ne peuvent plus modifier cette salle",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions",
        variant: "destructive",
      })
    }
  }

  const handleGenerateShareLink = async (assignmentId: string) => {
    setIsGeneratingLink(true)
    const supabase = createClient()

    try {
      // Generate a unique token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)

      // Create share link
      const { error } = await supabase.from("room_shares").insert({
        room_assignment_id: assignmentId,
        share_token: token,
      })

      if (error) throw error

      const link = `${window.location.origin}/share/${token}`
      setShareLink(link)
      setIsShareDialogOpen(true)

      toast({
        title: "Lien créé",
        description: "Le lien de partage a été créé avec succès",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le lien de partage",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast({
      title: "Lien copié",
      description: "Le lien a été copié dans le presse-papiers",
    })
  }

  const totalSeats = room.config.columns.reduce((total, col) => total + col.tables * col.seatsPerTable, 0)

  const canCreateSubRoom = userRole === "vie-scolaire" || userRole === "professeur"

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/rooms")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{room.name}</h1>
            <p className="text-muted-foreground">
              Code: {room.code} • {room.config.columns.length} colonne(s) • {totalSeats} places
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Affectations de classe</CardTitle>
            <CardDescription>{roomAssignments.length} classe(s) utilise(nt) cette salle</CardDescription>
          </CardHeader>
          <CardContent>
            {roomAssignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune classe n'utilise cette salle pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {roomAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{assignment.class_name}</CardTitle>
                          <CardDescription>{assignment.sub_rooms?.length || 0} sous-salle(s)</CardDescription>

                          <div className="flex items-center gap-2 mt-3">
                            <Switch
                              id={`delegate-${assignment.id}`}
                              checked={assignment.is_modifiable_by_delegates}
                              onCheckedChange={() =>
                                handleToggleDelegatePermission(assignment.id, assignment.is_modifiable_by_delegates)
                              }
                            />
                            <Label htmlFor={`delegate-${assignment.id}`} className="text-sm cursor-pointer">
                              Modifiable par les délégués
                            </Label>
                          </div>
                        </div>
                        {canCreateSubRoom && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCreateSubRoom(assignment.id)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Créer une sous-salle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateShareLink(assignment.id)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Partager
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    {assignment.sub_rooms && assignment.sub_rooms.length > 0 && (
                      <CardContent>
                        <div className="space-y-2">
                          {assignment.sub_rooms.map((subRoom) => (
                            <div
                              key={subRoom.id}
                              className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{subRoom.name}</span>
                                  <Badge variant={subRoom.type === "temporary" ? "default" : "secondary"}>
                                    {subRoom.type === "temporary" ? "Temporaire" : "Indéterminée"}
                                  </Badge>
                                </div>
                                {subRoom.type === "temporary" && subRoom.start_date && subRoom.end_date && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Du {format(new Date(subRoom.start_date), "PPP", { locale: fr })} au{" "}
                                    {format(new Date(subRoom.end_date), "PPP", { locale: fr })}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/rooms/${room.id}/subrooms/${subRoom.id}`)}
                                >
                                  Voir
                                </Button>
                                {canCreateSubRoom && (
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSubRoom(subRoom.id)}>
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager le plan de classe</DialogTitle>
            <DialogDescription>
              Partagez ce lien pour permettre à d'autres personnes de voir le plan de classe sans se connecter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShareDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAssignmentId && (
        <SubRoomDialog
          open={isSubRoomDialogOpen}
          onOpenChange={setIsSubRoomDialogOpen}
          roomAssignmentId={selectedAssignmentId}
          userId={userId}
          onSuccess={() => router.refresh()}
        />
      )}

      <Toaster />
    </div>
  )
}
