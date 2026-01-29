"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Upload, FileSpreadsheet } from "lucide-react"
import { createUser } from "@/lib/user-management"

interface ImportTeachersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  establishmentId: string
  availableClasses: Array<{ id: string; name: string }>
  onImportComplete: () => void
}

type ColumnMapping = {
  [key: string]: "first_name" | "last_name" | "email" | "subject" | "classes" | "ignore"
}

export function ImportTeachersDialog({
  open,
  onOpenChange,
  establishmentId,
  availableClasses,
  onImportComplete,
}: ImportTeachersDialogProps) {
  const [pastedData, setPastedData] = useState("")
  const [parsedData, setParsedData] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [step, setStep] = useState<"paste" | "map" | "preview">("paste")
  const [isImporting, setIsImporting] = useState(false)

  const handleParse = () => {
    if (!pastedData.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller des données",
        variant: "destructive",
      })
      return
    }

    const lines = pastedData.trim().split("\n")
    const parsed = lines.map((line) => {
      if (line.includes("\t")) return line.split("\t")
      if (line.includes(";")) return line.split(";")
      return line.split(",")
    })

    setParsedData(parsed)

    const initialMapping: ColumnMapping = {}
    parsed[0].forEach((_, index) => {
      initialMapping[`col${index}`] = "ignore"
    })
    setColumnMapping(initialMapping)

    setStep("map")
  }

  const handleImport = async () => {
    setIsImporting(true)

    try {
      const headers = parsedData[0]
      const rows = parsedData.slice(1)

      let successCount = 0
      let errorCount = 0

      for (const row of rows) {
        try {
          const teacherData: any = {
            establishment_id: establishmentId,
            role: "professeur",
          }

          headers.forEach((_, index) => {
            const mapping = columnMapping[`col${index}`]
            const value = row[index]?.trim()

            if (mapping !== "ignore" && value) {
              if (mapping === "classes") {
                const classNames = value
                  .split(/[,;]/)
                  .map((c) =>
                    c
                      .trim()
                      .replace(/ème|eme|ère|ere/gi, "")
                      .replace(/\s+/g, ""),
                  )
                  .filter(Boolean)

                console.log("[v0] Parsed class names:", classNames)
                console.log(
                  "[v0] Available classes:",
                  availableClasses.map((c) => c.name),
                )

                const classIds = classNames
                  .map((inputName) => {
                    const normalizedInput = inputName.toLowerCase()
                    return availableClasses.find((c) => {
                      const normalizedAvailable = c.name
                        .replace(/ème|eme|ère|ere/gi, "")
                        .replace(/\s+/g, "")
                        .toLowerCase()
                      return normalizedAvailable === normalizedInput
                    })?.id
                  })
                  .filter(Boolean)

                console.log("[v0] Matched class IDs:", classIds)
                teacherData.class_ids = classIds
              } else {
                teacherData[mapping] = value
              }
            }
          })

          if (!teacherData.first_name || !teacherData.last_name) {
            console.log("[v0] Skipping row - missing required fields:", row)
            errorCount++
            continue
          }

          await createUser(teacherData)
          successCount++
        } catch (error) {
          console.error("[v0] Error importing teacher:", error)
          errorCount++
        }
      }

      toast({
        title: "Importation terminée",
        description: `${successCount} professeur(s) importé(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      })

      onImportComplete()
      onOpenChange(false)
      resetDialog()
    } catch (error) {
      console.error("[v0] Import error:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'importation",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const resetDialog = () => {
    setPastedData("")
    setParsedData([])
    setColumnMapping({})
    setStep("paste")
  }

  const canProceedToPreview = () => {
    const mappings = Object.values(columnMapping)
    return mappings.includes("first_name") && mappings.includes("last_name")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <FileSpreadsheet className="inline mr-2 h-5 w-5" />
            Importer des professeurs
          </DialogTitle>
          <DialogDescription>
            Étape {step === "paste" ? "1" : step === "map" ? "2" : "3"} sur 3 -{" "}
            {step === "paste"
              ? "Collez vos données"
              : step === "map"
                ? "Associez les colonnes"
                : "Vérifiez et importez"}
          </DialogDescription>
        </DialogHeader>

        {step === "paste" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="data">Collez vos données (CSV, Excel, etc.)</Label>
              <Textarea
                id="data"
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Prénom&#9;Nom&#9;Email&#9;Matière&#9;Classes&#10;Marie&#9;Martin&#9;marie@example.com&#9;Mathématiques&#9;6ème A, 5ème B"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Formats acceptés : CSV (virgule), TSV (tabulation), ou point-virgule
              </p>
            </div>
          </div>
        )}

        {step === "map" && parsedData.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Associez chaque colonne à un champ. Les champs Prénom et Nom sont obligatoires.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Colonne</TableHead>
                    <TableHead>Aperçu des données</TableHead>
                    <TableHead className="w-[200px]">Associer à</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData[0].map((header, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">Col {index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {parsedData.slice(0, 3).map((row, i) => (
                          <div key={i} className="truncate">
                            {row[index]}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={columnMapping[`col${index}`]}
                          onValueChange={(value) =>
                            setColumnMapping({ ...columnMapping, [`col${index}`]: value as any })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">Ignorer</SelectItem>
                            <SelectItem value="first_name">Prénom</SelectItem>
                            <SelectItem value="last_name">Nom</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="subject">Matière</SelectItem>
                            <SelectItem value="classes">Classes (séparées par virgule)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {parsedData.length - 1} professeur(s) seront importé(s). Vérifiez les données avant de continuer.
            </p>
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead>Classes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(1).map((row, rowIndex) => {
                    const mappedRow: any = {}
                    parsedData[0].forEach((_, colIndex) => {
                      const mapping = columnMapping[`col${colIndex}`]
                      if (mapping !== "ignore") {
                        mappedRow[mapping] = row[colIndex]
                      }
                    })

                    return (
                      <TableRow key={rowIndex}>
                        <TableCell>{mappedRow.first_name || "-"}</TableCell>
                        <TableCell>{mappedRow.last_name || "-"}</TableCell>
                        <TableCell>{mappedRow.email || "-"}</TableCell>
                        <TableCell>{mappedRow.subject || "-"}</TableCell>
                        <TableCell>{mappedRow.classes || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "paste" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleParse}>
                Suivant
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("paste")}>
                Retour
              </Button>
              <Button onClick={() => setStep("preview")} disabled={!canProceedToPreview()}>
                Aperçu
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("map")}>
                Retour
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? "Importation..." : `Importer ${parsedData.length - 1} professeur(s)`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
