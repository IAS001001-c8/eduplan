"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClassroomView } from "@/components/classroom-view"
import { ClassroomOverview } from "@/components/classroom-overview"
import { Share, Copy, Check, Dice5, SortAsc, FilePlus, Save, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

interface ClassPlansProps {
  classCode: string
  className: string
  students: string[]
  rooms: Room[]
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

interface SeatAssignment {
  [roomId: string]: {
    [seatId: string]: string // studentName
  }
}

export function ClassPlans({ classCode, className, students, rooms }: ClassPlansProps) {
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [seatAssignments, setSeatAssignments] = useState<SeatAssignment>({})
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<"normal" | "overview">("normal")
  const [alphabeticalDirection, setAlphabeticalDirection] = useState<"asc" | "desc">("asc")
  const [draggedStudent, setDraggedStudent] = useState<{ seatId: string; student: string } | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Charger les attributions de places depuis localStorage
  useEffect(() => {
    try {
      const savedAssignments = localStorage.getItem(`seatAssignments_${classCode}`)
      if (savedAssignments) {
        const parsed = JSON.parse(savedAssignments)
        if (parsed && typeof parsed === "object") {
          setSeatAssignments(parsed)
        }
      }
    } catch (e) {
      console.error("Erreur lors du chargement des attributions:", e)
    }

    // Définir la première salle comme active par défaut
    if (rooms.length > 0 && !activeRoom) {
      setActiveRoom(rooms[0].id)
    }
  }, [classCode, rooms, activeRoom])

  const handleSaveAssignments = () => {
    try {
      localStorage.setItem(`seatAssignments_${classCode}`, JSON.stringify(seatAssignments))
      toast({
        title: "Plan sauvegardé",
        description: "Les attributions de places ont été sauvegardées",
      })
      setUnsavedChanges(false)
    } catch (e) {
      console.error("Erreur lors de la sauvegarde:", e)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les attributions de places",
        variant: "destructive",
      })
    }
  }

  const handleSeatSelect = (roomId: string, seatId: string, studentName: string) => {
    setSeatAssignments((prev) => {
      // Créer une copie profonde pour éviter les mutations
      const newAssignments = JSON.parse(JSON.stringify(prev))

      // S'assurer que l'objet pour cette salle existe
      if (!newAssignments[roomId]) {
        newAssignments[roomId] = {}
      }

      // Vérifier si l'étudiant a déjà une place dans cette salle
      let studentCurrentSeat = null
      Object.entries(newAssignments[roomId]).forEach(([seat, student]) => {
        if (student === studentName) {
          studentCurrentSeat = seat
        }
      })

      // Si l'étudiant a déjà une place, la libérer
      if (studentCurrentSeat) {
        delete newAssignments[roomId][studentCurrentSeat]
      }

      // Assigner la nouvelle place
      newAssignments[roomId][seatId] = studentName

      setUnsavedChanges(true)
      return newAssignments
    })
  }

  const handleRemoveStudent = (roomId: string, seatId: string) => {
    setSeatAssignments((prev) => {
      // Créer une copie profonde pour éviter les mutations
      const newAssignments = JSON.parse(JSON.stringify(prev))

      // S'assurer que l'objet pour cette salle existe
      if (newAssignments[roomId]) {
        // Supprimer l'élève de cette place
        delete newAssignments[roomId][seatId]
      }

      setUnsavedChanges(true)
      return newAssignments
    })

    toast({
      title: "Élève retiré",
      description: "L'élève a été retiré de cette place",
    })
  }

  const handleClearRoom = (roomId: string) => {
    setSeatAssignments((prev) => {
      // Créer une copie profonde pour éviter les mutations
      const newAssignments = JSON.parse(JSON.stringify(prev))
      // Réinitialiser les attributions pour cette salle
      newAssignments[roomId] = {}

      setUnsavedChanges(true)
      return newAssignments
    })

    toast({
      title: "Plan réinitialisé",
      description: "Toutes les attributions de places ont été supprimées pour cette salle",
    })
  }

  const handleDragStart = (seatId: string, student: string) => {
    setDraggedStudent({ seatId, student })
  }

  const handleDrop = (roomId: string, targetSeatId: string) => {
    if (!draggedStudent) return

    setSeatAssignments((prev) => {
      // Créer une copie profonde pour éviter les mutations
      const newAssignments = JSON.parse(JSON.stringify(prev))

      // S'assurer que l'objet pour cette salle existe
      if (!newAssignments[roomId]) {
        newAssignments[roomId] = {}
      }

      // Si la place cible est occupée, on échange les places
      if (newAssignments[roomId][targetSeatId]) {
        const targetStudent = newAssignments[roomId][targetSeatId]
        newAssignments[roomId][draggedStudent.seatId] = targetStudent
      } else {
        // Sinon on libère l'ancienne place
        delete newAssignments[roomId][draggedStudent.seatId]
      }

      // On place l'élève à la nouvelle place
      newAssignments[roomId][targetSeatId] = draggedStudent.student

      setUnsavedChanges(true)
      return newAssignments
    })

    setDraggedStudent(null)
  }

  // Remplacer la fonction handleShareRoom par :

  const handleShareRoom = (roomId: string) => {
    if (!activeRoom) return

    const room = rooms.find((r) => r.id === roomId)
    if (!room) return

    try {
      // Créer un objet de données à partager plus simple
      const shareData = {
        c: classCode,
        n: className,
        r: roomId,
        rn: room.name,
      }

      // Encoder les données en JSON puis en URI
      const shareDataJson = JSON.stringify(shareData)
      const shareDataEncoded = encodeURIComponent(shareDataJson)

      // Créer l'URL complète
      const origin = window.location.origin || "http://localhost:3000"
      const link = `${origin}/seat-selection?d=${shareDataEncoded}`

      setShareLink(link)
      setShowShareDialog(true)
    } catch (e) {
      console.error("Erreur lors de la création du lien de partage:", e)
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien de partage",
        variant: "destructive",
      })
    }
  }

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)

      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papiers",
      })
    } catch (e) {
      console.error("Erreur lors de la copie du lien:", e)
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      })
    }
  }

  // Fonction pour placer aléatoirement les élèves
  const placeRandomly = (roomId: string) => {
    if (!activeRoom) return

    const room = rooms.find((r) => r.id === roomId)
    if (!room) return

    try {
      // Calculer toutes les places disponibles
      const allSeats: string[] = []
      room.columns.forEach((column) => {
        for (let tableIndex = 0; tableIndex < column.tables; tableIndex++) {
          for (let seatIndex = 0; seatIndex < column.seatsPerTable; seatIndex++) {
            const seatId = `${column.id}-t${tableIndex + 1}-s${seatIndex + 1}`
            allSeats.push(seatId)
          }
        }
      })

      // Mélanger les élèves
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5)

      // Mélanger les places
      const shuffledSeats = [...allSeats].sort(() => Math.random() - 0.5)

      // Assigner les places (autant que possible)
      const maxAssignments = Math.min(shuffledStudents.length, shuffledSeats.length)
      const newAssignments: Record<string, string> = {}

      for (let i = 0; i < maxAssignments; i++) {
        newAssignments[shuffledSeats[i]] = shuffledStudents[i]
      }

      // Mettre à jour les attributions
      setSeatAssignments((prev) => {
        const updated = JSON.parse(JSON.stringify(prev))
        updated[roomId] = newAssignments
        setUnsavedChanges(true)
        return updated
      })

      toast({
        title: "Placement aléatoire",
        description: `${maxAssignments} élèves ont été placés aléatoirement`,
      })
    } catch (e) {
      console.error("Erreur lors du placement aléatoire:", e)
      toast({
        title: "Erreur",
        description: "Impossible de placer les élèves aléatoirement",
        variant: "destructive",
      })
    }
  }

  // Fonction pour placer les élèves par ordre alphabétique
  const placeAlphabetically = (roomId: string) => {
    if (!activeRoom) return

    const room = rooms.find((r) => r.id === roomId)
    if (!room) return

    try {
      // Calculer toutes les places disponibles
      const allSeats: string[] = []
      room.columns.forEach((column) => {
        for (let tableIndex = 0; tableIndex < column.tables; tableIndex++) {
          for (let seatIndex = 0; seatIndex < column.seatsPerTable; seatIndex++) {
            const seatId = `${column.id}-t${tableIndex + 1}-s${seatIndex + 1}`
            allSeats.push(seatId)
          }
        }
      })

      // Trier les élèves par ordre alphabétique
      const sortedStudents = [...students].sort((a, b) => {
        if (alphabeticalDirection === "asc") {
          return a.localeCompare(b)
        } else {
          return b.localeCompare(a)
        }
      })

      // Inverser la direction pour le prochain clic
      setAlphabeticalDirection((prev) => (prev === "asc" ? "desc" : "asc"))

      // Assigner les places (autant que possible)
      const maxAssignments = Math.min(sortedStudents.length, allSeats.length)
      const newAssignments: Record<string, string> = {}

      for (let i = 0; i < maxAssignments; i++) {
        newAssignments[allSeats[i]] = sortedStudents[i]
      }

      // Mettre à jour les attributions
      setSeatAssignments((prev) => {
        const updated = JSON.parse(JSON.stringify(prev))
        updated[roomId] = newAssignments
        setUnsavedChanges(true)
        return updated
      })

      toast({
        title: "Placement alphabétique",
        description: `${maxAssignments} élèves ont été placés par ordre ${alphabeticalDirection === "asc" ? "alphabétique" : "alphabétique inversé"}`,
      })
    } catch (e) {
      console.error("Erreur lors du placement alphabétique:", e)
      toast({
        title: "Erreur",
        description: "Impossible de placer les élèves par ordre alphabétique",
        variant: "destructive",
      })
    }
  }

  // Fonction pour compléter le plan
  const completePlan = (roomId: string) => {
    if (!activeRoom) return

    const room = rooms.find((r) => r.id === roomId)
    if (!room) return

    try {
      // Récupérer les attributions actuelles
      const currentAssignments = seatAssignments[roomId] || {}

      // Identifier les élèves déjà placés
      const placedStudents = Object.values(currentAssignments)

      // Identifier les élèves non placés
      const unplacedStudents = students.filter((student) => !placedStudents.includes(student))

      if (unplacedStudents.length === 0) {
        toast({
          title: "Information",
          description: "Tous les élèves sont déjà placés",
        })
        return
      }

      // Calculer toutes les places disponibles
      const allSeats: string[] = []
      room.columns.forEach((column) => {
        for (let tableIndex = 0; tableIndex < column.tables; tableIndex++) {
          for (let seatIndex = 0; seatIndex < column.seatsPerTable; seatIndex++) {
            const seatId = `${column.id}-t${tableIndex + 1}-s${seatIndex + 1}`
            allSeats.push(seatId)
          }
        }
      })

      // Identifier les places libres
      const freeSeats = allSeats.filter((seat) => !Object.keys(currentAssignments).includes(seat))

      // Mélanger les élèves non placés
      const shuffledUnplacedStudents = [...unplacedStudents].sort(() => Math.random() - 0.5)

      // Mélanger les places libres
      const shuffledFreeSeats = [...freeSeats].sort(() => Math.random() - 0.5)

      // Assigner les places (autant que possible)
      const maxAssignments = Math.min(shuffledUnplacedStudents.length, shuffledFreeSeats.length)
      const newAssignments = { ...currentAssignments }

      for (let i = 0; i < maxAssignments; i++) {
        newAssignments[shuffledFreeSeats[i]] = shuffledUnplacedStudents[i]
      }

      // Mettre à jour les attributions
      setSeatAssignments((prev) => {
        const updated = JSON.parse(JSON.stringify(prev))
        updated[roomId] = newAssignments
        setUnsavedChanges(true)
        return updated
      })

      toast({
        title: "Plan complété",
        description: `${maxAssignments} élèves supplémentaires ont été placés`,
      })
    } catch (e) {
      console.error("Erreur lors de la complétion du plan:", e)
      toast({
        title: "Erreur",
        description: "Impossible de compléter le plan",
        variant: "destructive",
      })
    }
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plans de classe</CardTitle>
          <CardDescription>Aucune salle n'a été configurée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Veuillez d'abord créer des salles dans l'onglet "Salles"</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle>Plans de classe</CardTitle>
          <CardDescription>Gérez les plans de classe pour chaque salle</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeRoom || ""} onValueChange={setActiveRoom}>
            <TabsList className="mb-4 flex flex-wrap">
              {rooms.map((room) => (
                <TabsTrigger key={room.id} value={room.id} className="flex-grow">
                  {room.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Bouton Sauvegarder flottant et mis en évidence */}
            {unsavedChanges && (
              <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                <Button
                  onClick={handleSaveAssignments}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 shadow-lg flex items-center gap-2 px-6 py-6"
                >
                  <Save className="h-5 w-5" />
                  <span className="font-bold">Sauvegarder</span>
                </Button>
              </div>
            )}

            {rooms.map((room) => (
              <TabsContent key={room.id} value={room.id}>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-medium">{room.name}</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleShareRoom(room.id)}>
                        <Share className="mr-2 h-4 w-4" />
                        Partager
                      </Button>
                      <Button
                        variant={unsavedChanges ? "default" : "outline"}
                        onClick={handleSaveAssignments}
                        className={unsavedChanges ? "bg-green-600 hover:bg-green-700 border-green-600" : ""}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Sauvegarder
                      </Button>
                      <Button variant="outline" onClick={() => handleClearRoom(room.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Tout supprimer
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Mode d'affichage:</span>
                      <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(value) => value && setViewMode(value as "normal" | "overview")}
                      >
                        <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
                        <ToggleGroupItem value="overview">Vue générale</ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Placement facile:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => placeRandomly(room.id)}
                        className="flex items-center gap-1"
                      >
                        <Dice5 className="h-4 w-4" />
                        <span>Aléatoire</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => placeAlphabetically(room.id)}
                        className="flex items-center gap-1"
                      >
                        <SortAsc className="h-4 w-4" />
                        <span>Alphabétique</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => completePlan(room.id)}
                        className="flex items-center gap-1"
                      >
                        <FilePlus className="h-4 w-4" />
                        <span>Compléter</span>
                      </Button>
                    </div>
                  </div>

                  {viewMode === "normal" ? (
                    <ClassroomView
                      room={room}
                      students={students}
                      seatAssignments={seatAssignments[room.id] || {}}
                      onSeatSelect={(seatId, studentName) => handleSeatSelect(room.id, seatId, studentName)}
                      onRemoveStudent={(seatId) => handleRemoveStudent(room.id, seatId)}
                      onDragStart={handleDragStart}
                      onDrop={(targetSeatId) => handleDrop(room.id, targetSeatId)}
                    />
                  ) : (
                    <ClassroomOverview
                      room={room}
                      seatAssignments={seatAssignments[room.id] || {}}
                      onRemoveStudent={(seatId) => handleRemoveStudent(room.id, seatId)}
                    />
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>

        {/* Dialog pour partager le lien */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Partager le plan de classe</DialogTitle>
              <DialogDescription>
                Partagez ce lien avec les élèves pour qu'ils puissent choisir leur place
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopyLink} type="button">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowShareDialog(false)} type="button">
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </DndProvider>
  )
}
