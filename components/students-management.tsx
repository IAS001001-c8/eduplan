"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createUser } from "@/lib/user-management"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Eye, Key, FileText, Upload, MoreHorizontal, Users, Pencil, Shuffle, FileSpreadsheet, Download, Mail, List, LayoutGrid } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImportStudentsDialog } from "@/components/import-students-dialog"
import { ImportExcelDialog, ImportedStudent } from "@/components/import-excel-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { downloadCredentialsPDF, generateRandomPassword } from "@/lib/generate-credentials-pdf"
import { ViewToggle } from "@/components/view-toggle"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Class {
  id: string
  name: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  class_id?: string
  role: "eleve" | "delegue" | "eco-delegue"
  can_create_subrooms: boolean
  classes?: { name: string }
  username?: string
  password_hash?: string
  profile_id?: string | null
  class_name?: string
  is_deleted?: boolean
  birth_date?: string | null
  gender?: number | null // 1 = Homme, 2 = Femme, 3 = Non identifié
  special_needs?: string[] // Codes des besoins particuliers (EBP)
}

interface StudentsManagementProps {
  establishmentId: string
  userRole?: string
  userId?: string
  onBack?: () => void
}

function generateStrongPassword(length = 8): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%&*"

  const allChars = lowercase + uppercase + numbers + symbols

  let password = ""
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

// import { Shuffle } from 'lucide-react'

function generateLocalRandomPassword(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function StudentsManagement({ establishmentId, userRole, userId, onBack }: StudentsManagementProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false) // Added import dialog state
  const [isExcelImportDialogOpen, setIsExcelImportDialogOpen] = useState(false) // Excel import dialog
  const [excelImportClassId, setExcelImportClassId] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    class_id: "",
    role: "eleve" as "delegue" | "eco-delegue" | "eleve",
    can_create_subrooms: false,
    gender: "" as "" | "1" | "2" | "3",
    special_needs: [] as string[],
  })
  const [accessData, setAccessData] = useState({
    username: "",
    password: "",
  })
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]) // Added class filter state
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)
  const [promoteToRole, setPromoteToRole] = useState<"delegue" | "eco-delegue">("delegue")
  const [upgradeCredentials, setUpgradeCredentials] = useState({ username: "", password: "" })
  const [isDemoteDialogOpen, setIsDemoteDialogOpen] = useState(false)
  const [studentToDemote, setStudentToDemote] = useState<Student | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]) // Added bulk selection state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false) // Added bulk delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false) // Added single delete dialog state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null) // Added student to delete state

  const [searchQuery, setSearchQuery] = useState("") // Added search query state
  const [roleFilter, setRoleFilter] = useState<"all" | "delegue" | "eco-delegue" | "eleve">("all") // Added role filter state
  const [isBulkDemoteDialogOpen, setIsBulkDemoteDialogOpen] = useState(false) // Added bulk demote dialog state

  // PDF download state
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isBulkCredentialsDialogOpen, setIsBulkCredentialsDialogOpen] = useState(false)

  // View mode state - Table by default
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")

  // Special needs options from establishment
  const [specialNeedsOptions, setSpecialNeedsOptions] = useState<{ code: string; label: string }[]>([])

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // Renamed editFormData to editData to avoid naming conflict with formData for add dialog
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    can_create_subrooms: false,
    gender: "" as "" | "1" | "2" | "3",
    special_needs: [] as string[],
  })

  useEffect(() => {
    if (isPromoteDialogOpen && selectedStudent) {
      // Normalize class name (remove "ème" and other accents)
      const normalizeClassName = (className: string | undefined) => {
        if (!className) return "CLASSE"
        return className.replace(/ème/gi, "").replace(/\s+/g, "").toUpperCase()
      }

      const suggestedUsername = `${selectedStudent.last_name.toUpperCase()}.${selectedStudent.first_name.toLowerCase()}.${normalizeClassName(selectedStudent.class_name)}`
      const suggestedPassword = generateStrongPassword(8)

      setUpgradeCredentials({
        username: suggestedUsername,
        password: suggestedPassword,
      })
    }
  }, [isPromoteDialogOpen, selectedStudent])

  useEffect(() => {
    fetchData()
  }, [establishmentId, userRole, userId])

  async function fetchData() {
    setLoading(true)


    const classesResult = await supabase
      .from("classes")
      .select("id, name")
      .eq("establishment_id", establishmentId)
      .order("name")

    if (classesResult.error) {
      setClasses([])
    } else {
      setClasses(classesResult.data || [])
    }

    let studentsResult

    if (userRole === "vie-scolaire") {
      studentsResult = await supabase
        .from("students")
        .select(`
          *,
          classes:class_id(name)
        `)
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)
        .order("last_name")
    } else if (userRole === "professeur") {
      const { data: teacherData } = await supabase.from("teachers").select("id").eq("profile_id", userId).maybeSingle()


      if (teacherData) {
        const { data: teacherClasses } = await supabase
          .from("teacher_classes")
          .select("class_id")
          .eq("teacher_id", teacherData.id)

        const classIds = teacherClasses?.map((tc) => tc.class_id) || []


        if (classIds.length > 0) {
          studentsResult = await supabase
            .from("students")
            .select(`
              *,
              classes:class_id(name)
            `)
            .eq("establishment_id", establishmentId)
            .in("class_id", classIds)
            .eq("is_deleted", false)
            .order("last_name")
        } else {
          studentsResult = { data: [], error: null }
        }
      } else {
        studentsResult = { data: [], error: null }
      }
    } else if (userRole === "delegue" || userRole === "eco-delegue") {
      const { data: studentData } = await supabase
        .from("students")
        .select("class_id")
        .eq("profile_id", userId)
        .maybeSingle()


      if (studentData?.class_id) {
        studentsResult = await supabase
          .from("students")
          .select(`
            *,
            classes:class_id(name)
          `)
          .eq("establishment_id", establishmentId)
          .eq("class_id", studentData.class_id)
          .eq("is_deleted", false)
          .order("last_name")
      } else {
        studentsResult = { data: [], error: null }
      }
    } else {
      studentsResult = { data: [], error: null }
    }

    if (studentsResult && !studentsResult.error) {
      setStudents(studentsResult.data || [])
    } else {
      setStudents([])
    }

    setLoading(false)
  }

  // Excel import handler
  async function handleExcelImport(importedStudents: ImportedStudent[]) {
    if (!excelImportClassId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une classe",
        variant: "destructive",
      })
      return
    }

    const selectedClass = classes.find((c) => c.id === excelImportClassId)
    if (!selectedClass) {
      toast({
        title: "Erreur",
        description: "Classe introuvable",
        variant: "destructive",
      })
      return
    }

    const studentsToInsert = importedStudents.map((s) => ({
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email || null,
      phone: s.phone || null,
      gender: s.gender || null,
      class_id: excelImportClassId,
      class_name: selectedClass.name,
      role: "eleve",
      can_create_subrooms: false,
      establishment_id: establishmentId,
      profile_id: null,
      is_deleted: false,
      special_needs: [],
    }))

    const { error } = await supabase.from("students").insert(studentsToInsert)

    if (error) {
      console.error("Excel import error:", error)
      throw new Error("Erreur lors de l'import")
    }

    fetchData()
  }

  async function handleAdd() {
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.class_id) {
      toast({
        title: "Erreur",
        description: "Le prénom, nom et classe sont requis",
        variant: "destructive",
      })
      return
    }

    try {

      const selectedClass = classes.find((c) => c.id === formData.class_id)

      if (!selectedClass || !selectedClass.name) {
        toast({
          title: "Erreur",
          description: "Classe introuvable ou invalide",
          variant: "destructive",
        })
        return
      }

      if (formData.role === "eleve") {

        const { data, error } = await supabase
          .from("students")
          .insert([
            {
              first_name: formData.first_name.trim(),
              last_name: formData.last_name.trim(),
              email: formData.email.trim() || null,
              phone: formData.phone.trim() || null,
              class_id: formData.class_id,
              class_name: selectedClass.name,
              role: "eleve",
              can_create_subrooms: formData.can_create_subrooms,
              establishment_id: establishmentId,
              profile_id: null,
              is_deleted: false, // Add is_deleted
            },
          ])
          .select()
          .single()

        if (error) {
          throw error
        }


        toast({
          title: "Élève créé avec succès",
          description: "L'élève a été ajouté sans accès à l'application",
        })
      } else {

        const credentials = await createUser({
          establishment_id: establishmentId,
          role: formData.role,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          class_id: formData.class_id,
          class_name: selectedClass.name,
          student_role: formData.role,
        })


        toast({
          title: "Élève créé avec succès",
          description: (
            <div className="space-y-2">
              <p>
                Identifiant: <strong>{credentials.username}</strong>
              </p>
              <p>
                Mot de passe: <strong>{credentials.password}</strong>
              </p>
              <p className="text-xs text-muted-foreground">Notez ces identifiants, ils ne seront plus affichés</p>
            </div>
          ),
          duration: 15000,
        })
      }

      setIsAddDialogOpen(false)
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        class_id: "",
        role: "eleve",
        can_create_subrooms: false,
      })
      fetchData() // Auto-refresh after add
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'élève",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteStudent(student: Student) {
    try {
      // Mark as deleted instead of hard delete
      const { error } = await supabase.from("students").update({ is_deleted: true }).eq("id", student.id)

      if (error) throw error

      // If profile exists, delete it as well
      if (student.profile_id) {
        await supabase.from("profiles").delete().eq("id", student.profile_id)
      }

      toast({
        title: "Succès",
        description: "Élève marqué comme supprimé avec succès",
      })
      setIsDeleteDialogOpen(false)
      setStudentToDelete(null)
      fetchData() // Auto-refresh after delete
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élève",
        variant: "destructive",
      })
    }
  }

  async function handleBulkDelete() {
    try {
      // Mark selected students as deleted
      const { error } = await supabase.from("students").update({ is_deleted: true }).in("id", selectedStudents)

      if (error) throw error

      // Delete profiles for students that have them
      const studentsWithProfiles = students.filter((s) => selectedStudents.includes(s.id) && s.profile_id)
      if (studentsWithProfiles.length > 0) {
        const profileIds = studentsWithProfiles.map((s) => s.profile_id).filter(Boolean)
        await supabase.from("profiles").delete().in("id", profileIds)
      }

      toast({
        title: "Succès",
        description: `${selectedStudents.length} élève(s) marqué(s) comme supprimé(s) avec succès`,
      })
      setIsBulkDeleteDialogOpen(false)
      setSelectedStudents([])
      fetchData() // Auto-refresh after bulk delete
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les élèves",
        variant: "destructive",
      })
    }
  }

  async function handleBulkDemote() {
    try {
      // Get students to demote
      const studentsToDemote = students.filter((s) => selectedStudents.includes(s.id))

      // Delete profiles for students that have them
      const studentsWithProfiles = studentsToDemote.filter((s) => s.profile_id)

      if (studentsWithProfiles.length > 0) {
        const supabase = createClient()
        const profileIds = studentsWithProfiles.map((s) => s.profile_id).filter(Boolean)
        await supabase.from("profiles").delete().in("id", profileIds)
      }

      // Update students to "eleve" role and remove profile_id (username doesn't exist in students table)
      const supabase = createClient()
      const { error } = await supabase
        .from("students")
        .update({
          role: "eleve",
          profile_id: null,
        })
        .in("id", selectedStudents)

      if (error) throw error

      toast({
        title: "Succès",
        description: `${selectedStudents.length} élève(s) rétrogradé(s) en élève simple`,
      })
      setIsBulkDemoteDialogOpen(false)
      setSelectedStudents([])
      fetchData() // Auto-refresh after demotion
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rétrograder les élèves",
        variant: "destructive",
      })
    }
  }

  async function handlePrintPDF() {
    if (!selectedStudent) return

    // Save credentials first before printing PDF
    await handleUpdateCredentials()

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Identifiants - ${selectedStudent.first_name} ${selectedStudent.last_name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { color: #333; }
              .credentials { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .field { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Identifiants de connexion</h1>
            <div class="credentials">
              <div class="field"><span class="label">Nom:</span> ${selectedStudent.first_name} ${selectedStudent.last_name}</div>
              <div class="field"><span class="label">Classe:</span> ${selectedStudent.classes?.name || "N/A"}</div>
              <div class="field"><span class="label">Identifiant:</span> ${accessData.username}</div>
              <div class="field"><span class="label">Mot de passe:</span> ${accessData.password}</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    setIsAccessDialogOpen(false)
  }

  // START OF MODIFIED FUNCTIONS
  async function handlePromoteStudent(student: Student, newRole: "delegue" | "eco-delegue") {
    try {

      if (!upgradeCredentials.username || !upgradeCredentials.password) {
        toast({
          title: "Erreur",
          description: "Veuillez définir un identifiant et un mot de passe",
          variant: "destructive",
        })
        return
      }

      if (student.profile_id && student.profile_id !== "null") {
        toast({
          title: "Erreur",
          description: "Cet élève a déjà un profil utilisateur",
          variant: "destructive",
        })
        return
      }

      const supabase = createClient()
      const { data: classData } = await supabase.from("classes").select("name").eq("id", student.class_id).single()

      const { data: hashedPassword, error: hashError } = await supabase.rpc("hash_password", {
        password: upgradeCredentials.password,
      })

      if (hashError) {
        throw hashError
      }

      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          establishment_id: establishmentId,
          role: "delegue", // This role is for the profile itself, distinct from student.role
          username: upgradeCredentials.username,
          password_hash: hashedPassword,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email || null,
          phone: student.phone || null,
        })
        .select()
        .single()

      if (profileError) {
        throw profileError
      }


      const { error: updateError } = await supabase
        .from("students")
        .update({
          role: newRole,
          profile_id: newProfile.id,
          class_name: classData?.name,
        })
        .eq("id", student.id)

      if (updateError) {
        // Cleanup: delete the profile if student update fails
        await supabase.from("profiles").delete().eq("id", newProfile.id)
        throw updateError
      }


      toast({
        title: "Élève promu avec succès",
        description: (
          <div className="space-y-2">
            <p>L'élève a été promu au rôle de {newRole === "delegue" ? "Délégué" : "Éco-délégué"}</p>
            <p>
              Identifiant: <strong>{upgradeCredentials.username}</strong>
            </p>
            <p>
              Mot de passe: <strong>{upgradeCredentials.password}</strong>
            </p>
          </div>
        ),
        duration: 15000,
      })

      setIsPromoteDialogOpen(false)
      setUpgradeCredentials({ username: "", password: "" })
      fetchData() // Auto-refresh after promotion
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de promouvoir l'élève",
        variant: "destructive",
      })
    }
  }

  async function handleDemoteStudent(student: Student) {
    try {

      // Delete profile if exists
      if (student.profile_id) {
        const supabase = createClient()
        const { error: profileError } = await supabase.from("profiles").delete().eq("id", student.profile_id)

        if (profileError) {
          throw profileError
        }
      }

      // Update student to "eleve" role and remove profile_id only (username doesn't exist in students table)
      const supabase = createClient()
      const { error } = await supabase
        .from("students")
        .update({
          role: "eleve",
          profile_id: null,
        })
        .eq("id", student.id)

      if (error) {
        throw error
      }

      toast({
        title: "Succès",
        description: "L'élève a été rétrogradé en élève simple",
      })
      setIsDemoteDialogOpen(false)
      setStudentToDemote(null)
      fetchData() // Auto-refresh after demotion
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de rétrograder l'élève",
        variant: "destructive",
      })
    }
  }

  const openAccessDialog = async (student: Student) => {
    setSelectedStudent(student)

    if (student.profile_id) {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", student.profile_id)
        .maybeSingle()

      if (profileData) {
        setAccessData({
          username: profileData.username || "",
          password: "", // Empty password field so vie-scolaire can enter new password
        })
      } else {
        // Fallback if profile doesn't exist
        setAccessData({
          username: `${student.first_name.toLowerCase()}.${student.last_name.toLowerCase()}`,
          password: "",
        })
      }
    } else {
      // For students without profiles (eleve role), show "Create access"
      setAccessData({
        username: `${student.first_name.toLowerCase()}.${student.last_name.toLowerCase()}`,
        password: "",
      })
    }

    setIsAccessDialogOpen(true)
  }

  // Function to open the promotion dialog (needed for the error fix)
  const openPromoteDialog = (student: Student, role: "delegue" | "eco-delegue") => {
    setSelectedStudent(student)
    setPromoteToRole(role)
    setIsPromoteDialogOpen(true)
  }

  async function handleUpdateCredentials() {
    if (!selectedStudent) return

    if (!selectedStudent.profile_id || selectedStudent.profile_id === "null" || selectedStudent.profile_id === "") {
      toast({
        title: "Erreur",
        description: "Cet élève n'a pas de profil utilisateur",
        variant: "destructive",
      })
      return
    }

    if (!accessData.username || accessData.username.trim() === "") {
      toast({
        title: "Erreur",
        description: "L'identifiant ne peut pas être vide",
        variant: "destructive",
      })
      return
    }

    const supabase = createClient()

    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", accessData.username)
      .neq("id", selectedStudent.profile_id)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'identifiant",
        variant: "destructive",
      })
      return
    }

    if (existingProfile) {
      toast({
        title: "Erreur",
        description: `L'identifiant "${accessData.username}" est déjà utilisé par un autre utilisateur`,
        variant: "destructive",
      })
      return
    }

    if (accessData.password && accessData.password !== "••••••••" && accessData.password.trim() !== "") {
      const { data: hashedPassword, error: hashError } = await supabase.rpc("hash_password", {
        password: accessData.password,
      })

      if (hashError) {
        toast({
          title: "Erreur",
          description: "Impossible de hasher le mot de passe",
          variant: "destructive",
        })
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: accessData.username,
          password_hash: hashedPassword,
        })
        .eq("id", selectedStudent.profile_id)

      if (updateError) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les identifiants",
          variant: "destructive",
        })
        return
      }

    } else {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: accessData.username,
        })
        .eq("id", selectedStudent.profile_id)

      if (updateError) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour l'identifiant",
          variant: "destructive",
        })
        return
      }

    }

    toast({
      title: "Succès",
      description: "Identifiants mis à jour avec succès",
    })

    setIsAccessDialogOpen(false)
    fetchData()
  }

  async function handleSendEmail() {
    if (!selectedStudent) return
    
    toast({
      title: "Fonctionnalité à venir",
      description: "L'envoi d'email sera disponible prochainement",
      variant: "default",
    })
  }
  // END OF MODIFIED FUNCTIONS

  function openEditDialog(student: Student) {
    setSelectedStudent(student)
    setEditData({
      // Use setEditData
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email || "",
      phone: student.phone || "",
      can_create_subrooms: student.can_create_subrooms, // Initialize can_create_subrooms
    })
    setIsEditDialogOpen(true)
  }

  async function handleSaveEdit() {
    // Renamed from handleUpdateStudent
    if (!selectedStudent) return

    const supabase = createClient()

    const { error } = await supabase
      .from("students")
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
        email: editData.email || null,
        phone: editData.phone || null,
        can_create_subrooms: editData.can_create_subrooms, // Update can_create_subrooms
      })
      .eq("id", selectedStudent.id)

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'élève",
        variant: "destructive",
      })
      return
    }

    // If student has a profile, update profile too
    if (selectedStudent.profile_id) {
      await supabase
        .from("profiles")
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email || null,
          phone: editData.phone || null,
        })
        .eq("id", selectedStudent.profile_id)
    }

    toast({
      title: "Succès",
      description: "L'élève a été modifié avec succès",
    })

    setIsEditDialogOpen(false)
    fetchData()
  }

  const filteredStudents = students.filter((s) => {
    // Filter by selected classes
    if (selectedClasses.length > 0 && (!s.class_id || !selectedClasses.includes(s.class_id))) {
      return false
    }
    // Filter by role
    if (roleFilter !== "all" && s.role !== roleFilter) {
      return false
    }
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
      return fullName.includes(query)
    }
    return true
  })

  // Compute isAllSelected based on filtered students
  const filteredStudentIds = filteredStudents.map(s => s.id)
  const isAllSelected = filteredStudentIds.length > 0 && filteredStudentIds.every(id => selectedStudents.includes(id))
  const isSomeSelected = selectedStudents.some(id => filteredStudentIds.includes(id))

  // Select/deselect all filtered students
  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all filtered students
      setSelectedStudents(selectedStudents.filter(id => !filteredStudentIds.includes(id)))
    } else {
      // Select all filtered students
      const newSelected = [...new Set([...selectedStudents, ...filteredStudentIds])]
      setSelectedStudents(newSelected)
    }
  }

  // Download PDF credentials for selected students
  const handleDownloadCredentialsPDF = async () => {
    const selectedStudentObjects = students.filter(s => selectedStudents.includes(s.id))
    
    if (selectedStudentObjects.length === 0) {
      toast({
        title: "Aucun élève sélectionné",
        description: "Veuillez sélectionner au moins un élève",
        variant: "destructive",
      })
      return
    }

    // Filter only students with profile_id
    const studentsWithProfiles = selectedStudentObjects.filter(s => s.profile_id)
    if (studentsWithProfiles.length === 0) {
      toast({
        title: "Aucun accès à exporter",
        description: "Les élèves sélectionnés n'ont pas de compte d'accès",
        variant: "destructive",
      })
      return
    }

    setIsDownloadingPDF(true)

    try {
      // Fetch usernames from profiles (public data)
      const profileIds = studentsWithProfiles.map(s => s.profile_id)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", profileIds)

      if (profilesError) {
        throw new Error("Erreur lors de la récupération des profils")
      }

      // Create a map of profile_id to username
      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || [])

      // Build credentials with student info and generated password
      const credentials = studentsWithProfiles
        .filter(s => profileMap.has(s.profile_id))
        .map(s => ({
          first_name: s.first_name,
          last_name: s.last_name,
          username: profileMap.get(s.profile_id) || "",
          password: generateRandomPassword(10),
          role: s.role || "eleve",
          class_name: s.class_name || s.classes?.name || ""
        }))

      if (credentials.length === 0) {
        toast({
          title: "Aucun accès à exporter",
          description: "Impossible de récupérer les identifiants",
          variant: "destructive",
        })
        return
      }

      // Update passwords in database for each profile (hash the password first)
      for (const cred of credentials) {
        const student = studentsWithProfiles.find(
          s => s.first_name === cred.first_name && s.last_name === cred.last_name
        )
        if (student?.profile_id) {
          // Hash the password before storing
          const { data: hashedPassword, error: hashError } = await supabase.rpc("hash_password", {
            password: cred.password,
          })
          
          if (!hashError && hashedPassword) {
            await supabase
              .from("profiles")
              .update({ password_hash: hashedPassword })
              .eq("id", student.profile_id)
          }
        }
      }

      // Generate and download ZIP with PDFs
      await downloadCredentialsPDF(credentials, `identifiants_eleves`)

      toast({
        title: "ZIP généré avec succès",
        description: `${credentials.length} identifiant(s) exporté(s)`,
      })

      // Clear selection
      setSelectedStudents([])
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Erreur",
        description: "Impossible de générer le ZIP",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des élèves...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack || (() => router.push("/dashboard"))} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {userRole === "professeur" ? "Mes camarades" : "Gestion des élèves"}
          </h1>
          <p className="text-muted-foreground mt-1">Gérez les élèves, leurs accès et leurs informations</p>
        </div>
        {userRole === "vie-scolaire" && (
          <div className="flex gap-2 items-center">
            {selectedStudents.length > 0 && (
              <>
                <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                  Supprimer ({selectedStudents.length})
                </Button>
                <Button variant="outline" onClick={() => setIsBulkDemoteDialogOpen(true)}>
                  Rétrograder ({selectedStudents.length})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadCredentialsPDF}
                  disabled={isDownloadingPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloadingPDF ? "Génération..." : `Télécharger accès PDF (${selectedStudents.length})`}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importer (texte)
            </Button>
            <Button variant="outline" onClick={() => setIsExcelImportDialogOpen(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un élève
            </Button>
          </div>
        )}
      </div>

      {userRole === "vie-scolaire" && classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filtrer par classe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <Badge
                  key={cls.id}
                  variant={selectedClasses.includes(cls.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedClasses((prev) =>
                      prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id],
                    )
                  }}
                >
                  {cls.name}
                </Badge>
              ))}
              {selectedClasses.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedClasses([])}>
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start of updates for search and filter */}
      {classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rechercher et filtrer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Rechercher par nom</Label>
              <Input
                id="search"
                placeholder="Prénom ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-2"
              />
            </div>
            {userRole === "vie-scolaire" && (
              <div>
                <Label>Filtrer par rôle</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    variant={roleFilter === "all" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setRoleFilter("all")}
                  >
                    Tous
                  </Badge>
                  <Badge
                    variant={roleFilter === "delegue" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setRoleFilter("delegue")}
                  >
                    Délégués
                  </Badge>
                  <Badge
                    variant={roleFilter === "eco-delegue" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setRoleFilter("eco-delegue")}
                  >
                    Éco-délégués
                  </Badge>
                  <Badge
                    variant={roleFilter === "eleve" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setRoleFilter("eleve")}
                  >
                    Élèves
                  </Badge>
                </div>
              </div>
            )}
            <div>
              <Label>Filtrer par classe</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {classes.map((cls) => (
                  <Badge
                    key={cls.id}
                    variant={selectedClasses.includes(cls.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedClasses((prev) =>
                        prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id],
                      )
                    }}
                  >
                    {cls.name}
                  </Badge>
                ))}
                {selectedClasses.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedClasses([])}>
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* End of updates for search and filter */}

      {/* View Toggle - Below filters */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#29282B]/60">
          {filteredStudents.length} élève(s) affiché(s)
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun élève</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Commencez par ajouter des élèves individuellement ou importez-les en masse
            </p>
            {userRole === "vie-scolaire" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un élève
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select all for vie scolaire */}
          {userRole === "vie-scolaire" && (
            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="h-5 w-5"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer flex-1">
                {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"} ({filteredStudents.length} élèves affichés)
              </label>
              {isSomeSelected && (
                <span className="text-sm text-muted-foreground">
                  {selectedStudents.filter(id => filteredStudentIds.includes(id)).length} sélectionné(s)
                </span>
              )}
            </div>
          )}
          
          {/* Table View */}
          {viewMode === "table" ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    {userRole === "vie-scolaire" && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Rôle</TableHead>
                    {userRole === "vie-scolaire" && <TableHead>Email</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      {userRole === "vie-scolaire" && (
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents([...selectedStudents, student.id])
                              } else {
                                setSelectedStudents(selectedStudents.filter((id) => id !== student.id))
                              }
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{student.last_name}</TableCell>
                      <TableCell>{student.first_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {student.classes?.name || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.role === "delegue"
                              ? "default"
                              : student.role === "eco-delegue"
                                ? "outline"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {student.role === "delegue"
                            ? "Délégué"
                            : student.role === "eco-delegue"
                              ? "Éco-délégué"
                              : "Élève"}
                        </Badge>
                      </TableCell>
                      {userRole === "vie-scolaire" && (
                        <TableCell className="text-muted-foreground text-sm">
                          {student.email || "-"}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStudent(student)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Regarder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(student)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            {userRole === "vie-scolaire" && student.role !== "eleve" && student.profile_id && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStudent(student)
                                  openAccessDialog(student)
                                }}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Gérer l'accès
                              </DropdownMenuItem>
                            )}
                            {userRole === "vie-scolaire" && student.role === "eleve" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStudent(student)
                                  openPromoteDialog(student, "delegue")
                                }}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Créer un accès
                              </DropdownMenuItem>
                            )}
                            {userRole === "vie-scolaire" && (
                              <>
                                {student.role !== "eleve" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setStudentToDemote(student)
                                      setIsDemoteDialogOpen(true)
                                    }}
                                  >
                                    Rétrograder en élève
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setStudentToDelete(student)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  className="text-destructive"
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            /* Grid View */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {userRole === "vie-scolaire" && (
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id])
                              } else {
                                setSelectedStudents(selectedStudents.filter((id) => id !== student.id))
                              }
                            }}
                            className="mt-1"
                          />
                        )}
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {student.first_name} {student.last_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {student.classes?.name && (
                              <Badge variant="secondary" className="text-xs">
                                {student.classes.name}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                student.role === "delegue"
                                  ? "default"
                                  : student.role === "eco-delegue"
                                    ? "outline"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {student.role === "delegue"
                                ? "Délégué"
                                : student.role === "eco-delegue"
                                  ? "Éco-délégué"
                                  : "Élève"}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedStudent(student)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Regarder
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(student)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {userRole === "vie-scolaire" && student.role !== "eleve" && student.profile_id && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStudent(student)
                                openAccessDialog(student)
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Gérer l'accès
                            </DropdownMenuItem>
                          )}
                          {userRole === "vie-scolaire" && student.role === "eleve" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStudent(student)
                                openPromoteDialog(student, "delegue")
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Créer un accès
                            </DropdownMenuItem>
                          )}
                          {userRole === "vie-scolaire" && (
                            <>
                              {student.role !== "eleve" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setStudentToDemote(student)
                                    setIsDemoteDialogOpen(true)
                                  }}
                                >
                                  Rétrograder en élève
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setStudentToDelete(student)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-destructive"
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {userRole === "vie-scolaire" && (
                      <>
                        {student.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        )}
                        {student.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">📱</span>
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                    {student.can_create_subrooms && (
                      <Badge variant="outline" className="text-xs">
                        Peut créer des sous-salles
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un élève</DialogTitle>
            <DialogDescription>Remplissez les informations de l'élève</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Jean"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@exemple.fr"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class_id">Classe *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "delegue" | "eco-delegue" | "eleve") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delegue">Délégué</SelectItem>
                    <SelectItem value="eco-delegue">Éco-délégué</SelectItem>
                    <SelectItem value="eleve">Élève</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="can_create_subrooms" className="text-base">
                  Peut créer des sous-salles
                </Label>
                <p className="text-sm text-muted-foreground">Autoriser cet élève à créer des sous-salles</p>
              </div>
              <Switch
                id="can_create_subrooms"
                checked={formData.can_create_subrooms}
                onCheckedChange={(checked) => setFormData({ ...formData, can_create_subrooms: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil de l'élève</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Prénom</Label>
                  <p className="font-medium">{selectedStudent.first_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nom</Label>
                  <p className="font-medium">{selectedStudent.last_name}</p>
                </div>
              </div>
              {userRole === "vie-scolaire" && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedStudent.email || "Non renseigné"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Téléphone</Label>
                    <p className="font-medium">{selectedStudent.phone || "Non renseigné"}</p>
                  </div>
                </>
              )}
              <div>
                <Label className="text-muted-foreground">Classe</Label>
                <p className="font-medium">{selectedStudent.classes?.name || "Non assigné"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Rôle</Label>
                <p className="font-medium">
                  {selectedStudent.role === "delegue"
                    ? "Délégué"
                    : selectedStudent.role === "eco-delegue"
                      ? "Éco-délégué"
                      : "Élève"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Peut créer des sous-salles</Label>
                <p className="font-medium">{selectedStudent.can_create_subrooms ? "Oui" : "Non"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date de naissance</Label>
                <p className="font-medium">
                  {selectedStudent.birth_date
                    ? new Date(selectedStudent.birth_date).toLocaleDateString()
                    : "Non renseignée"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Access Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gérer les accès</DialogTitle>
            <DialogDescription>
              Gérer les identifiants de connexion pour {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Identifiant</Label>
              <Input
                id="username"
                value={accessData.username}
                onChange={(e) => setAccessData({ ...accessData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="flex gap-2 min-w-0">
                <Input
                  id="password"
                  type="text"
                  placeholder="Laisser vide pour ne pas modifier"
                  value={accessData.password}
                  onChange={(e) => setAccessData({ ...accessData, password: e.target.value })}
                  className="flex-1 min-w-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 bg-transparent"
                  onClick={() => setAccessData({ ...accessData, password: generateLocalRandomPassword(8) })}
                  title="Générer un mot de passe aléatoire"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Laissez vide pour conserver le mot de passe actuel</p>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsAccessDialogOpen(false)}
              className="w-full sm:w-auto order-last sm:order-first"
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateCredentials} className="w-full sm:flex-1">
              Enregistrer
            </Button>
            <Button variant="secondary" onClick={handleSendEmail} className="w-full sm:flex-1">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="secondary" onClick={handlePrintPDF} className="w-full sm:flex-1">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportStudentsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        establishmentId={establishmentId}
        availableClasses={classes}
        onImportComplete={fetchData}
      />

      {/* Excel Import Dialog with Class Selection */}
      <Dialog open={isExcelImportDialogOpen && !excelImportClassId} onOpenChange={(open) => {
        if (!open) {
          setIsExcelImportDialogOpen(false)
          setExcelImportClassId("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Excel - Sélection de classe</DialogTitle>
            <DialogDescription>
              Sélectionnez la classe dans laquelle importer les élèves
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Classe de destination</Label>
              <Select value={excelImportClassId} onValueChange={setExcelImportClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExcelImportDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => {}} disabled={!excelImportClassId}>
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog - File Selection */}
      <ImportExcelDialog
        open={isExcelImportDialogOpen && !!excelImportClassId}
        onOpenChange={(open) => {
          if (!open) {
            setIsExcelImportDialogOpen(false)
            setExcelImportClassId("")
          }
        }}
        onImport={handleExcelImport}
        existingStudents={students.map(s => ({ first_name: s.first_name, last_name: s.last_name }))}
      />

      {/* Demote Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDemoteDialogOpen}
        onOpenChange={setIsDemoteDialogOpen}
        onConfirm={() => studentToDemote && handleDemoteStudent(studentToDemote)}
        itemCount={1}
        itemType="rétrogradation d'élève"
      />

      {/* Promote Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promouvoir l'élève</DialogTitle>
            <DialogDescription>
              Choisissez le rôle et définissez les identifiants pour {selectedStudent?.first_name}{" "}
              {selectedStudent?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nouveau rôle</Label>
              <Select
                value={promoteToRole}
                onValueChange={(value: "delegue" | "eco-delegue") => setPromoteToRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delegue">Délégué</SelectItem>
                  <SelectItem value="eco-delegue">Éco-délégué</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="upgrade-username">Identifiant</Label>
              <Input
                id="upgrade-username"
                value={upgradeCredentials.username}
                onChange={(e) => setUpgradeCredentials({ ...upgradeCredentials, username: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Format: NOM.prenom.CLASSE (ex: DUPONT.jean.5B)</p>
            </div>
            <div>
              <Label htmlFor="upgrade-password">Mot de passe</Label>
              <div className="flex gap-2">
                <Input
                  id="upgrade-password"
                  type="text"
                  value={upgradeCredentials.password}
                  onChange={(e) => setUpgradeCredentials({ ...upgradeCredentials, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUpgradeCredentials({ ...upgradeCredentials, password: generateStrongPassword(8) })}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mot de passe fort généré automatiquement (modifiable)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPromoteDialogOpen(false)
                setUpgradeCredentials({ username: "", password: "" })
              }}
            >
              Annuler
            </Button>
            <Button onClick={() => selectedStudent && handlePromoteStudent(selectedStudent, promoteToRole)}>
              Promouvoir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => studentToDelete && handleDeleteStudent(studentToDelete)}
        itemCount={1}
        itemType="élève"
      />

      <DeleteConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        itemCount={selectedStudents.length}
        itemType="élève(s)"
      />

      <DeleteConfirmationDialog
        open={isBulkDemoteDialogOpen}
        onOpenChange={setIsBulkDemoteDialogOpen}
        onConfirm={handleBulkDemote}
        itemCount={selectedStudents.length}
        itemType="rétrogradation d'élève(s)"
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'élève</DialogTitle>
            <DialogDescription>
              Modifier les informations de {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-first-name">Prénom</Label>
                <Input
                  id="edit-first-name"
                  value={editData.first_name}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-last-name">Nom</Label>
                <Input
                  id="edit-last-name"
                  value={editData.last_name}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
            </div>
            {(selectedStudent?.role === "delegue" || selectedStudent?.role === "eco-delegue") && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="can-create-subrooms"
                  checked={editData.can_create_subrooms}
                  onCheckedChange={(checked) => setEditData({ ...editData, can_create_subrooms: checked as boolean })}
                />
                <Label htmlFor="can-create-subrooms" className="text-sm font-normal cursor-pointer">
                  Peut créer des sous-salles
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
