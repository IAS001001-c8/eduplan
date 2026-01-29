"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AlertCircle, Check, Info, X } from "lucide-react"

interface ShareData {
  classCode: string
  className: string
  roomId: string
  roomName: string
}

interface Room {
  id: string
  name: string
  columns: Column[]
}

interface Column {
  id: string
  tables: number
  seatsPerTable: number
}

export function PlanPartageContent() {
  const searchParams = useSearchParams()
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [seatAssignments, setSeatAssignments] = useState<Record<string, { student: string; placedBy: string }>>({})
  const [studentName, setStudentName] = useState("")
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"name" | "seat">("name")

  // Charger les données initiales
  useEffect(() => {
    if (!searchParams) return

    try {
      // Récupérer et décoder les données de l'URL
      const dataParam = searchParams.get("data")
      if (!dataParam) {
        setError("Lien invalide. Aucune donnée trouvée.")
        setLoading(false)
        return
      }

      // Décoder les données
      try {
        const decodedJson = atob(dataParam)
        const parsedData = JSON.parse(decodedJson)
        setShareData(parsedData)
      } catch (e) {
        console.error("Erreur de décodage:", e)
        setError("Format de lien invalide.")
        setLoading(false)
        return
      }

      setLoading(false)
    } catch (err) {
      console.error("Erreur générale:", err)
      setError("Une erreur s'est produite lors du chargement des données.")
      setLoading(false)
    }
  }, [searchParams])

  // Reste du code inchangé...

  // Charger les données de la classe et de la salle
  useEffect(() => {
    if (!shareData) return

    try {
      // Charger les données de la classe
      const classesStr = localStorage.getItem("classes") || "{}"
      const classes = JSON.parse(classesStr)
      const classData = classes[shareData.classCode]

      if (!classData) {
        setError("Classe introuvable.")
        return
      }

      // Trouver la salle correspondante
      const roomData = Array.isArray(classData.rooms)
        ? classData.rooms.find((r: Room) => r.id === shareData.roomId)
        : null

      if (!roomData) {
        setError("Salle introuvable.")
        return
      }

      setRoom(roomData)

      // Charger les attributions de places
      try {
        const storageKey = `seatAssignments_${shareData.classCode}_${shareData.roomId}`
        const savedAssignments = localStorage.getItem(storageKey)

        if (savedAssignments) {
          const parsedAssignments = JSON.parse(savedAssignments)
          setSeatAssignments(parsedAssignments)
        }
      } catch (e) {
        console.error("Erreur lors du chargement des attributions:", e)
        setSeatAssignments({})
      }
    } catch (e) {
      console.error("Erreur lors du chargement des données de classe:", e)
      setError("Impossible de charger les données de classe.")
    }
  }, [shareData])

  // Vérifier si l'élève a déjà une place
  useEffect(() => {
    if (step === "seat" && studentName && seatAssignments) {
      // Chercher si l'élève a déjà une place
      const studentSeat = Object.entries(seatAssignments).find(
        ([_, assignment]) => assignment.student.toLowerCase() === studentName.toLowerCase(),
      )

      if (studentSeat) {
        setSelectedSeat(studentSeat[0])
        toast({
          title: "Place trouvée",
          description: "Vous avez déjà une place assignée dans cette salle.",
        })
      }
    }
  }, [step, studentName, seatAssignments])

  const handleNameSubmit = () => {
    if (!studentName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre nom",
        variant: "destructive",
      })
      return
    }

    setStep("seat")
  }

  const handleSeatSelect = (seatId: string) => {
    if (!shareData) return

    // Vérifier si la place est déjà prise
    if (seatAssignments[seatId]) {
      // Si la place est prise par un admin, on ne peut pas la modifier
      if (seatAssignments[seatId].placedBy === "admin") {
        toast({
          title: "Place réservée",
          description: "Cette place a été assignée par un responsable et ne peut pas être modifiée.",
          variant: "destructive",
        })
        return
      }

      // Si la place est prise par l'élève actuel, on la désélectionne
      if (seatAssignments[seatId].student.toLowerCase() === studentName.toLowerCase()) {
        // Créer une copie des attributions actuelles
        const newAssignments = { ...seatAssignments }
        delete newAssignments[seatId]

        // Mettre à jour l'état
        setSeatAssignments(newAssignments)
        setSelectedSeat(null)

        // Sauvegarder dans localStorage
        saveAssignments(newAssignments)

        toast({
          title: "Place libérée",
          description: "Vous avez libéré cette place",
        })
        return
      }

      // Si la place est prise par un autre élève, on peut la remplacer
      toast({
        title: "Place occupée",
        description: `Cette place est actuellement occupée par ${seatAssignments[seatId].student}. Votre sélection remplacera cet élève.`,
      })
    }

    // Vérifier si l'élève a déjà une place
    const currentSeat = Object.entries(seatAssignments).find(
      ([_, assignment]) => assignment.student.toLowerCase() === studentName.toLowerCase(),
    )

    // Créer une copie des attributions actuelles
    const newAssignments = { ...seatAssignments }

    // Si l'élève a déjà une place, la libérer
    if (currentSeat) {
      delete newAssignments[currentSeat[0]]
    }

    // Assigner la nouvelle place
    newAssignments[seatId] = {
      student: studentName,
      placedBy: "student",
    }

    // Mettre à jour l'état
    setSeatAssignments(newAssignments)
    setSelectedSeat(seatId)

    // Sauvegarder dans localStorage
    saveAssignments(newAssignments)

    toast({
      title: "Place sélectionnée",
      description: `Vous avez choisi la place ${seatId}`,
    })
  }

  const saveAssignments = (assignments: Record<string, { student: string; placedBy: string }>) => {
    if (!shareData) return

    try {
      const storageKey = `seatAssignments_${shareData.classCode}_${shareData.roomId}`
      localStorage.setItem(storageKey, JSON.stringify(assignments))
    } catch (e) {
      console.error("Erreur lors de la sauvegarde dans localStorage:", e)
      toast({
        title: "Avertissement",
        description: "La place a été sélectionnée mais n'a pas pu être sauvegardée localement",
        variant: "destructive",
      })
    }
  }

  // Afficher un écran de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>Une erreur s'est produite</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold">Erreur</span>
          </div>
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Vérifier que les données nécessaires sont disponibles
  if (!shareData) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>Données invalides</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Le lien que vous avez utilisé est invalide ou a expiré.</p>
        </CardContent>
      </Card>
    )
  }

  // Étape 1: Saisie du nom
  if (step === "name") {
    return (
      <div className="container mx-auto max-w-md">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Plan de classe partagé</CardTitle>
            <CardDescription>
              Classe: {shareData.className} - Salle: {shareData.roomName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="studentName">Votre nom</Label>
              <Input
                id="studentName"
                placeholder="Prénom NOM"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleNameSubmit}>
              Continuer
            </Button>
          </CardFooter>
        </Card>
        <Toaster />
      </div>
    )
  }

  // Étape 2: Sélection de place
  return (
    <div className="container mx-auto max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sélection de place</CardTitle>
          <CardDescription>
            Classe: {shareData.className} - Salle: {shareData.roomName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Bonjour {studentName}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Sélectionnez une place disponible dans la salle.
                    {selectedSeat && (
                      <span className="block mt-2 font-semibold">Votre place actuelle: {selectedSeat}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {room && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {room.columns.map((column) => (
                  <div key={column.id} className="flex flex-col items-center gap-4">
                    {Array.from({ length: column.tables }).map((_, tableIndex) => (
                      <div
                        key={`${column.id}-table-${tableIndex}`}
                        className="w-full border-2 border-gray-300 rounded-md p-2 bg-gray-100"
                      >
                        <div className="text-xs text-center text-gray-500 mb-1">Table {tableIndex + 1}</div>
                        <div className="flex justify-between w-full">
                          {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => {
                            const seatId = `${column.id}-t${tableIndex + 1}-s${seatIndex + 1}`
                            const assignment = seatAssignments[seatId]
                            const isOccupied = !!assignment
                            const isOccupiedByAdmin = isOccupied && assignment.placedBy === "admin"
                            const isOccupiedByCurrentStudent =
                              isOccupied && assignment.student.toLowerCase() === studentName.toLowerCase()
                            const isOccupiedByOtherStudent =
                              isOccupied &&
                              assignment.student.toLowerCase() !== studentName.toLowerCase() &&
                              assignment.placedBy === "student"

                            return (
                              <div key={seatId} className="relative group flex-1">
                                <Button
                                  type="button"
                                  variant={
                                    isOccupiedByCurrentStudent
                                      ? "default"
                                      : isOccupiedByAdmin
                                        ? "secondary"
                                        : isOccupiedByOtherStudent
                                          ? "outline"
                                          : "outline"
                                  }
                                  className={`h-12 w-full transition-colors ${
                                    isOccupiedByCurrentStudent
                                      ? "bg-primary shadow-md"
                                      : isOccupiedByAdmin
                                        ? "bg-gray-200 cursor-not-allowed"
                                        : isOccupiedByOtherStudent
                                          ? "bg-amber-100 hover:bg-amber-200"
                                          : "hover:bg-green-100"
                                  }`}
                                  onClick={() => handleSeatSelect(seatId)}
                                  disabled={isOccupiedByAdmin}
                                >
                                  {isOccupied ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-medium">{assignment.student.split(" ")[0]}</span>
                                      <span className="text-xs">{assignment.student.split(" ")[1]?.[0] || ""}</span>
                                      {isOccupiedByAdmin && (
                                        <span className="text-[10px] mt-1 text-red-600">Réservé</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Libre</span>
                                  )}
                                </Button>

                                {isOccupiedByCurrentStudent && (
                                  <button
                                    type="button"
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleSeatSelect(seatId)}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("name")}>
            Changer de nom
          </Button>
          {selectedSeat && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span>Place sélectionnée</span>
            </div>
          )}
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  )
}
