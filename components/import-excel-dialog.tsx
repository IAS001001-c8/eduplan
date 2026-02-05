"use client"

import { useState, useRef, useEffect } from "react"
import * as XLSX from "xlsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, ArrowRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImportExcelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (students: ImportedStudent[]) => Promise<void>
  existingStudents?: { first_name: string; last_name: string }[]
}

export interface ImportedStudent {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  gender?: number // 1 = Homme, 2 = Femme, 3 = Non identifié
  lv2?: string // Langue Vivante 2
}

type ColumnMapping = {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  gender: string | null
  lv2: string | null
}

export function ImportExcelDialog({ 
  open, 
  onOpenChange, 
  onImport,
  existingStudents = []
}: ImportExcelDialogProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<any[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    gender: null,
    lv2: null
  })
  const [previewData, setPreviewData] = useState<ImportedStudent[]>([])
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false)
  const [disclaimerProgress, setDisclaimerProgress] = useState(0)
  const [isDisclaimerTimerActive, setIsDisclaimerTimerActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Timer pour le disclaimer (3 secondes)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isDisclaimerTimerActive && disclaimerProgress < 100) {
      interval = setInterval(() => {
        setDisclaimerProgress(prev => {
          const newProgress = prev + (100 / 30) // 30 steps over 3 seconds (100ms each)
          if (newProgress >= 100) {
            setHasReadDisclaimer(true)
            setIsDisclaimerTimerActive(false)
            return 100
          }
          return newProgress
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isDisclaimerTimerActive, disclaimerProgress])

  // Démarrer le timer quand on arrive sur l'étape mapping avec une colonne genre
  useEffect(() => {
    if (step === "mapping" && mapping.gender && !hasReadDisclaimer) {
      setIsDisclaimerTimerActive(true)
    }
  }, [step, mapping.gender])

  function reset() {
    setStep("upload")
    setFile(null)
    setHeaders([])
    setRawData([])
    setMapping({ first_name: null, last_name: null, email: null, phone: null, gender: null, lv2: null })
    setPreviewData([])
    setDuplicates([])
    setHasReadDisclaimer(false)
    setDisclaimerProgress(0)
    setIsDisclaimerTimerActive(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        if (jsonData.length < 2) {
          toast({
            title: "Fichier vide",
            description: "Le fichier ne contient pas de données",
            variant: "destructive"
          })
          return
        }

        const headerRow = (jsonData[0] as string[]).map(h => String(h || "").trim())
        const dataRows = jsonData.slice(1).filter((row: any) => row.length > 0)

        setHeaders(headerRow)
        setRawData(dataRows)

        // Auto-mapping intelligent
        const autoMapping: ColumnMapping = {
          first_name: null,
          last_name: null,
          email: null,
          phone: null,
          gender: null,
          lv2: null
        }

        headerRow.forEach((header) => {
          const headerLower = header.toLowerCase()
          if (headerLower.includes("prénom") || headerLower.includes("prenom") || headerLower === "firstname") {
            autoMapping.first_name = header
          } else if ((headerLower.includes("nom") && !headerLower.includes("prénom")) || headerLower === "lastname" || headerLower === "name") {
            autoMapping.last_name = header
          } else if (headerLower.includes("email") || headerLower.includes("mail") || headerLower.includes("courriel")) {
            autoMapping.email = header
          } else if (headerLower.includes("tel") || headerLower.includes("phone") || headerLower.includes("portable") || headerLower.includes("mobile")) {
            autoMapping.phone = header
          } else if (headerLower.includes("sexe") || headerLower.includes("genre") || headerLower === "gender" || headerLower === "sex") {
            autoMapping.gender = header
          } else if (headerLower.includes("lv2") || headerLower.includes("langue") || headerLower.includes("language")) {
            autoMapping.lv2 = header
          }
        })

        setMapping(autoMapping)
        setStep("mapping")
      } catch (error) {
        console.error("Error reading file:", error)
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier Excel",
          variant: "destructive"
        })
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  // Convertir les valeurs de genre en format numérique
  function parseGender(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined
    
    const strValue = String(value).trim().toUpperCase()
    
    // Format numérique
    if (strValue === "1" || strValue === "M" || strValue === "H" || strValue === "HOMME" || strValue === "MASCULIN") return 1
    if (strValue === "2" || strValue === "F" || strValue === "FEMME" || strValue === "FÉMININ" || strValue === "FEMININ") return 2
    if (strValue === "3" || strValue === "X" || strValue === "NB" || strValue === "NON IDENTIFIÉ" || strValue === "NON IDENTIFIE" || strValue === "AUTRE") return 3
    
    return undefined
  }

  function handleMappingComplete() {
    if (!mapping.first_name || !mapping.last_name) {
      toast({
        title: "Mapping incomplet",
        description: "Les champs Prénom et Nom sont obligatoires",
        variant: "destructive"
      })
      return
    }

    // Si une colonne genre est mappée et le disclaimer n'est pas lu
    if (mapping.gender && !hasReadDisclaimer) {
      toast({
        title: "Veuillez patienter",
        description: "Lisez les informations sur le format du sexe avant de continuer",
        variant: "destructive"
      })
      return
    }

    // Convertir les données avec le mapping
    const students: ImportedStudent[] = []
    const foundDuplicates: string[] = []

    rawData.forEach((row: any) => {
      const firstNameIndex = headers.indexOf(mapping.first_name!)
      const lastNameIndex = headers.indexOf(mapping.last_name!)
      const emailIndex = mapping.email ? headers.indexOf(mapping.email) : -1
      const phoneIndex = mapping.phone ? headers.indexOf(mapping.phone) : -1
      const genderIndex = mapping.gender ? headers.indexOf(mapping.gender) : -1
      const lv2Index = mapping.lv2 ? headers.indexOf(mapping.lv2) : -1

      const firstName = String(row[firstNameIndex] || "").trim()
      const lastName = String(row[lastNameIndex] || "").trim()

      if (!firstName || !lastName) return

      // Vérifier les doublons
      const fullName = `${firstName} ${lastName}`.toLowerCase()
      const existingDuplicate = existingStudents.find(
        s => `${s.first_name} ${s.last_name}`.toLowerCase() === fullName
      )
      if (existingDuplicate) {
        foundDuplicates.push(`${firstName} ${lastName}`)
      }

      // Normaliser la LV2 (première lettre majuscule)
      let lv2Value: string | undefined = undefined
      if (lv2Index >= 0 && row[lv2Index]) {
        const rawLv2 = String(row[lv2Index]).trim()
        if (rawLv2) {
          lv2Value = rawLv2.charAt(0).toUpperCase() + rawLv2.slice(1).toLowerCase()
        }
      }

      students.push({
        first_name: firstName,
        last_name: lastName,
        email: emailIndex >= 0 ? String(row[emailIndex] || "").trim() || undefined : undefined,
        phone: phoneIndex >= 0 ? String(row[phoneIndex] || "").trim() || undefined : undefined,
        gender: genderIndex >= 0 ? parseGender(row[genderIndex]) : undefined,
        lv2: lv2Value
      })
    })

    setPreviewData(students)
    setDuplicates(foundDuplicates)
    setStep("preview")
  }

  async function handleImport() {
    setIsLoading(true)
    try {
      // Filtrer les doublons
      const studentsToImport = previewData.filter(
        s => !duplicates.includes(`${s.first_name} ${s.last_name}`)
      )

      await onImport(studentsToImport)
      
      toast({
        title: "Import réussi",
        description: `${studentsToImport.length} élève(s) importé(s)`
      })
      
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher le genre en texte
  function getGenderLabel(gender?: number): string {
    switch (gender) {
      case 1: return "H"
      case 2: return "F"
      case 3: return "X"
      default: return "-"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open) }}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#29282B]">
            <FileSpreadsheet className="h-5 w-5 text-[#E7A541]" />
            Import Excel
          </DialogTitle>
          <DialogDescription className="text-[#29282B]/60">
            {step === "upload" && "Sélectionnez un fichier Excel (.xlsx, .xls) ou CSV"}
            {step === "mapping" && "Associez les colonnes du fichier aux champs"}
            {step === "preview" && "Vérifiez les données avant l'import"}
          </DialogDescription>
        </DialogHeader>

        {/* Étapes */}
        <div className="flex items-center justify-center gap-2 py-4">
          {["upload", "mapping", "preview"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s ? "bg-[#E7A541] text-white" : 
                ["mapping", "preview"].indexOf(step) > i ? "bg-[#E7A541]/20 text-[#E7A541]" : 
                "bg-[#F5F5F6] text-[#29282B]/40"
              )}>
                {i + 1}
              </div>
              {i < 2 && <ArrowRight className="h-4 w-4 mx-2 text-[#D9DADC]" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-[#D9DADC] rounded-lg p-12 text-center cursor-pointer hover:border-[#E7A541] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-[#D9DADC]" />
              <p className="text-lg font-medium text-[#29282B] mb-1">Glissez votre fichier ici</p>
              <p className="text-sm text-[#29282B]/60 mb-4">ou cliquez pour sélectionner</p>
              <p className="text-xs text-[#29282B]/40">Formats acceptés: .xlsx, .xls, .csv</p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="bg-[#F5F5F6] rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-[#29282B] mb-2">Fichier: {file?.name}</p>
              <p className="text-xs text-[#29282B]/60">{rawData.length} ligne(s) détectée(s)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#29282B]">Prénom <span className="text-red-500">*</span></Label>
                <Select value={mapping.first_name || ""} onValueChange={(v) => setMapping(m => ({ ...m, first_name: v }))}>
                  <SelectTrigger className="border-[#D9DADC]">
                    <SelectValue placeholder="Sélectionner la colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#29282B]">Nom <span className="text-red-500">*</span></Label>
                <Select value={mapping.last_name || ""} onValueChange={(v) => setMapping(m => ({ ...m, last_name: v }))}>
                  <SelectTrigger className="border-[#D9DADC]">
                    <SelectValue placeholder="Sélectionner la colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#29282B]">Email</Label>
                <Select value={mapping.email || ""} onValueChange={(v) => setMapping(m => ({ ...m, email: v || null }))}>
                  <SelectTrigger className="border-[#D9DADC]">
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non mappé</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#29282B]">Téléphone</Label>
                <Select value={mapping.phone || ""} onValueChange={(v) => setMapping(m => ({ ...m, phone: v || null }))}>
                  <SelectTrigger className="border-[#D9DADC]">
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non mappé</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-[#29282B]">Sexe</Label>
                <Select 
                  value={mapping.gender || ""} 
                  onValueChange={(v) => {
                    setMapping(m => ({ ...m, gender: v || null }))
                    if (v && !hasReadDisclaimer) {
                      setDisclaimerProgress(0)
                      setIsDisclaimerTimerActive(true)
                    }
                  }}
                >
                  <SelectTrigger className="border-[#D9DADC]">
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non mappé</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-[#29282B]">LV2 (Langue Vivante 2)</Label>
                <Select 
                  value={mapping.lv2 || ""} 
                  onValueChange={(v) => setMapping(m => ({ ...m, lv2: v || null }))}
                >
                  <SelectTrigger className="border-[#D9DADC]">
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non mappé</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Disclaimer pour le format du sexe */}
            {mapping.gender && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <p className="font-medium text-blue-900 text-sm">Format du champ "Sexe"</p>
                    <p className="text-xs text-blue-800">
                      Le sexe de l'élève doit respecter l'un des formats suivants :
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <div className="bg-white rounded px-2 py-1 text-center border border-blue-100">
                        <span className="font-bold text-blue-900">1</span>/<span className="font-bold">H</span>/<span className="font-bold">M</span>
                        <span className="text-blue-600 ml-1">= Homme</span>
                      </div>
                      <div className="bg-white rounded px-2 py-1 text-center border border-blue-100">
                        <span className="font-bold text-blue-900">2</span>/<span className="font-bold">F</span>
                        <span className="text-blue-600 ml-1">= Femme</span>
                      </div>
                      <div className="bg-white rounded px-2 py-1 text-center border border-blue-100">
                        <span className="font-bold text-blue-900">3</span>/<span className="font-bold">X</span>/<span className="font-bold">NB</span>
                        <span className="text-blue-600 ml-1">= Non identifié</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-blue-500">
                      Valeurs non reconnues ignorées. Utilisé pour le placement intelligent (mixité).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            {duplicates.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{duplicates.length} doublon(s) détecté(s)</span>
                </div>
                <p className="text-sm text-amber-600">Ces élèves existent déjà et ne seront pas importés</p>
              </div>
            )}

            <ScrollArea className="h-[300px] border border-[#D9DADC] rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Sexe</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((student, index) => {
                    const isDuplicate = duplicates.includes(`${student.first_name} ${student.last_name}`)
                    return (
                      <TableRow key={index} className={isDuplicate ? "opacity-50" : ""}>
                        <TableCell>
                          {isDuplicate ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <X className="h-3 w-3 mr-1" />
                              Doublon
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{student.first_name}</TableCell>
                        <TableCell>{student.last_name}</TableCell>
                        <TableCell>
                          {student.gender ? (
                            <Badge className={cn(
                              "text-xs",
                              student.gender === 1 ? "bg-blue-100 text-blue-700" :
                              student.gender === 2 ? "bg-pink-100 text-pink-700" :
                              "bg-gray-100 text-gray-700"
                            )}>
                              {getGenderLabel(student.gender)}
                            </Badge>
                          ) : (
                            <span className="text-[#29282B]/40">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[#29282B]/60">{student.email || "-"}</TableCell>
                        <TableCell className="text-[#29282B]/60">{student.phone || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center text-sm">
              <span className="text-[#29282B]/60">
                {previewData.length - duplicates.length} élève(s) à importer
              </span>
              <span className="text-[#E7A541] font-medium">
                {duplicates.length > 0 && `${duplicates.length} ignoré(s)`}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== "upload" && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step === "preview" ? "mapping" : "upload")}
              className="border-[#D9DADC]"
            >
              Retour
            </Button>
          )}
          {step === "mapping" && (
            <div className="relative">
              <Button 
                onClick={handleMappingComplete} 
                disabled={!mapping.first_name || !mapping.last_name || (mapping.gender && !hasReadDisclaimer)}
                className={cn(
                  "bg-[#E7A541] hover:bg-[#D4933A] text-white min-w-[140px] overflow-hidden",
                  mapping.gender && !hasReadDisclaimer && "opacity-80"
                )}
              >
                {mapping.gender && !hasReadDisclaimer ? (
                  <>
                    <span className="relative z-10">Veuillez lire...</span>
                    {/* Barre de progression qui remplit le bouton */}
                    <div 
                      className="absolute inset-0 bg-[#D4933A] transition-all duration-100"
                      style={{ width: `${disclaimerProgress}%` }}
                    />
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            </div>
          )}
          {step === "preview" && (
            <Button 
              onClick={handleImport} 
              disabled={isLoading || previewData.length === duplicates.length}
              className="bg-[#E7A541] hover:bg-[#D4933A] text-white"
            >
              {isLoading ? "Import en cours..." : `Importer ${previewData.length - duplicates.length} élève(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
