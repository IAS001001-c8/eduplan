"use client"

import { Button } from "@/components/ui/button"

interface ClassroomProps {
  config: {
    columns: {
      id: string
      tables: number
      seatsPerTable: number
    }[]
  }
  seats: Record<string, string>
  selectedSeat: string | null
  onSeatSelect: (seatId: string) => void
  currentStudent: string
}

export function Classroom({ config, seats, selectedSeat, onSeatSelect, currentStudent }: ClassroomProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {config.columns.map((column) => (
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
                  const isOccupied = !!seats[seatId]
                  const isSelected = selectedSeat === seatId
                  const isOccupiedByOther = isOccupied && seats[seatId] !== currentStudent

                  return (
                    <Button
                      key={seatId}
                      variant={isSelected ? "default" : isOccupiedByOther ? "secondary" : "outline"}
                      className={`h-12 flex-1 ${isSelected ? "bg-primary" : isOccupiedByOther ? "bg-gray-200" : ""}`}
                      onClick={() => onSeatSelect(seatId)}
                      disabled={isOccupiedByOther}
                    >
                      {isOccupied ? (
                        <span className="text-xs text-center overflow-hidden">
                          {seats[seatId].split(" ")[0][0]}
                          {seats[seatId].split(" ")[1]?.[0] || ""}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{seatIndex + 1}</span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
