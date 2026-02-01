"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

interface RenameSubRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subRoom: {
    id: string
    name: string
    custom_name?: string
  } | null
  onSuccess: () => void
}

export function RenameSubRoomDialog({
  open,
  onOpenChange,
  subRoom,
  onSuccess,
}: RenameSubRoomDialogProps) {
  const [newName, setNewName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (subRoom && open) {
      setNewName(subRoom.custom_name || subRoom.name || "")
    }
  }, [subRoom, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!subRoom || !newName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom valide",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("sub_rooms")
        .update({
          name: newName.trim(),
          custom_name: newName.trim(),
        })
        .eq("id", subRoom.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "La sous-salle a été renommée",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de renommer la sous-salle",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Renommer la sous-salle</DialogTitle>
          <DialogDescription>
            Entrez le nouveau nom pour cette sous-salle
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Nouveau nom</Label>
            <Input
              id="new-name"
              placeholder="Ex: 2nde A - M. Dupont - Maths"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !newName.trim()}>
              {isLoading ? "Enregistrement..." : "Renommer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
