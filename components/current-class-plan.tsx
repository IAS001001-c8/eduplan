"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Maximize2, Clock, MapPin, Users } from "lucide-react"
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
  const [students, setStudents] = useState<Student[]>([])
  const [seatAssignments, setSeatAssignments] = useState<Map<number, string>>(new Map())
  const [currentWeekType, setCurrentWeekType] = useState<string>("A")
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
          rooms (name, config),
          classes (id, name)
        `)
        .eq("teacher_id", teacherId)
        .eq("is_deleted", false)

      if (subRoomError || !subRooms || subRooms.length === 0) {
        setActiveSubRoom(null)
        setIsLoading(false)
        return
      }

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

      // Filtrer par type de semaine
      const matchingSchedule = schedules?.find((s: any) => {
        return s.week_type === "both" || s.week_type === weekType
      })

      if (!matchingSchedule) {
        setActiveSubRoom(null)
        setIsLoading(false)
        return
      }

      // Trouver la sous-salle correspondante
      const subRoom = subRooms.find(sr => sr.id === matchingSchedule.sub_room_id) as any

      if (!subRoom) {
        setActiveSubRoom(null)
        setIsLoading(false)
        return
      }

      // 4. Charger les placements depuis seating_assignments (table dédiée)
      const { data: assignments, error: assignError } = await supabase
        .from("seating_assignments")
        .select("seat_id, student_id, seat_position")
        .eq("sub_room_id", subRoom.id)

      if (assignError) {
        console.error("Error fetching seat assignments:", assignError)
      }

      // Créer une map seat_position -> student_id
      const assignmentMap = new Map<number, string>()
      assignments?.forEach((a: SeatAssignment) => {
        // seat_position est le numéro de la place, ou on utilise seat_id si c'est numérique
        const seatNum = a.seat_position || parseInt(a.seat_id) || 0
        if (seatNum > 0 && a.student_id) {
          assignmentMap.set(seatNum, a.student_id)
        }
      })
      setSeatAssignments(assignmentMap)

      // 5. Charger les élèves de la/des classe(s) ou les élèves filtrés par LV2
      const classIds = subRoom.class_ids && subRoom.class_ids.length > 0 
        ? subRoom.class_ids 
        : (subRoom.class_id ? [subRoom.class_id] : [])

      let classNames = "Classe"
      
      if (classIds.length > 0) {
        let classStudents: any[] = []
        
        // Si des élèves filtrés par LV2 existent, les utiliser
        if (subRoom.filtered_student_ids && subRoom.filtered_student_ids.length > 0) {
          const { data: filteredStudents } = await supabase
            .from("students")
            .select("id, first_name, last_name, role, lv2")
            .in("id", subRoom.filtered_student_ids)
            .eq("is_deleted", false)
            .order("last_name")
          
          classStudents = filteredStudents || []
        } else {
          // Sinon, charger tous les élèves des classes
          const { data: allStudents } = await supabase
            .from("students")
            .select("id, first_name, last_name, role")
            .in("class_id", classIds)
            .eq("is_deleted", false)
            .order("last_name")
          
          classStudents = allStudents || []
        }
        
        setStudents(classStudents)

        // Obtenir le nom de la classe
        const { data: classData } = await supabase
          .from("classes")
          .select("name")
          .in("id", classIds)
        
        classNames = classData?.map(c => c.name).join(", ") || "Classe"
        
        // Ajouter le filtre LV2 au nom si applicable
        if (subRoom.lv2_filter) {
          classNames += ` (${subRoom.lv2_filter})`
        }
      }

      setActiveSubRoom({
        id: subRoom.id,
        name: subRoom.name,
        roomName: subRoom.rooms?.name || "Salle",
        className: classNames,
        startTime: matchingSchedule.start_time?.slice(0, 5) || "",
        endTime: matchingSchedule.end_time?.slice(0, 5) || "",
        weekType: matchingSchedule.week_type,
        roomConfig: subRoom.rooms?.config || { columns: [] },
      })
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
  const renderPlan = (isFullscreenView: boolean) => {
    if (!activeSubRoom) return null

    const config = activeSubRoom.roomConfig
    const columns = config.columns || []
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
                  const studentId = seatAssignments.get(currentSeat)
                  const student = studentId ? students.find((s) => s.id === studentId) : null

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

  if (isLoading) {
    return null
  }

  if (!activeSubRoom) {
    return null
  }

  // Compter les élèves placés
  const placedStudentsCount = Array.from(seatAssignments.values()).filter(id => 
    students.some(s => s.id === id)
  ).length

  return (
    <>
      <Card className="border-[#E7A541] bg-gradient-to-r from-[#FDF6E9] to-white shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#E7A541] shadow-md">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-[#29282B]">Cours en cours</CardTitle>
                <p className="text-sm text-[#29282B]/60">
                  {activeSubRoom.startTime} - {activeSubRoom.endTime}
                  {activeSubRoom.weekType !== "both" && (
                    <Badge className={cn(
                      "ml-2 text-xs",
                      activeSubRoom.weekType === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      Semaine {activeSubRoom.weekType}
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsFullscreen(true)}
              className="bg-[#E7A541] hover:bg-[#D4933A] text-white shadow-md"
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
                <MapPin className="h-4 w-4 text-[#E7A541]" />
                <span className="text-[#29282B] font-medium">{activeSubRoom.roomName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-[#E7A541]" />
                <span className="text-[#29282B] font-medium">{activeSubRoom.className}</span>
              </div>
              <p className="text-lg font-bold text-[#29282B] mt-2">{activeSubRoom.name}</p>
              <p className="text-sm text-[#29282B]/60">
                {placedStudentsCount}/{students.length} élèves placés
              </p>
            </div>

            {/* Mini plan */}
            <div className="flex-1 flex justify-center">
              {renderPlan(false)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog plein écran - Adaptatif */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-fit max-h-[95vh] overflow-auto">
          <DialogHeader className="border-b border-[#D9DADC] pb-4">
            <DialogTitle className="flex items-center gap-4 text-[#29282B] flex-wrap">
              <span className="text-xl font-bold">{activeSubRoom.name}</span>
              <Badge className="bg-[#FDF6E9] text-[#E7A541] border border-[#E7A541]/20 text-sm px-3 py-1">
                {activeSubRoom.roomName}
              </Badge>
              <Badge className="bg-[#F5F5F6] text-[#29282B] text-sm px-3 py-1">
                {activeSubRoom.className}
              </Badge>
              <span className="text-sm text-[#29282B]/60 ml-auto">
                {activeSubRoom.startTime} - {activeSubRoom.endTime} • {placedStudentsCount}/{students.length} élèves
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {/* Tableau */}
            <div className="w-full max-w-3xl mx-auto h-10 bg-[#E7A541] rounded-lg flex items-center justify-center mb-8 shadow-md">
              <span className="text-white font-bold tracking-wide">TABLEAU</span>
            </div>

            {/* Plan adaptatif */}
            {renderPlan(true)}

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
    </>
  )
}
