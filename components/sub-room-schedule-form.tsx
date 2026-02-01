"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ScheduleSlot {
  id: string
  day_of_week: number // 0 = Lundi, 6 = Dimanche
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
  week_type: "A" | "B" | "both"
}

interface SubRoomScheduleFormProps {
  schedules: ScheduleSlot[]
  onChange: (schedules: ScheduleSlot[]) => void
  disabled?: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Lundi" },
  { value: 1, label: "Mardi" },
  { value: 2, label: "Mercredi" },
  { value: 3, label: "Jeudi" },
  { value: 4, label: "Vendredi" },
  { value: 5, label: "Samedi" },
  { value: 6, label: "Dimanche" },
]

const WEEK_TYPES = [
  { value: "both", label: "Toutes les semaines" },
  { value: "A", label: "Semaine A uniquement" },
  { value: "B", label: "Semaine B uniquement" },
]

// Générer un ID unique
function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function SubRoomScheduleForm({ schedules, onChange, disabled = false }: SubRoomScheduleFormProps) {
  const addSchedule = () => {
    const newSchedule: ScheduleSlot = {
      id: generateId(),
      day_of_week: 0,
      start_time: "08:00",
      end_time: "09:00",
      week_type: "both",
    }
    onChange([...schedules, newSchedule])
  }

  const updateSchedule = (id: string, updates: Partial<ScheduleSlot>) => {
    onChange(
      schedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      )
    )
  }

  const removeSchedule = (id: string) => {
    onChange(schedules.filter((s) => s.id !== id))
  }

  const getWeekTypeColor = (type: string) => {
    switch (type) {
      case "A":
        return "bg-green-100 text-green-700 border-green-200"
      case "B":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-[#F5F5F6] text-[#29282B] border-[#D9DADC]"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[#29282B] font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#E7A541]" />
          Créneaux horaires
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSchedule}
          disabled={disabled}
          className="border-[#D9DADC] hover:border-[#E7A541] hover:bg-[#FDF6E9]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un créneau
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-8 bg-[#F5F5F6] rounded-lg border border-dashed border-[#D9DADC]">
          <Clock className="h-8 w-8 text-[#D9DADC] mx-auto mb-2" />
          <p className="text-sm text-[#29282B]/60">Aucun créneau défini</p>
          <p className="text-xs text-[#29282B]/40 mt-1">
            Cliquez sur "Ajouter un créneau" pour définir les horaires d'utilisation
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.id}
              className="p-4 bg-[#F9F9FA] rounded-lg border border-[#D9DADC] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#29282B]">
                  Créneau {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSchedule(schedule.id)}
                  disabled={disabled}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Jour */}
                <div>
                  <Label className="text-xs text-[#29282B]/60">Jour</Label>
                  <Select
                    value={schedule.day_of_week.toString()}
                    onValueChange={(value) =>
                      updateSchedule(schedule.id, { day_of_week: parseInt(value) })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="border-[#D9DADC] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semaine A/B */}
                <div>
                  <Label className="text-xs text-[#29282B]/60">Semaine</Label>
                  <Select
                    value={schedule.week_type}
                    onValueChange={(value) =>
                      updateSchedule(schedule.id, { week_type: value as "A" | "B" | "both" })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="border-[#D9DADC] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Heure début */}
                <div>
                  <Label className="text-xs text-[#29282B]/60">Début</Label>
                  <Input
                    type="time"
                    value={schedule.start_time}
                    onChange={(e) =>
                      updateSchedule(schedule.id, { start_time: e.target.value })
                    }
                    disabled={disabled}
                    className="border-[#D9DADC] mt-1"
                  />
                </div>

                {/* Heure fin */}
                <div>
                  <Label className="text-xs text-[#29282B]/60">Fin</Label>
                  <Input
                    type="time"
                    value={schedule.end_time}
                    onChange={(e) =>
                      updateSchedule(schedule.id, { end_time: e.target.value })
                    }
                    disabled={disabled}
                    className="border-[#D9DADC] mt-1"
                  />
                </div>
              </div>

              {/* Résumé */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#D9DADC]">
                <Badge className={cn("text-xs", getWeekTypeColor(schedule.week_type))}>
                  {schedule.week_type === "both" ? "A+B" : `Sem. ${schedule.week_type}`}
                </Badge>
                <span className="text-sm text-[#29282B]">
                  {DAYS_OF_WEEK.find((d) => d.value === schedule.day_of_week)?.label} {schedule.start_time} - {schedule.end_time}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Résumé global */}
      {schedules.length > 0 && (
        <div className="p-3 bg-[#FDF6E9] rounded-lg border border-[#E7A541]/20">
          <p className="text-sm text-[#29282B] font-medium mb-2">Résumé des créneaux :</p>
          <div className="flex flex-wrap gap-2">
            {schedules.map((schedule) => (
              <Badge key={schedule.id} variant="outline" className="text-xs border-[#E7A541]/30 bg-white">
                {DAYS_OF_WEEK.find((d) => d.value === schedule.day_of_week)?.label.slice(0, 3)}.{" "}
                {schedule.start_time}-{schedule.end_time}
                {schedule.week_type !== "both" && ` (${schedule.week_type})`}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
