"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { SubRoomScheduleForm, type ScheduleSlot } from "@/components/sub-room-schedule-form"
import { Pencil, Clock } from "lucide-react"

interface SubRoom {
  id: string
  name: string
  custom_name?: string
  teacher_id?: string
  room_id?: string
  class_ids?: string[]
}

interface EditSubRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subRoom: SubRoom | null
  onSuccess: () => void
}

export function EditSubRoomDialog({
  open,
  onOpenChange,
  subRoom,
  onSuccess,
}: EditSubRoomDialogProps) {
  const [newName, setNewName] = useState("")
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingSchedules, setIsFetchingSchedules] = useState(false)

  useEffect(() => {
    if (subRoom && open) {
      setNewName(subRoom.custom_name || subRoom.name || "")
      fetchSchedules()
    }
  }, [subRoom, open])

  const fetchSchedules = async () => {
    if (!subRoom) return
    
    setIsFetchingSchedules(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("sub_room_schedules")
        .select("*")
        .eq("sub_room_id", subRoom.id)

      if (error) throw error

      setSchedules(
        data?.map((s) => ({
          id: s.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          week_type: s.week_type as "A" | "B" | "both",
        })) || []
      )
    } catch (error) {
      console.error("Error fetching schedules:", error)
      // Si la table n'existe pas encore, ne pas afficher d'erreur
      setSchedules([])
    } finally {
      setIsFetchingSchedules(false)
    }
  }

  const handleSave = async () => {
    if (!subRoom) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Mettre à jour le nom si modifié
      if (newName.trim() && newName.trim() !== subRoom.name) {
        const { error: nameError } = await supabase
          .from("sub_rooms")
          .update({
            name: newName.trim(),
            custom_name: newName.trim(),
          })
          .eq("id", subRoom.id)

        if (nameError) throw nameError
      }

      // Supprimer les anciens créneaux
      await supabase
        .from("sub_room_schedules")
        .delete()
        .eq("sub_room_id", subRoom.id)

      // Insérer les nouveaux créneaux
      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map((s) => ({
          sub_room_id: subRoom.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          week_type: s.week_type,
        }))

        const { error: scheduleError } = await supabase
          .from("sub_room_schedules")
          .insert(schedulesToInsert)

        if (scheduleError) {
          console.error("Error saving schedules:", scheduleError)
          // Ne pas bloquer si la table n'existe pas
        }
      }

      toast({
        title: "Succès",
        description: "Les modifications ont été enregistrées",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating sub-room:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer les modifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#29282B]">Modifier la sous-salle</DialogTitle>
          <DialogDescription className="text-[#29282B]/60">
            Modifiez le nom et les créneaux horaires de cette sous-salle
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#F5F5F6]">
            <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:text-[#E7A541]">
              <Pencil className="h-4 w-4 mr-2" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="schedules" className="data-[state=active]:bg-white data-[state=active]:text-[#E7A541]">
              <Clock className="h-4 w-4 mr-2" />
              Créneaux
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="subroom-name" className="text-[#29282B]">Nom de la sous-salle</Label>
              <Input
                id="subroom-name"
                placeholder="Ex: 2nde A - M. Dupont - Maths"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border-[#D9DADC]"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="schedules" className="pt-4">
            {isFetchingSchedules ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-[#29282B]/60">Chargement des créneaux...</p>
              </div>
            ) : (
              <SubRoomScheduleForm
                schedules={schedules}
                onChange={setSchedules}
              />
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-[#D9DADC]"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-[#E7A541] hover:bg-[#D4933A] text-white"
          >
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
