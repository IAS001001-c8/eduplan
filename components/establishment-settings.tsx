"use client"

import { useState, useEffect } from "react"
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
import { ArrowLeft, Building2, Calendar, Globe, Copy, Check, UserCog, Plus, Trash2, GripVertical } from "lucide-react"
import { WeekABCalendar } from "@/components/week-ab-calendar"

interface EstablishmentSettingsProps {
  establishmentId: string
  onBack: () => void
}

interface EstablishmentData {
  id: string
  name: string
  code: string
}

interface SettingsData {
  id?: string
  timezone: string
  school_year_start_month: number
}

interface SpecialNeedOption {
  id: string
  code: string
  label: string
  description?: string
  is_default: boolean
}

const TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Europe/Brussels", label: "Bruxelles (GMT+1)" },
  { value: "Europe/Zurich", label: "Zurich (GMT+1)" },
  { value: "America/Martinique", label: "Martinique (GMT-4)" },
  { value: "America/Guadeloupe", label: "Guadeloupe (GMT-4)" },
  { value: "Indian/Reunion", label: "La Réunion (GMT+4)" },
  { value: "Pacific/Noumea", label: "Nouvelle-Calédonie (GMT+11)" },
]

export function EstablishmentSettings({ establishmentId, onBack }: EstablishmentSettingsProps) {
  const [establishment, setEstablishment] = useState<EstablishmentData | null>(null)
  const [settings, setSettings] = useState<SettingsData>({
    timezone: "Europe/Paris",
    school_year_start_month: 8,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  
  // États pour la gestion EBP
  const [specialNeeds, setSpecialNeeds] = useState<SpecialNeedOption[]>([])
  const [showAddEBP, setShowAddEBP] = useState(false)
  const [newEBP, setNewEBP] = useState({ code: "", label: "", description: "" })
  const [isSavingEBP, setIsSavingEBP] = useState(false)

  useEffect(() => {
    fetchData()
  }, [establishmentId])

  const fetchData = async () => {
    const supabase = createClient()

    try {
      // Fetch establishment
      const { data: estData, error: estError } = await supabase
        .from("establishments")
        .select("id, name, code")
        .eq("id", establishmentId)
        .single()

      if (estError) throw estError
      setEstablishment(estData)

      // Fetch settings
      const { data: settingsData } = await supabase
        .from("establishment_settings")
        .select("*")
        .eq("establishment_id", establishmentId)
        .maybeSingle()

      if (settingsData) {
        setSettings({
          id: settingsData.id,
          timezone: settingsData.timezone || "Europe/Paris",
          school_year_start_month: settingsData.school_year_start_month || 8,
        })
      }
      
      // Fetch EBP characteristics
      const { data: ebpData, error: ebpError } = await supabase
        .from("establishment_special_needs")
        .select("*")
        .eq("establishment_id", establishmentId)
        .order("is_default", { ascending: false })
        .order("label")
      
      if (!ebpError && ebpData) {
        setSpecialNeeds(ebpData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      if (settings.id) {
        // Update
        const { error } = await supabase
          .from("establishment_settings")
          .update({
            timezone: settings.timezone,
            school_year_start_month: settings.school_year_start_month,
          })
          .eq("id", settings.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from("establishment_settings")
          .insert({
            establishment_id: establishmentId,
            timezone: settings.timezone,
            school_year_start_month: settings.school_year_start_month,
          })

        if (error) throw error
      }

      toast({
        title: "Succès",
        description: "Paramètres enregistrés",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyCode = () => {
    if (establishment?.code) {
      navigator.clipboard.writeText(establishment.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Fonctions EBP
  const handleAddEBP = async () => {
    if (!newEBP.code.trim() || !newEBP.label.trim()) {
      toast({
        title: "Erreur",
        description: "Le code et le libellé sont obligatoires",
        variant: "destructive",
      })
      return
    }
    
    // Vérifier si le code existe déjà
    if (specialNeeds.some(sn => sn.code.toLowerCase() === newEBP.code.toLowerCase())) {
      toast({
        title: "Erreur",
        description: "Ce code existe déjà",
        variant: "destructive",
      })
      return
    }
    
    setIsSavingEBP(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from("establishment_special_needs")
        .insert({
          establishment_id: establishmentId,
          code: newEBP.code.toUpperCase(),
          label: newEBP.label,
          description: newEBP.description || null,
          is_default: false,
        })
        .select()
        .single()
      
      if (error) throw error
      
      setSpecialNeeds([...specialNeeds, data])
      setNewEBP({ code: "", label: "", description: "" })
      setShowAddEBP(false)
      toast({
        title: "Succès",
        description: "Caractéristique EBP ajoutée",
      })
    } catch (error) {
      console.error("Error adding EBP:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la caractéristique",
        variant: "destructive",
      })
    } finally {
      setIsSavingEBP(false)
    }
  }
  
  const handleDeleteEBP = async (ebp: SpecialNeedOption) => {
    if (ebp.is_default) {
      toast({
        title: "Action impossible",
        description: "Les caractéristiques par défaut ne peuvent pas être supprimées",
        variant: "destructive",
      })
      return
    }
    
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from("establishment_special_needs")
        .delete()
        .eq("id", ebp.id)
      
      if (error) throw error
      
      setSpecialNeeds(specialNeeds.filter(sn => sn.id !== ebp.id))
      toast({
        title: "Succès",
        description: "Caractéristique supprimée",
      })
    } catch (error) {
      console.error("Error deleting EBP:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la caractéristique",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#F5F5F6] rounded animate-pulse" />
        <div className="h-64 bg-[#F5F5F6] rounded animate-pulse" />
      </div>
    )
  }

  if (showCalendar) {
    return (
      <WeekABCalendar
        establishmentId={establishmentId}
        onBack={() => setShowCalendar(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#29282B]">Paramètres de l'établissement</h1>
          <p className="text-[#29282B]/60">Configurez les paramètres généraux</p>
        </div>
      </div>

      {/* Establishment Info */}
      <Card className="border-[#D9DADC]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FDF6E9]">
              <Building2 className="h-5 w-5 text-[#E7A541]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#29282B]">Informations</CardTitle>
              <CardDescription className="text-[#29282B]/60">Identité de l'établissement</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-[#29282B]/60">Nom de l'établissement</Label>
            <p className="text-lg font-medium text-[#29282B]">{establishment?.name}</p>
          </div>
          <div>
            <Label className="text-sm text-[#29282B]/60">Code établissement</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-[#F5F5F6] text-[#29282B] font-mono text-lg px-4 py-2 hover:bg-[#F5F5F6]">
                {establishment?.code}
              </Badge>
              <Button variant="outline" size="sm" onClick={copyCode} className="border-[#D9DADC]">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-[#29282B]/50 mt-1">
              Ce code est utilisé par les utilisateurs pour se connecter
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Settings */}
      <Card className="border-[#D9DADC]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FDF6E9]">
              <Globe className="h-5 w-5 text-[#E7A541]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#29282B]">Fuseau horaire</CardTitle>
              <CardDescription className="text-[#29282B]/60">Définit l'heure de référence pour les créneaux</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <Label htmlFor="timezone" className="text-[#29282B]">Fuseau horaire</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger className="border-[#D9DADC] mt-1">
                <SelectValue placeholder="Sélectionner un fuseau horaire" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving}
            className="bg-[#E7A541] hover:bg-[#D4933A] text-white"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      {/* Week A/B Calendar */}
      <Card className="border-[#D9DADC] cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCalendar(true)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FDF6E9]">
                <Calendar className="h-5 w-5 text-[#E7A541]" />
              </div>
              <div>
                <CardTitle className="text-lg text-[#29282B]">Semaines A/B</CardTitle>
                <CardDescription className="text-[#29282B]/60">Configurer l'alternance des semaines</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-200">A</Badge>
              <Badge className="bg-red-100 text-red-700 border-red-200">B</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#29282B]/60">
            Cliquez pour configurer le calendrier des semaines A et B pour l'année scolaire.
            Ce paramètre affecte l'affichage des plans de classe selon les créneaux horaires.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
