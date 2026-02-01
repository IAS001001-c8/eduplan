"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, Edit, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleTimelineProps {
  teacherId: string
  establishmentId: string
  onEditSubRoom?: (subRoomId: string) => void
}

interface ScheduleEvent {
  id: string
  subRoomId: string
  subRoomName: string
  roomName: string
  className: string
  dayOfWeek: number
  startTime: string
  endTime: string
  weekType: "A" | "B" | "both"
}

const DAYS_OF_WEEK = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
const HOURS_START = 7.5 // 7h30
const HOURS_END = 19.5 // 19h30
const HOUR_HEIGHT = 50 // pixels par heure

// Fonction pour obtenir le numéro de semaine ISO
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Obtenir le lundi d'une semaine donnée
function getWeekStartDate(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Formater une date en français
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
}

// Convertir "HH:MM" en nombre décimal
function timeToDecimal(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours + minutes / 60
}

export function ScheduleTimeline({ teacherId, establishmentId, onEditSubRoom }: ScheduleTimelineProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [currentWeekType, setCurrentWeekType] = useState<"A" | "B">("A")
  const [isLoading, setIsLoading] = useState(true)

  const weekStart = useMemo(() => getWeekStartDate(currentDate), [currentDate])
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    return end
  }, [weekStart])

  const weekNumber = useMemo(() => getWeekNumber(weekStart), [weekStart])

  useEffect(() => {
    fetchEvents()
  }, [teacherId, establishmentId, weekStart])

  const fetchEvents = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // 1. Obtenir le type de semaine
      const { data: weekData } = await supabase
        .from("week_ab_calendar")
        .select("week_type")
        .eq("establishment_id", establishmentId)
        .eq("year", weekStart.getFullYear())
        .eq("week_number", weekNumber)
        .maybeSingle()

      const weekType = (weekData?.week_type as "A" | "B") || "A"
      setCurrentWeekType(weekType)

      // 2. Charger les créneaux du professeur
      const { data: schedules, error } = await supabase
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
            teacher_id,
            is_deleted,
            rooms (name),
            classes (name)
          )
        `)

      if (error) throw error

      // Filtrer par professeur et formater
      const filteredEvents: ScheduleEvent[] = []
      
      schedules?.forEach((s: any) => {
        const subRoom = s.sub_rooms
        if (!subRoom || subRoom.is_deleted) return
        if (subRoom.teacher_id !== teacherId) return
        
        // Vérifier si le créneau correspond à cette semaine
        if (s.week_type !== "both" && s.week_type !== weekType) return

        filteredEvents.push({
          id: s.id,
          subRoomId: subRoom.id,
          subRoomName: subRoom.name,
          roomName: subRoom.rooms?.name || "Salle",
          className: subRoom.classes?.name || "Classe",
          dayOfWeek: s.day_of_week,
          startTime: s.start_time.slice(0, 5),
          endTime: s.end_time.slice(0, 5),
          weekType: s.week_type,
        })
      })

      setEvents(filteredEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calculer la position et la hauteur d'un événement
  const getEventStyle = (event: ScheduleEvent) => {
    const startDecimal = timeToDecimal(event.startTime)
    const endDecimal = timeToDecimal(event.endTime)
    const duration = endDecimal - startDecimal
    const top = (startDecimal - HOURS_START) * HOUR_HEIGHT
    const height = duration * HOUR_HEIGHT

    return {
      top: `${top}px`,
      height: `${Math.max(height - 2, 20)}px`,
    }
  }

  // Générer les lignes d'heures
  const hourLines = []
  for (let hour = HOURS_START; hour <= HOURS_END; hour += 0.5) {
    const isFullHour = hour % 1 === 0
    hourLines.push({
      hour,
      label: isFullHour ? `${Math.floor(hour)}:00` : `${Math.floor(hour)}:30`,
      isFullHour,
    })
  }

  return (
    <Card className="border-[#D9DADC]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FDF6E9]">
              <Calendar className="h-5 w-5 text-[#E7A541]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#29282B]">Emploi du temps</CardTitle>
              <p className="text-sm text-[#29282B]/60">Vue hebdomadaire des créneaux</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="border-[#D9DADC]">
              Aujourd'hui
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousWeek} className="border-[#D9DADC]">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium text-[#29282B] min-w-[280px] text-center">
              Du {formatDate(weekStart)} au {formatDate(weekEnd)}
              <Badge className={cn(
                "ml-2",
                currentWeekType === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                Semaine {currentWeekType}
              </Badge>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextWeek} className="border-[#D9DADC]">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <p className="text-[#29282B]/60">Chargement...</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <div className="flex" style={{ minWidth: "900px" }}>
              {/* Colonne des heures */}
              <div className="w-16 flex-shrink-0 border-r border-[#D9DADC]">
                <div className="h-10" /> {/* Header spacer */}
                <div className="relative" style={{ height: `${(HOURS_END - HOURS_START) * HOUR_HEIGHT}px` }}>
                  {hourLines.map(({ hour, label, isFullHour }) => (
                    <div
                      key={hour}
                      className="absolute right-2 -translate-y-1/2"
                      style={{ top: `${(hour - HOURS_START) * HOUR_HEIGHT}px` }}
                    >
                      {isFullHour && (
                        <span className="text-xs text-[#29282B]/50">{label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonnes des jours */}
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                const dayDate = new Date(weekStart)
                dayDate.setDate(weekStart.getDate() + dayIndex)
                const isToday = dayDate.toDateString() === new Date().toDateString()
                const dayEvents = events.filter((e) => e.dayOfWeek === dayIndex)

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "flex-1 min-w-[120px] border-r border-[#D9DADC] last:border-r-0",
                      isToday && "bg-[#FDF6E9]/30"
                    )}
                  >
                    {/* Header */}
                    <div className={cn(
                      "h-10 flex flex-col items-center justify-center border-b border-[#D9DADC]",
                      isToday && "bg-[#E7A541] text-white"
                    )}>
                      <span className="text-xs font-medium">{day}</span>
                      <span className="text-[10px]">{dayDate.getDate()}</span>
                    </div>

                    {/* Grille horaire */}
                    <div
                      className="relative"
                      style={{ height: `${(HOURS_END - HOURS_START) * HOUR_HEIGHT}px` }}
                    >
                      {/* Lignes horizontales */}
                      {hourLines.map(({ hour, isFullHour }) => (
                        <div
                          key={hour}
                          className={cn(
                            "absolute w-full border-t",
                            isFullHour ? "border-[#D9DADC]" : "border-[#D9DADC]/30"
                          )}
                          style={{ top: `${(hour - HOURS_START) * HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {/* Événements */}
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute left-1 right-1 rounded-md p-1 cursor-pointer transition-all hover:shadow-md overflow-hidden",
                            event.weekType === "A"
                              ? "bg-green-500 text-white"
                              : event.weekType === "B"
                              ? "bg-red-500 text-white"
                              : "bg-[#E7A541] text-white"
                          )}
                          style={getEventStyle(event)}
                          onClick={() => onEditSubRoom?.(event.subRoomId)}
                          title={`${event.subRoomName}\n${event.className}\n${event.roomName}\n${event.startTime} - ${event.endTime}`}
                        >
                          <div className="text-[10px] font-semibold truncate">
                            {event.className}
                          </div>
                          <div className="text-[9px] truncate opacity-90">
                            {event.startTime}-{event.endTime}
                          </div>
                          <div className="text-[9px] truncate opacity-80">
                            {event.roomName}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-0 right-0 h-5 w-5 p-0 opacity-70 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditSubRoom?.(event.subRoomId)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Légende */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#D9DADC]">
          <span className="text-sm text-[#29282B]/60">Légende :</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs text-[#29282B]">Semaine A</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs text-[#29282B]">Semaine B</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#E7A541]" />
            <span className="text-xs text-[#29282B]">Toutes les semaines</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
