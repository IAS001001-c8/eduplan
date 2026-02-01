"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  LayoutGrid,
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
      // Get student record
      const { data: studentData } = await supabase
        .from("students")
        .select("class_id, classes(id, name)")
        .eq("profile_id", userId)
        .maybeSingle()

      if (studentData?.class_id) {
        // Get class info
        const { count: studentCount } = await supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("class_id", studentData.class_id)
          .eq("is_deleted", false)

        // Get principal teacher
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

        // Get teachers for this class
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

      // Get my proposals
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
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
          <RotateCcw className="w-3 h-3 mr-1" />
          À revoir
        </Badge>
      )
    }
    if (!proposal.isSubmitted) {
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300">
          Brouillon
        </Badge>
      )
    }
    switch (proposal.status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Validée
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300">
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
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded" />
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Bonjour, {userName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Délégué{classInfo ? ` - ${classInfo.name}` : ""}
            </p>
          </div>
          <Button onClick={() => onNavigate("sandbox")} className="bg-sky-500 hover:bg-sky-600">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle proposition
          </Button>
        </div>
      </motion.div>

      {/* Class Info Card */}
      {classInfo && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-sky-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium">Ma classe</p>
                  <h2 className="text-2xl font-bold mt-1">{classInfo.name}</h2>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-200" />
                      <span className="text-sm">{classInfo.studentCount} élèves</span>
                    </div>
                    {classInfo.principalTeacher && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-sky-200" />
                        <span className="text-sm">PP: {classInfo.principalTeacher}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden md:block">
                  <Button variant="secondary" onClick={() => onNavigate("students")}>
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{approvedCount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Validée{approvedCount > 1 ? "s" : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("sandbox")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900">
                <RotateCcw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{toReviewCount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">À revoir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Proposals List */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Mes propositions</CardTitle>
                <CardDescription>Historique de vos propositions de plans de classe</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("sandbox")}>
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
                    className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => onNavigate("sandbox")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {proposal.name}
                        </p>
                        {getStatusBadge(proposal)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pour {proposal.teacherName} • {new Date(proposal.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {proposal.teacherComments && !proposal.isSubmitted && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded bg-orange-50 dark:bg-orange-950/50">
                          <MessageSquare className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-orange-700 dark:text-orange-300">{proposal.teacherComments}</p>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      {!proposal.isSubmitted ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Aucune proposition
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Créez votre première proposition de plan de classe
                </p>
                <Button onClick={() => onNavigate("sandbox")} className="bg-sky-500 hover:bg-sky-600">
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Mes professeurs</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("teachers")}>
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
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{teacher.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{teacher.subject}</p>
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
