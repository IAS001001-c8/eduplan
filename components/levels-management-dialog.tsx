"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { AlertTriangle, GraduationCap, Plus } from "lucide-react"

interface Level {
  id: string
  name: string
  is_custom: boolean
  created_at: string
}

interface LevelsManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  establishmentId: string
}

export function LevelsManagementDialog({ open, onOpenChange, establishmentId }: LevelsManagementDialogProps) {
  const [levels, setLevels] = useState<Level[]>([])
  const [newLevelName, setNewLevelName] = useState("")
  const [showWarning, setShowWarning] = useState(false)
  const [confirmCode, setConfirmCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const CONFIRMATION_CODE = "CREER_NIVEAU"

  useEffect(() => {
    if (open) {
      fetchLevels()
    }
  }, [open])

  const fetchLevels = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("levels").select("*").eq("establishment_id", establishmentId).order("name")

    if (data) setLevels(data)
  }

  const handleShowWarning = () => {
    if (!newLevelName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du niveau est requis",
        variant: "destructive",
      })
      return
    }
    setShowWarning(true)
  }

  const handleCreateLevel = async () => {
    if (confirmCode !== CONFIRMATION_CODE) {
      toast({
        title: "Erreur",
        description: "Code de confirmation incorrect",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("levels").insert({
        name: newLevelName.trim(),
        establishment_id: establishmentId,
        is_custom: true,
      })

      if (error) throw error

      toast({
        title: "Niveau créé",
        description: `Le niveau "${newLevelName}" a été créé avec succès`,
      })

      setNewLevelName("")
      setConfirmCode("")
      setShowWarning(false)
      fetchLevels()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le niveau",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const redirectToAddClass = () => {
    setShowWarning(false)
    onOpenChange(false)
    // The parent component should handle navigation to class creation
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Gestion des niveaux
            </DialogTitle>
            <DialogDescription>
              Gérez les niveaux scolaires (6ème, 5ème, 4ème, 3ème, etc.) de votre établissement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Existing Levels */}
            <div>
              <h3 className="text-sm font-medium mb-3">Niveaux existants ({levels.length})</h3>
              <div className="grid gap-2">
                {levels.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Aucun niveau créé pour le moment
                    </CardContent>
                  </Card>
                ) : (
                  levels.map((level) => (
                    <Card key={level.id}>
                      <CardContent className="py-3 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{level.name}</span>
                          {level.is_custom && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              Personnalisé
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Add New Level */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-3">Ajouter un nouveau niveau</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="levelName">Nom du niveau</Label>
                  <Input
                    id="levelName"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    placeholder="ex: 6ème Général, 4ème Technologique"
                  />
                </div>
                <Button onClick={handleShowWarning} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un niveau
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Attention
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-base">
                Vous êtes en train de créer un <strong>Niveau</strong> et non une classe.
              </p>
              <p>
                Cette action est <strong>irréversible</strong>. Pour créer une classe (4ème B, 5ème ULYSSE…), veuillez
                quitter ce formulaire et cliquer sur le bouton « Ajouter une classe » présent ci-dessous.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-2">Pour confirmer la création du niveau, recopiez ce code :</p>
                <code className="text-lg font-mono font-bold">{CONFIRMATION_CODE}</code>
              </div>
              <Input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="Recopiez le code ici"
                className="font-mono"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmCode("")}>Annuler</AlertDialogCancel>
            <Button variant="outline" onClick={redirectToAddClass}>
              Créer une classe
            </Button>
            <AlertDialogAction
              onClick={handleCreateLevel}
              disabled={confirmCode !== CONFIRMATION_CODE || isLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? "Création..." : "Poursuivre"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
