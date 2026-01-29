"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentList } from "@/components/student-list"
import { RoomCreator } from "@/components/room-creator"
import { ClassPlans } from "@/components/class-plans"
import { ArrowLeft } from "lucide-react"
import { ClassRecap } from "@/components/class-recap"

interface ClassManagerProps {
  classCode: string
  userType: string
  onBack: () => void
}

interface ClassData {
  name: string
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

export function ClassManager({ classCode, userType, onBack }: ClassManagerProps) {
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [activeTab, setActiveTab] = useState("liste")

  useEffect(() => {
    // Charger les données de la classe
    const classes = JSON.parse(localStorage.getItem("classes") || "{}")
    if (classes[classCode]) {
      setClassData(classes[classCode])
    }
  }, [classCode])

  const updateClassData = (newData: ClassData) => {
    setClassData(newData)

    // Mettre à jour les données dans localStorage
    const classes = JSON.parse(localStorage.getItem("classes") || "{}")
    classes[classCode] = newData
    localStorage.setItem("classes", JSON.stringify(classes))
  }

  if (!classData) {
    return <div>Chargement des données de la classe...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">{classData.name}</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="liste">Liste des élèves</TabsTrigger>
          <TabsTrigger value="salles">Salles</TabsTrigger>
          <TabsTrigger value="plans">Plans de classe</TabsTrigger>
          <TabsTrigger value="recap">Récapitulatif</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="mt-4">
          <StudentList
            students={classData.students}
            onStudentsChange={(students) => {
              updateClassData({
                ...classData,
                students,
              })
            }}
          />
        </TabsContent>

        <TabsContent value="salles" className="mt-4">
          <RoomCreator
            rooms={classData.rooms}
            onRoomsChange={(rooms) => {
              updateClassData({
                ...classData,
                rooms,
              })
            }}
          />
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <ClassPlans
            classCode={classCode}
            className={classData.name}
            students={classData.students}
            rooms={classData.rooms}
          />
        </TabsContent>

        <TabsContent value="recap" className="mt-4">
          <ClassRecap classData={classData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
