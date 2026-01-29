"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface ClassSelectorProps {
  onClose: () => void
  onClassCreated: (code: string) => void
}

export function ClassSelector({ onClose, onClassCreated }: ClassSelectorProps) {
  const [className, setClassName] = useState("")
  const [classCode, setClassCode] = useState("")

  const handleCreateClass = () => {
    if (!className || !classCode) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    // Vérifier si le code existe déjà
    const classes = JSON.parse(localStorage.getItem("classes") || "{}")

    if (classes[classCode]) {
      toast({
        title: "Erreur",
        description: "Ce code de classe existe déjà",
        variant: "destructive",
      })
      return
    }

    // Créer la nouvelle classe
    const newClasses = {
      ...classes,
      [classCode]: {
        name: className,
        students: [],
        rooms: [],
      },
    }

    localStorage.setItem("classes", JSON.stringify(newClasses))

    toast({
      title: "Classe créée",
      description: `La classe ${className} a été créée avec le code ${classCode}`,
    })

    onClassCreated(classCode)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle classe</DialogTitle>
          <DialogDescription>Définissez le nom et le code d'accès pour cette classe</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="className" className="text-right">
              Nom
            </Label>
            <Input
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="col-span-3"
              placeholder="ex: Première 1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="classCode" className="text-right">
              Code
            </Label>
            <Input
              id="classCode"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="col-span-3"
              placeholder="ex: prem1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleCreateClass}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
