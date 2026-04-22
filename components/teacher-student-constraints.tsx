"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  ArrowLeft,
  Link2,
  Ban,
  Eye,
  Trash2,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Clock,
  UserCheck,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Types
interface Student {
  id: string
  first_name: string
  last_name: string
  class_id: string
  class_name: string
  gender: number | null
  special_needs: string[]
  student_role: string | null
}

interface ClassInfo {
  id: string
  name: string
}

interface PlacementConstraint {
  id: string
  teacher_id: string
  establishment_id: string
  constraint_type: "ensemble" | "separes" | "devant" | "aesh"
  student_ids: string[]
  reason: string | null
  created_at: string
  updated_at: string
}

interface ConflictInfo {
  type: "error" | "warning"
  message: string
  conflicting_constraint_id?: string
}

interface TeacherStudentConstraintsProps {
  establishmentId: string
  userRole: string
  userId: string
  onBack: () => void
}

// Constraint type config
const CONSTRAINT_CONFIG = {
  ensemble: {
    label: "Ensemble",
    icon: Link2,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    buttonColor: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200",
    dotColor: "bg-emerald-400",
    minStudents: 2,
    maxStudents: 4,
  },
  separes: {
    label: "Séparés",
    icon: Ban,
    color: "bg-rose-100 text-rose-700 border-rose-200",
    buttonColor: "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200",
    dotColor: "bg-rose-400",
    minStudents: 2,
    maxStudents: 4,
  },
  devant: {
    label: "Devant",
    icon: Eye,
    color: "bg-violet-100 text-violet-700 border-violet-200",
    buttonColor: "bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200",
    dotColor: "bg-violet-400",
    minStudents: 1,
    maxStudents: 4,
  },
  aesh: {
    label: "AESH",
    icon: UserCheck,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    buttonColor: "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200",
    dotColor: "bg-amber-400",
    minStudents: 1,
    maxStudents: 1,
  },
} as const

export function TeacherStudentConstraints({
  establishmentId,
  userRole,
  userId,
  onBack,
}: TeacherStudentConstraintsProps) {
  const supabase = createClient()

  // State
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [constraints, setConstraints] = useState<PlacementConstraint[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [pendingConstraintType, setPendingConstraintType] = useState<"ensemble" | "separes" | "devant" | "aesh" | null>(null)
  const [constraintReason, setConstraintReason] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [constraintToDelete, setConstraintToDelete] = useState<string | null>(null)
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())

  // Load teacher ID
  useEffect(() => {
    const loadTeacher = async () => {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle()

      if (teacher) {
        setTeacherId(teacher.id)
      }
    }
    loadTeacher()
  }, [userId])

  // Load classes for this teacher
  useEffect(() => {
    if (!teacherId) return
    const loadClasses = async () => {
      const { data: teacherClasses } = await supabase
        .from("teacher_classes")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", teacherId)

      if (teacherClasses) {
        const classList = teacherClasses
          .map((tc: any) => tc.classes)
          .filter(Boolean)
          .sort((a: ClassInfo, b: ClassInfo) => a.name.localeCompare(b.name))
        setClasses(classList)
        if (classList.length > 0 && !selectedClassId) {
          setSelectedClassId(classList[0].id)
          setExpandedClasses(new Set([classList[0].id]))
        }
      }
      setIsLoading(false)
    }
    loadClasses()
  }, [teacherId])

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) return
    const loadStudents = async () => {
      const { data } = await supabase
        .from("students")
        .select("id, first_name, last_name, class_id, class_name, gender, special_needs, student_role")
        .eq("class_id", selectedClassId)
        .eq("is_deleted", false)
        .order("last_name")

      setStudents(data || [])
    }
    loadStudents()
  }, [selectedClassId])

  // Load constraints for this teacher
  const loadConstraints = useCallback(async () => {
    if (!teacherId) return
    try {
      const { data, error } = await supabase
        .from("placement_constraints")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })

      if (error) {
        // Table n'existe pas encore - ignorer silencieusement
        console.warn("Contraintes non disponibles:", error.message)
        setConstraints([])
        return
      }
      setConstraints(data || [])
    } catch {
      setConstraints([])
    }
  }, [teacherId])

  useEffect(() => {
    loadConstraints()
  }, [loadConstraints])

  // Student display name
  const getStudentDisplayName = (student: Student) => {
    return `${student.first_name} ${student.last_name.charAt(0)}.`
  }

  const getStudentById = (id: string): Student | undefined => {
    return students.find((s) => s.id === id)
  }

  // Find student name from ALL classes (for constraint panel)
  const getStudentNameById = (id: string): string => {
    const student = students.find((s) => s.id === id)
    if (student) return getStudentDisplayName(student)
    return "Élève inconnu"
  }

  // Check if student has any constraints
  const getStudentConstraintTypes = (studentId: string): Set<string> => {
    const types = new Set<string>()
    constraints.forEach((c) => {
      if (c.student_ids.includes(studentId)) {
        types.add(c.constraint_type)
      }
    })
    return types
  }

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      }
      return [...prev, studentId]
    })
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedStudents([])
  }

  // Conflict detection
  const detectConflicts = (
    type: "ensemble" | "separes" | "devant" | "aesh",
    studentIds: string[]
  ): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = []

    if (type === "ensemble") {
      // Check if any pair in studentIds is already "séparés"
      constraints.forEach((c) => {
        if (c.constraint_type === "separes") {
          const overlap = studentIds.filter((id) => c.student_ids.includes(id))
          if (overlap.length >= 2) {
            const names = overlap.map((id) => getStudentNameById(id)).join(", ")
            conflicts.push({
              type: "error",
              message: `Conflit : ${names} sont déjà marqués "Séparés"`,
              conflicting_constraint_id: c.id,
            })
          }
        }
      })
    }

    if (type === "separes") {
      // Check if any pair in studentIds is already "ensemble"
      constraints.forEach((c) => {
        if (c.constraint_type === "ensemble") {
          const overlap = studentIds.filter((id) => c.student_ids.includes(id))
          if (overlap.length >= 2) {
            const names = overlap.map((id) => getStudentNameById(id)).join(", ")
            conflicts.push({
              type: "error",
              message: `Conflit : ${names} sont déjà marqués "Ensemble"`,
              conflicting_constraint_id: c.id,
            })
          }
        }
      })
    }

    // Check for duplicates
    constraints.forEach((c) => {
      if (c.constraint_type === type) {
        const sameStudents =
          studentIds.length === c.student_ids.length &&
          studentIds.every((id) => c.student_ids.includes(id))
        if (sameStudents) {
          conflicts.push({
            type: "warning",
            message: `Cette contrainte existe déjà`,
            conflicting_constraint_id: c.id,
          })
        }
      }
    })

    return conflicts
  }

  // Initiate constraint creation (opens reason dialog)
  const initiateConstraint = (type: "ensemble" | "separes" | "devant" | "aesh") => {
    const config = CONSTRAINT_CONFIG[type]

    if (selectedStudents.length < config.minStudents) {
      toast({
        title: "Sélection insuffisante",
        description: `Sélectionnez au moins ${config.minStudents} élève(s) pour "${config.label}"`,
        variant: "destructive",
      })
      return
    }

    if (selectedStudents.length > config.maxStudents) {
      toast({
        title: "Trop d'élèves",
        description: `Maximum ${config.maxStudents} élèves à la fois pour "${config.label}"`,
        variant: "destructive",
      })
      return
    }

    // Check conflicts
    const conflicts = detectConflicts(type, selectedStudents)
    const errors = conflicts.filter((c) => c.type === "error")

    if (errors.length > 0) {
      toast({
        title: "Conflit détecté",
        description: errors[0].message,
        variant: "destructive",
      })
      return
    }

    const warnings = conflicts.filter((c) => c.type === "warning")
    if (warnings.length > 0) {
      toast({
        title: "Attention",
        description: warnings[0].message,
        variant: "destructive",
      })
      return
    }

    setPendingConstraintType(type)
    setConstraintReason("")
    setReasonDialogOpen(true)
  }

  // Save constraint
  const saveConstraint = async () => {
    if (!teacherId || !pendingConstraintType) return

    const { error } = await supabase.from("placement_constraints").insert({
      teacher_id: teacherId,
      establishment_id: establishmentId,
      constraint_type: pendingConstraintType,
      student_ids: selectedStudents,
      reason: constraintReason.trim() || null,
    })

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la contrainte",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Contrainte créée",
      description: `"${CONSTRAINT_CONFIG[pendingConstraintType].label}" appliquée à ${selectedStudents.length} élève(s)`,
    })

    setReasonDialogOpen(false)
    setPendingConstraintType(null)
    setConstraintReason("")
    clearSelection()
    loadConstraints()
  }

  // Delete constraint
  const confirmDeleteConstraint = (id: string) => {
    setConstraintToDelete(id)
    setDeleteDialogOpen(true)
  }

  const deleteConstraint = async () => {
    if (!constraintToDelete) return

    const { error } = await supabase
      .from("placement_constraints")
      .delete()
      .eq("id", constraintToDelete)

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la contrainte",
        variant: "destructive",
      })
      return
    }

    toast({ title: "Contrainte supprimée" })
    setDeleteDialogOpen(false)
    setConstraintToDelete(null)
    loadConstraints()
  }

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  // Constraints for current class (students currently loaded = students of selectedClassId)
  const classConstraints = constraints.filter((c) =>
    c.student_ids.some((id) => students.some((s) => s.id === id))
  )

  // Grouped by type, filtered to current class only
  const allConstraintsGrouped = {
    ensemble: classConstraints.filter((c) => c.constraint_type === "ensemble"),
    separes: classConstraints.filter((c) => c.constraint_type === "separes"),
    devant: classConstraints.filter((c) => c.constraint_type === "devant"),
    aesh: classConstraints.filter((c) => c.constraint_type === "aesh"),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E7A541]" />
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="teacher-student-constraints">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-[#29282B]">Mes élèves & contraintes</h1>
          <p className="text-sm text-[#29282B]/60">
            Définissez des contraintes de placement pour vos élèves
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Student grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Class selector */}
          <Card className="border-[#D9DADC]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-[#29282B]/70 whitespace-nowrap">
                  Classe :
                </Label>
                <Select
                  value={selectedClassId || ""}
                  onValueChange={(val) => {
                    setSelectedClassId(val)
                    clearSelection()
                  }}
                >
                  <SelectTrigger className="border-[#D9DADC]" data-testid="class-selector">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#29282B]/40" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-[#D9DADC]"
                    data-testid="student-search"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student grid */}
          <Card className="border-[#D9DADC]">
            <CardContent className="p-4">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-[#29282B]/50 py-8">
                  {students.length === 0 ? "Aucun élève dans cette classe" : "Aucun résultat"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2" data-testid="student-grid">
                  {filteredStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student.id)
                    const constraintTypes = getStudentConstraintTypes(student.id)
                    const hasEBP = student.special_needs && student.special_needs.length > 0

                    return (
                      <motion.button
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        whileTap={{ scale: 0.95 }}
                        data-testid={`student-pill-${student.id}`}
                        className={`
                          relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                          transition-all duration-150 cursor-pointer select-none
                          ${isSelected
                            ? "bg-[#E7A541]/15 border-2 border-[#E7A541] text-[#29282B] shadow-sm"
                            : "bg-white border border-[#D9DADC] text-[#29282B]/80 hover:border-[#E7A541]/50 hover:bg-[#E7A541]/5"
                          }
                          ${hasEBP ? "ring-1 ring-violet-400" : ""}
                        `}
                      >
                        {/* Constraint dots */}
                        {constraintTypes.size > 0 && (
                          <span className="flex gap-0.5 mr-0.5">
                            {Array.from(constraintTypes).map((type) => (
                              <span
                                key={type}
                                className={`w-1.5 h-1.5 rounded-full ${CONSTRAINT_CONFIG[type as keyof typeof CONSTRAINT_CONFIG]?.dotColor || "bg-gray-400"}`}
                              />
                            ))}
                          </span>
                        )}

                        {/* Name */}
                        <span>{getStudentDisplayName(student)}</span>

                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-[#E7A541]"
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Selection bar */}
              <AnimatePresence>
                {selectedStudents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-4 pt-4 border-t border-[#E7A541]/30"
                    data-testid="selection-bar"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[#E7A541]">
                        {selectedStudents.length} élève{selectedStudents.length > 1 ? "s" : ""} sélectionné{selectedStudents.length > 1 ? "s" : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                        className="text-[#29282B]/50 hover:text-[#29282B]"
                        data-testid="clear-selection-btn"
                      >
                        Annuler
                      </Button>
                    </div>

                    {/* Affichage des EBP des élèves sélectionnés */}
                    {(() => {
                      const selectedWithEBP = selectedStudents
                        .map(id => students.find(s => s.id === id))
                        .filter(s => s && s.special_needs && s.special_needs.length > 0)
                      
                      if (selectedWithEBP.length === 0) return null
                      return (
                        <div className="mb-3 space-y-1" data-testid="ebp-display">
                          {selectedWithEBP.map(student => {
                            if (!student) return null
                            return (
                              <p key={student.id} className="text-xs text-violet-600 font-medium">
                                {student.first_name} {student.last_name.charAt(0)}. : <span className="text-violet-500">{student.special_needs.join(", ")}</span>
                              </p>
                            )
                          })}
                        </div>
                      )
                    })()}

                    <div className="flex flex-wrap gap-2">
                      {/* Ensemble - min 2 */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedStudents.length < 2}
                        onClick={() => initiateConstraint("ensemble")}
                        className={CONSTRAINT_CONFIG.ensemble.buttonColor}
                        data-testid="btn-ensemble"
                      >
                        <Link2 className="h-4 w-4 mr-1.5" />
                        Ensemble
                      </Button>

                      {/* Séparés - min 2 */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedStudents.length < 2}
                        onClick={() => initiateConstraint("separes")}
                        className={CONSTRAINT_CONFIG.separes.buttonColor}
                        data-testid="btn-separes"
                      >
                        <Ban className="h-4 w-4 mr-1.5" />
                        Séparés
                      </Button>

                      {/* Devant - min 1 */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => initiateConstraint("devant")}
                        className={CONSTRAINT_CONFIG.devant.buttonColor}
                        data-testid="btn-devant"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        Devant
                      </Button>

                      {/* AESH - exactement 1 élève */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedStudents.length !== 1}
                        onClick={() => initiateConstraint("aesh")}
                        className={CONSTRAINT_CONFIG.aesh.buttonColor}
                        data-testid="btn-aesh"
                      >
                        <UserCheck className="h-4 w-4 mr-1.5" />
                        + AESH
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Constraints panel */}
        <div className="space-y-4">
          <Card className="border-[#D9DADC] sticky top-20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#29282B]">
                  Contraintes ({classConstraints.length})
                </CardTitle>
              </div>
              <p className="text-xs text-[#29282B]/50">
                Classe sélectionnée uniquement
              </p>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
              {classConstraints.length === 0 ? (
                <div className="text-center py-8 text-[#29282B]/40">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune contrainte pour cette classe</p>
                  <p className="text-xs mt-1">
                    Sélectionnez des élèves pour créer une contrainte
                  </p>
                </div>
              ) : (
                <>
                  {/* Group by type */}
                  {(["ensemble", "separes", "devant", "aesh"] as const).map((type) => {
                    const typeConstraints = allConstraintsGrouped[type]
                    if (typeConstraints.length === 0) return null
                    const config = CONSTRAINT_CONFIG[type]
                    const Icon = config.icon

                    return (
                      <div key={type} className="space-y-2">
                        {typeConstraints.map((constraint) => (
                          <motion.div
                            key={constraint.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg border border-[#D9DADC] bg-white hover:shadow-sm transition-shadow"
                            data-testid={`constraint-card-${constraint.id}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Badge className={`${config.color} text-xs font-medium`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[#29282B]/30 hover:text-rose-500"
                                onClick={() => confirmDeleteConstraint(constraint.id)}
                                data-testid={`delete-constraint-${constraint.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div className="mt-2 space-y-0.5">
                              {constraint.student_ids.map((sid) => (
                                <p key={sid} className="text-sm text-[#29282B]">
                                  {getStudentNameById(sid)}
                                </p>
                              ))}
                            </div>

                            {/* Reason & date */}
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-[#29282B]/40">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(constraint.created_at).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {constraint.reason && (
                                <span className="italic truncate max-w-[120px]">
                                  — {constraint.reason}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reason Dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingConstraintType && (
                <>
                  {(() => {
                    const Icon = CONSTRAINT_CONFIG[pendingConstraintType].icon
                    return <Icon className="h-5 w-5" />
                  })()}
                  Nouvelle contrainte : {CONSTRAINT_CONFIG[pendingConstraintType]?.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingConstraintType === "ensemble" && "Ces élèves seront placés côte à côte."}
              {pendingConstraintType === "separes" && "Ces élèves seront séparés de min. 2 places."}
              {pendingConstraintType === "devant" && "Ces élèves seront placés au 1er ou 2ème rang."}
              {pendingConstraintType === "aesh" && "Une place libre sera gardée à côté de cet élève pour l'AESH."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected students preview */}
            <div className="flex flex-wrap gap-1.5">
              {selectedStudents.map((sid) => {
                const student = getStudentById(sid)
                if (!student) return null
                return (
                  <Badge key={sid} variant="secondary" className="text-xs">
                    {getStudentDisplayName(student)}
                  </Badge>
                )
              })}
            </div>

            {/* Optional reason */}
            <div>
              <Label htmlFor="constraint-reason" className="text-sm text-[#29282B]/70">
                Raison (optionnel)
              </Label>
              <Input
                id="constraint-reason"
                value={constraintReason}
                onChange={(e) => setConstraintReason(e.target.value)}
                placeholder="Ex: bavardage, binôme TP, conseil de classe..."
                className="mt-1 border-[#D9DADC]"
                data-testid="constraint-reason-input"
              />
              <p className="text-[10px] text-[#29282B]/40 mt-1">
                Visible uniquement par vous, utile pour les conseils de classe
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={saveConstraint}
              className="bg-[#E7A541] hover:bg-[#D4933A] text-white"
              data-testid="save-constraint-btn"
            >
              Créer la contrainte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la contrainte ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={deleteConstraint}
              data-testid="confirm-delete-btn"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
