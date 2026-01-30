"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit } from "lucide-react"

interface Column {
  id: string
  tables: number
  seatsPerTable: number
}

interface Room {
  id: string
  name: string
  code: string
  board_position: "top" | "bottom" | "left" | "right"
  config?: {
    columns?: Column[]
  }
}

interface EditRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  room: Room | null
}

export function EditRoomDialog({
  open,
  onOpenChange,
  onSuccess,
  room,
}: EditRoomDialogProps) {
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

  // Load room data when dialog opens
  useEffect(() => {
    if (room && open) {
      setFormData({
        name: room.name || "",
        code: room.code || "",
        boardPosition: room.board_position || "top",
        columns: room.config?.columns || [
          { id: "col1", tables: 5, seatsPerTable: 2 },
          { id: "col2", tables: 5, seatsPerTable: 2 },
          { id: "col3", tables: 4, seatsPerTable: 2 },
        ],
      })
    }
  }, [room, open])

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

  const handleSave = async () => {
    if (!room) return

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

      const { error } = await supabase
        .from("rooms")
        .update({
          name: formData.name,
          code: formData.code,
          board_position: formData.boardPosition,
          config: { columns: formData.columns },
        })
        .eq("id", room.id)

      if (error) throw error

      toast({
        title: "Salle modifiée",
        description: `La salle "${formData.name}" a été modifiée avec succès`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating room:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la salle",
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
            <Edit className="h-5 w-5 text-emerald-600" />
            Modifier la salle
          </DialogTitle>
          <DialogDescription>
            Modifiez la configuration de la salle de classe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-room-name">Nom de la salle *</Label>
              <Input
                id="edit-room-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Salle Informatique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-room-code">Code *</Label>
              <Input
                id="edit-room-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ex: B12"
              />
            </div>
          </div>

          {/* Columns configuration */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Configuration des colonnes</Label>
              <div className="text-sm text-muted-foreground">
                Total: <span className={calculateTotalSeats() > 350 ? "text-red-500 font-bold" : "font-medium"}>
                  {calculateTotalSeats()} places
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {formData.columns.map((column, index) => (
                <div
                  key={column.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <span className="text-sm font-medium text-muted-foreground w-20">
                    Colonne {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Tables:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={column.tables}
                      onChange={(e) => handleColumnChange(index, "tables", parseInt(e.target.value) || 1)}
                      className="w-16 h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Places/table:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={column.seatsPerTable}
                      onChange={(e) => handleColumnChange(index, "seatsPerTable", parseInt(e.target.value) || 1)}
                      className="w-16 h-8"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    = {column.tables * column.seatsPerTable} places
                  </div>
                  {formData.columns.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveColumn(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {formData.columns.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddColumn}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une colonne
              </Button>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Aperçu</Label>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-4 justify-center">
                {formData.columns.map((column, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    {Array.from({ length: Math.min(column.tables, 5) }).map((_, tableIndex) => (
                      <div
                        key={tableIndex}
                        className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded p-1 flex gap-0.5 justify-center"
                        style={{ width: `${column.seatsPerTable * 12 + 8}px` }}
                      >
                        {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => (
                          <div
                            key={seatIndex}
                            className="w-2 h-2 bg-emerald-500 rounded-sm"
                          />
                        ))}
                      </div>
                    ))}
                    {column.tables > 5 && (
                      <div className="text-xs text-center text-muted-foreground">
                        +{column.tables - 5}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
