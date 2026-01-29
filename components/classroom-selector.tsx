"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Classroom } from "@/components/classroom"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Liste des élèves
const students = [
  "Rafael AHIPO",
  "Anaëlle BANTAS",
  "Charlotte BARRE RIBET",
  "Louis-Fernand BOISARD",
  "Daniela BUKASA NKONKO",
  "Valentine CAUDY",
  "Oriane CHAUVET",
  "Diane CHAUVIN",
  "Adrien COLAS",
  "Anaëlle COLAS",
  "Léa COURJEAULT",
  "Barthélemy D'AVOUT",
  "Estelle DUPONT",
  "Lucie FLIPO",
  "Eleanor FRANCOISE",
  "Clara FUNICA",
  "Francesca GODMAN",
  "Noémie GUELLER",
  "Marie HARTEL",
  "Inès LELIEVRE",
  "Axel LEMARDELE",
  "Jade MADELAINE",
  "Jade MARIE",
  "Anna MASSELIS",
  "Martin MAUBOUSSSIN",
  "Rayan MEGHARI",
  "Lénis MOHAMMEDI",
  "Olivia PETIT",
  "Jeanne POTET",
  "Louisa RIPOLL",
  "Léa RUAULT",
  "Lilou SCHWOB",
  "Noémie VALLEE",
  "Clément VARIN",
  "Margot VAUCELLE",
  "Arthur VAUGON",
  "Daphné VOYDIE",
]

// Configuration des salles
const classroomConfigs = {
  classroom1: {
    columns: [
      { id: "col1", tables: 5, seatsPerTable: 2 },
      { id: "col2", tables: 5, seatsPerTable: 2 },
      { id: "col3", tables: 4, seatsPerTable: 2 },
    ],
  },
  classroom2: {
    columns: [
      { id: "col1", tables: 8, seatsPerTable: 2 },
      { id: "col2", tables: 8, seatsPerTable: 2 },
      { id: "col3", tables: 8, seatsPerTable: 2 },
    ],
  },
}

export function ClassroomSelector() {
  const [selectedStudent, setSelectedStudent] = useState("")
  const [classroom1Seats, setClassroom1Seats] = useState<Record<string, string>>({})
  const [classroom2Seats, setClassroom2Seats] = useState<Record<string, string>>({})
  const [selectedSeat1, setSelectedSeat1] = useState<string | null>(null)
  const [selectedSeat2, setSelectedSeat2] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("classroom1")

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    const savedClassroom1 = localStorage.getItem("classroom1Seats")
    const savedClassroom2 = localStorage.getItem("classroom2Seats")

    if (savedClassroom1) {
      setClassroom1Seats(JSON.parse(savedClassroom1))
    }

    if (savedClassroom2) {
      setClassroom2Seats(JSON.parse(savedClassroom2))
    }
  }, [])

  // Sauvegarder les données quand elles changent
  useEffect(() => {
    localStorage.setItem("classroom1Seats", JSON.stringify(classroom1Seats))
  }, [classroom1Seats])

  useEffect(() => {
    localStorage.setItem("classroom2Seats", JSON.stringify(classroom2Seats))
  }, [classroom2Seats])

  // Trouver les places actuelles de l'élève sélectionné
  useEffect(() => {
    if (selectedStudent) {
      // Trouver la place dans la salle 1
      const seat1 = Object.entries(classroom1Seats).find(([_, student]) => student === selectedStudent)?.[0] || null
      setSelectedSeat1(seat1)

      // Trouver la place dans la salle 2
      const seat2 = Object.entries(classroom2Seats).find(([_, student]) => student === selectedStudent)?.[0] || null
      setSelectedSeat2(seat2)
    } else {
      setSelectedSeat1(null)
      setSelectedSeat2(null)
    }
  }, [selectedStudent, classroom1Seats, classroom2Seats])

  const handleSeatSelect = (seatId: string) => {
    if (!selectedStudent) {
      toast({
        title: "Aucun élève sélectionné",
        description: "Veuillez sélectionner un élève avant de choisir une place",
        variant: "destructive",
      })
      return
    }

    if (activeTab === "classroom1") {
      // Vérifier si la place est déjà prise par un autre élève
      if (classroom1Seats[seatId] && classroom1Seats[seatId] !== selectedStudent) {
        toast({
          title: "Place déjà prise",
          description: `Cette place est déjà prise par ${classroom1Seats[seatId]}`,
          variant: "destructive",
        })
        return
      }

      // Si l'élève a déjà une place dans cette salle, la libérer
      const newSeats = { ...classroom1Seats }

      // Supprimer toutes les places de cet élève dans la salle 1
      Object.entries(newSeats).forEach(([key, student]) => {
        if (student === selectedStudent) {
          delete newSeats[key]
        }
      })

      // Assigner la nouvelle place
      newSeats[seatId] = selectedStudent
      setClassroom1Seats(newSeats)
      setSelectedSeat1(seatId)

      toast({
        title: "Place sélectionnée",
        description: `Salle 1: Place ${seatId} sélectionnée pour ${selectedStudent}`,
      })
    } else {
      // Vérifier si la place est déjà prise par un autre élève
      if (classroom2Seats[seatId] && classroom2Seats[seatId] !== selectedStudent) {
        toast({
          title: "Place déjà prise",
          description: `Cette place est déjà prise par ${classroom2Seats[seatId]}`,
          variant: "destructive",
        })
        return
      }

      // Si l'élève a déjà une place dans cette salle, la libérer
      const newSeats = { ...classroom2Seats }

      // Supprimer toutes les places de cet élève dans la salle 2
      Object.entries(newSeats).forEach(([key, student]) => {
        if (student === selectedStudent) {
          delete newSeats[key]
        }
      })

      // Assigner la nouvelle place
      newSeats[seatId] = selectedStudent
      setClassroom2Seats(newSeats)
      setSelectedSeat2(seatId)

      toast({
        title: "Place sélectionnée",
        description: `Salle 2: Place ${seatId} sélectionnée pour ${selectedStudent}`,
      })
    }
  }

  const handleClearSelection = () => {
    if (!selectedStudent) return

    // Supprimer les places de l'élève sélectionné
    if (selectedSeat1) {
      const newSeats1 = { ...classroom1Seats }
      delete newSeats1[selectedSeat1]
      setClassroom1Seats(newSeats1)
      setSelectedSeat1(null)
    }

    if (selectedSeat2) {
      const newSeats2 = { ...classroom2Seats }
      delete newSeats2[selectedSeat2]
      setClassroom2Seats(newSeats2)
      setSelectedSeat2(null)
    }

    toast({
      title: "Sélections effacées",
      description: `Les places de ${selectedStudent} ont été libérées`,
    })
  }

  const handleValidate = () => {
    if (!selectedStudent) {
      toast({
        title: "Aucun élève sélectionné",
        description: "Veuillez sélectionner un élève avant de valider",
        variant: "destructive",
      })
      return
    }

    if (!selectedSeat1 || !selectedSeat2) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner une place dans chaque salle",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Sélection validée",
      description: `${selectedStudent} a choisi les places ${selectedSeat1} (Salle 1) et ${selectedSeat2} (Salle 2)`,
    })

    // Réinitialiser la sélection d'élève
    setSelectedStudent("")
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Sélection de l'élève</h2>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-full">
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

        {selectedStudent && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClearSelection}>
              Effacer mes sélections
            </Button>
            <Button className="flex-1" onClick={handleValidate}>
              Valider mes places
            </Button>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="classroom1">Salle 1</TabsTrigger>
              <TabsTrigger value="classroom2">Salle 2</TabsTrigger>
            </TabsList>
            <TabsContent value="classroom1" className="mt-4">
              <h3 className="text-lg font-medium mb-2">Salle 1</h3>
              <p className="text-sm text-gray-500 mb-4">
                3 colonnes: 2 colonnes de 5 tables (2 places) et 1 colonne de 4 tables (2 places)
              </p>
              <Classroom
                config={classroomConfigs.classroom1}
                seats={classroom1Seats}
                selectedSeat={selectedSeat1}
                onSeatSelect={handleSeatSelect}
                currentStudent={selectedStudent}
              />
            </TabsContent>
            <TabsContent value="classroom2" className="mt-4">
              <h3 className="text-lg font-medium mb-2">Salle 2</h3>
              <p className="text-sm text-gray-500 mb-4">3 colonnes de 8 tables (2 places chacune)</p>
              <Classroom
                config={classroomConfigs.classroom2}
                seats={classroom2Seats}
                selectedSeat={selectedSeat2}
                onSeatSelect={handleSeatSelect}
                currentStudent={selectedStudent}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
      <Toaster />
    </div>
  )
}
