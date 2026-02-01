"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ChevronLeft, ChevronRight, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeekABCalendarProps {
  establishmentId: string
  onBack: () => void
}

interface WeekData {
  week_number: number
  year: number
  week_type: "A" | "B"
  week_start_date: string
}

// Fonction pour obtenir le numéro de semaine ISO
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Fonction pour obtenir la date de début d'une semaine
function getWeekStartDate(year: number, weekNumber: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1)
  const result = new Date(firstMonday)
  result.setDate(firstMonday.getDate() + (weekNumber - 1) * 7)
  return result
}

// Générer les semaines d'une année scolaire (Août N à Juillet N+1)
function generateSchoolYearWeeks(startYear: number): Array<{ weekNumber: number; year: number; startDate: Date; endDate: Date }> {
  const weeks: Array<{ weekNumber: number; year: number; startDate: Date; endDate: Date }> = []
  
  // Commencer en Août de l'année startYear
  let currentDate = new Date(startYear, 7, 1) // 1er Août
  // Trouver le premier lundi
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Générer 52 semaines
  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(currentDate)
    const weekEnd = new Date(currentDate)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    weeks.push({
      weekNumber: getWeekNumber(weekStart),
      year: weekStart.getFullYear(),
      startDate: weekStart,
      endDate: weekEnd,
    })
    
    currentDate.setDate(currentDate.getDate() + 7)
  }
  
  return weeks
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

export function WeekABCalendar({ establishmentId, onBack }: WeekABCalendarProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  // Déterminer l'année scolaire actuelle
  const [schoolYear, setSchoolYear] = useState(() => {
    return currentMonth >= 7 ? currentYear : currentYear - 1
  })
  
  const [weekTypes, setWeekTypes] = useState<Map<string, "A" | "B">>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<{ weekNumber: number; year: number } | null>(null)
  const [confirmCode, setConfirmCode] = useState("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingWeekType, setPendingWeekType] = useState<"A" | "B">("A")

  const weeks = useMemo(() => generateSchoolYearWeeks(schoolYear), [schoolYear])
  
  // Grouper les semaines par mois
  const weeksByMonth = useMemo(() => {
    const grouped: Map<string, typeof weeks> = new Map()
    
    weeks.forEach((week) => {
      const monthKey = `${week.startDate.getFullYear()}-${week.startDate.getMonth()}`
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, [])
      }
      grouped.get(monthKey)!.push(week)
    })
    
    return grouped
  }, [weeks])

  useEffect(() => {
    fetchWeekTypes()
  }, [establishmentId, schoolYear])

  const fetchWeekTypes = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("week_ab_calendar")
        .select("week_number, year, week_type")
        .eq("establishment_id", establishmentId)
        .in("year", [schoolYear, schoolYear + 1])

      if (error) throw error

      const map = new Map<string, "A" | "B">()
      data?.forEach((item) => {
        map.set(`${item.year}-${item.week_number}`, item.week_type as "A" | "B")
      })
      setWeekTypes(map)
    } catch (error) {
      console.error("Error fetching week types:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWeekClick = (weekNumber: number, year: number) => {
    setSelectedWeek({ weekNumber, year })
    const currentType = weekTypes.get(`${year}-${weekNumber}`)
    setPendingWeekType(currentType === "A" ? "B" : "A")
    setConfirmCode("")
    setIsConfirmOpen(true)
  }

  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const [expectedCode] = useState(() => generateRandomCode())

  const handleConfirmChange = async () => {
    if (confirmCode !== expectedCode) {
      toast({
        title: "Code incorrect",
        description: "Le code de confirmation ne correspond pas",
        variant: "destructive",
      })
      return
    }

    if (!selectedWeek) return

    const supabase = createClient()

    try {
      // Trouver la semaine sélectionnée
      const selectedWeekData = weeks.find(
        (w) => w.weekNumber === selectedWeek.weekNumber && w.year === selectedWeek.year
      )
      
      if (!selectedWeekData) return

      // Insérer ou mettre à jour la semaine sélectionnée
      const { error: updateError } = await supabase
        .from("week_ab_calendar")
        .upsert({
          establishment_id: establishmentId,
          week_number: selectedWeek.weekNumber,
          year: selectedWeek.year,
          week_type: pendingWeekType,
          week_start_date: selectedWeekData.startDate.toISOString().split('T')[0],
        }, {
          onConflict: 'establishment_id,week_number,year'
        })

      if (updateError) throw updateError

      // Auto-compléter le reste du calendrier
      const selectedIndex = weeks.findIndex(
        (w) => w.weekNumber === selectedWeek.weekNumber && w.year === selectedWeek.year
      )
      
      const newWeekTypes = new Map(weekTypes)
      let currentType: "A" | "B" = pendingWeekType

      // Remplir toutes les semaines à partir de la sélection
      for (let i = selectedIndex; i < weeks.length; i++) {
        const week = weeks[i]
        newWeekTypes.set(`${week.year}-${week.weekNumber}`, currentType)
        
        // Upsert dans la base
        await supabase
          .from("week_ab_calendar")
          .upsert({
            establishment_id: establishmentId,
            week_number: week.weekNumber,
            year: week.year,
            week_type: currentType,
            week_start_date: week.startDate.toISOString().split('T')[0],
          }, {
            onConflict: 'establishment_id,week_number,year'
          })
        
        currentType = currentType === "A" ? "B" : "A"
      }

      // Remplir aussi les semaines précédentes en alternant dans l'autre sens
      currentType = pendingWeekType === "A" ? "B" : "A"
      for (let i = selectedIndex - 1; i >= 0; i--) {
        const week = weeks[i]
        newWeekTypes.set(`${week.year}-${week.weekNumber}`, currentType)
        
        await supabase
          .from("week_ab_calendar")
          .upsert({
            establishment_id: establishmentId,
            week_number: week.weekNumber,
            year: week.year,
            week_type: currentType,
            week_start_date: week.startDate.toISOString().split('T')[0],
          }, {
            onConflict: 'establishment_id,week_number,year'
          })
        
        currentType = currentType === "A" ? "B" : "A"
      }

      setWeekTypes(newWeekTypes)
      setIsConfirmOpen(false)
      
      toast({
        title: "Calendrier mis à jour",
        description: "Les semaines A/B ont été configurées avec succès",
      })
    } catch (error) {
      console.error("Error updating week types:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le calendrier",
        variant: "destructive",
      })
    }
  }

  const getCurrentWeekKey = () => {
    const now = new Date()
    return `${now.getFullYear()}-${getWeekNumber(now)}`
  }

  const currentWeekKey = getCurrentWeekKey()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#29282B]">Calendrier Semaines A/B</h1>
            <p className="text-[#29282B]/60">Année scolaire {schoolYear}/{schoolYear + 1}</p>
          </div>
        </div>
        
        {/* Navigation années */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSchoolYear(schoolYear - 1)}
            className="border-[#D9DADC]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-[#29282B] min-w-[100px] text-center">
            {schoolYear}/{schoolYear + 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSchoolYear(schoolYear + 1)}
            className="border-[#D9DADC]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-500" />
          <span className="text-sm text-[#29282B]">Semaine A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-500" />
          <span className="text-sm text-[#29282B]">Semaine B</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F5F5F6] border border-[#D9DADC]" />
          <span className="text-sm text-[#29282B]">Non configurée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-[#E7A541]" />
          <span className="text-sm text-[#29282B]">Semaine actuelle</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border-[#D9DADC]">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-[#29282B]/60">Chargement...</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {Array.from(weeksByMonth.entries()).map(([monthKey, monthWeeks]) => {
                const [year, month] = monthKey.split("-").map(Number)
                return (
                  <div key={monthKey} className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#29282B]">
                      {MONTHS_FR[month]} {year}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {monthWeeks.map((week) => {
                        const weekKey = `${week.year}-${week.weekNumber}`
                        const weekType = weekTypes.get(weekKey)
                        const isCurrentWeek = weekKey === currentWeekKey
                        
                        return (
                          <button
                            key={weekKey}
                            onClick={() => handleWeekClick(week.weekNumber, week.year)}
                            className={cn(
                              "w-8 h-8 rounded text-xs font-medium transition-all flex items-center justify-center",
                              weekType === "A" && "bg-green-500 text-white hover:bg-green-600",
                              weekType === "B" && "bg-red-500 text-white hover:bg-red-600",
                              !weekType && "bg-[#F5F5F6] text-[#29282B]/60 hover:bg-[#E5E5E7]",
                              isCurrentWeek && "ring-2 ring-[#E7A541] ring-offset-1"
                            )}
                            title={`Semaine ${week.weekNumber} - Du ${week.startDate.toLocaleDateString("fr-FR")} au ${week.endDate.toLocaleDateString("fr-FR")}`}
                          >
                            {week.weekNumber}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#29282B]">
              <AlertTriangle className="h-5 w-5 text-[#E7A541]" />
              Modifier le calendrier
            </DialogTitle>
            <DialogDescription>
              Cette action va définir la semaine {selectedWeek?.weekNumber} comme semaine{" "}
              <Badge className={cn(
                pendingWeekType === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {pendingWeekType}
              </Badge>{" "}
              et auto-compléter le reste du calendrier en alternance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[#29282B]">Code de confirmation</Label>
              <p className="text-sm text-[#29282B]/60 mb-2">
                Entrez le code suivant pour confirmer : <span className="font-mono font-bold">{expectedCode}</span>
              </p>
              <Input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                placeholder="Entrez le code"
                className="border-[#D9DADC] font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="border-[#D9DADC]">
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmChange}
              disabled={confirmCode !== expectedCode}
              className="bg-[#E7A541] hover:bg-[#D4933A] text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
