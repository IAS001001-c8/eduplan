"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash, Edit, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface RoomCreatorProps {
  rooms: Room[]
  onRoomsChange: (rooms: Room[]) => void
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

export function RoomCreator({ rooms, onRoomsChange }: RoomCreatorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [columns, setColumns] = useState<Column[]>([
    { id: "col1", tables: 5, seatsPerTable: 2 },
    { id: "col2", tables: 5, seatsPerTable: 2 },
    { id: "col3", tables: 4, seatsPerTable: 2 },
  ])
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

  const handleAddColumn = () => {
    if (columns.length >= 10) {
      toast({
        title: "Limite atteinte",
        description: "Vous ne pouvez pas ajouter plus de 10 colonnes",
        variant: "destructive",
      })
      return
    }

    setColumns([...columns, { id: `col${columns.length + 1}`, tables: 5, seatsPerTable: 2 }])
  }

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) {
      toast({
        title: "Erreur",
        description: "Vous devez avoir au moins une colonne",
        variant: "destructive",
      })
      return
    }

    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleColumnChange = (index: number, field: keyof Column, value: number) => {
    const newColumns = [...columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setColumns(newColumns)
  }

  const calculateTotalSeats = () => {
    return columns.reduce((total, column) => {
      return total + column.tables * column.seatsPerTable
    }, 0)
  }

  const handleSaveRoom = () => {
    if (!roomName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la salle ne peut pas être vide",
        variant: "destructive",
      })
      return
    }

    const totalSeats = calculateTotalSeats()
    if (totalSeats > 200) {
      toast({
        title: "Erreur",
        description: "Le nombre total de places ne peut pas dépasser 200",
        variant: "destructive",
      })
      return
    }

    if (editingRoomId) {
      // Modification d'une salle existante
      const updatedRooms = rooms.map((room) =>
        room.id === editingRoomId ? { ...room, name: roomName, columns: [...columns] } : room,
      )
      onRoomsChange(updatedRooms)
      toast({
        title: "Salle modifiée",
        description: `La salle ${roomName} a été mise à jour`,
      })
    } else {
      // Création d'une nouvelle salle
      const newRoom: Room = {
        id: `room_${Date.now()}`,
        name: roomName,
        columns: [...columns],
      }
      onRoomsChange([...rooms, newRoom])
      toast({
        title: "Salle créée",
        description: `La salle ${roomName} a été créée avec ${totalSeats} places`,
      })
    }

    // Réinitialiser le formulaire
    setRoomName("")
    setColumns([
      { id: "col1", tables: 5, seatsPerTable: 2 },
      { id: "col2", tables: 5, seatsPerTable: 2 },
      { id: "col3", tables: 4, seatsPerTable: 2 },
    ])
    setEditingRoomId(null)
    setShowAddDialog(false)
  }

  const handleEditRoom = (room: Room) => {
    setRoomName(room.name)
    setColumns([...room.columns])
    setEditingRoomId(room.id)
    setShowAddDialog(true)
  }

  const handleDeleteRoom = (roomId: string) => {
    const roomToDelete = rooms.find((room) => room.id === roomId)
    if (!roomToDelete) return

    const updatedRooms = rooms.filter((room) => room.id !== roomId)
    onRoomsChange(updatedRooms)

    toast({
      title: "Salle supprimée",
      description: `La salle ${roomToDelete.name} a été supprimée`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des salles</CardTitle>
        <CardDescription>Créez et configurez les salles de classe</CardDescription>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucune salle configurée. Créez une salle pour commencer.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  <CardDescription>
                    {room.columns.reduce((total, col) => total + col.tables * col.seatsPerTable, 0)} places
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between p-4 pt-0">
                  <Button variant="outline" size="sm" onClick={() => handleEditRoom(room)}>
                    <Edit className="h-4 w-4 mr-1" /> Modifier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                    <Trash className="h-4 w-4 mr-1" /> Supprimer
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une salle
        </Button>
      </CardFooter>

      {/* Dialog pour ajouter/modifier une salle */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingRoomId ? "Modifier une salle" : "Ajouter une salle"}</DialogTitle>
            <DialogDescription>Configurez la disposition de la salle de classe</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomName" className="text-right">
                Nom
              </Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="col-span-3"
                placeholder="ex: Salle 101"
              />
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Configuration des colonnes</h3>
                <div className="text-sm text-gray-500">
                  Total: {calculateTotalSeats()} places
                  {calculateTotalSeats() > 200 && <span className="text-red-500 ml-2">(Maximum: 200)</span>}
                </div>
              </div>

              <div className="space-y-4">
                {columns.map((column, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center p-2 border rounded-md">
                    <div className="col-span-1 font-medium text-center">{index + 1}</div>
                    <div className="col-span-5">
                      <Label htmlFor={`tables-${index}`}>Nombre de tables</Label>
                      <Input
                        id={`tables-${index}`}
                        type="number"
                        min="1"
                        max="20"
                        value={column.tables}
                        onChange={(e) => handleColumnChange(index, "tables", Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-5">
                      <Label htmlFor={`seats-${index}`}>Places par table</Label>
                      <Input
                        id={`seats-${index}`}
                        type="number"
                        min="1"
                        max="7"
                        value={column.seatsPerTable}
                        onChange={(e) =>
                          handleColumnChange(index, "seatsPerTable", Number.parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveColumn(index)}
                        disabled={columns.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={handleAddColumn} disabled={columns.length >= 10}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une colonne
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setEditingRoomId(null)
                setRoomName("")
                setColumns([
                  { id: "col1", tables: 5, seatsPerTable: 2 },
                  { id: "col2", tables: 5, seatsPerTable: 2 },
                  { id: "col3", tables: 4, seatsPerTable: 2 },
                ])
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveRoom}>
              <Save className="mr-2 h-4 w-4" />
              {editingRoomId ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
