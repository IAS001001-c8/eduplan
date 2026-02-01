"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  GraduationCap,
  School,
  LayoutGrid,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { motion } from "framer-motion"

interface VieScolaireDashboardProps {
  establishmentId: string
  onNavigate: (section: string) => void
}

interface Stats {
  totalStudents: number
  totalTeachers: number
  totalRooms: number
  totalSubRooms: number
  pendingProposals: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
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

export function VieScolaireDashboard({ establishmentId, onNavigate }: VieScolaireDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalRooms: 0,
    totalSubRooms: 0,
    pendingProposals: 0,
    recentActivity: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [establishmentId])

  const fetchStats = async () => {
    const supabase = createClient()

    try {
      // Fetch counts in parallel
      const [studentsRes, teachersRes, roomsRes, subRoomsRes, proposalsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId).eq("is_deleted", false),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId).eq("is_deleted", false),
        supabase.from("rooms").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId),
        supabase.from("sub_rooms").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId),
        supabase.from("sub_room_proposals").select("id", { count: "exact", head: true }).eq("status", "pending").eq("is_submitted", true),
      ])

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalRooms: roomsRes.count || 0,
        totalSubRooms: subRoomsRes.count || 0,
        pendingProposals: proposalsRes.count || 0,
        recentActivity: [],
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Élèves",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-blue-500",
      lightColor: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
      onClick: () => onNavigate("students"),
    },
    {
      title: "Professeurs",
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 dark:bg-emerald-950",
      textColor: "text-emerald-600 dark:text-emerald-400",
      onClick: () => onNavigate("teachers"),
    },
    {
      title: "Salles",
      value: stats.totalRooms,
      icon: School,
      color: "bg-amber-500",
      lightColor: "bg-amber-50 dark:bg-amber-950",
      textColor: "text-amber-600 dark:text-amber-400",
      onClick: () => onNavigate("rooms"),
    },
    {
      title: "Plans de classe",
      value: stats.totalSubRooms,
      icon: LayoutGrid,
      color: "bg-purple-500",
      lightColor: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
      onClick: () => onNavigate("seating-plan"),
    },
  ]

  const quickActions = [
    { label: "Ajouter un élève", icon: Users, action: () => onNavigate("students"), color: "bg-blue-500 hover:bg-blue-600" },
    { label: "Ajouter un professeur", icon: GraduationCap, action: () => onNavigate("teachers"), color: "bg-emerald-500 hover:bg-emerald-600" },
    { label: "Créer une salle", icon: School, action: () => onNavigate("rooms"), color: "bg-amber-500 hover:bg-amber-600" },
    { label: "Créer un plan", icon: LayoutGrid, action: () => onNavigate("seating-plan"), color: "bg-purple-500 hover:bg-purple-600" },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Message */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Tableau de bord
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Vue d'ensemble de votre établissement
            </p>
          </div>
          {stats.pendingProposals > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              <Clock className="w-3 h-3 mr-1" />
              {stats.pendingProposals} proposition{stats.pendingProposals > 1 ? "s" : ""} en attente
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 shadow-sm"
            onClick={stat.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl", stat.lightColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.textColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Actions rapides</CardTitle>
            <CardDescription>Créez rapidement de nouvelles entrées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                  onClick={action.action}
                >
                  <div className={cn("p-2 rounded-lg text-white", action.color)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Grid */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        {/* Pending Proposals */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Propositions en attente</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("sandbox")}>
                Voir tout
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.pendingProposals > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {stats.pendingProposals} proposition{stats.pendingProposals > 1 ? "s" : ""} à examiner
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cliquez pour voir les détails
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune proposition en attente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">Élèves inscrits</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                    <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">Professeurs actifs</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalTeachers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <LayoutGrid className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">Plans configurés</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalSubRooms}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
