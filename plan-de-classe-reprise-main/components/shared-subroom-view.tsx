"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface SharedSubRoomViewProps {
  subRoom: any
}

export function SharedSubRoomView({ subRoom }: SharedSubRoomViewProps) {
  const roomAssignment = subRoom.room_assignments
  const room = roomAssignment.rooms
  const seatAssignments = subRoom.seat_assignments || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">{subRoom.name}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {room.name} • Classe: {roomAssignment.class_name}
                </CardDescription>
                {subRoom.type === "temporary" && subRoom.start_date && subRoom.end_date && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Du {format(new Date(subRoom.start_date), "PPP", { locale: fr })} au{" "}
                    {format(new Date(subRoom.end_date), "PPP", { locale: fr })}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={subRoom.type === "temporary" ? "default" : "secondary"}>
                  {subRoom.type === "temporary" ? "Temporaire" : "Indéterminée"}
                </Badge>
                <Badge variant="secondary">Vue partagée</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan de classe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {room.config.columns.map((column: any) => (
                <div key={column.id} className="flex flex-col items-center gap-4">
                  {Array.from({ length: column.tables }).map((_, tableIndex) => (
                    <div
                      key={`${column.id}-table-${tableIndex}`}
                      className="w-full border-2 border-gray-300 rounded-md p-2 bg-gray-100"
                    >
                      <div className="text-xs text-center text-gray-500 mb-1">Table {tableIndex + 1}</div>
                      <div className="flex justify-between w-full gap-1">
                        {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => {
                          const seatId = `${column.id}-t${tableIndex + 1}-s${seatIndex + 1}`
                          const student = seatAssignments[seatId]

                          return (
                            <div
                              key={seatId}
                              className={`flex-1 h-12 rounded border flex items-center justify-center text-xs ${
                                student
                                  ? "bg-green-100 border-green-300 text-green-800 font-medium"
                                  : "bg-white border-gray-300 text-gray-400"
                              }`}
                            >
                              {student ? (
                                <div className="text-center">
                                  <div>{student.split(" ")[0]}</div>
                                  <div className="text-[10px]">{student.split(" ")[1]?.[0] || ""}</div>
                                </div>
                              ) : (
                                "Libre"
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
