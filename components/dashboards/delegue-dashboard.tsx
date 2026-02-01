"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Lightbulb,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  RotateCcw,
  MessageSquare,
  GraduationCap,
} from "lucide-react"
import { motion } from "framer-motion"

interface DelegueDashboardProps {
  establishmentId: string
  userId: string
  userName: string
  onNavigate: (section: string) => void
}

interface ClassInfo {
  id: string
  name: string
  studentCount: number
  principalTeacher?: string
}

interface Proposal {
  id: string
  name: string
  status: "draft" | "pending" | "approved" | "rejected" | "returned"
  isSubmitted: boolean
  teacherName: string
  teacherComments?: string
  createdAt: string
}

interface Teacher {
  id: string
  name: string
  subject: string
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

export function DelegueDashboard({ establishmentId, userId, userName, onNavigate }: DelegueDashboardProps) {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [establishmentId, userId])

  const fetchData = async () => {
    const supabase = createClient()

    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("class_id, classes(id, name)")
        .eq("profile_id", userId)
        .maybeSingle()

      if (studentData?.class_id) {
        const { count: studentCount } = await supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("class_id", studentData.class_id)
          .eq("is_deleted", false)

        const { data: principalTeacher } = await supabase
          .from("teachers")
          .select("first_name, last_name")
          .eq("is_principal", true)
          .eq("principal_class_id", studentData.class_id)
          .maybeSingle()

        setClassInfo({
          id: studentData.class_id,
          name: (studentData.classes as any)?.name || "Ma classe",
          studentCount: studentCount || 0,
          principalTeacher: principalTeacher ? `${principalTeacher.first_name} ${principalTeacher.last_name}` : undefined,
        })

        const { data: classTeachers } = await supabase
          .from("teacher_classes")
          .select("teacher_id, teachers(id, first_name, last_name, subject)")
          .eq("class_id", studentData.class_id)

        if (classTeachers) {
          setTeachers(
            classTeachers.map((ct: any) => ({
              id: ct.teachers.id,
              name: `${ct.teachers.first_name} ${ct.teachers.last_name}`,
              subject: ct.teachers.subject || "Non spécifié",
            }))
          )
        }
      }

      const { data: myProposals } = await supabase
        .from("sub_room_proposals")
        .select(`
          id,
          name,
          status,
          is_submitted,
          teacher_comments,
          created_at,
          teachers:teacher_id(first_name, last_name)
        `)
        .eq("proposed_by", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (myProposals) {
        setProposals(
          myProposals.map((p: any) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            isSubmitted: p.is_submitted,
            teacherName: p.teachers ? `${p.teachers.first_name} ${p.teachers.last_name}` : "Inconnu",
            teacherComments: p.teacher_comments,
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

  const getStatusBadge = (proposal: Proposal) => {
    if (!proposal.isSubmitted && proposal.teacherComments) {
      return (
        <Badge className="bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-50">
          <RotateCcw className="w-3 h-3 mr-1" />
          À revoir
        </Badge>
      )
    }
    if (!proposal.isSubmitted) {
      return (
        <Badge className="bg-[#F5F5F6] text-[#29282B]/60 border border-[#D9DADC] hover:bg-[#F5F5F6]">
          Brouillon
        </Badge>
      )
    }
    switch (proposal.status) {
      case "pending":
        return (
          <Badge className="bg-[#FDF6E9] text-[#E7A541] border border-[#E7A541]/20 hover:bg-[#FDF6E9]">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Validée
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">
            <XCircle className="w-3 h-3 mr-1" />
            Refusée
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-[#F5F5F6] rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse border-[#D9DADC]">
              <CardContent className="p-6">
                <div className="h-32 bg-[#F5F5F6] rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const approvedCount = proposals.filter((p) => p.status === "approved").length
  const pendingCount = proposals.filter((p) => p.isSubmitted && p.status === "pending").length
  const toReviewCount = proposals.filter((p) => !p.isSubmitted && p.teacherComments).length

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
              Délégué{classInfo ? ` - ${classInfo.name}` : ""}
            </p>
          </div>
          <Button onClick={() => onNavigate("sandbox")} className="bg-[#E7A541] hover:bg-[#D4933A] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle proposition
          </Button>
        </div>
      </motion.div>

      {/* Class Info Card */}
      {classInfo && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[#E7A541] to-[#D4933A] text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Ma classe</p>
                  <h2 className="text-2xl font-bold mt-1">{classInfo.name}</h2>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-white/70" />
                      <span className="text-sm">{classInfo.studentCount} élèves</span>
                    </div>
                    {classInfo.principalTeacher && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-white/70" />
                        <span className="text-sm">PP: {classInfo.principalTeacher}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden md:block">
                  <Button variant="secondary" onClick={() => onNavigate("students")} className="bg-white text-[#E7A541] hover:bg-white/90">
                    Voir ma classe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#D9DADC] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#29282B]">{approvedCount}</p>
                <p className="text-sm text-[#29282B]/60">Validée{approvedCount > 1 ? "s" : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D9DADC] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#FDF6E9]">
                <Clock className="h-6 w-6 text-[#E7A541]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#29282B]">{pendingCount}</p>
                <p className="text-sm text-[#29282B]/60">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D9DADC] bg-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("sandbox")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-50">
                <RotateCcw className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#29282B]">{toReviewCount}</p>
                <p className="text-sm text-[#29282B]/60">À revoir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Proposals List */}
      <motion.div variants={itemVariants}>
        <Card className="border-[#D9DADC] bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#29282B]">Mes propositions</CardTitle>
                <CardDescription className="text-[#29282B]/60">Historique de vos propositions de plans de classe</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("sandbox")} className="text-[#E7A541] hover:text-[#D4933A] hover:bg-[#FDF6E9]">
                Voir tout
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <div className="space-y-3">
                {proposals.slice(0, 5).map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#F5F5F6] hover:bg-[#EBEBED] cursor-pointer transition-colors"
                    onClick={() => onNavigate("sandbox")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-[#29282B] truncate">
                          {proposal.name}
                        </p>
                        {getStatusBadge(proposal)}
                      </div>
                      <p className="text-xs text-[#29282B]/60">
                        Pour {proposal.teacherName} • {new Date(proposal.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {proposal.teacherComments && !proposal.isSubmitted && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded bg-orange-50 border border-orange-200">
                          <MessageSquare className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-orange-700">{proposal.teacherComments}</p>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="text-[#29282B]/60 hover:text-[#E7A541]">
                      {!proposal.isSubmitted ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 text-[#D9DADC] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#29282B] mb-2">
                  Aucune proposition
                </h3>
                <p className="text-sm text-[#29282B]/60 mb-4">
                  Créez votre première proposition de plan de classe
                </p>
                <Button onClick={() => onNavigate("sandbox")} className="bg-[#E7A541] hover:bg-[#D4933A] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une proposition
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Teachers List */}
      {teachers.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-[#D9DADC] bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#29282B]">Mes professeurs</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("teachers")} className="text-[#E7A541] hover:text-[#D4933A] hover:bg-[#FDF6E9]">
                  Voir tout
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {teachers.slice(0, 6).map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F5F6]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FDF6E9] flex items-center justify-center">
                      <span className="text-sm font-medium text-[#E7A541]">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#29282B] truncate">{teacher.name}</p>
                      <p className="text-xs text-[#29282B]/60">{teacher.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
