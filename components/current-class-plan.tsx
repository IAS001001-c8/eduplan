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

      // 2. Chercher les sous-salles actives pour ce professeur
      const { data: schedules, error: scheduleError } = await supabase
        .from("sub_room_schedules")
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          week_type,
          sub_room_id,
          sub_rooms!inner (
            id,
            name,
            seat_assignments,
            teacher_id,
            is_deleted,
            room_id,
            class_id,
            rooms (name, config),
            classes (id, name)
          )
        `)
        .eq("day_of_week", currentDay)
        .lte("start_time", currentTime)
        .gte("end_time", currentTime)

      if (scheduleError) {
        console.error("Error fetching schedules:", scheduleError)
        setIsLoading(false)
        return
      }

      // Filtrer par professeur et type de semaine
      const matchingSchedule = schedules?.find((s: any) => {
        const subRoom = s.sub_rooms
        if (!subRoom || subRoom.is_deleted) return false
        if (subRoom.teacher_id !== teacherId) return false
        if (s.week_type !== "both" && s.week_type !== weekType) return false
        return true
      })

      if (!matchingSchedule) {
        setActiveSubRoom(null)
        setIsLoading(false)
        return
      }

      const subRoom = matchingSchedule.sub_rooms as any

      // 3. Charger les élèves de la classe
      if (subRoom.class_id) {
        const { data: classStudents } = await supabase
          .from("students")
          .select("id, first_name, last_name, role")
          .eq("class_id", subRoom.class_id)
          .eq("is_deleted", false)
          .order("last_name")

        setStudents(classStudents || [])
      }

      setActiveSubRoom({
        id: subRoom.id,
        name: subRoom.name,
        roomName: subRoom.rooms?.name || "Salle inconnue",
        className: subRoom.classes?.name || "Classe inconnue",
        startTime: matchingSchedule.start_time,
        endTime: matchingSchedule.end_time,
        weekType: matchingSchedule.week_type,
        seatAssignments: subRoom.seat_assignments || {},
        roomConfig: subRoom.rooms?.config || { columns: [] },
      })
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
                        "w-6 h-6 rounded text-[6px] flex items-center justify-center truncate",
                        student
                          ? student.role === "delegue"
                            ? "bg-[#E7A541] text-white"
                            : student.role === "eco-delegue"
                            ? "bg-green-500 text-white"
                            : "bg-[#D9DADC] text-[#29282B]"
                          : "bg-[#F5F5F6] border border-[#D9DADC]"
                      )}
                      title={student ? `${student.first_name} ${student.last_name}` : "Vide"}
                    >
                      {student ? student.last_name.slice(0, 3) : ""}
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
      <div className="p-8">
        {/* Tableau */}
        <div className="w-full max-w-2xl mx-auto h-10 bg-[#E7A541] rounded-lg flex items-center justify-center mb-8">
          <span className="text-white font-medium">TABLEAU</span>
        </div>

        {/* Places */}
        <div className="flex gap-6 justify-center">
          {columns.map((column: any, colIndex: number) => (
            <div key={colIndex} className="flex flex-col gap-2">
              {Array.from({ length: column.tables || 0 }).map((_, tableIndex) => (
                <div key={tableIndex} className="flex gap-1">
                  {Array.from({ length: column.seatsPerTable || 2 }).map((_, seatIndex) => {
                    const currentSeat = seatNumber++
                    const studentId = activeSubRoom.seatAssignments[currentSeat.toString()]
                    const student = studentId ? students.find((s) => s.id === studentId) : null

                    return (
                      <div
                        key={seatIndex}
                        className={cn(
                          "w-24 h-16 rounded-lg flex flex-col items-center justify-center p-1",
                          student
                            ? student.role === "delegue"
                              ? "bg-[#E7A541] text-white"
                              : student.role === "eco-delegue"
                              ? "bg-green-500 text-white"
                              : "bg-[#D9DADC] text-[#29282B]"
                            : "bg-[#F5F5F6] border border-[#D9DADC]"
                        )}
                      >
                        {student ? (
                          <>
                            <span className="text-xs font-semibold truncate w-full text-center">
                              {student.last_name}
                            </span>
                            <span className="text-[10px] truncate w-full text-center opacity-80">
                              {student.first_name}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[#29282B]/40">{currentSeat}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
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
      <Card className="border-[#D9DADC] bg-gradient-to-r from-[#FDF6E9] to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E7A541]">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-[#29282B]">Cours en cours</CardTitle>
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
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="border-[#E7A541] text-[#E7A541] hover:bg-[#FDF6E9]"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Plein écran
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Infos */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[#29282B]/50" />
                <span className="text-[#29282B]">{activeSubRoom.roomName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-[#29282B]/50" />
                <span className="text-[#29282B]">{activeSubRoom.className}</span>
              </div>
              <p className="text-lg font-semibold text-[#29282B]">{activeSubRoom.name}</p>
            </div>

            {/* Mini plan */}
            <div className="flex-1 flex justify-center">
              {renderMiniPlan()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog plein écran */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-[#29282B]">
              <span className="text-xl">{activeSubRoom.name}</span>
              <Badge className="bg-[#FDF6E9] text-[#E7A541] border border-[#E7A541]/20">
                {activeSubRoom.roomName}
              </Badge>
              <Badge className="bg-[#F5F5F6] text-[#29282B]">
                {activeSubRoom.className}
              </Badge>
              <span className="text-sm text-[#29282B]/60 ml-auto">
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
