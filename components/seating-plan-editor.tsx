"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { createClient as createBrowserClient } from "@/lib/supabase/client" // Renamed for clarity
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
  Shuffle,
  ArrowDownAZ,
  ArrowUpAZ,
  Share2,
  Mail,
  Download,
  Link2,
  CheckCircle2,
  User,
  Send,
  History,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import cn from "classnames"
import { notifyPlanModified } from "@/lib/notifications"
import { exportSeatingPlanToPDF } from "@/lib/export-pdf"
import { HistoryDialog } from "@/components/history-dialog"
import { Toaster } from "@/components/ui/toaster" // Imported Toaster
import { useRouter } from "next/navigation" // Import useRouter for navigation
import { sendNotification } from "@/lib/notifications" // Import sendNotification

interface Student {
  id: string
  first_name: string
  last_name: string
  class_name: string
  role: string
  profile_id?: string | null // Added for notifications
  establishment_id?: string | null // Added for notifications
}

interface Room {
  id: string
  name: string
  code: string
  board_position: "top" | "bottom" | "left" | "right"
  config: {
    columns: {
      id: string
      tables: number
      seatsPerTable: number
    }[]
  }
}

interface SubRoom {
  id: string
  name: string
  room_id: string
  class_ids: string[]
  is_sandbox?: boolean // Added for sandbox functionality
  proposal_data?: {
    id: string
    proposed_by: string
    sub_room_id: string | null
    room_id: string
    teacher_id: string
    class_id: string
    name: string
    seat_assignments: { seat_id: string; student_id: string; seat_number: number }[]
    status: "pending" | "approved" | "rejected" | "draft"
    is_submitted: boolean
    reviewed_by: string | null
    reviewed_at: string | null
    created_at: string
    updated_at: string
    proposed_by: string
  }
}

interface SeatAssignment {
  student_id: string
  seat_number: number
}

interface SeatingPlanEditorProps {
  subRoom: SubRoom
  room?: Room
  onClose?: () => void
  onBack?: () => void
  isSandbox?: boolean // Added for sandbox functionality
  userRole?: string // Added for user role
  userId?: string // Added for user ID
}

// --- Added createClient function ---
const createClient = () => {
  // Assuming you have a function or import for creating a Supabase client in the browser context
  // Replace with your actual Supabase client creation logic if it's different
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
// --- End of added createClient function ---

export function SeatingPlanEditor({
  subRoom,
  room: initialRoom,
  onClose,
  onBack,
  isSandbox = false,
  userRole,
  userId,
}: SeatingPlanEditorProps) {
  const router = useRouter() // Initialize useRouter
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Map<number, string>>(new Map())
  const [savedAssignments, setSavedAssignments] = useState<Map<number, string>>(new Map())
  const [room, setRoom] = useState<Room | null>(initialRoom || null)
  // Changed draggedStudent to string | null to store only studentId
  const [draggedStudent, setDraggedStudent] = useState<string | null>(null)
  // Added state for dragging over the unplaced students area
  const [isDragOverUnplaced, setIsDragOverUnplaced] = useState(false)
  const [selectedSeatForDialog, setSelectedSeatForDialog] = useState<number | null>(null)
  const [seatDialogSearchQuery, setSeatDialogSearchQuery] = useState("") // Search in seat selection dialog
  const [isDragging, setIsDragging] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Added state for submitting proposals
  const [completeMethod, setCompleteMethod] = useState<"random" | "asc" | "desc">("random")
  // Simplified confirmation state
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false)
  // Changed studentToRemove to store only studentId
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null)
  // Renamed dontShowRemoveAgain to dontShowAgain for consistency
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [isLoadingRoom, setIsLoadingRoom] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null) // Added state for selected student
  const [clickedStudentInfo, setClickedStudentInfo] = useState<{student: Student, seatNumber: number} | null>(null) // Info popup for clicked student
  const [isHistoryOpen, setIsHistoryOpen] = useState(false) // History dialog state
  
  // States for sandbox review actions (professors)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [returnComments, setReturnComments] = useState("")

  // Memoized fetchData to prevent unnecessary re-renders and to satisfy dependency array
  const fetchData = useCallback(async () => {
    const supabase = createClient()

    console.log("[v0] Fetching data for sub-room:", subRoom.id)
    console.log("[v0] Sub-room class_ids:", subRoom.class_ids)

    // Ensure room is loaded before proceeding
    if (!room) {
      console.log("[v0] Room is not loaded, attempting to load...")
      // This part might be redundant if loadRoomData is always called first or if initialRoom is provided
      // However, to be safe, we can fetch it here if needed.
      // Consider if this fetch should happen within loadRoomData itself for better separation of concerns.
      const { data: roomData } = await supabase.from("rooms").select("*").eq("id", subRoom.room_id).single()

      if (roomData) {
        setRoom(roomData as Room) // Ensure type safety
        console.log("[v0] Room loaded:", roomData.name)
      } else {
        console.error("[v0] Room not found for sub_room:", subRoom.room_id)
        setRoomError("Configuration de la salle introuvable.") // Set error if room not found
        return // Stop fetching if room is not found
      }
    }

    if (!subRoom.class_ids || subRoom.class_ids.length === 0) {
      console.warn("[v0] No class_ids found for this sub-room")
      setStudents([])
      return
    }

    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, first_name, last_name, class_name, role, profile_id, establishment_id") // Added profile_id and establishment_id
      .in("class_id", subRoom.class_ids)
      .order("last_name")

    if (studentsError) {
      console.error("[v0] Error fetching students:", studentsError)
      // Handle student fetch error if necessary, e.g., by setting an error state
    }

    if (studentsData) {
      console.log("[v0] Students loaded:", studentsData.length)
      setStudents(studentsData)
    } else {
      setStudents([]) // Ensure students is an empty array if no data or error
    }

    // Fetch existing seat assignments
    if (isSandbox && subRoom.is_sandbox && subRoom.proposal_data?.seat_assignments) {
      console.log("[v0] Loading assignments from sandbox proposal")
      const assignmentMap = new Map<number, string>()
      subRoom.proposal_data.seat_assignments.forEach((a) => {
        assignmentMap.set(a.seat_number, a.student_id)
      })
      setAssignments(assignmentMap)
      setSavedAssignments(new Map(assignmentMap))
      console.log("[v0] Loaded", subRoom.proposal_data.seat_assignments.length, "seat assignments from proposal")
    } else {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("seating_assignments")
        .select("student_id, seat_position") // Removed seat_number
        .eq("sub_room_id", subRoom.id)

      if (assignmentsError) {
        console.error("[v0] Error fetching seating assignments:", assignmentsError)
        // Handle assignment fetch error if necessary
      }

      if (assignmentsData) {
        const assignmentMap = new Map<number, string>()
        assignmentsData.forEach((a: any) => {
          // Use a more specific type if possible
          assignmentMap.set(a.seat_position, a.student_id)
        })
        setAssignments(assignmentMap)
        setSavedAssignments(new Map(assignmentMap))
        console.log("[v0] Loaded", assignmentsData.length, "seat assignments")
      } else {
        setAssignments(new Map()) // Clear assignments if no data or error
        setSavedAssignments(new Map())
      }
    }
  }, [subRoom, room]) // Simplified dependencies

  useEffect(() => {
    // Load room data first
    async function loadRoomData() {
      console.log("[v0] Checking room data:", { room, subRoom })

      // If room is missing or doesn't have config.columns, load it
      if (!room || !room.config?.columns) {
        console.log("[v0] Room data incomplete, loading from database...")
        setIsLoadingRoom(true)
        setRoomError(null)

        try {
          const supabase = createClient()

          const { data, error } = await supabase.from("rooms").select("*").eq("id", subRoom.room_id).single()

          if (error) throw error

          if (!data) {
            throw new Error("Room not found")
          }

          console.log("[v0] Room loaded successfully:", data)
          setRoom(data as Room) // Type assertion for safety
          setRoomError(null)
        } catch (error) {
          console.error("[v0] Error loading room:", error)
          setRoomError("Impossible de charger la configuration de la salle")
        } finally {
          setIsLoadingRoom(false)
        }
      }
    }

    loadRoomData()
  }, [subRoom, room]) // Simplified dependencies

  // Effect to fetch data once room data is loaded or if initialRoom is provided
  useEffect(() => {
    // Only fetch data if room is available and not currently loading
    if (room && !isLoadingRoom && !roomError) {
      fetchData()
    }

    // Load the "don't show again" preference from localStorage
    const dontShow = localStorage.getItem("dontShowRemoveConfirmation")
    setDontShowAgain(dontShow === "true")
  }, [room, isLoadingRoom, roomError, fetchData]) // Dependencies for data fetching and preference loading

  const getTotalSeats = () => {
    if (!room?.config?.columns) {
      console.warn("[v0] getTotalSeats: room.config.columns is missing")
      return 0
    }
    return room.config.columns.reduce((total, col) => total + col.tables * col.seatsPerTable, 0)
  }

  const getUnassignedStudents = () => {
    const assignedIds = new Set(assignments.values())
    return students.filter((s) => !assignedIds.has(s.id))
  }

  const handleDragStart = (e: React.DragEvent | null, studentId: string) => {
    setDraggedStudent(studentId)
    if (e) {
      e.dataTransfer.setData("studentId", studentId)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, seatNumber: number) => {
    e.preventDefault()
    const studentId = e.dataTransfer.getData("studentId")
    if (!studentId) return

    const studentToPlace = students.find((s) => s.id === studentId)
    if (!studentToPlace) return

    const currentStudentIdInSeat = assignments.get(seatNumber)

    // If the seat is occupied by the dragged student, do nothing
    if (currentStudentIdInSeat === studentId) {
      setDraggedStudent(null)
      return
    }

    const newAssignments = new Map(assignments)

    // Find where the dragged student was sitting (if anywhere)
    const existingSeat = Array.from(newAssignments.entries()).find(
      ([_, id]) => id === studentId
    )?.[0]

    // If the target seat has another student, SWAP their positions
    if (currentStudentIdInSeat && existingSeat !== undefined) {
      // Swap: move the other student to the dragged student's old seat
      newAssignments.set(existingSeat, currentStudentIdInSeat)
      newAssignments.set(seatNumber, studentId)
      // No toast for swap - too many notifications
    } else {
      // Normal placement
      if (existingSeat !== undefined) {
        newAssignments.delete(existingSeat)
      }
      newAssignments.set(seatNumber, studentId)
      // No toast for placement - too many notifications
    }

    setAssignments(newAssignments)
    setDraggedStudent(null)
    setSelectedStudent(null)
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const supabase = createClient()

      console.log("[v0] Saving seating plan for sub-room:", subRoom.id)
      console.log("[v0] Number of assignments:", assignments.size)

      if (isSandbox && subRoom.is_sandbox) {
        // Save to sub_room_proposals
        const assignmentsToSave = Array.from(assignments.entries()).map(([seatNumber, studentId]) => ({
          seat_id: `seat-${seatNumber}`,
          student_id: studentId,
          seat_number: seatNumber, // Include seat_number
        }))

        const { error } = await supabase
          .from("sub_room_proposals")
          .update({
            seat_assignments: assignmentsToSave,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subRoom.id)

        if (error) throw error

        setSavedAssignments(new Map(assignments))

        toast({
          title: "Succès",
          description: "Votre plan a été sauvegardé",
          className: "z-[9999]",
        })
      } else {
        // Normal save to seating_assignments
        const { error: deleteError } = await supabase.from("seating_assignments").delete().eq("sub_room_id", subRoom.id)

        if (deleteError) {
          console.error("[v0] Error deleting existing assignments:", deleteError)
          throw deleteError
        }

        if (assignments.size > 0) {
          const assignmentsToSave = Array.from(assignments.entries()).map(([seatNumber, studentId]) => ({
            sub_room_id: subRoom.id,
            seat_id: `seat-${seatNumber}`,
            student_id: studentId,
            seat_position: seatNumber, // Use seat_position instead of seat_number
          }))

          console.log("[v0] Assignments to insert:", assignmentsToSave)

          const { error: insertError } = await supabase.from("seating_assignments").insert(assignmentsToSave)

          if (insertError) {
            console.error("[v0] Error inserting assignments:", insertError)
            console.error("[v0] Error details:", {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
            })
            throw insertError
          }

          console.log("[v0] Inserted assignments:", assignmentsToSave)
        }

        setSavedAssignments(new Map(assignments))

        // Notify students
        const classIds = subRoom.class_ids || []
        for (const classId of classIds) {
          const { data: studentsData } = await supabase
            .from("students")
            .select("id, profile_id, establishment_id") // Added profile_id and establishment_id
            .eq("class_id", classId)

          if (studentsData && studentsData.length > 0) {
            const establishmentId = studentsData[0].establishment_id // Use establishment_id from fetched students
            for (const student of studentsData) {
              if (student.profile_id && establishmentId) {
                // Replaced notifyPlanModified to include establishmentId
                await notifyPlanModified(subRoom.id, student.profile_id, subRoom.name, establishmentId)
              }
            }
          }
        }

        toast({
          title: "Succès",
          description: "Le plan de classe a été sauvegardé",
          className: "z-[9999]",
        })
      }
    } catch (error: any) {
      console.error("[v0] Error saving seating plan:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le plan",
        variant: "destructive",
        className: "z-[9999]",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!isSandbox || !subRoom.is_sandbox) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      console.log("[v0] === SUBMISSION DEBUG START ===")
      console.log("[v0] Full subRoom object:", JSON.stringify(subRoom, null, 2))
      console.log("[v0] subRoom.id:", subRoom.id)
      console.log("[v0] subRoom.proposal_data:", JSON.stringify(subRoom.proposal_data, null, 2))
      console.log("[v0] proposal_data.id exists?:", !!subRoom.proposal_data?.id)
      console.log("[v0] Using proposal ID:", subRoom.proposal_data?.id || "MISSING!")

      if (!subRoom.proposal_data?.id) {
        console.error("[v0] ERROR: proposal_data.id is missing!")
        throw new Error("ID de proposition manquant")
      }

      const updateData = {
        status: "pending",
        is_submitted: true,
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Update data:", updateData)
      console.log("[v0] Updating proposal with ID:", subRoom.proposal_data.id)

      const { data, error } = await supabase
        .from("sub_room_proposals")
        .update(updateData)
        .eq("id", subRoom.proposal_data.id)
        .select()

      console.log("[v0] === RESPONSE START ===")
      console.log("[v0] Response data:", data)
      console.log("[v0] Response error:", error)

      if (error) {
        console.error("[v0] === SUPABASE ERROR DETAILS ===")
        console.error("[v0] Error code:", error.code)
        console.error("[v0] Error message:", error.message)
        console.error("[v0] Error details:", error.details)
        console.error("[v0] Error hint:", error.hint)
        console.error("[v0] Full error object:", JSON.stringify(error, null, 2))
        throw error
      }

      // Notify the teacher about the submitted proposal
      const proposal = subRoom.proposal_data
      if (proposal?.teacher_id) {
        // Get teacher's profile_id
        const { data: teacher } = await supabase
          .from("teachers")
          .select("profile_id")
          .eq("id", proposal.teacher_id)
          .single()

        if (teacher?.profile_id) {
          await sendNotification({
            user_id: teacher.profile_id,
            establishment_id: subRoom.establishment_id || "",
            type: "proposal_submitted",
            title: "Nouvelle proposition",
            message: `Un délégué a soumis une proposition pour "${proposal.name}"`,
            proposal_id: subRoom.proposal_data.id,
            triggered_by: userId,
          })
        }
      }

      toast({
        title: "Proposition soumise",
        description: "Votre proposition a été soumise au professeur",
        className: "z-[9999]",
      })

      // Redirect to sandbox
      router.push("/dashboard/sandbox")
    } catch (error: any) {
      console.error("[v0] Error submitting proposal:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de soumettre la proposition",
        variant: "destructive",
        className: "z-[9999]",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImpose = async () => {
    if (!isSandbox || !subRoom.is_sandbox || userRole !== "professeur") return

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const proposal = subRoom.proposal_data

      // Create or update sub-room
      if (proposal?.sub_room_id) {
        const { error: deleteError } = await supabase
          .from("seating_assignments")
          .delete()
          .eq("sub_room_id", proposal.sub_room_id)

        if (deleteError) throw deleteError

        if (assignments.size > 0) {
          const assignmentsToSave = Array.from(assignments.entries()).map(([seatNumber, studentId]) => ({
            sub_room_id: proposal.sub_room_id,
            seat_id: `seat-${seatNumber}`,
            student_id: studentId,
            seat_position: seatNumber, // Ensure seat_position is used
          }))

          const { error: insertError } = await supabase.from("seating_assignments").insert(assignmentsToSave)

          if (insertError) {
            console.error("[v0] Error imposing plan:", insertError)
            throw insertError
          }
        }

        // Update proposal status
        const { error: updateError } = await supabase
          .from("sub_room_proposals")
          .update({
            status: "approved",
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", subRoom.id)

        if (updateError) throw updateError

        // Notify delegate
        await sendNotification({
          userId: proposal.proposed_by,
          establishmentId: subRoom.establishment_id || "", // Assuming establishmentId is available in subRoom or can be fetched
          type: "plan_validated",
          title: "Proposition validée",
          message: `Le professeur a imposé son plan pour "${proposal.name}"`,
          subRoomId: proposal.sub_room_id,
          proposalId: subRoom.id,
          triggeredBy: userId,
        })
      } else {
        const { data: subRoomData, error: subRoomError } = await supabase
          .from("sub_rooms")
          .insert({
            room_id: proposal!.room_id,
            teacher_id: proposal!.teacher_id,
            name: proposal!.name,
            class_ids: [proposal!.class_id],
            created_by: userId,
          })
          .select()
          .single()

        if (subRoomError) throw subRoomError

        // Save seating assignments
        if (assignments.size > 0) {
          const assignmentsToSave = Array.from(assignments.entries()).map(([seatNumber, studentId]) => ({
            sub_room_id: subRoomData.id,
            seat_id: `seat-${seatNumber}`,
            student_id: studentId,
            seat_position: seatNumber, // Ensure seat_position is used
          }))

          const { error: assignmentsError } = await supabase.from("seating_assignments").insert(assignmentsToSave)

          if (assignmentsError) {
            console.error("[v0] Error imposing plan:", assignmentsError)
            throw assignmentsError
          }
        }

        // Update proposal
        const { error: updateError } = await supabase
          .from("sub_room_proposals")
          .update({
            status: "approved",
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            sub_room_id: subRoomData.id,
          })
          .eq("id", subRoom.id)

        if (updateError) throw updateError

        // Notify delegate
        await sendNotification({
          userId: proposal!.proposed_by,
          establishmentId: subRoom.establishment_id || "", // Assuming establishmentId is available in subRoom or can be fetched
          type: "plan_validated",
          title: "Proposition validée",
          message: `Le professeur a validé votre proposition "${proposal!.name}"`,
          subRoomId: subRoomData.id,
          proposalId: subRoom.id,
          triggeredBy: userId,
        })
      }

      toast({
        title: "Succès",
        description: "Le plan a été imposé avec succès",
        className: "z-[9999]",
      })

      // Redirect to sandbox
      router.push("/dashboard/sandbox")
    } catch (error: any) {
      console.error("[v0] Error imposing plan:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'imposer le plan",
        variant: "destructive",
        className: "z-[9999]",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle rejection of proposal by professor
  const handleReject = async () => {
    if (!isSandbox || !subRoom.is_sandbox || userRole !== "professeur") return
    if (!rejectReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison pour le refus",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const proposal = subRoom.proposal_data

      const { error } = await supabase
        .from("sub_room_proposals")
        .update({
          status: "rejected",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectReason,
        })
        .eq("id", subRoom.id)

      if (error) throw error

      // Notify delegate
      await sendNotification({
        user_id: proposal?.proposed_by || "",
        establishment_id: subRoom.establishment_id || "",
        type: "plan_rejected",
        title: "Proposition refusée",
        message: `Le professeur a refusé définitivement votre proposition "${proposal?.name}"`,
        proposal_id: subRoom.id,
        triggered_by: userId,
      })

      toast({
        title: "Proposition refusée",
        description: "Le délégué a été notifié du refus",
      })

      setShowRejectDialog(false)
      setRejectReason("")
      router.push("/dashboard/sandbox")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de refuser la proposition",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle return of proposal with comments by professor
  const handleReturn = async () => {
    if (!isSandbox || !subRoom.is_sandbox || userRole !== "professeur") return
    if (!returnComments.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer des commentaires pour le délégué",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const proposal = subRoom.proposal_data

      const { error } = await supabase
        .from("sub_room_proposals")
        .update({
          status: "draft",
          is_submitted: false,
          teacher_comments: returnComments,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", subRoom.id)

      if (error) throw error

      // Notify delegate
      await sendNotification({
        user_id: proposal?.proposed_by || "",
        establishment_id: subRoom.establishment_id || "",
        type: "plan_returned",
        title: "Proposition renvoyée",
        message: `Le professeur a renvoyé votre proposition "${proposal?.name}" avec des commentaires`,
        proposal_id: subRoom.id,
        triggered_by: userId,
      })

      toast({
        title: "Proposition renvoyée",
        description: "Le délégué peut maintenant modifier et resoumettre sa proposition",
      })

      setShowReturnDialog(false)
      setReturnComments("")
      router.push("/dashboard/sandbox")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de renvoyer la proposition",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSeatClick = (seatNumber: number) => {
    if (!selectedStudent) {
      // If no student is selected, and the seat is occupied, show student info popup
      const studentId = assignments.get(seatNumber)
      if (studentId) {
        const student = students.find(s => s.id === studentId)
        if (student) {
          setClickedStudentInfo({ student, seatNumber })
        }
      } else {
        // If seat is empty and no student is selected, open student selection dialog
        setSelectedSeatForDialog(seatNumber)
      }
      return
    }

    // If a student is selected
    // Check if student is already placed - if so, SWAP with existing student
    const existingPlacement = Array.from(assignments.entries()).find(
      ([_, studentId]) => studentId === selectedStudent.id,
    )

    const newAssignments = new Map(assignments)
    const currentStudentInSeat = assignments.get(seatNumber)

    // If the seat is occupied by the selected student, just unselect
    if (currentStudentInSeat === selectedStudent.id) {
      setSelectedStudent(null)
      return
    }

    // SWAP logic: if both students are placed, swap their positions
    if (currentStudentInSeat && existingPlacement) {
      newAssignments.set(existingPlacement[0], currentStudentInSeat)
      newAssignments.set(seatNumber, selectedStudent.id)
      // No toast for swap - too many notifications
    } else {
      // Normal placement
      if (existingPlacement) {
        newAssignments.delete(existingPlacement[0])
      }
      newAssignments.set(seatNumber, selectedStudent.id)
      // No toast for placement - too many notifications
    }

    setAssignments(newAssignments)
    setSelectedStudent(null)
  }

  // Handler to remove student from clicked info popup
  const handleRemoveFromInfoPopup = () => {
    if (clickedStudentInfo) {
      const newAssignments = new Map(assignments)
      newAssignments.delete(clickedStudentInfo.seatNumber)
      setAssignments(newAssignments)
      // No toast for removal - too many notifications
      setClickedStudentInfo(null)
    }
  }

  const handleConfirmRemove = () => {
    if (studentToRemove) {
      // Find the seat with this student
      const seatNumber = Array.from(assignments.entries()).find(([_, id]) => id === studentToRemove)?.[0]
      if (seatNumber !== undefined) {
        const newAssignments = new Map(assignments)
        newAssignments.delete(seatNumber)
        setAssignments(newAssignments)
      }
    }

    // Save preference if checkbox was checked
    if (dontShowAgain) {
      localStorage.setItem("dontShowRemoveConfirmation", "true")
    }

    setShowRemoveConfirmation(false)
    setStudentToRemove(null)
    setDontShowAgain(false)
    // No toast - too many notifications
  }

  const handleCancelRemove = () => {
    setShowRemoveConfirmation(false)
    setStudentToRemove(null)
    setDontShowAgain(false)
  }

  const handleRemoveFromSeat = (seatNumber: number) => {
    const studentId = assignments.get(seatNumber)
    if (studentId) {
      setStudentToRemove(studentId)
      setShowRemoveConfirmation(true)
    }
  }

  const handleRandomPlacementAll = () => {
    const totalSeats = getTotalSeats()
    const availableSeats = Array.from({ length: totalSeats }, (_, i) => i + 1)

    // Shuffle seats randomly
    const shuffledSeats = availableSeats.sort(() => Math.random() - 0.5)

    // Shuffle students randomly
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5)

    const newAssignments = new Map<number, string>()

    shuffledStudents.forEach((student, index) => {
      if (index < shuffledSeats.length) {
        newAssignments.set(shuffledSeats[index], student.id)
      }
    })

    setAssignments(newAssignments)
    // No toast - too many notifications
  }

  const handleAlphabeticalPlacement = (order: "asc" | "desc") => {
    const sorted = [...students].sort((a, b) => {
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()
      return order === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })

    const newAssignments = new Map<number, string>()
    const totalSeats = getTotalSeats()

    sorted.forEach((student, index) => {
      if (index < totalSeats) {
        newAssignments.set(index + 1, student.id)
      }
    })

    setAssignments(newAssignments)
    // No toast - too many notifications
  }

  const handleCompletePlan = () => {
    const unassigned = getUnassignedStudents()
    const availableSeats: number[] = []

    for (let i = 1; i <= getTotalSeats(); i++) {
      if (!assignments.has(i)) {
        availableSeats.push(i)
      }
    }

    let sorted: Student[]
    if (completeMethod === "random") {
      sorted = [...unassigned].sort(() => Math.random() - 0.5)
    } else {
      sorted = [...unassigned].sort((a, b) => {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()
        return completeMethod === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      })
    }

    const newAssignments = new Map(assignments)

    sorted.forEach((student, index) => {
      if (index < availableSeats.length) {
        newAssignments.set(availableSeats[index], student.id)
      }
    })

    setAssignments(newAssignments)
    // No toast - too many notifications
  }

  const handleRemoveAll = () => {
    setAssignments(new Map())
    // No toast - too many notifications
  }

  const handleReset = () => {
    setAssignments(new Map(savedAssignments))
    // No toast - too many notifications
  }

  const handleDropToUnplacedArea = () => {
    if (draggedStudent) {
      console.log("[v0] Removing student from seat:", draggedStudent)

      // Find and remove the student from their current seat
      const entries = Array.from(assignments.entries())
      const entry = entries.find(([_, studentId]) => studentId === draggedStudent)

      if (entry) {
        const [seatNumber] = entry
        const newAssignments = new Map(assignments)
        newAssignments.delete(seatNumber)
        setAssignments(newAssignments)
        // No toast - too many notifications
      }

      setDraggedStudent(null)
      setSelectedStudent(null) // Clear selected student when dropping to unplaced
    }
  }

  // Helper to get student display name (Prénom.Initiale)
  const getInitials = (student: Student) => {
    return `${student.first_name}.${student.last_name.charAt(0).toUpperCase()}`
  }

  // Touch event handlers (needed for mobile compatibility)
  const handleTouchStart = (e: React.TouchEvent, studentId: string) => {
    setDraggedStudent(studentId)
    // In a real app, you might want to simulate a drag event or use a dedicated library
    // For now, we'll just set the dragged student
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Handle touch move if necessary, e.g., to update a visual indicator
  }

  const handleTouchEnd = (e: React.TouchEvent, seatNumber?: number) => {
    if (draggedStudent) {
      if (seatNumber !== undefined) {
        // If dropped on a seat, handle drop
        const studentToPlace = students.find((s) => s.id === draggedStudent)
        if (!studentToPlace) return

        const currentStudentId = assignments.get(seatNumber)

        // If the seat is occupied by the dragged student, do nothing
        if (currentStudentId === draggedStudent) {
          setDraggedStudent(null)
          return
        }

        // If the seat is occupied by another student, swap them
        if (currentStudentId) {
          // Find the current student's current seat and remove them
          const currentStudentCurrentSeat = Array.from(assignments.entries()).find(
            ([_, id]) => id === currentStudentId,
          )?.[0]
          if (currentStudentCurrentSeat !== undefined) {
            assignments.delete(currentStudentCurrentSeat)
          }
        }

        const newAssignments = new Map(assignments)
        newAssignments.set(seatNumber, draggedStudent)
        setAssignments(newAssignments)
        setSelectedStudent(null) // Clear selected student

        toast({
          title: "Élève placé",
          description: `${studentToPlace.first_name} ${studentToPlace.last_name} a été placé sur la place ${seatNumber}.`,
        })
      } else {
        // If dropped outside a seat (e.g., on the unplaced list), remove from seat
        handleDropToUnplacedArea()
      }
      setDraggedStudent(null)
    }
  }

  // Share functions
  const handleShareByEmail = () => {
    // Implement email sharing logic here
    toast({
      title: "Fonctionnalité non implémentée",
      description: "Le partage par email n'est pas encore disponible.",
    })
  }

  const handleDownloadImage = () => {
    // Implement image download logic here
    toast({
      title: "Fonctionnalité non implémentée",
      description: "Le téléchargement d'image n'est pas encore disponible.",
    })
  }

  const handleDownloadPDF = () => {
    if (!room?.config?.columns) {
      toast({
        title: "Erreur",
        description: "Configuration de la salle non disponible",
        variant: "destructive",
      })
      return
    }

    try {
      const teacherName = "Professeur" // Can be enhanced to get actual teacher name
      const className = students[0]?.class_name || "Classe"

      const fileName = exportSeatingPlanToPDF({
        subRoomName: subRoom.name,
        roomName: room.name,
        teacherName,
        className,
        columns: room.config.columns,
        assignments,
        students,
        boardPosition: room.board_position || "top",
        establishmentName: "EduPlan"
      })

      toast({
        title: "PDF généré",
        description: `Le fichier ${fileName} a été téléchargé`,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      })
    }
  }

  const handleCreateLink = () => {
    // Implement link creation logic here
    toast({
      title: "Fonctionnalité non implémentée",
      description: "La création de lien n'est pas encore disponible.",
    })
  }

  // --- Helper functions for room layout ---
  
  // Get number of columns for grid based on seats
  const getGridCols = (seatsPerTable: number): number => {
    if (seatsPerTable === 1) return 1
    if (seatsPerTable === 2) return 2
    if (seatsPerTable === 3) return 3
    if (seatsPerTable === 4) return 2 // 2x2 grid
    if (seatsPerTable === 5) return 3 // 2 rows, 3+2 
    if (seatsPerTable === 6) return 3 // 2x3 grid
    return Math.min(seatsPerTable, 4)
  }

  // Calculate table width based on number of seats per table
  const getTableWidth = (seatsPerTable: number): number => {
    const seatSize = 56 // Slightly larger seats (14 * 4 = 56px)
    const gapWidth = 12 // gap-3 = 12px
    const padding = 24 // p-3 = 12px * 2
    
    const cols = getGridCols(seatsPerTable)
    return cols * seatSize + (cols - 1) * gapWidth + padding
  }

  // Calculate table height based on number of seats and layout
  const getTableHeight = (seatsPerTable: number): number => {
    const seatSize = 56
    const gapHeight = 12
    const padding = 24
    
    const cols = getGridCols(seatsPerTable)
    const rows = Math.ceil(seatsPerTable / cols)
    return rows * seatSize + (rows - 1) * gapHeight + padding
  }

  const getTableStyle = (seatsPerTable?: number): React.CSSProperties => {
    if (!seatsPerTable) {
      return { width: 140, height: 100 }
    }
    const width = getTableWidth(seatsPerTable)
    const height = getTableHeight(seatsPerTable)
    return {
      width: `${width}px`,
      height: `${height}px`,
      minWidth: `${width}px`,
      minHeight: `${height}px`,
    }
  }
  
  const getGridColsClass = (seatsPerTable: number): string => {
    const cols = getGridCols(seatsPerTable)
    return `grid-cols-${cols}`
  }

  const getSeatNumber = (colIndex: number, tableIndex: number, seatIndex: number): number => {
    if (!room?.config?.columns) return 0
    let seatCounter = 1
    for (let i = 0; i < colIndex; i++) {
      const currentCol = room.config.columns[i]
      seatCounter += currentCol.tables * currentCol.seatsPerTable
    }
    const currentColumn = room.config.columns[colIndex]
    seatCounter += tableIndex * currentColumn.seatsPerTable
    seatCounter += seatIndex + 1
    return seatCounter
  }

  const getSeatStyle = (isOccupied: boolean): React.CSSProperties => {
    // Add any specific styling for seats if required
    return {
      // Example: Adjust border radius or other properties
    }
  }
  // --- End of helper functions for room layout ---

  if (isLoadingRoom) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Chargement de la salle...</p>
        </div>
      </div>
    )
  }

  if (roomError || !room?.config?.columns) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{roomError || "Configuration de la salle introuvable"}</p>
          <Button onClick={onBack || onClose}>Retour</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-slate-950 z-10 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack || onClose}
              className="hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">{subRoom.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {room?.name} ({room?.code}) • {students.length} élève(s) • {getTotalSeats()} place(s)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onBack || onClose}
              variant="outline"
              className="border-gray-300 dark:border-gray-700 bg-transparent"
            >
              Fermer
            </Button>

            <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>

            {isSandbox && userRole === "delegue" && !subRoom.proposal_data?.is_submitted && (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Soumission..." : "Soumettre au professeur"}
              </Button>
            )}

            {isSandbox && userRole === "professeur" && subRoom.proposal_data?.status === "pending" && (
              <>
                <Button 
                  onClick={() => setShowReturnDialog(true)} 
                  disabled={isSubmitting} 
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  Renvoyer
                </Button>
                <Button 
                  onClick={() => setShowRejectDialog(true)} 
                  disabled={isSubmitting} 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                >
                  Refuser
                </Button>
                <Button onClick={handleImpose} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Validation..." : "Valider"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 w-full">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Options */}
          <div className="col-span-2">
            <Card className="sticky top-6 border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm mb-4 text-black dark:text-white">Options</h3>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                  onClick={handleRandomPlacementAll}
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Aléatoire
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                  onClick={() => handleAlphabeticalPlacement("asc")}
                >
                  <ArrowDownAZ className="mr-2 h-4 w-4" />A → Z
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                  onClick={() => handleAlphabeticalPlacement("desc")}
                >
                  <ArrowUpAZ className="mr-2 h-4 w-4" />Z → A
                </Button>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Compléter le plan</Label>
                  <div key="complete-method-select">
                    <Select value={completeMethod} onValueChange={(value: any) => setCompleteMethod(value)}>
                      <SelectTrigger className="w-full border-gray-300 dark:border-gray-700 bg-transparent">
                        <SelectValue placeholder="Méthode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="complete-random" value="random">
                          Aléatoire
                        </SelectItem>
                        <SelectItem key="complete-asc" value="asc">
                          A → Z
                        </SelectItem>
                        <SelectItem key="complete-desc" value="desc">
                          Z → A
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 justify-start border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                    onClick={handleCompletePlan}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Compléter
                  </Button>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <Button
                    size="sm"
                    className="w-full justify-start bg-green-400 hover:bg-green-500 text-white"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>

                  <Button
                    size="sm"
                    className="w-full justify-start bg-red-400 hover:bg-red-500 text-white"
                    onClick={handleRemoveAll}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Tout retirer
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                    onClick={handleReset}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </Button>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                    onClick={() => setIsShareDialogOpen(true)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Partager
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start mt-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                    onClick={() => setIsHistoryOpen(true)}
                  >
                    <History className="mr-2 h-4 w-4" />
                    Historique
                  </Button>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full justify-start bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Valider
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Room Layout */}
          <div className="col-span-8">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                {!room?.config?.columns ? (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <p>Configuration de la salle non disponible</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <div className="flex justify-center items-start gap-6 min-w-min p-4">
                      {room.config.columns.map((column, colIndex) => (
                        <div key={column.id} className="flex flex-col gap-4">
                          {Array.from({ length: column.tables }).map((_, tableIndex) => (
                            <div
                              key={tableIndex}
                              className="relative rounded-lg border-2 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700 transition-all"
                              style={getTableStyle(column.seatsPerTable)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => {
                                // Determine the first seat number in this table for the drop target
                                const firstSeatInTable = getSeatNumber(colIndex, tableIndex, 0)
                                handleDrop(e, firstSeatInTable)
                              }}
                            >
                              <div
                                className="grid gap-3 p-3 place-items-center w-full h-full"
                                style={{ 
                                  gridTemplateColumns: `repeat(${getGridCols(column.seatsPerTable)}, minmax(0, 1fr))` 
                                }}
                              >
                                {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => {
                                  const seatNumber = getSeatNumber(colIndex, tableIndex, seatIndex)
                                  const assignment = assignments.get(seatNumber)
                                  const student = assignment ? students.find((s) => s.id === assignment) : null
                                  const isOccupied = !!student

                                  return (
                                    <div
                                      key={`seat-${tableIndex}-${seatIndex}`}
                                      data-seat-number={seatNumber}
                                      draggable={!!student}
                                      // Pass student.id to handleDragStart
                                      onDragStart={(e) => student && handleDragStart(e as any, student.id)}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, seatNumber)}
                                      onTouchStart={(e) => student && handleTouchStart(e as any, student.id)}
                                      onTouchMove={handleTouchMove}
                                      onTouchEnd={(e) => handleTouchEnd(e, seatNumber)}
                                      // Use the new handleSeatClick
                                      onClick={() => handleSeatClick(seatNumber)}
                                      className={cn(
                                        "w-14 h-14 border-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer shadow-sm",
                                        student
                                          ? "bg-emerald-600 text-white border-emerald-700 hover:scale-105 hover:shadow-md"
                                          : "bg-white text-gray-400 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50",
                                      )}
                                      style={getSeatStyle(isOccupied)}
                                    >
                                      {student ? (
                                        <>
                                          <span className="text-white text-sm font-semibold">
                                            {getInitials(student)}
                                          </span>
                                          {/* Removed direct remove button from seat for consistency with dialog */}
                                        </>
                                      ) : (
                                        <span className="text-sm">{seatNumber}</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Students List */}
          <div className="col-span-2">
            <Card className="sticky top-6 border-gray-200 dark:border-gray-800">
              <CardContent
                className="p-4"
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOverUnplaced(true) // Set flag when dragging over
                }}
                onDragLeave={() => setIsDragOverUnplaced(false)} // Reset flag when leaving
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOverUnplaced(false) // Reset flag on drop
                  handleDropToUnplacedArea()
                }}
              >
                <h3 className="font-semibold mb-4 text-black dark:text-white">
                  Élèves non placés ({getUnassignedStudents().length}/{students.length})
                </h3>
                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {getUnassignedStudents().map((student) => (
                    <div
                      key={student.id}
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(e as any, student.id)
                        setSelectedStudent(student) // Set the selected student when dragging starts
                      }}
                      onTouchStart={(e) => handleTouchStart(e as any, student.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 cursor-move hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <div className="font-medium text-sm text-black dark:text-white">
                        {student.last_name} {student.first_name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
                        >
                          {student.class_name}
                        </Badge>
                        {student.role === "delegue" && (
                          <Badge className="text-xs bg-blue-500 hover:bg-blue-600 text-white border-0">Délégué</Badge>
                        )}
                        {student.role === "eco-delegue" && (
                          <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                            Éco-délégué
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {getUnassignedStudents().length === 0 && (
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-black dark:text-white" />
                      <p className="text-sm">Tous les élèves sont placés</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Share Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="border-gray-200 dark:border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">Partager le plan de classe</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Choisissez comment partager ce plan de classe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-email" className="text-black dark:text-white">
                  Envoyer par email
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="share-email"
                    type="email"
                    placeholder="email@example.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="border-gray-300 dark:border-gray-700"
                  />
                  <Button
                    onClick={handleShareByEmail}
                    className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-black dark:text-white">Télécharger</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadImage}
                    className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-black dark:text-white">Créer un lien de visualisation</Label>
                <Button
                  variant="outline"
                  onClick={handleCreateLink}
                  className="w-full border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Générer un lien
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for student selection */}
        <Dialog open={selectedSeatForDialog !== null} onOpenChange={(open) => {
          if (!open) {
            setSelectedSeatForDialog(null)
            setSeatDialogSearchQuery("")
          }
        }}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Sélectionner un élève</DialogTitle>
              <DialogDescription>Choisissez un élève à placer sur la place {selectedSeatForDialog}</DialogDescription>
            </DialogHeader>
            
            {/* Search bar */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un élève..."
                value={seatDialogSearchQuery}
                onChange={(e) => setSeatDialogSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2 mt-4 overflow-y-auto flex-1 pr-2">
              {getUnassignedStudents()
                .filter((student) => {
                  if (!seatDialogSearchQuery.trim()) return true
                  const query = seatDialogSearchQuery.toLowerCase()
                  return (
                    student.first_name.toLowerCase().includes(query) ||
                    student.last_name.toLowerCase().includes(query) ||
                    student.class_name?.toLowerCase().includes(query)
                  )
                })
                .map((student) => (
                <Button
                  key={student.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 bg-transparent"
                  onClick={() => {
                    // Assign student to the selected seat
                    const newAssignments = new Map(assignments)
                    newAssignments.set(selectedSeatForDialog!, student.id)
                    setAssignments(newAssignments)
                    setSelectedStudent(null)
                    setSelectedSeatForDialog(null)
                    setSeatDialogSearchQuery("")
                    // No toast - too many notifications
                  }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <div className="font-medium">
                      {student.last_name} {student.first_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {student.class_name}
                      </Badge>
                      {student.role === "delegue" && <Badge className="text-xs bg-blue-500 text-white">Délégué</Badge>}
                      {student.role === "eco-delegue" && (
                        <Badge className="text-xs bg-emerald-500 text-white">Éco-délégué</Badge>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
              {getUnassignedStudents().filter((student) => {
                if (!seatDialogSearchQuery.trim()) return true
                const query = seatDialogSearchQuery.toLowerCase()
                return (
                  student.first_name.toLowerCase().includes(query) ||
                  student.last_name.toLowerCase().includes(query) ||
                  student.class_name?.toLowerCase().includes(query)
                )
              }).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {seatDialogSearchQuery ? (
                    <p>Aucun élève trouvé pour "{seatDialogSearchQuery}"</p>
                  ) : (
                    <p>Tous les élèves sont déjà placés</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Unplaced students list */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">
              Élèves non placés ({getUnassignedStudents().length}/{students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-2 max-h-[400px] overflow-y-auto p-2 rounded-md border-2 border-dashed border-transparent transition-all"
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("bg-blue-50", "border-blue-400")
                handleDropToUnplacedArea()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("bg-blue-50", "border-blue-400")
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("bg-blue-50", "border-blue-400")
              }}
            >
              {getUnassignedStudents().length === 0 ? (
                <div className="flex items-center justify-center gap-2 p-4 text-green-600 bg-green-50 rounded-md border border-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Tous les élèves sont placés</span>
                </div>
              ) : (
                getUnassignedStudents().map((student) => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={() => {
                      handleDragStart(null as any, student.id)
                      setSelectedStudent(student) // Set the selected student when dragging starts
                    }}
                    className="flex items-center gap-2 p-2 bg-white border rounded-md cursor-move hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {student.first_name} {student.last_name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Info Popup */}
      <Dialog open={!!clickedStudentInfo} onOpenChange={(open) => !open && setClickedStudentInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Information élève
            </DialogTitle>
          </DialogHeader>
          {clickedStudentInfo && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {clickedStudentInfo.student.first_name} {clickedStudentInfo.student.last_name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Classe: {clickedStudentInfo.student.class_name || "Non spécifiée"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Place n°{clickedStudentInfo.seatNumber}
                </p>
                {clickedStudentInfo.student.role && clickedStudentInfo.student.role !== "eleve" && (
                  <Badge className="mt-2" variant="secondary">
                    {clickedStudentInfo.student.role === "delegue" ? "Délégué" : "Éco-délégué"}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setClickedStudentInfo(null)}
                >
                  Fermer
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRemoveFromInfoPopup}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Retirer du plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRemoveConfirmation} onOpenChange={setShowRemoveConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer l'élève du plan ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous retirer cet élève du plan de classe ? Il sera replacé dans la liste des élèves non placés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ne plus afficher cette confirmation
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRemoveConfirmation(false)
                setStudentToRemove(null)
                setDontShowAgain(false)
              }}
            >
              Non
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>Oui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <HistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        entityType="sub_room"
        entityId={subRoom.id}
        establishmentId={students[0]?.establishment_id || ""}
      />

      {/* Reject Proposal Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser définitivement cette proposition ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Le délégué ne pourra pas resoumettre cette proposition.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">Raison du refus (obligatoire)</label>
            <textarea
              className="w-full p-3 border rounded-md min-h-[100px] text-sm"
              placeholder="Ex: Le plan ne convient pas pour ce type de cours..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRejectDialog(false)
              setRejectReason("")
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              disabled={!rejectReason.trim() || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Refus..." : "Refuser définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return Proposal Dialog */}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renvoyer cette proposition au délégué ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le délégué pourra modifier sa proposition et la resoumettre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">Commentaires pour le délégué (obligatoire)</label>
            <textarea
              className="w-full p-3 border rounded-md min-h-[100px] text-sm"
              placeholder="Ex: Pouvez-vous placer les élèves turbulents plus près du tableau..."
              value={returnComments}
              onChange={(e) => setReturnComments(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowReturnDialog(false)
              setReturnComments("")
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReturn}
              disabled={!returnComments.trim() || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? "Renvoi..." : "Renvoyer avec commentaires"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  )
}
