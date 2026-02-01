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
  seatAssignments: Record<string, string>
  roomConfig: any
}

interface Student {
  id: string
  first_name: string
  last_name: string
  role?: string
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
          seat_assignments,
          teacher_id,
          is_deleted,
          room_id,
          class_id,
          class_ids,
          rooms (name, config),
          classes (id, name)
        `)
        .eq("teacher_id", teacherId)
        .eq("is_deleted", false)

      if (subRoomError) {
        console.error("Error fetching sub_rooms:", subRoomError)
        setIsLoading(false)
        return
      }

      if (!subRooms || subRooms.length === 0) {
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

      // 4. Charger les élèves de la/des classe(s)
      // Utiliser class_ids si disponible, sinon class_id
      const classIds = subRoom.class_ids && subRoom.class_ids.length > 0 
        ? subRoom.class_ids 
        : (subRoom.class_id ? [subRoom.class_id] : [])

      if (classIds.length > 0) {
        const { data: classStudents } = await supabase
          .from("students")
          .select("id, first_name, last_name, role")
          .in("class_id", classIds)
          .eq("is_deleted", false)
          .order("last_name")

        setStudents(classStudents || [])

        // Obtenir le nom de la classe
        const { data: classData } = await supabase
          .from("classes")
          .select("name")
          .in("id", classIds)
        
        const classNames = classData?.map(c => c.name).join(", ") || "Classe"

        setActiveSubRoom({
          id: subRoom.id,
          name: subRoom.name,
          roomName: subRoom.rooms?.name || "Salle",
          className: classNames,
          startTime: matchingSchedule.start_time?.slice(0, 5) || "",
          endTime: matchingSchedule.end_time?.slice(0, 5) || "",
          weekType: matchingSchedule.week_type,
          seatAssignments: subRoom.seat_assignments || {},
          roomConfig: subRoom.rooms?.config || { columns: [] },
        })
      } else {
        setActiveSubRoom({
          id: subRoom.id,
          name: subRoom.name,
          roomName: subRoom.rooms?.name || "Salle",
          className: subRoom.classes?.name || "Classe",
          startTime: matchingSchedule.start_time?.slice(0, 5) || "",
          endTime: matchingSchedule.end_time?.slice(0, 5) || "",
          weekType: matchingSchedule.week_type,
          seatAssignments: subRoom.seat_assignments || {},
          roomConfig: subRoom.rooms?.config || { columns: [] },
        })
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Rendu du mini plan de classe
  const renderMiniPlan = () => {
    if (!activeSubRoom) return null

    const config = activeSubRoom.roomConfig
    const columns = config.columns || []
    let seatNumber = 1

    return (
      <div className="flex gap-2 justify-center">
        {columns.map((column: any, colIndex: number) => (
          <div key={colIndex} className="flex flex-col gap-1">
            {Array.from({ length: column.tables || 0 }).map((_, tableIndex) => (
              <div key={tableIndex} className="flex gap-0.5">
                {Array.from({ length: column.seatsPerTable || 2 }).map((_, seatIndex) => {
                  const currentSeat = seatNumber++
                  const studentId = activeSubRoom.seatAssignments[currentSeat.toString()]
                  const student = studentId ? students.find((s) => s.id === studentId) : null

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
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Rendu du plan de classe en plein écran
  const renderFullPlan = () => {
    if (!activeSubRoom) return null

    const config = activeSubRoom.roomConfig
    const columns = config.columns || []
    let seatNumber = 1

    return (
      <div className="p-6">
        {/* Tableau */}
        <div className="w-full max-w-4xl mx-auto h-14 bg-[#E7A541] rounded-xl flex items-center justify-center mb-10 shadow-lg">
          <span className="text-white font-bold text-lg tracking-wide">TABLEAU</span>
        </div>

        {/* Places */}
        <div className="flex gap-8 justify-center">
          {columns.map((column: any, colIndex: number) => (
            <div key={colIndex} className="flex flex-col gap-3">
              {Array.from({ length: column.tables || 0 }).map((_, tableIndex) => (
                <div key={tableIndex} className="flex gap-2">
                  {Array.from({ length: column.seatsPerTable || 2 }).map((_, seatIndex) => {
                    const currentSeat = seatNumber++
                    const studentId = activeSubRoom.seatAssignments[currentSeat.toString()]
                    const student = studentId ? students.find((s) => s.id === studentId) : null

                    return (
                      <div
                        key={seatIndex}
                        className={cn(
                          "w-32 h-20 rounded-xl flex flex-col items-center justify-center p-2 shadow-md transition-all",
                          student
                            ? student.role === "delegue"
                              ? "bg-[#E7A541] text-white"
                              : student.role === "eco-delegue"
                              ? "bg-green-500 text-white"
                              : "bg-[#29282B] text-white"
                            : "bg-[#F5F5F6] border-2 border-dashed border-[#D9DADC]"
                        )}
                      >
                        {student ? (
                          <>
                            <span className="text-sm font-bold truncate w-full text-center">
                              {student.last_name}
                            </span>
                            <span className="text-xs truncate w-full text-center opacity-80">
                              {student.first_name}
                            </span>
                            {student.role && (
                              <Badge className={cn(
                                "mt-1 text-[10px] px-2",
                                student.role === "delegue" ? "bg-white/20" : "bg-white/20"
                              )}>
                                {student.role === "delegue" ? "Délégué" : "Éco-délégué"}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-[#29282B]/30 font-medium">{currentSeat}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 mt-10 pt-6 border-t border-[#D9DADC]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#29282B]" />
            <span className="text-sm text-[#29282B]">Élève</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#E7A541]" />
            <span className="text-sm text-[#29282B]">Délégué</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-500" />
            <span className="text-sm text-[#29282B]">Éco-délégué</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#F5F5F6] border-2 border-dashed border-[#D9DADC]" />
            <span className="text-sm text-[#29282B]">Place vide</span>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return null // Ne rien afficher pendant le chargement
  }

  if (!activeSubRoom) {
    return null // Ne rien afficher s'il n'y a pas de cours en cours
  }

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
              <p className="text-sm text-[#29282B]/60">{students.length} élèves</p>
            </div>

            {/* Mini plan */}
            <div className="flex-1 flex justify-center">
              {renderMiniPlan()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog plein écran - AGRANDI */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-auto">
          <DialogHeader className="border-b border-[#D9DADC] pb-4">
            <DialogTitle className="flex items-center gap-4 text-[#29282B]">
              <span className="text-2xl font-bold">{activeSubRoom.name}</span>
              <Badge className="bg-[#FDF6E9] text-[#E7A541] border border-[#E7A541]/20 text-sm px-3 py-1">
                {activeSubRoom.roomName}
              </Badge>
              <Badge className="bg-[#F5F5F6] text-[#29282B] text-sm px-3 py-1">
                {activeSubRoom.className}
              </Badge>
              <span className="text-base text-[#29282B]/60 ml-auto">
                {activeSubRoom.startTime} - {activeSubRoom.endTime}
              </span>
            </DialogTitle>
          </DialogHeader>
          {renderFullPlan()}
        </DialogContent>
      </Dialog>
    </>
  )
}
