"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeekABCalendarProps {
  establishmentId: string
  onBack: () => void
}

// Fonction pour obtenir le numéro de semaine ISO
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Générer les semaines d'une année scolaire (Août N à Juillet N+1)
function generateSchoolYearWeeks(startYear: number): Array<{
  weekNumber: number
  year: number
  startDate: Date
  endDate: Date
  month: number
  monthName: string
}> {
  const weeks: Array<{
    weekNumber: number
    year: number
    startDate: Date
    endDate: Date
    month: number
    monthName: string
  }> = []
  
  const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
  
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
      month: weekStart.getMonth(),
      monthName: MONTHS_FR[weekStart.getMonth()],
    })
    
    currentDate.setDate(currentDate.getDate() + 7)
  }
  
  return weeks
}

export function WeekABCalendar({ establishmentId, onBack }: WeekABCalendarProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  // Déterminer l'année scolaire actuelle
  const [schoolYear, setSchoolYear] = useState(() => {
    return currentMonth >= 7 ? currentYear : currentYear - 1
  })
  
  const [weekTypes, setWeekTypes] = useState<Map<string, "A" | "B">>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<{ weekNumber: number; year: number; startDate: Date; endDate: Date } | null>(null)
  const [confirmCode, setConfirmCode] = useState("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingWeekType, setPendingWeekType] = useState<"A" | "B">("A")
  const [expectedCode, setExpectedCode] = useState("")

  const weeks = useMemo(() => generateSchoolYearWeeks(schoolYear), [schoolYear])
  
  const currentWeekKey = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${getWeekNumber(now)}`
  }, [])

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

  const handleWeekClick = (week: typeof weeks[0]) => {
    setSelectedWeek({
      weekNumber: week.weekNumber,
      year: week.year,
      startDate: week.startDate,
      endDate: week.endDate
    })
    const currentType = weekTypes.get(`${week.year}-${week.weekNumber}`)
    setPendingWeekType(currentType === "A" ? "B" : "A")
    setConfirmCode("")
    setExpectedCode(Math.random().toString(36).substring(2, 8).toUpperCase())
    setIsConfirmOpen(true)
  }

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
      // Trouver l'index de la semaine sélectionnée
      const selectedIndex = weeks.findIndex(
        (w) => w.weekNumber === selectedWeek.weekNumber && w.year === selectedWeek.year
      )
      
      if (selectedIndex === -1) return

      const newWeekTypes = new Map(weekTypes)
      let currentType: "A" | "B" = pendingWeekType

      // Mettre à jour toutes les semaines à partir de la sélection
      const upsertPromises: Promise<unknown>[] = []
      
      for (let i = selectedIndex; i < weeks.length; i++) {
        const week = weeks[i]
        newWeekTypes.set(`${week.year}-${week.weekNumber}`, currentType)
        
        upsertPromises.push(
          supabase
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
        )
        
        currentType = currentType === "A" ? "B" : "A"
      }

      // Remplir aussi les semaines précédentes
      currentType = pendingWeekType === "A" ? "B" : "A"
      for (let i = selectedIndex - 1; i >= 0; i--) {
        const week = weeks[i]
        newWeekTypes.set(`${week.year}-${week.weekNumber}`, currentType)
        
        upsertPromises.push(
          supabase
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
        )
        
        currentType = currentType === "A" ? "B" : "A"
      }

      await Promise.all(upsertPromises)

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

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`
  }

  // Obtenir le type de semaine actuel
  const getCurrentWeekType = () => {
    return weekTypes.get(currentWeekKey)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#29282B]">Calendrier Semaines A/B</h1>
            <p className="text-[#29282B]/60">Année scolaire {schoolYear}/{schoolYear + 1}</p>
          </div>
        </div>
        
        {/* Navigation années */}
        <div className="flex items-center gap-2 bg-[#F5F5F6] rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSchoolYear(schoolYear - 1)}
            className="h-9 w-9 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-[#29282B] min-w-[120px] text-center">
            {schoolYear} - {schoolYear + 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSchoolYear(schoolYear + 1)}
            className="h-9 w-9 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info actuelle */}
      <Card className="border-[#E7A541] bg-[#FDF6E9]">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-[#E7A541]" />
            <div>
              <p className="font-medium text-[#29282B]">
                Semaine actuelle : {getCurrentWeekType() ? (
                  <Badge className={cn(
                    "ml-2",
                    getCurrentWeekType() === "A" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    Semaine {getCurrentWeekType()}
                  </Badge>
                ) : (
                  <span className="text-[#29282B]/60 ml-2">Non configurée</span>
                )}
              </p>
              <p className="text-sm text-[#29282B]/60">
                Cliquez sur une semaine pour définir sa catégorie. Le calendrier s'alternera automatiquement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="text-sm text-[#29282B]">Semaine A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm">B</div>
          <span className="text-sm text-[#29282B]">Semaine B</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F5F5F6] border-2 border-dashed border-[#D9DADC] flex items-center justify-center text-[#29282B]/40 font-bold text-sm">?</div>
          <span className="text-sm text-[#29282B]">Non configurée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border-3 border-[#E7A541] bg-[#FDF6E9]" />
          <span className="text-sm text-[#29282B]">Semaine actuelle</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border-[#D9DADC]">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-[#29282B]/60">Chargement du calendrier...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D9DADC]">
                    <th className="text-left p-2 text-sm font-medium text-[#29282B]/60 w-16">N°</th>
                    <th className="text-left p-2 text-sm font-medium text-[#29282B]/60">Période</th>
                    <th className="text-center p-2 text-sm font-medium text-[#29282B]/60 w-24">Type</th>
                    <th className="text-left p-2 text-sm font-medium text-[#29282B]/60 w-16">Mois</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, index) => {
                    const weekKey = `${week.year}-${week.weekNumber}`
                    const weekType = weekTypes.get(weekKey)
                    const isCurrentWeek = weekKey === currentWeekKey
                    
                    return (
                      <tr 
                        key={weekKey}
                        className={cn(
                          "border-b border-[#F5F5F6] hover:bg-[#F5F5F6] cursor-pointer transition-colors",
                          isCurrentWeek && "bg-[#FDF6E9] hover:bg-[#FDF6E9]"
                        )}
                        onClick={() => handleWeekClick(week)}
                      >
                        <td className="p-2">
                          <span className={cn(
                            "text-sm font-medium",
                            isCurrentWeek ? "text-[#E7A541]" : "text-[#29282B]/60"
                          )}>
                            S{week.weekNumber}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={cn(
                            "text-sm",
                            isCurrentWeek ? "font-medium text-[#29282B]" : "text-[#29282B]/80"
                          )}>
                            {formatDateRange(week.startDate, week.endDate)}
                          </span>
                          {isCurrentWeek && (
                            <Badge className="ml-2 bg-[#E7A541] text-white text-xs">Actuelle</Badge>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {weekType ? (
                            <Badge className={cn(
                              "w-12 justify-center font-bold",
                              weekType === "A" 
                                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            )}>
                              {weekType}
                            </Badge>
                          ) : (
                            <Badge className="w-12 justify-center bg-[#F5F5F6] text-[#29282B]/40 hover:bg-[#E5E5E7]">
                              —
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-[#29282B]/50 uppercase">{week.monthName}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#29282B]">
              <AlertTriangle className="h-5 w-5 text-[#E7A541]" />
              Modifier le calendrier A/B
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {selectedWeek && (
                <div className="bg-[#F5F5F6] rounded-lg p-3">
                  <p className="font-medium text-[#29282B]">
                    Semaine {selectedWeek.weekNumber}
                  </p>
                  <p className="text-sm text-[#29282B]/60">
                    Du {selectedWeek.startDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} au {selectedWeek.endDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              )}
              <p className="text-[#29282B]/80">
                Cette semaine sera définie comme{" "}
                <Badge className={cn(
                  "font-bold",
                  pendingWeekType === "A" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                )}>
                  Semaine {pendingWeekType}
                </Badge>
              </p>
              <p className="text-sm text-[#29282B]/60">
                ⚠️ Toutes les semaines de l'année scolaire seront recalculées en alternance à partir de cette semaine.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[#29282B]">Code de confirmation</Label>
              <p className="text-sm text-[#29282B]/60 mb-2">
                Saisissez : <code className="bg-[#F5F5F6] px-2 py-1 rounded font-mono font-bold text-[#E7A541]">{expectedCode}</code>
              </p>
              <Input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="border-[#D9DADC] font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="border-[#D9DADC]">
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmChange}
              disabled={confirmCode !== expectedCode}
              className={cn(
                "text-white",
                pendingWeekType === "A" 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-red-500 hover:bg-red-600"
              )}
            >
              Définir comme {pendingWeekType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
