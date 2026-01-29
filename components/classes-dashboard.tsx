"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, LayoutGrid, Trash2, Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

interface ClassesDashboardProps {
  onSelectClass: (classCode: string) => void
}

interface ClassData {
  name: string
  students: string[]
  rooms: any[]
}

export function ClassesDashboard({ onSelectClass }: ClassesDashboardProps) {
  const [classes, setClasses] = useState<Record<string, ClassData>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<string | null>(null)

  useEffect(() => {
    // Charger toutes les classes
    try {
      const savedClasses = JSON.parse(localStorage.getItem("classes") || "{}")
      setClasses(savedClasses)
    } catch (e) {
      console.error("Erreur lors du chargement des classes:", e)
      toast({
        title: "Erreur",
        description: "Impossible de charger les classes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredClasses = Object.entries(classes).filter(([code, classData]) => {
    return (
      classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDeleteClass = (code: string) => {
    setClassToDelete(code)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteClass = () => {
    if (!classToDelete) return

    try {
      // Supprimer la classe
      const updatedClasses = { ...classes }
      delete updatedClasses[classToDelete]

      // Mettre à jour le localStorage
      localStorage.setItem("classes", JSON.stringify(updatedClasses))

      // Mettre à jour l'état
      setClasses(updatedClasses)

      // Supprimer également les attributions de places associées
      try {
        localStorage.removeItem(`seatAssignments_${classToDelete}`)
      } catch (e) {
        console.error("Erreur lors de la suppression des attributions:", e)
      }

      toast({
        title: "Classe supprimée",
        description: `La classe a été supprimée avec succès`,
      })
    } catch (e) {
      console.error("Erreur lors de la suppression de la classe:", e)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la classe",
        variant: "destructive",
      })
    } finally {
      setClassToDelete(null)
      setDeleteConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="col-span-2 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="col-span-2">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une classe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-focus-effect"
          />
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-subtle p-8">
          <div className="flex flex-col items-center">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune classe trouvée</h3>
            <p>Créez une nouvelle classe pour commencer.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map(([code, classData]) => (
            <Card
              key={code}
              className="overflow-hidden h-full border border-gray-200 hover:border-theme-amber-300 dark:hover:border-theme-amber-700 transition-colors duration-200"
            >
              <CardHeader className="p-3 pb-0 bg-gradient-to-br from-theme-amber-50 to-theme-amber-100 dark:from-theme-amber-900 dark:to-theme-amber-800">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{classData.name}</CardTitle>
                    <CardDescription>Code: {code}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-theme-amber-200 dark:hover:bg-theme-amber-800"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectClass(code)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Modifier</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClass(code)}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-theme-blue-500" />
                    <span>{classData.students.length} élèves</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <LayoutGrid className="h-4 w-4 text-theme-teal-500" />
                    <span>{classData.rooms.length} salles</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Button
                  className="w-full bg-theme-amber-600 hover:bg-theme-amber-700"
                  onClick={() => onSelectClass(code)}
                >
                  Accéder
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette classe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à cette classe seront définitivement
              supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="button-hover-effect">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClass}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 button-hover-effect"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
