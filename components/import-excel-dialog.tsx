"use client"

import { useState, useRef } from "react"
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
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, ArrowRight } from "lucide-react"

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
}

type ColumnMapping = {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
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
    phone: null
  })
  const [previewData, setPreviewData] = useState<ImportedStudent[]>([])
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep("upload")
    setFile(null)
    setHeaders([])
    setRawData([])
    setMapping({ first_name: null, last_name: null, email: null, phone: null })
    setPreviewData([])
    setDuplicates([])
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
          phone: null
        }

        headerRow.forEach((header, index) => {
          const headerLower = header.toLowerCase()
          if (headerLower.includes("prénom") || headerLower.includes("prenom") || headerLower === "firstname") {
            autoMapping.first_name = header
          } else if (headerLower.includes("nom") && !headerLower.includes("prénom") || headerLower === "lastname" || headerLower === "name") {
            autoMapping.last_name = header
          } else if (headerLower.includes("email") || headerLower.includes("mail") || headerLower.includes("courriel")) {
            autoMapping.email = header
          } else if (headerLower.includes("tel") || headerLower.includes("phone") || headerLower.includes("portable") || headerLower.includes("mobile")) {
            autoMapping.phone = header
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

  function handleMappingComplete() {
    if (!mapping.first_name || !mapping.last_name) {
      toast({
        title: "Mapping incomplet",
        description: "Les champs Prénom et Nom sont obligatoires",
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

      students.push({
        first_name: firstName,
        last_name: lastName,
        email: emailIndex >= 0 ? String(row[emailIndex] || "").trim() || undefined : undefined,
        phone: phoneIndex >= 0 ? String(row[phoneIndex] || "").trim() || undefined : undefined
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

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open) }}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Excel
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Sélectionnez un fichier Excel (.xlsx, .xls) ou CSV"}
            {step === "mapping" && "Associez les colonnes du fichier aux champs"}
            {step === "preview" && "Vérifiez les données avant l'import"}
          </DialogDescription>
        </DialogHeader>

        {/* Étapes */}
        <div className="flex items-center justify-center gap-2 py-4">
          {["upload", "mapping", "preview"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? "bg-emerald-600 text-white" : 
                ["mapping", "preview"].indexOf(step) > i ? "bg-emerald-100 text-emerald-700" : 
                "bg-slate-100 text-slate-400"
              }`}>
                {i + 1}
              </div>
              {i < 2 && <ArrowRight className="h-4 w-4 mx-2 text-slate-300" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-emerald-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium mb-1">Glissez votre fichier ici</p>
              <p className="text-sm text-muted-foreground mb-4">ou cliquez pour sélectionner</p>
              <p className="text-xs text-muted-foreground">Formats acceptés: .xlsx, .xls, .csv</p>
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
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium mb-2">Fichier: {file?.name}</p>
              <p className="text-xs text-muted-foreground">{rawData.length} ligne(s) détectée(s)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom <span className="text-red-500">*</span></Label>
                <Select value={mapping.first_name || ""} onValueChange={(v) => setMapping(m => ({ ...m, first_name: v }))}>
                  <SelectTrigger>
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
                <Label>Nom <span className="text-red-500">*</span></Label>
                <Select value={mapping.last_name || ""} onValueChange={(v) => setMapping(m => ({ ...m, last_name: v }))}>
                  <SelectTrigger>
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
                <Label>Email</Label>
                <Select value={mapping.email || ""} onValueChange={(v) => setMapping(m => ({ ...m, email: v || null }))}>
                  <SelectTrigger>
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
                <Label>Téléphone</Label>
                <Select value={mapping.phone || ""} onValueChange={(v) => setMapping(m => ({ ...m, phone: v || null }))}>
                  <SelectTrigger>
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

            <ScrollArea className="h-[300px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
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
                            <Badge variant="outline" className="text-amber-600">
                              <X className="h-3 w-3 mr-1" />
                              Doublon
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{student.first_name}</TableCell>
                        <TableCell>{student.last_name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.email || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{student.phone || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {previewData.length - duplicates.length} élève(s) à importer
              </span>
              <span className="text-emerald-600 font-medium">
                {duplicates.length > 0 && `${duplicates.length} ignoré(s)`}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== "upload" && (
            <Button variant="outline" onClick={() => setStep(step === "preview" ? "mapping" : "upload")}>
              Retour
            </Button>
          )}
          {step === "mapping" && (
            <Button onClick={handleMappingComplete} disabled={!mapping.first_name || !mapping.last_name}>
              Continuer
            </Button>
          )}
          {step === "preview" && (
            <Button onClick={handleImport} disabled={isLoading || previewData.length === duplicates.length}>
              {isLoading ? "Import en cours..." : `Importer ${previewData.length - duplicates.length} élève(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
