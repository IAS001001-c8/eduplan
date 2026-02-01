"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { motion } from "framer-motion"
import { CurrentClassPlan } from "@/components/current-class-plan"

interface ProfesseurDashboardProps {
  establishmentId: string
  userId: string
  userName: string
  onNavigate: (section: string) => void
}

interface ClassInfo {
  id: string
  name: string
  studentCount: number
  hasSubRoom: boolean
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

export function ProfesseurDashboard({ establishmentId, userId, userName, onNavigate }: ProfesseurDashboardProps) {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

      const { data: teacherClasses } = await supabase
        .from("teacher_classes")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", teacherData.id)

      if (teacherClasses) {
        const classInfoPromises = teacherClasses.map(async (tc: any) => {
          const { count: studentCount } = await supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("class_id", tc.classes.id)
            .eq("is_deleted", false)

          const { data: subRooms } = await supabase
            .from("sub_rooms")
            .select("id")
            .eq("teacher_id", teacherData.id)
            .contains("class_ids", [tc.classes.id])
            .limit(1)

          return {
            id: tc.classes.id,
            name: tc.classes.name,
            studentCount: studentCount || 0,
            hasSubRoom: (subRooms?.length || 0) > 0,
          }
        })

        const classInfos = await Promise.all(classInfoPromises)
        setClasses(classInfos)
      }

      const { data: proposals } = await supabase
        .from("sub_room_proposals")
        .select(`
          id,
          name,
          created_at,
          classes:class_id(name),
          proposed_by_profile:proposed_by(first_name, last_name)
        `)
        .eq("teacher_id", teacherData.id)
        .eq("status", "pending")
        .eq("is_submitted", true)
        .order("created_at", { ascending: false })
        .limit(5)

      if (proposals) {
        setPendingProposals(
          proposals.map((p: any) => ({
            id: p.id,
            name: p.name,
            className: p.classes?.name || "",
            proposedBy: p.proposed_by_profile ? `${p.proposed_by_profile.first_name} ${p.proposed_by_profile.last_name}` : "Inconnu",
            createdAt: p.created_at,
          }))
        )
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-[#F5F5F6] rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-[#D9DADC]">
              <CardContent className="p-6">
                <div className="h-24 bg-[#F5F5F6] rounded" />
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
      {/* Welcome */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#29282B]">
              Bonjour, {userName}
            </h1>
            <p className="text-[#29282B]/60 mt-1">
              {classes.length} classe{classes.length > 1 ? "s" : ""} • {pendingProposals.length} proposition{pendingProposals.length > 1 ? "s" : ""} en attente
            </p>
          </div>
        </div>
      </motion.div>

      {/* Classes Grid */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#29282B]">Mes classes</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("students")} className="text-[#E7A541] hover:text-[#D4933A] hover:bg-[#FDF6E9]">
            Voir tous les élèves
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-[#D9DADC] bg-white"
              onClick={() => onNavigate("seating-plan")}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-[#FDF6E9]">
                    <BookOpen className="h-5 w-5 text-[#E7A541]" />
                  </div>
                  {cls.hasSubRoom ? (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Plan créé
                    </Badge>
                  ) : (
                    <Badge className="bg-[#F5F5F6] text-[#29282B]/60 border border-[#D9DADC] hover:bg-[#F5F5F6]">
                      Pas de plan
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[#29282B]">{cls.name}</h3>
                <p className="text-sm text-[#29282B]/60 mt-1">
                  {cls.studentCount} élève{cls.studentCount > 1 ? "s" : ""}
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full border-[#D9DADC] hover:border-[#E7A541] hover:bg-[#FDF6E9] text-[#29282B]">
                  {cls.hasSubRoom ? "Voir le plan" : "Créer un plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {classes.length === 0 && (
            <Card className="md:col-span-3 border-[#D9DADC]">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-[#D9DADC] mx-auto mb-3" />
                <p className="text-[#29282B]/60">Aucune classe assignée</p>
              </CardContent>
            </Card>
          )}
        </div>
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 border-[#D9DADC] hover:border-[#E7A541] hover:bg-[#FDF6E9]">
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-[#29282B]">Tout est à jour !</p>
                <p className="text-sm text-[#29282B]/60">
                  Aucune proposition en attente de validation
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
