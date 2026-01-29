"use client"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ClassroomOverviewProps {
  room: {
    id: string
    name: string
    columns: {
      id: string
      tables: number
      seatsPerTable: number
    }[]
  }
  seatAssignments: Record<string, string>
  onRemoveStudent?: (seatId: string) => void
}

export function ClassroomOverview({ room, seatAssignments, onRemoveStudent }: ClassroomOverviewProps) {
  // Calculer le nombre total de places
  const calculateTotalSeats = () => {
    let total = 0
    room.columns.forEach((column) => {
      total += column.tables * column.seatsPerTable
    })
    return total
  }

  const totalSeats = calculateTotalSeats()
  const occupiedSeats = Object.keys(seatAssignments).length
  const occupancyRate = Math.round((occupiedSeats / totalSeats) * 100)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium">Vue générale de la salle</h3>
        <div className="text-sm text-muted-foreground">
          {occupiedSeats} / {totalSeats} places occupées ({occupancyRate}%)
        </div>
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
                    const student = seatAssignments[seatId]
                    const isOccupied = !!student

                    return (
                      <div key={seatId} className="relative group flex-1">
                        <Button
                          className={`h-12 w-full ${
                            isOccupied
                              ? "bg-green-100 hover:bg-green-200 text-green-800"
                              : "bg-red-100 hover:bg-red-200 text-red-800"
                          }`}
                          variant="outline"
                        >
                          {isOccupied ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-medium">{student.split(" ")[0]}</span>
                              <span className="text-xs">{student.split(" ")[1]?.[0] || ""}</span>
                            </div>
                          ) : (
                            <span className="text-xs">Libre</span>
                          )}
                        </Button>

                        {isOccupied && onRemoveStudent && (
                          <button
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRemoveStudent(seatId)}
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
    </div>
  )
}
