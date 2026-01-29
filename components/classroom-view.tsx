"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { useDrag, useDrop } from "react-dnd"

interface ClassroomViewProps {
  room: Room
  students: string[]
  seatAssignments: Record<string, string>
  onSeatSelect: (seatId: string, studentName: string) => void
  onRemoveStudent?: (seatId: string) => void
  onDragStart?: (seatId: string, student: string) => void
  onDrop?: (targetSeatId: string) => void
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

// Composant pour un siège avec drag and drop
function DraggableSeat({
  seatId,
  student,
  isOccupied,
  onClick,
  onRemove,
  onDragStart,
  onDrop,
}: {
  seatId: string
  student: string | null
  isOccupied: boolean
  onClick: () => void
  onRemove?: () => void
  onDragStart?: (seatId: string, student: string) => void
  onDrop?: (targetSeatId: string) => void
}) {
  // Configuration du drag
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "STUDENT",
      item: () => {
        if (student && onDragStart) {
          onDragStart(seatId, student)
        }
        return { seatId, student }
      },
      canDrag: !!student,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [seatId, student, onDragStart],
  )

  // Configuration du drop
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "STUDENT",
      drop: () => {
        if (onDrop) {
          onDrop(seatId)
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [seatId, onDrop],
  )

  // Combiner les refs pour permettre à la fois le drag et le drop
  const dragDropRef = (el: HTMLButtonElement | null) => {
    drag(el)
    drop(el)
  }

  return (
    <div className="relative group flex-1">
      <Button
        ref={dragDropRef}
        className={`h-12 w-full ${
          isOver
            ? "bg-blue-100 border-blue-300"
            : isOccupied
              ? "bg-green-100 hover:bg-green-200 text-green-800"
              : "bg-gray-100 hover:bg-gray-200"
        } ${isDragging ? "opacity-50" : ""}`}
        onClick={onClick}
      >
        {isOccupied && student ? (
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium">{student.split(" ")[0]}</span>
            <span className="text-xs">{student.split(" ")[1]?.[0] || ""}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Libre</span>
        )}
      </Button>

      {isOccupied && student && onRemove && (
        <button
          type="button"
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export function ClassroomView({
  room,
  students,
  seatAssignments,
  onSeatSelect,
  onRemoveStudent,
  onDragStart,
  onDrop,
}: ClassroomViewProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")

  const handleSeatClick = (seatId: string) => {
    if (!selectedStudent) {
      toast({
        title: "Aucun élève sélectionné",
        description: "Veuillez d'abord sélectionner un élève",
        variant: "destructive",
      })
      return
    }

    // Vérifier si la place est déjà prise par un autre élève
    if (seatAssignments[seatId] && seatAssignments[seatId] !== selectedStudent) {
      toast({
        title: "Place déjà prise",
        description: `Cette place est déjà prise par ${seatAssignments[seatId]}`,
        variant: "destructive",
      })
      return
    }

    onSeatSelect(seatId, selectedStudent)

    toast({
      title: "Place attribuée",
      description: `${selectedStudent} a été placé(e) à la place ${seatId}`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-2">Sélection de l'élève</h3>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un élève" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {room.columns.map((column, colIndex) => (
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
                    const student = seatAssignments[seatId] || null
                    const isOccupied = !!student

                    return (
                      <DraggableSeat
                        key={seatId}
                        seatId={seatId}
                        student={student}
                        isOccupied={isOccupied}
                        onClick={() => handleSeatClick(seatId)}
                        onRemove={onRemoveStudent ? () => onRemoveStudent(seatId) : undefined}
                        onDragStart={onDragStart}
                        onDrop={onDrop}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
