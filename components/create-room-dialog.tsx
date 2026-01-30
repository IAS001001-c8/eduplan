"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, LayoutGrid } from "lucide-react"

interface Column {
  id: string
  tables: number
  seatsPerTable: number
}

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userId: string
  establishmentId: string
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  establishmentId,
}: CreateRoomDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    boardPosition: "top" as "top" | "bottom" | "left" | "right",
    columns: [
      { id: "col1", tables: 5, seatsPerTable: 2 },
      { id: "col2", tables: 5, seatsPerTable: 2 },
      { id: "col3", tables: 4, seatsPerTable: 2 },
    ] as Column[],
  })

  const calculateTotalSeats = () => {
    return formData.columns.reduce((sum, col) => sum + col.tables * col.seatsPerTable, 0)
  }

  const handleAddColumn = () => {
    if (formData.columns.length >= 6) return
    setFormData({
      ...formData,
      columns: [
        ...formData.columns,
        { id: `col${formData.columns.length + 1}`, tables: 4, seatsPerTable: 2 },
      ],
    })
  }

  const handleRemoveColumn = (index: number) => {
    if (formData.columns.length <= 1) return
    setFormData({
      ...formData,
      columns: formData.columns.filter((_, i) => i !== index),
    })
  }

  const handleColumnChange = (index: number, field: "tables" | "seatsPerTable", value: number) => {
    const newColumns = [...formData.columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setFormData({ ...formData, columns: newColumns })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom à la salle",
        variant: "destructive",
      })
      return
    }

    if (!formData.code.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un code à la salle (ex: B12)",
        variant: "destructive",
      })
      return
    }

    if (calculateTotalSeats() > 350) {
      toast({
        title: "Erreur",
        description: "La capacité maximale est de 350 places",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("rooms").insert({
        establishment_id: establishmentId,
        name: formData.name,
        code: formData.code,
        board_position: formData.boardPosition,
        config: { columns: formData.columns },
        created_by: userId,
      })

      if (error) throw error

      toast({
        title: "Salle créée",
        description: `La salle "${formData.name}" a été créée avec succès`,
      })

      // Reset form
      setFormData({
        name: "",
        code: "",
        boardPosition: "top",
        columns: [
          { id: "col1", tables: 5, seatsPerTable: 2 },
          { id: "col2", tables: 5, seatsPerTable: 2 },
          { id: "col3", tables: 4, seatsPerTable: 2 },
        ],
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error creating room:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la salle",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-emerald-600" />
            Créer une nouvelle salle
          </DialogTitle>
          <DialogDescription>
            Configurez votre salle de classe avec le nombre de colonnes, rangées et places
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Nom de la salle *</Label>
              <Input
                id="room-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Salle Informatique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-code">Code *</Label>
              <Input
                id="room-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ex: B12"
              />
            </div>
          </div>
              </SelectContent>
            </Select>
          </div>

          {/* Columns configuration */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Configuration des colonnes</Label>
              <div className="text-sm text-muted-foreground">
                Total: <span className={calculateTotalSeats() > 350 ? "text-red-500 font-bold" : "font-medium"}>
                  {calculateTotalSeats()} places
                </span>
                {calculateTotalSeats() > 350 && <span className="text-red-500 ml-1">(max 350)</span>}
              </div>
            </div>

            <div className="space-y-3">
              {formData.columns.map((column, index) => (
                <div
                  key={column.id}
                  className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                >
                  <div className="col-span-1">
                    <span className="font-medium text-emerald-600">#{index + 1}</span>
                  </div>
                  <div className="col-span-5">
                    <Label htmlFor={`tables-${index}`} className="text-xs text-muted-foreground">
                      Nombre de rangées
                    </Label>
                    <Input
                      id={`tables-${index}`}
                      type="number"
                      min="1"
                      max="20"
                      value={column.tables}
                      onChange={(e) => handleColumnChange(index, "tables", parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label htmlFor={`seats-${index}`} className="text-xs text-muted-foreground">
                      Places par rangée
                    </Label>
                    <Input
                      id={`seats-${index}`}
                      type="number"
                      min="1"
                      max="7"
                      value={column.seatsPerTable}
                      onChange={(e) => handleColumnChange(index, "seatsPerTable", parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveColumn(index)}
                      disabled={formData.columns.length <= 1}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddColumn}
                disabled={formData.columns.length >= 6}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une colonne {formData.columns.length >= 6 && "(max 6)"}
              </Button>
            </div>
          </div>

          {/* Preview summary */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Résumé</h4>
            <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
              <p><strong>{formData.name || "Nom non défini"}</strong> ({formData.code || "Code non défini"})</p>
              <p>Tableau: {formData.boardPosition === "top" ? "Haut" : formData.boardPosition === "bottom" ? "Bas" : formData.boardPosition === "left" ? "Gauche" : "Droite"}</p>
              <p>{formData.columns.length} colonne(s) • {calculateTotalSeats()} places au total</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || !formData.name.trim() || !formData.code.trim() || calculateTotalSeats() > 350}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Création..." : "Créer la salle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
