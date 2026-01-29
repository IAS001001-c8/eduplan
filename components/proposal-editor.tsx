"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, Send, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProposalEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: any
  userRole: string
  userId: string
  onSuccess: () => void
}

export function ProposalEditor({ open, onOpenChange, proposal, userRole, userId, onSuccess }: ProposalEditorProps) {
  const [students, setStudents] = useState<any[]>([])
  const [seatingAssignments, setSeatingAssignments] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [comments, setComments] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [roomConfig, setRoomConfig] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const isDelegate = userRole === "delegue"
  const isTeacher = userRole === "professeur"
  const canEdit = (isDelegate && proposal?.status !== "approved") || isTeacher

  useEffect(() => {
    if (open && proposal) {
      loadProposalData()
    }
  }, [open, proposal])

  async function loadProposalData() {
    try {
      // Load students from class
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", proposal.class_id)
        .order("last_name")

      if (studentsError) throw studentsError
      setStudents(studentsData || [])

      // Load room config
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("config")
        .eq("id", proposal.room_id)
        .single()

      if (roomError) throw roomError
      setRoomConfig(roomData?.config)

      // Load existing seat assignments
      if (proposal.seat_assignments && Array.isArray(proposal.seat_assignments)) {
        setSeatingAssignments(proposal.seat_assignments)
      } else if (proposal.sub_room_id) {
        // Load from existing sub-room if proposal was created from one
        const { data: subRoomData, error: subRoomError } = await supabase
          .from("seating_assignments")
          .select("*")
          .eq("sub_room_id", proposal.sub_room_id)

        if (!subRoomError && subRoomData) {
          setSeatingAssignments(subRoomData)
        }
      }

      setComments(proposal.comments || "")
    } catch (error: any) {
      console.error("[v0] Error loading proposal data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    }
  }

  async function handleSave() {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("sub_room_proposals")
        .update({
          seat_assignments: seatingAssignments,
          comments: comments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.id)

      if (error) throw error

      toast({
        title: "Sauvegardé",
        description: "Votre plan a été sauvegardé",
      })

      onSuccess()
    } catch (error: any) {
      console.error("[v0] Error saving proposal:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("sub_room_proposals")
        .update({
          seat_assignments: seatingAssignments,
          comments: comments,
          status: "pending",
          is_submitted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.id)

      if (error) throw error

      toast({
        title: "Proposition soumise",
        description: "Le professeur a été notifié",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error submitting proposal:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de soumettre",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleImpose() {
    if (!isTeacher) return

    setIsLoading(true)
    try {
      // Create sub-room with teacher's modifications
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

      if (subRoomError) throw subRoomError

      // Save seating assignments
      if (seatingAssignments.length > 0) {
        const assignments = seatingAssignments.map((assignment) => ({
          ...assignment,
          sub_room_id: subRoomData.id,
        }))

        const { error: assignmentsError } = await supabase.from("seating_assignments").insert(assignments)

        if (assignmentsError) throw assignmentsError
      }

      // Update proposal
      const { error: updateError } = await supabase
        .from("sub_room_proposals")
        .update({
          status: "approved",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          sub_room_id: subRoomData.id,
          comments: comments,
        })
        .eq("id", proposal.id)

      if (updateError) throw updateError

      toast({
        title: "Plan imposé",
        description: "La sous-salle a été créée avec vos modifications",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error imposing plan:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'imposer le plan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleSeatClick(seatId: string) {
    if (!canEdit) return

    if (selectedStudent) {
      // Assign student to seat
      const newAssignments = [...seatingAssignments]
      const existingIndex = newAssignments.findIndex((a) => a.seat_id === seatId)

      if (existingIndex >= 0) {
        newAssignments[existingIndex] = { seat_id: seatId, student_id: selectedStudent }
      } else {
        newAssignments.push({ seat_id: seatId, student_id: selectedStudent })
      }

      setSeatingAssignments(newAssignments)
      setSelectedStudent(null)
    } else {
      // Remove assignment
      setSeatingAssignments(seatingAssignments.filter((a) => a.seat_id !== seatId))
    }
  }

  const getStudentAtSeat = (seatId: string) => {
    const assignment = seatingAssignments.find((a) => a.seat_id === seatId)
    if (!assignment) return null
    return students.find((s) => s.id === assignment.student_id)
  }

  if (!proposal || !roomConfig) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isTeacher ? "Réviser la proposition" : "Éditer la proposition"} - {proposal.name}
          </DialogTitle>
        </DialogHeader>

        {proposal.status === "rejected" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Proposition refusée: {proposal.rejection_reason}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Students list */}
          <div className="col-span-1 space-y-2">
            <h3 className="font-semibold">Élèves</h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {students.map((student) => {
                const isPlaced = seatingAssignments.some((a) => a.student_id === student.id)
                const isSelected = selectedStudent === student.id

                return (
                  <Button
                    key={student.id}
                    variant={isSelected ? "default" : isPlaced ? "secondary" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedStudent(isSelected ? null : student.id)}
                    disabled={!canEdit}
                  >
                    {student.first_name} {student.last_name}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Room visualization */}
          <div className="col-span-2 border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Plan de classe</h3>
            <div className="flex gap-8 justify-center">
              {roomConfig.columns?.map((column: any, colIndex: number) => (
                <div key={colIndex} className="flex flex-col gap-4">
                  {Array.from({ length: column.tables }).map((_, tableIndex) => (
                    <div key={tableIndex} className="bg-amber-100 rounded p-2">
                      <div
                        className="grid gap-1"
                        style={{ gridTemplateColumns: `repeat(${column.seatsPerTable}, 1fr)` }}
                      >
                        {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => {
                          const seatId = `col${colIndex}-table${tableIndex}-seat${seatIndex}`
                          const student = getStudentAtSeat(seatId)

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={!canEdit}
                              className={`w-16 h-16 rounded border-2 text-xs p-1 ${
                                student
                                  ? "bg-emerald-500 text-white border-emerald-600"
                                  : "bg-white border-gray-300 hover:border-emerald-500"
                              } ${!canEdit ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {student ? `${student.first_name.charAt(0)}. ${student.last_name}` : "Vide"}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Commentaires</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ajoutez des commentaires ou notes..."
            rows={3}
            disabled={!canEdit}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>

          {canEdit && (
            <>
              <Button onClick={handleSave} disabled={isLoading} variant="secondary">
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>

              {isDelegate && proposal.status !== "pending" && (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Send className="w-4 h-4 mr-2" />
                  Soumettre au professeur
                </Button>
              )}

              {isTeacher && proposal.status === "pending" && (
                <Button onClick={handleImpose} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  Imposer ce plan
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
