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
  CheckCircle2,
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
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [establishmentId])

  const fetchStats = async () => {
    const supabase = createClient()

    try {
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
      color: "bg-[#E7A541]",
      lightColor: "bg-[#FDF6E9]",
      textColor: "text-[#E7A541]",
      onClick: () => onNavigate("students"),
    },
    {
      title: "Professeurs",
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: "bg-[#29282B]",
      lightColor: "bg-[#F5F5F6]",
      textColor: "text-[#29282B]",
      onClick: () => onNavigate("teachers"),
    },
    {
      title: "Salles",
      value: stats.totalRooms,
      icon: School,
      color: "bg-[#D9DADC]",
      lightColor: "bg-[#F5F5F6]",
      textColor: "text-[#29282B]/70",
      onClick: () => onNavigate("rooms"),
    },
    {
      title: "Plans de classe",
      value: stats.totalSubRooms,
      icon: LayoutGrid,
      color: "bg-[#E7A541]",
      lightColor: "bg-[#FDF6E9]",
      textColor: "text-[#E7A541]",
      onClick: () => onNavigate("seating-plan"),
    },
  ]

  const quickActions = [
    { label: "Ajouter un élève", icon: Users, action: () => onNavigate("students") },
    { label: "Ajouter un professeur", icon: GraduationCap, action: () => onNavigate("teachers") },
    { label: "Créer une salle", icon: School, action: () => onNavigate("rooms") },
    { label: "Créer un plan", icon: LayoutGrid, action: () => onNavigate("seating-plan") },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse border-[#D9DADC]">
              <CardContent className="p-6">
                <div className="h-20 bg-[#F5F5F6] rounded" />
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
            <h1 className="text-2xl font-bold text-[#29282B]">
              Tableau de bord
            </h1>
            <p className="text-[#29282B]/60 mt-1">
              Vue d'ensemble de votre établissement
            </p>
          </div>
          {stats.pendingProposals > 0 && (
            <Badge className="bg-[#FDF6E9] text-[#E7A541] border border-[#E7A541]/20 hover:bg-[#FDF6E9]">
              <Clock className="w-3 h-3 mr-1" />
              {stats.pendingProposals} proposition{stats.pendingProposals > 1 ? "s" : ""} en attente
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-[#D9DADC] bg-white"
            onClick={stat.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#29282B]/60">{stat.title}</p>
                  <p className="text-3xl font-bold text-[#29282B] mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.lightColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border-[#D9DADC] bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#29282B]">Actions rapides</CardTitle>
            <CardDescription className="text-[#29282B]/60">Créez rapidement de nouvelles entrées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 border-[#D9DADC] hover:border-[#E7A541] hover:bg-[#FDF6E9] transition-all group"
                  onClick={action.action}
                >
                  <div className="p-2 rounded-lg bg-[#F5F5F6] group-hover:bg-[#E7A541] transition-colors">
                    <action.icon className="h-5 w-5 text-[#29282B]/60 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-[#29282B]">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Grid */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        {/* Pending Proposals */}
        <Card className="border-[#D9DADC] bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#29282B]">Propositions en attente</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("sandbox")} className="text-[#E7A541] hover:text-[#D4933A] hover:bg-[#FDF6E9]">
                Voir tout
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.pendingProposals > 0 ? (
              <div className="space-y-3">
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#FDF6E9] border border-[#E7A541]/20 cursor-pointer hover:bg-[#FCF0DD] transition-colors"
                  onClick={() => onNavigate("sandbox")}
                >
                  <div className="p-2 rounded-full bg-[#E7A541]/20">
                    <Clock className="h-4 w-4 text-[#E7A541]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#29282B]">
                      {stats.pendingProposals} proposition{stats.pendingProposals > 1 ? "s" : ""} à examiner
                    </p>
                    <p className="text-xs text-[#29282B]/60">
                      Cliquez pour voir les détails
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#29282B]/40" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-[#29282B]/60">
                  Aucune proposition en attente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-[#D9DADC] bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#29282B]">Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F5F6]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#FDF6E9]">
                    <Users className="h-4 w-4 text-[#E7A541]" />
                  </div>
                  <span className="text-sm font-medium text-[#29282B]">Élèves inscrits</span>
                </div>
                <span className="text-lg font-bold text-[#29282B]">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F5F6]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#F5F5F6] border border-[#D9DADC]">
                    <GraduationCap className="h-4 w-4 text-[#29282B]" />
                  </div>
                  <span className="text-sm font-medium text-[#29282B]">Professeurs actifs</span>
                </div>
                <span className="text-lg font-bold text-[#29282B]">{stats.totalTeachers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F5F6]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#FDF6E9]">
                    <LayoutGrid className="h-4 w-4 text-[#E7A541]" />
                  </div>
                  <span className="text-sm font-medium text-[#29282B]">Plans configurés</span>
                </div>
                <span className="text-lg font-bold text-[#29282B]">{stats.totalSubRooms}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
