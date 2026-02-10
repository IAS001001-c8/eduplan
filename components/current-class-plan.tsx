"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Maximize2, Clock, MapPin, Users, CalendarClock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CurrentClassPlanProps {
  teacherId: string
  establishmentId: string
}

interface ActiveSubRoom {
  id: string
  name: string
  roomName: string
  className: string
  startTime: string
  endTime: string
  weekType: string
  roomConfig: any
  isTemporary?: boolean
  temporaryDate?: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  role?: string
}

interface SeatAssignment {
  seat_id: string
  student_id: string
  seat_position: number
}

// Fonction pour obtenir le numéro de semaine ISO
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Convertir le jour de la semaine (0=Dimanche en JS) vers notre format (0=Lundi)
function getDayOfWeek(): number {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

export function CurrentClassPlan({ teacherId, establishmentId }: CurrentClassPlanProps) {
  const [activeSubRoom, setActiveSubRoom] = useState<ActiveSubRoom | null>(null)
  const [activeTemporarySubRoom, setActiveTemporarySubRoom] = useState<ActiveSubRoom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [temporaryStudents, setTemporaryStudents] = useState<Student[]>([])
  const [seatAssignments, setSeatAssignments] = useState<Map<number, string>>(new Map())
  const [temporarySeatAssignments, setTemporarySeatAssignments] = useState<Map<number, string>>(new Map())
  const [currentWeekType, setCurrentWeekType] = useState<string>("A")
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTemporaryFullscreen, setShowTemporaryFullscreen] = useState(false)

  useEffect(() => {
    fetchActiveSubRoom()
    
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchActiveSubRoom, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [teacherId, establishmentId])

  const fetchActiveSubRoom = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"
      const currentDay = getDayOfWeek()
      const currentWeek = getWeekNumber(now)
      const currentYear = now.getFullYear()

      // 1. Obtenir le type de semaine actuel
      const { data: weekData } = await supabase
        .from("week_ab_calendar")
        .select("week_type")
        .eq("establishment_id", establishmentId)
        .eq("year", currentYear)
        .eq("week_number", currentWeek)
        .maybeSingle()

      const weekType = weekData?.week_type || "A"
      setCurrentWeekType(weekType)

      // 2. Chercher les sous-salles du professeur
      const { data: subRooms, error: subRoomError } = await supabase
        .from("sub_rooms")
        .select(`
          id,
          name,
          teacher_id,
          is_deleted,
          room_id,
          class_id,
          class_ids,
          filtered_student_ids,
          lv2_filter,
          is_temporary,
          temporary_date,
          rooms (name, config),
          classes (id, name)
        `)
        .eq("teacher_id", teacherId)
        .eq("is_deleted", false)

      if (subRoomError || !subRooms || subRooms.length === 0) {
        setActiveSubRoom(null)
        setActiveTemporarySubRoom(null)
        setIsLoading(false)
        return
      }

      // Séparer les sous-salles normales et temporaires
      const todayStr = now.toISOString().split('T')[0]
      const normalSubRooms = subRooms.filter((sr: any) => !sr.is_temporary)
      const temporarySubRooms = subRooms.filter((sr: any) => sr.is_temporary && sr.temporary_date === todayStr)

      // 3. Chercher les créneaux actifs pour ces sous-salles
      const subRoomIds = subRooms.map(sr => sr.id)
      
      const { data: schedules, error: scheduleError } = await supabase
        .from("sub_room_schedules")
        .select("*")
        .in("sub_room_id", subRoomIds)
        .eq("day_of_week", currentDay)
        .lte("start_time", currentTime + ":00")
        .gte("end_time", currentTime + ":00")

      if (scheduleError) {
        console.error("Error fetching schedules:", scheduleError)
        setIsLoading(false)
        return
      }

      // Fonction helper pour charger les données d'une sous-salle
      const loadSubRoomData = async (subRoom: any, schedule: any) => {
        // Charger les placements
        const { data: assignments } = await supabase
          .from("seating_assignments")
          .select("seat_id, student_id, seat_position")
          .eq("sub_room_id", subRoom.id)

        const assignmentMap = new Map<number, string>()
        assignments?.forEach((a: SeatAssignment) => {
          const seatNum = a.seat_position || parseInt(a.seat_id) || 0
          if (seatNum > 0 && a.student_id) {
            assignmentMap.set(seatNum, a.student_id)
          }
        })

        // Charger les élèves
        const classIds = subRoom.class_ids && subRoom.class_ids.length > 0 
          ? subRoom.class_ids 
          : (subRoom.class_id ? [subRoom.class_id] : [])

        let classNames = "Classe"
        let classStudents: any[] = []
        
        if (classIds.length > 0) {
          if (subRoom.filtered_student_ids && subRoom.filtered_student_ids.length > 0) {
            const { data: filteredStudents } = await supabase
              .from("students")
              .select("id, first_name, last_name, role, lv2")
              .in("id", subRoom.filtered_student_ids)
              .eq("is_deleted", false)
              .order("last_name")
            
            classStudents = filteredStudents || []
          } else {
            const { data: allStudents } = await supabase
              .from("students")
              .select("id, first_name, last_name, role")
              .in("class_id", classIds)
              .eq("is_deleted", false)
              .order("last_name")
            
            classStudents = allStudents || []
          }

          const { data: classData } = await supabase
            .from("classes")
            .select("name")
            .in("id", classIds)
          
          classNames = classData?.map(c => c.name).join(", ") || "Classe"
          
          if (subRoom.lv2_filter) {
            classNames += ` (${subRoom.lv2_filter})`
          }
        }

        return {
          subRoomData: {
            id: subRoom.id,
            name: subRoom.name,
            roomName: subRoom.rooms?.name || "Salle",
            className: classNames,
            startTime: schedule.start_time?.slice(0, 5) || "",
            endTime: schedule.end_time?.slice(0, 5) || "",
            weekType: schedule.week_type,
            roomConfig: subRoom.rooms?.config || null,
            isTemporary: subRoom.is_temporary || false,
            temporaryDate: subRoom.temporary_date || null,
          },
          students: classStudents,
          assignments: assignmentMap,
        }
      }

      // Chercher le créneau actif pour les sous-salles NORMALES
      const normalSchedule = schedules?.find((s: any) => {
        const subRoom = normalSubRooms.find(sr => sr.id === s.sub_room_id)
        if (!subRoom) return false
        return s.week_type === "both" || s.week_type === weekType
      })

      if (normalSchedule) {
        const subRoom = normalSubRooms.find(sr => sr.id === normalSchedule.sub_room_id) as any
        if (subRoom) {
          const data = await loadSubRoomData(subRoom, normalSchedule)
          setActiveSubRoom(data.subRoomData)
          setStudents(data.students)
          setSeatAssignments(data.assignments)
        }
      } else {
        setActiveSubRoom(null)
        setStudents([])
        setSeatAssignments(new Map())
      }

      // Chercher le créneau actif pour les sous-salles TEMPORAIRES (aujourd'hui seulement)
      const temporarySchedule = schedules?.find((s: any) => {
        const subRoom = temporarySubRooms.find(sr => sr.id === s.sub_room_id)
        if (!subRoom) return false
        return s.week_type === "both" || s.week_type === weekType
      })

      if (temporarySchedule) {
        const subRoom = temporarySubRooms.find(sr => sr.id === temporarySchedule.sub_room_id) as any
        if (subRoom) {
          const data = await loadSubRoomData(subRoom, temporarySchedule)
          setActiveTemporarySubRoom(data.subRoomData)
          setTemporaryStudents(data.students)
          setTemporarySeatAssignments(data.assignments)
        }
      } else {
        setActiveTemporarySubRoom(null)
        setTemporaryStudents([])
        setTemporarySeatAssignments(new Map())
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculer les dimensions adaptatives pour le plan
  const getAdaptiveSizes = (isFullscreenView: boolean) => {
    if (!activeSubRoom) return { seatWidth: 32, seatHeight: 32, gap: 4 }
    
    const config = activeSubRoom.roomConfig
    const columns = config.columns || []
    
    // Calculer le nombre total de colonnes et de rangées
    const numColumns = columns.length
    const maxTables = Math.max(...columns.map((c: any) => c.tables || 0), 1)
    const maxSeatsPerTable = Math.max(...columns.map((c: any) => c.seatsPerTable || 2), 2)
    
    if (isFullscreenView) {
      // En plein écran, adapter pour que tout soit visible
      // Largeur disponible ~ 90vw - marges, hauteur disponible ~ 70vh
      const availableWidth = window.innerWidth * 0.85
      const availableHeight = window.innerHeight * 0.65
      
      // Calculer la taille max des sièges pour tenir dans l'espace
      const gapX = 8 // gap entre colonnes
      const gapY = 6 // gap entre tables
      const gapSeat = 4 // gap entre sièges d'une même table
      
      const totalWidthNeeded = numColumns * maxSeatsPerTable
      const totalHeightNeeded = maxTables
      
      // Taille max basée sur la largeur
      const maxWidthBasedSize = (availableWidth - (numColumns - 1) * gapX - numColumns * (maxSeatsPerTable - 1) * gapSeat) / totalWidthNeeded
      
      // Taille max basée sur la hauteur
      const maxHeightBasedSize = (availableHeight - (maxTables - 1) * gapY) / totalHeightNeeded
      
      // Prendre le minimum, avec une taille max de 100px et min de 40px
      const seatSize = Math.min(Math.max(Math.min(maxWidthBasedSize, maxHeightBasedSize), 40), 100)
      
      return {
        seatWidth: seatSize,
        seatHeight: seatSize * 0.75,
        gap: Math.max(4, seatSize * 0.08),
        colGap: Math.max(12, seatSize * 0.15),
        tableGap: Math.max(6, seatSize * 0.1),
      }
    } else {
      // Version miniature dans le dashboard
      return {
        seatWidth: 32,
        seatHeight: 32,
        gap: 2,
        colGap: 8,
        tableGap: 4,
      }
    }
  }

  // Rendu du plan de classe
  const renderPlan = (
    isFullscreenView: boolean, 
    subRoom: ActiveSubRoom, 
    studentList: Student[], 
    assignmentMap: Map<number, string>
  ) => {
    if (!subRoom) return null

    const config = subRoom.roomConfig
    const columns = config?.columns || []
    const sizes = getAdaptiveSizes(isFullscreenView)
    let seatNumber = 1

    return (
      <div className={cn(
        "flex justify-center",
        isFullscreenView ? "gap-4" : "gap-2"
      )} style={{ gap: isFullscreenView ? sizes.colGap : sizes.gap }}>
        {columns.map((column: any, colIndex: number) => (
          <div key={colIndex} className="flex flex-col" style={{ gap: isFullscreenView ? sizes.tableGap : 1 }}>
            {Array.from({ length: column.tables || 0 }).map((_, tableIndex) => (
              <div key={tableIndex} className="flex" style={{ gap: sizes.gap }}>
                {Array.from({ length: column.seatsPerTable || 2 }).map((_, seatIndex) => {
                  const currentSeat = seatNumber++
                  const studentId = assignmentMap.get(currentSeat)
                  const student = studentId ? studentList.find((s) => s.id === studentId) : null

                  if (isFullscreenView) {
                    return (
                      <div
                        key={seatIndex}
                        className={cn(
                          "rounded-lg flex flex-col items-center justify-center p-1 transition-all shadow-sm",
                          student
                            ? student.role === "delegue"
                              ? "bg-[#E7A541] text-white"
                              : student.role === "eco-delegue"
                              ? "bg-green-500 text-white"
                              : "bg-[#29282B] text-white"
                            : "bg-[#F5F5F6] border-2 border-dashed border-[#D9DADC]"
                        )}
                        style={{ 
                          width: sizes.seatWidth, 
                          height: sizes.seatHeight,
                          fontSize: Math.max(10, sizes.seatWidth * 0.12),
                        }}
                      >
                        {student ? (
                          <>
                            <span className="font-bold truncate w-full text-center" style={{ fontSize: Math.max(11, sizes.seatWidth * 0.14) }}>
                              {student.last_name}
                            </span>
                            <span className="truncate w-full text-center opacity-80" style={{ fontSize: Math.max(9, sizes.seatWidth * 0.11) }}>
                              {student.first_name}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#29282B]/30 font-medium">{currentSeat}</span>
                        )}
                      </div>
                    )
                  } else {
                    // Version miniature
                    return (
                      <div
                        key={seatIndex}
                        className={cn(
                          "w-8 h-8 rounded text-[8px] flex items-center justify-center truncate font-medium",
                          student
                            ? student.role === "delegue"
                              ? "bg-[#E7A541] text-white"
                              : student.role === "eco-delegue"
                              ? "bg-green-500 text-white"
                              : "bg-[#29282B] text-white"
                            : "bg-[#F5F5F6] border border-[#D9DADC] text-[#29282B]/30"
                        )}
                        title={student ? `${student.first_name} ${student.last_name}` : `Place ${currentSeat}`}
                      >
                        {student ? student.last_name.slice(0, 4) : currentSeat}
                      </div>
                    )
                  }
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Rendu d'une carte de cours
  const renderCourseCard = (
    subRoom: ActiveSubRoom,
    studentList: Student[],
    assignmentMap: Map<number, string>,
    isTemporary: boolean,
    onFullscreenClick: () => void
  ) => {
    const placedCount = Array.from(assignmentMap.values()).filter(id => 
      studentList.some(s => s.id === id)
    ).length

    return (
      <Card className={cn(
        "shadow-lg",
        isTemporary 
          ? "border-orange-500 bg-gradient-to-r from-orange-50 to-white" 
          : "border-[#E7A541] bg-gradient-to-r from-[#FDF6E9] to-white"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl shadow-md",
                isTemporary ? "bg-orange-500" : "bg-[#E7A541]"
              )}>
                {isTemporary ? (
                  <CalendarClock className="h-6 w-6 text-white" />
                ) : (
                  <Clock className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className={cn(
                    "text-xl",
                    isTemporary ? "text-orange-700" : "text-[#29282B]"
                  )}>
                    {isTemporary ? "Cours temporaire en cours" : "Cours en cours"}
                  </CardTitle>
                  {isTemporary && (
                    <Badge className="bg-orange-100 text-orange-700 border border-orange-300">
                      Aujourd'hui uniquement
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[#29282B]/60">
                  {subRoom.startTime} - {subRoom.endTime}
                  {subRoom.weekType !== "both" && (
                    <Badge className={cn(
                      "ml-2 text-xs",
                      subRoom.weekType === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      Semaine {subRoom.weekType}
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={onFullscreenClick}
              className={cn(
                "shadow-md",
                isTemporary 
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-[#E7A541] hover:bg-[#D4933A] text-white"
              )}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Plein écran
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Infos */}
            <div className="space-y-3 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className={cn("h-4 w-4", isTemporary ? "text-orange-500" : "text-[#E7A541]")} />
                <span className="text-[#29282B] font-medium">{subRoom.roomName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className={cn("h-4 w-4", isTemporary ? "text-orange-500" : "text-[#E7A541]")} />
                <span className="text-[#29282B] font-medium">{subRoom.className}</span>
              </div>
              <p className="text-lg font-bold text-[#29282B] mt-2">{subRoom.name}</p>
              <p className="text-sm text-[#29282B]/60">
                {placedCount}/{studentList.length} élèves placés
              </p>
            </div>

            {/* Mini plan */}
            <div className="flex-1 flex justify-center">
              {renderPlan(false, subRoom, studentList, assignmentMap)}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Dialog plein écran pour une sous-salle
  const renderFullscreenDialog = (
    isOpen: boolean,
    onClose: (open: boolean) => void,
    subRoom: ActiveSubRoom | null,
    studentList: Student[],
    assignmentMap: Map<number, string>,
    isTemporary: boolean
  ) => {
    if (!subRoom) return null

    const placedCount = Array.from(assignmentMap.values()).filter(id => 
      studentList.some(s => s.id === id)
    ).length

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-fit max-h-[95vh] overflow-auto">
          <DialogHeader className="border-b border-[#D9DADC] pb-4">
            <DialogTitle className="flex items-center gap-4 text-[#29282B] flex-wrap">
              <span className="text-xl font-bold">{subRoom.name}</span>
              {isTemporary && (
                <Badge className="bg-orange-100 text-orange-700 border border-orange-300">
                  Temporaire - Aujourd'hui uniquement
                </Badge>
              )}
              <Badge className={cn(
                "text-sm px-3 py-1",
                isTemporary 
                  ? "bg-orange-50 text-orange-600 border border-orange-200"
                  : "bg-[#FDF6E9] text-[#E7A541] border border-[#E7A541]/20"
              )}>
                {subRoom.roomName}
              </Badge>
              <Badge className="bg-[#F5F5F6] text-[#29282B] text-sm px-3 py-1">
                {subRoom.className}
              </Badge>
              <span className="text-sm text-[#29282B]/60 ml-auto">
                {subRoom.startTime} - {subRoom.endTime} • {placedCount}/{studentList.length} élèves
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {/* Tableau */}
            <div className={cn(
              "w-full max-w-3xl mx-auto h-10 rounded-lg flex items-center justify-center mb-8 shadow-md",
              isTemporary ? "bg-orange-500" : "bg-[#E7A541]"
            )}>
              <span className="text-white font-bold tracking-wide">TABLEAU</span>
            </div>

            {/* Plan adaptatif */}
            {renderPlan(true, subRoom, studentList, assignmentMap)}

            {/* Légende */}
            <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-[#D9DADC]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#29282B]" />
                <span className="text-sm text-[#29282B]">Élève</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#E7A541]" />
                <span className="text-sm text-[#29282B]">Délégué</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm text-[#29282B]">Éco-délégué</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#F5F5F6] border-2 border-dashed border-[#D9DADC]" />
                <span className="text-sm text-[#29282B]">Place vide</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoading) {
    return null
  }

  // Si aucune sous-salle active (ni normale ni temporaire), ne rien afficher
  if (!activeSubRoom && !activeTemporarySubRoom) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Section Cours temporaire en cours (PRIORITAIRE - Position 1) */}
      {activeTemporarySubRoom && (
        <>
          {renderCourseCard(
            activeTemporarySubRoom,
            temporaryStudents,
            temporarySeatAssignments,
            true,
            () => setShowTemporaryFullscreen(true)
          )}
          {renderFullscreenDialog(
            showTemporaryFullscreen,
            setShowTemporaryFullscreen,
            activeTemporarySubRoom,
            temporaryStudents,
            temporarySeatAssignments,
            true
          )}
        </>
      )}

      {/* Section Cours en cours (Position 2) */}
      {activeSubRoom && (
        <>
          {renderCourseCard(
            activeSubRoom,
            students,
            seatAssignments,
            false,
            () => setIsFullscreen(true)
          )}
          {renderFullscreenDialog(
            isFullscreen,
            setIsFullscreen,
            activeSubRoom,
            students,
            seatAssignments,
            false
          )}
        </>
      )}
    </div>
  )
}
