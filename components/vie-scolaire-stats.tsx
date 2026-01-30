"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  GraduationCap,
  BookOpen,
  DoorOpen,
  LayoutGrid,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  UserCheck,
  UserX
} from "lucide-react"

interface StatsProps {
  establishmentId: string
}

interface Stats {
  students: { total: number; delegates: number; ecoDelegates: number }
  teachers: { total: number; principals: number }
  classes: { total: number; withStudents: number }
  rooms: { total: number; totalSeats: number }
  subRooms: { total: number; collaborative: number }
  proposals: { total: number; pending: number; approved: number; rejected: number }
  placements: { totalPlaced: number; totalSeats: number; percentage: number }
}

export function VieScolaireStats({ establishmentId }: StatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchStats()
  }, [establishmentId])

  async function fetchStats() {
    setIsLoading(true)
    try {
      // Élèves
      const { data: students } = await supabase
        .from("students")
        .select("id, role, student_role")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)

      // Professeurs
      const { data: teachers } = await supabase
        .from("teachers")
        .select("id, is_principal")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)

      // Classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)

      const { data: classesWithStudents } = await supabase
        .from("students")
        .select("class_id")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)
        .not("class_id", "is", null)

      // Salles
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, config")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)

      // Sous-salles
      const { data: subRooms } = await supabase
        .from("sub_rooms")
        .select("id, is_collaborative")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)

      // Propositions
      const { data: proposals } = await supabase
        .from("sub_room_proposals")
        .select("id, status")
        .eq("establishment_id", establishmentId)

      // Placements
      const { data: placements } = await supabase
        .from("seating_assignments")
        .select("id, sub_room_id")
        .not("student_id", "is", null)

      // Calculer les statistiques
      const totalSeats = rooms?.reduce((sum, room) => {
        const columns = room.config?.columns || []
        return sum + columns.reduce((s: number, c: any) => s + (c.tables || 0) * (c.seatsPerTable || 0), 0)
      }, 0) || 0

      const uniqueClassIds = new Set(classesWithStudents?.map(s => s.class_id))

      setStats({
        students: {
          total: students?.length || 0,
          delegates: students?.filter(s => s.student_role === "delegue" || s.role === "delegue").length || 0,
          ecoDelegates: students?.filter(s => s.student_role === "eco-delegue" || s.role === "eco-delegue").length || 0
        },
        teachers: {
          total: teachers?.length || 0,
          principals: teachers?.filter(t => t.is_principal).length || 0
        },
        classes: {
          total: classes?.length || 0,
          withStudents: uniqueClassIds.size
        },
        rooms: {
          total: rooms?.length || 0,
          totalSeats
        },
        subRooms: {
          total: subRooms?.length || 0,
          collaborative: subRooms?.filter(sr => sr.is_collaborative).length || 0
        },
        proposals: {
          total: proposals?.length || 0,
          pending: proposals?.filter(p => p.status === "pending").length || 0,
          approved: proposals?.filter(p => p.status === "approved").length || 0,
          rejected: proposals?.filter(p => p.status === "rejected").length || 0
        },
        placements: {
          totalPlaced: placements?.length || 0,
          totalSeats,
          percentage: totalSeats > 0 ? Math.round((placements?.length || 0) / totalSeats * 100) : 0
        }
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-slate-200 rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Résumé principal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Élèves</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats.students.delegates} délégué{stats.students.delegates > 1 ? "s" : ""}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                {stats.students.ecoDelegates} éco
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Professeurs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachers.total}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.teachers.principals} professeur{stats.teachers.principals > 1 ? "s" : ""} principa{stats.teachers.principals > 1 ? "ux" : "l"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classes.total}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.classes.withStudents} avec élèves
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salles</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rooms.total}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.rooms.totalSeats} places totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Plans de classe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Sous-salles actives</span>
              <span className="font-bold">{stats.subRooms.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Collaboratives</span>
              <Badge variant="outline">{stats.subRooms.collaborative}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Propositions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                En attente
              </span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                {stats.proposals.pending}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Validées
              </span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {stats.proposals.approved}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                Refusées
              </span>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {stats.proposals.rejected}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taux de placement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-emerald-600">
              {stats.placements.percentage}%
            </div>
            <Progress value={stats.placements.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {stats.placements.totalPlaced} / {stats.placements.totalSeats} places occupées
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
