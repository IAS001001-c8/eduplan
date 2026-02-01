"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  LayoutGrid,
  ArrowRight,
  Clock,
  CheckCircle2,
  Eye,
  BookOpen,
  Calendar,
} from "lucide-react"
import { motion } from "framer-motion"
import { CurrentClassPlan } from "@/components/current-class-plan"
import { cn } from "@/lib/utils"

interface ProfesseurDashboardProps {
  establishmentId: string
  userId: string
  userName: string
  onNavigate: (section: string) => void
}

interface ScheduleEvent {
  id: string
  subRoomName: string
  className: string
  roomName: string
  startTime: string
  endTime: string
  weekType: string
}

interface Proposal {
  id: string
  name: string
  className: string
  proposedBy: string
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
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

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

export function ProfesseurDashboard({ establishmentId, userId, userName, onNavigate }: ProfesseurDashboardProps) {
  const [todaySchedule, setTodaySchedule] = useState<ScheduleEvent[]>([])
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([])
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [currentWeekType, setCurrentWeekType] = useState<string>("A")
  const [subRoomCount, setSubRoomCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const today = useMemo(() => new Date(), [])
  const currentDayOfWeek = getDayOfWeek()
  const currentTime = today.toTimeString().slice(0, 5)

  useEffect(() => {
    fetchData()
  }, [establishmentId, userId])

  const fetchData = async () => {
    const supabase = createClient()

    try {
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle()

      if (!teacherData) {
        setIsLoading(false)
        return
      }

      setTeacherId(teacherData.id)

      // Obtenir le type de semaine actuel
      const currentWeek = getWeekNumber(today)
      const currentYear = today.getFullYear()

      const { data: weekData } = await supabase
        .from("week_ab_calendar")
        .select("week_type")
        .eq("establishment_id", establishmentId)
        .eq("year", currentYear)
        .eq("week_number", currentWeek)
        .maybeSingle()

      const weekType = weekData?.week_type || "A"
      setCurrentWeekType(weekType)

      // Charger les sous-salles du professeur
      const { data: subRooms } = await supabase
        .from("sub_rooms")
        .select(`
          id,
          name,
          rooms (name),
          classes (name),
          class_ids
        `)
        .eq("teacher_id", teacherData.id)
        .eq("is_deleted", false)

      setSubRoomCount(subRooms?.length || 0)

      if (subRooms && subRooms.length > 0) {
        // Charger les créneaux de la journée
        const subRoomIds = subRooms.map(sr => sr.id)
        
        const { data: schedules } = await supabase
          .from("sub_room_schedules")
          .select("*")
          .in("sub_room_id", subRoomIds)
          .eq("day_of_week", currentDayOfWeek)
          .order("start_time")

        // Filtrer par type de semaine et formater
        const todayEvents: ScheduleEvent[] = []
        
        schedules?.forEach((s: any) => {
          if (s.week_type !== "both" && s.week_type !== weekType) return

          const subRoom = subRooms.find(sr => sr.id === s.sub_room_id) as any
          if (!subRoom) return

          // Obtenir le nom de la classe
          let className = subRoom.classes?.name || "Classe"
          if (subRoom.class_ids && subRoom.class_ids.length > 1) {
            className = `${subRoom.class_ids.length} classes`
          }

          todayEvents.push({
            id: s.id,
            subRoomName: subRoom.name,
            className,
            roomName: subRoom.rooms?.name || "Salle",
            startTime: s.start_time?.slice(0, 5) || "",
            endTime: s.end_time?.slice(0, 5) || "",
            weekType: s.week_type,
          })
        })

        setTodaySchedule(todayEvents)
      }

      // Charger les propositions en attente
      const { data: proposals } = await supabase
        .from("sub_room_proposals")
        .select(`
          id,
          name,
          classes (name),
          profiles!sub_room_proposals_proposed_by_fkey (first_name, last_name),
          created_at
        `)
        .eq("teacher_id", teacherData.id)
        .eq("status", "pending")
        .eq("is_submitted", true)
        .order("created_at", { ascending: false })
        .limit(5)

      setPendingProposals(
        proposals?.map((p: any) => ({
          id: p.id,
          name: p.name,
          className: p.classes?.name || "Classe",
          proposedBy: `${p.profiles?.first_name || ""} ${p.profiles?.last_name || ""}`.trim() || "Inconnu",
          createdAt: new Date(p.created_at).toLocaleDateString("fr-FR"),
        })) || []
      )
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Vérifier si un créneau est en cours
  const isCurrentSlot = (startTime: string, endTime: string) => {
    return currentTime >= startTime && currentTime <= endTime
  }

  // Vérifier si un créneau est passé
  const isPastSlot = (endTime: string) => {
    return currentTime > endTime
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-[#F5F5F6] rounded-lg animate-pulse" />
        <div className="h-64 bg-[#F5F5F6] rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#29282B]">
              Bonjour, {userName.split(" ")[0]} 👋
            </h1>
            <p className="text-[#29282B]/60 mt-1">
              {DAYS_FR[currentDayOfWeek]} • Semaine {currentWeekType} • {subRoomCount} plan{subRoomCount > 1 ? "s" : ""} de classe
            </p>
          </div>
        </div>
      </motion.div>

      {/* Current Class Plan - Shows if there's an active session */}
      {teacherId && (
        <motion.div variants={itemVariants}>
          <CurrentClassPlan
            teacherId={teacherId}
            establishmentId={establishmentId}
          />
        </motion.div>
      )}

      {/* Emploi du temps de la journée */}
      <motion.div variants={itemVariants}>
        <Card className="border-[#D9DADC] bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FDF6E9]">
                  <Calendar className="h-5 w-5 text-[#E7A541]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-[#29282B]">
                    Emploi du temps - {DAYS_FR[currentDayOfWeek]}
                  </CardTitle>
                  <CardDescription className="text-[#29282B]/60">
                    {todaySchedule.length} créneau{todaySchedule.length > 1 ? "x" : ""} aujourd'hui
                    {currentWeekType && (
                      <Badge className={cn(
                        "ml-2",
                        currentWeekType === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        Semaine {currentWeekType}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate("seating-plan")} 
                className="text-[#E7A541] hover:text-[#D4933A] hover:bg-[#FDF6E9]"
              >
                Voir tous les plans
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-2">
                {todaySchedule.map((slot) => {
                  const isCurrent = isCurrentSlot(slot.startTime, slot.endTime)
                  const isPast = isPastSlot(slot.endTime)

                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-all",
                        isCurrent 
                          ? "bg-[#FDF6E9] border-[#E7A541] shadow-md" 
                          : isPast
                          ? "bg-[#F5F5F6] border-[#D9DADC] opacity-60"
                          : "bg-white border-[#D9DADC] hover:border-[#E7A541]/50"
                      )}
                    >
                      {/* Horaires */}
                      <div className="text-center min-w-[80px]">
                        <p className={cn(
                          "text-lg font-bold",
                          isCurrent ? "text-[#E7A541]" : "text-[#29282B]"
                        )}>
                          {slot.startTime}
                        </p>
                        <p className="text-xs text-[#29282B]/50">{slot.endTime}</p>
                      </div>

                      {/* Séparateur */}
                      <div className={cn(
                        "w-1 h-12 rounded-full",
                        isCurrent ? "bg-[#E7A541]" : isPast ? "bg-[#D9DADC]" : "bg-[#D9DADC]"
                      )} />

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold truncate",
                          isCurrent ? "text-[#E7A541]" : "text-[#29282B]"
                        )}>
                          {slot.className}
                        </p>
                        <p className="text-sm text-[#29282B]/60 truncate">
                          {slot.subRoomName} • {slot.roomName}
                        </p>
                      </div>

                      {/* Badge semaine */}
                      {slot.weekType !== "both" && (
                        <Badge className={cn(
                          "text-xs",
                          slot.weekType === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {slot.weekType}
                        </Badge>
                      )}

                      {/* Status */}
                      {isCurrent && (
                        <Badge className="bg-[#E7A541] text-white animate-pulse">
                          En cours
                        </Badge>
                      )}
                      {isPast && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Calendar className="h-12 w-12 text-[#D9DADC] mx-auto mb-3" />
                <p className="text-[#29282B]/60">Aucun créneau prévu aujourd'hui</p>
                <p className="text-sm text-[#29282B]/40 mt-1">
                  Créez des créneaux dans vos plans de classe pour les voir ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Proposals */}
      <motion.div variants={itemVariants}>
        <Card className="border-[#D9DADC] bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#29282B]">Propositions à valider</CardTitle>
                <CardDescription className="text-[#29282B]/60">Propositions soumises par les délégués</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("sandbox")} className="text-[#E7A541] hover:text-[#D4933A] hover:bg-[#FDF6E9]">
                Voir tout
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingProposals.length > 0 ? (
              <div className="space-y-3">
                {pendingProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#FDF6E9] border border-[#E7A541]/20 cursor-pointer hover:bg-[#FCF0DD] transition-colors"
                    onClick={() => onNavigate("sandbox")}
                  >
                    <div className="p-2 rounded-full bg-[#E7A541]/20">
                      <Clock className="h-4 w-4 text-[#E7A541]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#29282B] truncate">
                        {proposal.name}
                      </p>
                      <p className="text-xs text-[#29282B]/60">
                        {proposal.className} • Par {proposal.proposedBy}
                      </p>
                    </div>
                    <Badge className="bg-[#E7A541] text-white">
                      À valider
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-[#29282B]/60">Aucune proposition en attente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
