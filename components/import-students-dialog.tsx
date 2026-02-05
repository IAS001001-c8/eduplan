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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { ArrowRight, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ImportStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  establishmentId: string
  availableClasses: Array<{ id: string; name: string }>
  onImportComplete: () => void
}

export function ImportStudentsDialog({
  open,
  onOpenChange,
  establishmentId,
  availableClasses,
  onImportComplete,
}: ImportStudentsDialogProps) {
  const [step, setStep] = useState(1)
  const [pastedData, setPastedData] = useState("")
  const [parsedData, setParsedData] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, number | null>>({
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    gender: null,
    lv2: null,
  })
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [importing, setImporting] = useState(false)
  const [hasHeaders, setHasHeaders] = useState(true)

  const handleParse = () => {
    if (!pastedData.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller des données",
        variant: "destructive",
      })
      return
    }

    try {
      const lines = pastedData.split(/\r?\n/).filter((line) => line.trim())
      const rows = lines.map((line) => line.split(/\t|,/).map((cell) => cell.trim()))


      if (rows.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucune donnée détectée",
          variant: "destructive",
        })
        return
      }

      setParsedData(rows)
      setStep(3)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de parser les données",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (
      !parsedData.length ||
      columnMapping.first_name === null ||
      columnMapping.last_name === null ||
      !selectedClassId
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez mapper au moins le prénom et nom, et sélectionner une classe",
        variant: "destructive",
      })
      return
    }

    setImporting(true)

    const supabase = createClient()

    const selectedClass = availableClasses.find((c) => c.id === selectedClassId)
    if (!selectedClass) {
      toast({
        title: "Erreur",
        description: "Classe introuvable",
        variant: "destructive",
      })
      setImporting(false)
      return
    }

    const dataRows = hasHeaders ? parsedData.slice(1) : parsedData
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []


    for (const row of dataRows) {
      try {
        const firstName = row[columnMapping.first_name!]
        const lastName = row[columnMapping.last_name!]
        const email = columnMapping.email !== null && columnMapping.email !== -1 ? row[columnMapping.email] : null
        const phone = columnMapping.phone !== null && columnMapping.phone !== -1 ? row[columnMapping.phone] : null
        const genderRaw = columnMapping.gender !== null && columnMapping.gender !== -1 ? row[columnMapping.gender]?.trim() : null
        const lv2Raw = columnMapping.lv2 !== null && columnMapping.lv2 !== -1 ? row[columnMapping.lv2]?.trim() : null
        
        // Convertir le genre en format numérique
        let gender: number | null = null
        if (genderRaw) {
          const genderStr = genderRaw.toUpperCase()
          if (genderStr === "1" || genderStr === "M" || genderStr === "H" || genderStr === "HOMME" || genderStr === "MASCULIN") gender = 1
          else if (genderStr === "2" || genderStr === "F" || genderStr === "FEMME" || genderStr === "FÉMININ" || genderStr === "FEMININ") gender = 2
          else if (genderStr === "3" || genderStr === "X" || genderStr === "NB" || genderStr === "NON IDENTIFIÉ" || genderStr === "AUTRE") gender = 3
        }
        
        // Normaliser la LV2 (première lettre majuscule)
        const lv2 = lv2Raw ? lv2Raw.charAt(0).toUpperCase() + lv2Raw.slice(1).toLowerCase() : null

        if (!firstName || !lastName) {
          errorCount++
          continue
        }


        const { data, error } = await supabase
          .from("students")
          .insert([
            {
              first_name: firstName,
              last_name: lastName,
              email,
              phone,
              gender,
              lv2,
              class_id: selectedClassId,
              class_name: selectedClass.name, // Added class_name
              role: "eleve",
              can_create_subrooms: false,
              establishment_id: establishmentId,
              profile_id: null,
            },
          ])
          .select()

        if (error) {
          errors.push(`${firstName} ${lastName}: ${error.message}`)
          errorCount++
        } else {
          successCount++
        }
      } catch (error) {
        errorCount++
      }
    }

    setImporting(false)

    if (errors.length > 0) {
    }

    toast({
      title: "Import terminé",
      description: `${successCount} élèves importés avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ""}`,
      variant: errorCount > 0 ? "destructive" : "default",
    })

    if (successCount > 0) {
      onImportComplete()
      handleClose()
    }
  }

  const handleClose = () => {
    setStep(1)
    setPastedData("")
    setParsedData([])
    setColumnMapping({
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      gender: null,
      lv2: null,
    })
    setSelectedClassId("")
    setHasHeaders(true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des élèves</DialogTitle>
          <DialogDescription>
            Étape {step}/4:{" "}
            {step === 1
              ? "Sélectionner la classe"
              : step === 2
                ? "Coller les données"
                : step === 3
                  ? "Mapper les colonnes"
                  : "Prévisualiser"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="class-select">Classe *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez une classe" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Tous les élèves importés seront assignés à cette classe.</p>
              <p className="mt-2">Les élèves seront créés sans accès à l'application (rôle "élève").</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep(2)} disabled={!selectedClassId}>
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="paste-data">Coller les données</Label>
              <Textarea
                id="paste-data"
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Collez vos données ici (depuis Excel, Google Sheets, etc.)"
                className="mt-2 min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-headers"
                checked={hasHeaders}
                onCheckedChange={(checked) => setHasHeaders(checked === true)}
              />
              <Label htmlFor="has-headers" className="text-sm font-normal cursor-pointer">
                Mon fichier comporte des entêtes
              </Label>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Instructions:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Copiez les données depuis Excel, Google Sheets ou un fichier CSV</li>
                <li>Les colonnes doivent être séparées par des tabulations ou des virgules</li>
                <li>Colonnes requises: Prénom, Nom</li>
                <li>Colonnes optionnelles: Email, Téléphone, Sexe, LV2</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button onClick={handleParse} disabled={!pastedData.trim()}>
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && parsedData.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Associez chaque colonne de votre fichier aux champs correspondants. Sélectionnez "Ignorer" pour les
              colonnes non utilisées.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom *</Label>
                <Select
                  value={columnMapping.first_name?.toString() ?? ""}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, first_name: value === "-1" ? null : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {(hasHeaders ? parsedData[0] : parsedData[0].map((_, i) => `Colonne ${i + 1}`)).map(
                      (header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nom *</Label>
                <Select
                  value={columnMapping.last_name?.toString() ?? ""}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, last_name: value === "-1" ? null : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {(hasHeaders ? parsedData[0] : parsedData[0].map((_, i) => `Colonne ${i + 1}`)).map(
                      (header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Email (optionnel)</Label>
                <Select
                  value={columnMapping.email?.toString() ?? "-1"}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, email: value === "-1" ? null : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Ignorer</SelectItem>
                    {(hasHeaders ? parsedData[0] : parsedData[0].map((_, i) => `Colonne ${i + 1}`)).map(
                      (header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Téléphone (optionnel)</Label>
                <Select
                  value={columnMapping.phone?.toString() ?? "-1"}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, phone: value === "-1" ? null : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Ignorer</SelectItem>
                    {(hasHeaders ? parsedData[0] : parsedData[0].map((_, i) => `Colonne ${i + 1}`)).map(
                      (header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sexe (optionnel)</Label>
                <Select
                  value={columnMapping.gender?.toString() ?? "-1"}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, gender: value === "-1" ? null : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Ignorer</SelectItem>
                    {(hasHeaders ? parsedData[0] : parsedData[0].map((_, i) => `Colonne ${i + 1}`)).map(
                      (header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Format: H/M/1 (Homme), F/2 (Femme), X/NB/3 (Non identifié)</p>
              </div>

              <div>
                <Label>LV2 (optionnel)</Label>
                <Select
                  value={columnMapping.lv2?.toString() ?? "-1"}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, lv2: value === "-1" ? null : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Ignorer</SelectItem>
                    {(hasHeaders ? parsedData[0] : parsedData[0].map((_, i) => `Colonne ${i + 1}`)).map(
                      (header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={columnMapping.first_name === null || columnMapping.last_name === null}
              >
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prévisualisation des {hasHeaders ? parsedData.length - 1 : parsedData.length} élèves à importer
            </p>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                Classe sélectionnée: {availableClasses.find((c) => c.id === selectedClassId)?.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Les élèves seront créés sans accès à l'application (rôle "élève")
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-3 py-2 border-b">
                <p className="text-sm font-medium">Aperçu des données à importer</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Prénom</th>
                    <th className="p-2 text-left font-medium">Nom</th>
                    {columnMapping.email !== null && columnMapping.email !== -1 && (
                      <th className="p-2 text-left font-medium">Email</th>
                    )}
                    {columnMapping.phone !== null && columnMapping.phone !== -1 && (
                      <th className="p-2 text-left font-medium">Téléphone</th>
                    )}
                    {columnMapping.gender !== null && columnMapping.gender !== -1 && (
                      <th className="p-2 text-left font-medium">Sexe</th>
                    )}
                    {columnMapping.lv2 !== null && columnMapping.lv2 !== -1 && (
                      <th className="p-2 text-left font-medium">LV2</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(hasHeaders ? parsedData.slice(1, 6) : parsedData.slice(0, 5)).map((row, index) => (
                    <tr key={index} className="border-t hover:bg-muted/30">
                      <td className="p-2">
                        {row[columnMapping.first_name!] || <span className="text-muted-foreground italic">Vide</span>}
                      </td>
                      <td className="p-2">
                        {row[columnMapping.last_name!] || <span className="text-muted-foreground italic">Vide</span>}
                      </td>
                      {columnMapping.email !== null && columnMapping.email !== -1 && (
                        <td className="p-2">
                          {row[columnMapping.email] || <span className="text-muted-foreground italic">-</span>}
                        </td>
                      )}
                      {columnMapping.phone !== null && columnMapping.phone !== -1 && (
                        <td className="p-2">
                          {row[columnMapping.phone] || <span className="text-muted-foreground italic">-</span>}
                        </td>
                      )}
                      {columnMapping.gender !== null && columnMapping.gender !== -1 && (
                        <td className="p-2">
                          {row[columnMapping.gender] || <span className="text-muted-foreground italic">-</span>}
                        </td>
                      )}
                      {columnMapping.lv2 !== null && columnMapping.lv2 !== -1 && (
                        <td className="p-2">
                          {row[columnMapping.lv2] || <span className="text-muted-foreground italic">-</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > (hasHeaders ? 6 : 5) && (
                <div className="bg-muted/30 px-3 py-2 border-t text-center text-sm text-muted-foreground">
                  ... et {hasHeaders ? parsedData.length - 6 : parsedData.length - 5} autres élèves
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(3)}>
                Retour
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>Importation en cours...</>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Importer {hasHeaders ? parsedData.length - 1 : parsedData.length} élèves
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
