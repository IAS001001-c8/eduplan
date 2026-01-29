"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { X } from "lucide-react"

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

export function SeatSelectionContent() {
  const searchParams = useSearchParams()
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [students, setStudents] = useState<string[]>([])
  const [seatAssignments, setSeatAssignments] = useState<Record<string, string>>({})
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les données initiales
  useEffect(() => {
    try {
      // Récupérer et décoder les données de l'URL
      const dataParam = searchParams?.get("d") || searchParams?.get("data")
      if (!dataParam) {
        setError("Lien invalide. Aucune donnée trouvée.")
        setLoading(false)
        return
      }

      // Décoder les données
      let decodedData: ShareData
      try {
        // Essayer d'abord le nouveau format
        if (searchParams?.get("d")) {
          const decodedJson = decodeURIComponent(dataParam)
          const parsedData = JSON.parse(decodedJson)
          decodedData = {
            classCode: parsedData.c,
            className: parsedData.n,
            roomId: parsedData.r,
            roomName: parsedData.rn,
          }
        } else {
          // Ancien format (base64)
          const decodedParam = decodeURIComponent(dataParam)
          decodedData = JSON.parse(atob(decodedParam))
        }
      } catch (e) {
        console.error("Erreur de décodage:", e)
        setError("Format de lien invalide.")
        setLoading(false)
        return
      }

      setShareData(decodedData)

      // Charger les données de la classe
      try {
        const classesStr = localStorage.getItem("classes") || "{}"
        const classes = JSON.parse(classesStr)
        const classData = classes[decodedData.classCode]

        if (!classData) {
          setError("Classe introuvable.")
          setLoading(false)
          return
        }

        // Définir les étudiants
        setStudents(Array.isArray(classData.students) ? classData.students : [])

        // Trouver la salle correspondante
        const roomData = Array.isArray(classData.rooms)
          ? classData.rooms.find((r: Room) => r.id === decodedData.roomId)
          : null

        if (!roomData) {
          setError("Salle introuvable.")
          setLoading(false)
          return
        }

        setRoom(roomData)

        // Charger les attributions de places
        try {
          const storageKey = `seatAssignments_${decodedData.classCode}`
          const savedAssignments = localStorage.getItem(storageKey)

          if (savedAssignments) {
            const allAssignments = JSON.parse(savedAssignments)
            if (allAssignments && typeof allAssignments === "object") {
              const roomAssignments = allAssignments[decodedData.roomId] || {}
              setSeatAssignments(roomAssignments)
            }
          }
        } catch (e) {
          console.error("Erreur lors du chargement des attributions:", e)
          setSeatAssignments({})
        }
      } catch (e) {
        console.error("Erreur lors du chargement des données de classe:", e)
        setError("Impossible de charger les données de classe.")
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

  // Fonction pour gérer le clic sur un siège
  const handleSeatClick = (seatId: string) => {
    if (!selectedStudent) {
      toast({
        title: "Aucun élève sélectionné",
        description: "Veuillez d'abord sélectionner votre nom",
        variant: "destructive",
      })
      return
    }

    if (!shareData) return

    // Vérifier si la place est déjà prise par un autre élève
    if (seatAssignments[seatId] && seatAssignments[seatId] !== selectedStudent) {
      toast({
        title: "Place déjà prise",
        description: `Cette place est déjà prise par ${seatAssignments[seatId]}`,
        variant: "destructive",
      })
      return
    }

    // Créer une copie des attributions actuelles
    const newAssignments = { ...seatAssignments }

    // Trouver si l'élève a déjà une place
    Object.keys(newAssignments).forEach((seat) => {
      if (newAssignments[seat] === selectedStudent) {
        delete newAssignments[seat]
      }
    })

    // Assigner la nouvelle place
    newAssignments[seatId] = selectedStudent

    // Mettre à jour l'état
    setSeatAssignments(newAssignments)
    setSelectedSeat(seatId)

    // Sauvegarder dans localStorage
    try {
      const storageKey = `seatAssignments_${shareData.classCode}`
      let allAssignments = {}

      try {
        const savedData = localStorage.getItem(storageKey)
        if (savedData) {
          allAssignments = JSON.parse(savedData)
        }
      } catch (e) {
        console.error("Erreur lors de la lecture du localStorage:", e)
      }

      // S'assurer que l'objet pour cette salle existe
      if (!allAssignments[shareData.roomId]) {
        allAssignments[shareData.roomId] = {}
      }

      // Mettre à jour les attributions pour cette salle
      allAssignments[shareData.roomId] = {
        ...allAssignments[shareData.roomId],
        ...newAssignments,
      }

      localStorage.setItem(storageKey, JSON.stringify(allAssignments))

      toast({
        title: "Place sélectionnée",
        description: `Vous avez choisi la place ${seatId}`,
      })
    } catch (e) {
      console.error("Erreur lors de la sauvegarde dans localStorage:", e)
      toast({
        title: "Avertissement",
        description: "La place a été sélectionnée mais n'a pas pu être sauvegardée localement",
        variant: "destructive",
      })
    }
  }

  // Fonction pour supprimer un élève d'un siège
  const handleRemoveSeat = (seatId: string, event: React.MouseEvent) => {
    // Empêcher la propagation pour éviter que le clic ne soit capturé par le bouton parent
    event.stopPropagation()

    if (!shareData) return

    // Créer une copie des attributions actuelles
    const newAssignments = { ...seatAssignments }

    // Supprimer l'élève de cette place
    delete newAssignments[seatId]

    // Mettre à jour l'état
    setSeatAssignments(newAssignments)
    setSelectedSeat(null)

    // Mettre à jour localStorage
    try {
      const storageKey = `seatAssignments_${shareData.classCode}`
      let allAssignments = {}

      try {
        const savedData = localStorage.getItem(storageKey)
        if (savedData) {
          allAssignments = JSON.parse(savedData)
        }
      } catch (e) {
        console.error("Erreur lors de la lecture du localStorage:", e)
      }

      const updatedAssignments = {
        ...allAssignments,
        [shareData.roomId]: newAssignments,
      }

      localStorage.setItem(storageKey, JSON.stringify(updatedAssignments))

      toast({
        title: "Place libérée",
        description: "Vous avez libéré cette place",
      })
    } catch (e) {
      console.error("Erreur lors de la sauvegarde dans localStorage:", e)
    }
  }

  // Fonction pour valider la sélection
  const handleValidate = () => {
    if (!selectedSeat || !shareData) {
      toast({
        title: "Aucune place sélectionnée",
        description: "Veuillez sélectionner une place avant de valider",
        variant: "destructive",
      })
      return
    }

    // Sauvegarder dans localStorage
    try {
      const storageKey = `seatAssignments_${shareData.classCode}`
      let allAssignments = {}

      try {
        const savedData = localStorage.getItem(storageKey)
        if (savedData) {
          allAssignments = JSON.parse(savedData)
        }
      } catch (e) {
        console.error("Erreur lors de la lecture du localStorage:", e)
      }

      const updatedAssignments = {
        ...allAssignments,
        [shareData.roomId]: seatAssignments,
      }

      localStorage.setItem(storageKey, JSON.stringify(updatedAssignments))

      toast({
        title: "Sélection validée",
        description: `Votre place a été enregistrée`,
      })
    } catch (e) {
      console.error("Erreur lors de la sauvegarde dans localStorage:", e)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder votre sélection",
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
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Vérifier que les données nécessaires sont disponibles
  if (!shareData || !room) {
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

  // Rendu principal
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
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-2">Sélectionnez votre nom</h3>
              <Select
                value={selectedStudent}
                onValueChange={(value) => {
                  setSelectedStudent(value)

                  // Trouver si l'élève a déjà une place
                  let foundSeat = null
                  Object.entries(seatAssignments).forEach(([seat, student]) => {
                    if (student === value) {
                      foundSeat = seat
                    }
                  })
                  setSelectedSeat(foundSeat)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre nom" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student} value={student}>
                      {student}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && room?.columns && Array.isArray(room.columns) && (
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
                            const isOccupied = !!seatAssignments[seatId]
                            const isSelectedStudentSeat = isOccupied && seatAssignments[seatId] === selectedStudent
                            const isOccupiedByOther = isOccupied && seatAssignments[seatId] !== selectedStudent

                            return (
                              <div key={seatId} className="relative group flex-1">
                                <Button
                                  type="button"
                                  variant={
                                    isSelectedStudentSeat ? "default" : isOccupiedByOther ? "secondary" : "outline"
                                  }
                                  className={`h-12 w-full transition-colors ${
                                    isSelectedStudentSeat
                                      ? "bg-primary shadow-md"
                                      : isOccupiedByOther
                                        ? "bg-gray-200"
                                        : "hover:bg-gray-50"
                                  }`}
                                  onClick={() => handleSeatClick(seatId)}
                                  disabled={isOccupiedByOther}
                                >
                                  {isOccupied ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-medium">
                                        {seatAssignments[seatId].split(" ")[0]}
                                      </span>
                                      <span className="text-xs">
                                        {seatAssignments[seatId].split(" ")[1]?.[0] || ""}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Libre</span>
                                  )}
                                </Button>

                                {isSelectedStudentSeat && (
                                  <button
                                    type="button"
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => handleRemoveSeat(seatId, e)}
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
        <CardFooter>
          <Button type="button" className="w-full transition-colors" onClick={handleValidate} disabled={!selectedSeat}>
            Valider ma place
          </Button>
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  )
}
