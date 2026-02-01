"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/components/ui/use-toast"

interface CreateProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  establishmentId: string
  userId: string
  userRole?: string
  onSuccess: () => void
}

interface Room {
  id: string
  name: string
  code: string
}

interface SubRoom {
  id: string
  name: string
  seat_assignments: any
  room_id: string
}

interface Teacher {
  id: string
  first_name: string
  last_name: string
  subject: string
}

export function CreateProposalDialog({
  open,
  onOpenChange,
  establishmentId,
  userId,
  userRole,
  onSuccess,
}: CreateProposalDialogProps) {
  const [name, setName] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [selectedSubRoomId, setSelectedSubRoomId] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  // Delegates must use existing sub-rooms, not physical rooms
  const isDelegateOrEco = userRole === "delegue" || userRole === "eco-delegue"
  const [useExistingSubRoom, setUseExistingSubRoom] = useState(isDelegateOrEco)
  const [rooms, setRooms] = useState<Room[]>([])
  const [subRooms, setSubRooms] = useState<SubRoom[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classId, setClassId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, establishmentId, userId])

  useEffect(() => {
    if (useExistingSubRoom && selectedTeacherId && classId) {
      fetchSubRooms()
    } else {
      setSubRooms([])
      setSelectedSubRoomId("")
    }
  }, [useExistingSubRoom, selectedTeacherId, classId])

  async function fetchData() {
    try {
      const { data: studentData } = await supabase.from("students").select("class_id").eq("profile_id", userId).single()

      if (studentData) {
        setClassId(studentData.class_id)

        const { data: teacherClassData } = await supabase
          .from("teacher_classes")
          .select("teacher_id, teachers(id, first_name, last_name, subject)")
          .eq("class_id", studentData.class_id)

        if (teacherClassData) {
          const uniqueTeachers = teacherClassData
            .map((tc: any) => tc.teachers)
            .filter(
              (teacher: any, index: number, self: any[]) =>
                teacher && self.findIndex((t) => t?.id === teacher?.id) === index,
            )
            .sort((a: Teacher, b: Teacher) =>
              `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`),
            )
          setTeachers(uniqueTeachers)
        }
      }

      // Fetch rooms
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id, name, code")
        .eq("establishment_id", establishmentId)
        .order("name")

      if (roomsData) {
        setRooms(roomsData)
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    }
  }

  async function fetchSubRooms() {
    try {
      // Get teacher's profile_id to find sub-rooms they created or are assigned to
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("profile_id")
        .eq("id", selectedTeacherId)
        .single()

      if (!teacherData) {
        console.log("[CreateProposal] Teacher not found for id:", selectedTeacherId)
        setSubRooms([])
        return
      }

      // Fetch sub-rooms that:
      // 1. Belong to the selected teacher (teacher_id matches)
      // 2. Contain the delegate's class (class_ids contains classId)
      const { data: subRoomsData, error } = await supabase
        .from("sub_rooms")
        .select("id, name, seat_assignments, room_id")
        .eq("teacher_id", selectedTeacherId)
        .contains("class_ids", [classId])
        .order("name")

      if (error) {
        console.error("[CreateProposal] Error fetching sub-rooms:", error)
        setSubRooms([])
        return
      }

      console.log("[CreateProposal] Found", subRoomsData?.length || 0, "sub-rooms for teacher", selectedTeacherId)
      setSubRooms(subRoomsData || [])
    } catch (error) {
      console.error("[CreateProposal] Exception:", error)
      setSubRooms([])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name || !selectedTeacherId || !classId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    if (useExistingSubRoom && !selectedSubRoomId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une sous-salle",
        variant: "destructive",
      })
      return
    }

    if (!useExistingSubRoom && !selectedRoomId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une salle",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let seatAssignments: any[] = []
      let roomId = selectedRoomId

      if (useExistingSubRoom && selectedSubRoomId) {
        const subRoom = subRooms.find((sr) => sr.id === selectedSubRoomId)
        if (subRoom) {
          // Get room_id from the sub_room
          roomId = subRoom.room_id
          
          // Fetch actual seat assignments from seating_assignments table
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from("seating_assignments")
            .select("student_id, seat_position")
            .eq("sub_room_id", selectedSubRoomId)
          
          if (assignmentsError) {
            console.error("[CreateProposal] Error fetching seat assignments:", assignmentsError)
          }
          
          if (assignmentsData && assignmentsData.length > 0) {
            // Convert to the format expected by proposals: [{seat_id, student_id, seat_number}]
            seatAssignments = assignmentsData.map((a: any) => ({
              seat_id: `seat-${a.seat_position}`,
              student_id: a.student_id,
              seat_number: a.seat_position,
            }))
            console.log("[CreateProposal] Imported", seatAssignments.length, "seat assignments from sub-room:", selectedSubRoomId)
          } else {
            console.log("[CreateProposal] No existing seat assignments found for sub-room:", selectedSubRoomId)
            seatAssignments = []
          }
        }
      }

      const { error } = await supabase.from("sub_room_proposals").insert({
        name,
        room_id: roomId,
        class_id: classId,
        teacher_id: selectedTeacherId,
        proposed_by: userId,
        establishment_id: establishmentId,
        status: "draft",
        is_submitted: false,
        seat_assignments: seatAssignments,
        sub_room_id: useExistingSubRoom ? selectedSubRoomId : null,
      })

      if (error) throw error

      toast({
        title: "Succès",
        description: "Proposition créée avec succès",
      })

      // Reset form
      setName("")
      setSelectedRoomId("")
      setSelectedSubRoomId("")
      setSelectedTeacherId("")
      setUseExistingSubRoom(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la proposition",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle proposition de plan</DialogTitle>
          <DialogDescription>Créez une proposition de plan de classe pour un de vos professeurs</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la proposition</Label>
            <Input
              id="name"
              placeholder="Ex: Plan pour contrôle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Professeur destinataire</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} required>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Sélectionner un professeur" />
              </SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">Aucun professeur disponible</div>
                ) : (
                  teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name} - {teacher.subject}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Only show choice for non-delegates */}
          {!isDelegateOrEco && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useExisting"
                checked={useExistingSubRoom}
                onCheckedChange={(checked) => setUseExistingSubRoom(checked === true)}
              />
              <Label htmlFor="useExisting" className="text-sm font-normal cursor-pointer">
                Créer à partir d'une sous-salle existante
              </Label>
            </div>
          )}

          {/* Delegates must use existing sub-rooms - show info message */}
          {isDelegateOrEco && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                En tant que délégué, vous devez créer votre proposition à partir d'une sous-salle existante de votre professeur.
              </p>
            </div>
          )}

          {/* Sub-room selection - always shown for delegates, optional for others */}
          {(isDelegateOrEco || useExistingSubRoom) && (
            <div className="space-y-2">
              <Label htmlFor="subroom">Sous-salle de référence</Label>
              <Select
                value={selectedSubRoomId}
                onValueChange={setSelectedSubRoomId}
                required
                disabled={!selectedTeacherId}
              >
                <SelectTrigger id="subroom">
                  <SelectValue
                    placeholder={
                      selectedTeacherId ? "Sélectionner une sous-salle" : "Sélectionnez d'abord un professeur"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subRooms.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {selectedTeacherId ? "Aucune sous-salle disponible pour ce professeur" : "Sélectionnez un professeur"}
                    </div>
                  ) : (
                    subRooms.map((subRoom) => (
                      <SelectItem key={subRoom.id} value={subRoom.id}>
                        {subRoom.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Le plan actuel de cette sous-salle sera repris. Une fois validé, il remplacera la sous-salle d'origine.
              </p>
            </div>
          )}
          
          {/* Physical room selection - ONLY for non-delegates when not using existing sub-room */}
          {!isDelegateOrEco && !useExistingSubRoom && (
            <div className="space-y-2">
              <Label htmlFor="room">Salle physique</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId} required>
                <SelectTrigger id="room">
                  <SelectValue placeholder="Sélectionner une salle" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
