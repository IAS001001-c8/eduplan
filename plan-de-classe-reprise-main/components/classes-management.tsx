"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { logAction } from "@/lib/supabase-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Pencil, Trash2, ArrowLeft, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { LevelsManagementDialog } from "@/components/levels-management-dialog"

interface Class {
  id: string
  name: string
  level: string
  establishment_id: string
  created_at: string
}

interface Level {
  id: string
  name: string
}

interface ClassesManagementProps {
  establishmentId: string
  onBack?: () => void
}

export function ClassesManagement({ establishmentId, onBack }: ClassesManagementProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLevelsDialogOpen, setIsLevelsDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({ name: "", level: "" })
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [establishmentId])

  async function fetchData() {
    setLoading(true)
    await Promise.all([fetchClasses(), fetchLevels()])
    setLoading(false)
  }

  async function fetchClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("level", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching classes:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les classes",
        variant: "destructive",
      })
    } else {
      setClasses(data || [])
    }
  }

  async function fetchLevels() {
    const { data, error } = await supabase
      .from("levels")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching levels:", error)
    } else {
      setLevels(data || [])
    }
  }

  async function handleAdd() {
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la classe est requis",
        variant: "destructive",
      })
      return
    }

    if (!formData.level) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un niveau",
        variant: "destructive",
      })
      return
    }

    const { data, error } = await supabase
      .from("classes")
      .insert([
        {
          name: formData.name,
          level: formData.level,
          establishment_id: establishmentId,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error adding class:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la classe",
        variant: "destructive",
      })
    } else {
      await logAction("create", "class", data.id, formData.name)
      toast({
        title: "Succès",
        description: "Classe ajoutée avec succès",
      })
      setIsAddDialogOpen(false)
      setFormData({ name: "", level: "" })
      fetchClasses()
    }
  }

  async function handleEdit() {
    if (!selectedClass || !formData.name.trim()) return

    const { error } = await supabase
      .from("classes")
      .update({
        name: formData.name,
        level: formData.level,
      })
      .eq("id", selectedClass.id)

    if (error) {
      console.error("[v0] Error updating class:", error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier la classe",
        variant: "destructive",
      })
    } else {
      await logAction("update", "class", selectedClass.id, formData.name)
      toast({
        title: "Succès",
        description: "Classe modifiée avec succès",
      })
      setIsEditDialogOpen(false)
      setSelectedClass(null)
      setFormData({ name: "", level: "" })
      fetchClasses()
    }
  }

  async function handleDelete(classItem: Class) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la classe "${classItem.name}" ?`)) {
      return
    }

    const { error } = await supabase.from("classes").delete().eq("id", classItem.id)

    if (error) {
      console.error("[v0] Error deleting class:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la classe",
        variant: "destructive",
      })
    } else {
      await logAction("delete", "class", classItem.id, classItem.name)
      toast({
        title: "Succès",
        description: "Classe supprimée avec succès",
      })
      fetchClasses()
    }
  }

  function openEditDialog(classItem: Class) {
    setSelectedClass(classItem)
    setFormData({ name: classItem.name, level: classItem.level || "" })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack || (() => router.push("/dashboard"))} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des classes</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {classes.length} classe{classes.length !== 1 ? "s" : ""} enregistrée{classes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsLevelsDialogOpen(true)} variant="outline" size="lg">
          <GraduationCap className="mr-2 h-5 w-5" />
          Gestion des niveaux
        </Button>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="w-full sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Ajouter une classe
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-semibold">Nom</TableHead>
                <TableHead className="font-semibold">Niveau</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Aucune classe</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Commencez par créer votre première classe
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((classItem) => (
                  <TableRow
                    key={classItem.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {classItem.level || "Non défini"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEditDialog(classItem)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(classItem)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Ajouter une classe</DialogTitle>
            <DialogDescription>Créez une nouvelle classe pour votre établissement</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom de la classe <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 6A, 5B"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level" className="text-sm font-medium">
                Niveau <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {levels.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucun niveau créé
                    </SelectItem>
                  ) : (
                    levels.map((level) => (
                      <SelectItem key={level.id} value={level.name}>
                        {level.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleAdd} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Modifier la classe</DialogTitle>
            <DialogDescription>Modifiez les informations de la classe</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Nom de la classe <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-level" className="text-sm font-medium">
                Niveau
              </Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {levels.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucun niveau créé
                    </SelectItem>
                  ) : (
                    levels.map((level) => (
                      <SelectItem key={level.id} value={level.name}>
                        {level.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleEdit} className="w-full sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LevelsManagementDialog
        open={isLevelsDialogOpen}
        onOpenChange={setIsLevelsDialogOpen}
        establishmentId={establishmentId}
        onLevelsUpdated={fetchLevels}
      />
    </div>
  )
}
