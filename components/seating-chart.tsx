"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface SeatingChartProps {
  roomName: string
  config: {
    columns: {
      id: string
      tables: number
      seatsPerTable: number
    }[]
  }
  seats: Record<string, string>
  className?: string
}

export function SeatingChart({ roomName, config, seats, className }: SeatingChartProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className={className}>
      <CardHeader className="print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plan de classe - {roomName}</CardTitle>
            <CardDescription>Vue d'ensemble des places assignées</CardDescription>
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Print-only header */}
        <div className="hidden print:block mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Plan de classe - {roomName}</h1>
          <p className="text-gray-600">Vue d'ensemble des places assignées</p>
        </div>

        {/* Seating layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:gap-6">
          {config.columns.map((column, colIndex) => (
            <div key={column.id} className="flex flex-col items-center gap-4 print:gap-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Colonne {colIndex + 1}</div>
              {Array.from({ length: column.tables }).map((_, tableIndex) => (
                <div
                  key={`${column.id}-table-${tableIndex}`}
                  className="w-full border-2 border-gray-300 rounded-md p-3 bg-gray-50 print:p-2"
                >
                  <div className="text-xs text-center text-gray-500 mb-2 font-medium">Table {tableIndex + 1}</div>
                  <div className="flex justify-between gap-2 w-full">
                    {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => {
                      const seatId = `${column.id}-t${tableIndex + 1}-s${seatIndex + 1}`
                      const studentName = seats[seatId]

                      return (
                        <div
                          key={seatId}
                          className={`flex-1 min-h-[60px] rounded border-2 flex items-center justify-center p-2 text-center print:min-h-[50px] ${
                            studentName ? "bg-primary/10 border-primary/30" : "bg-white border-gray-200 border-dashed"
                          }`}
                        >
                          {studentName ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-semibold text-gray-800 leading-tight">{studentName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Place {seatIndex + 1}</span>
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

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 print:mt-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 bg-primary/10 border-primary/30"></div>
              <span className="text-gray-600">Place assignée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 bg-white border-gray-200 border-dashed"></div>
              <span className="text-gray-600">Place libre</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-4 pt-4 border-t border-gray-200 print:mt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{Object.keys(seats).length}</div>
              <div className="text-xs text-gray-600">Places assignées</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">
                {config.columns.reduce((acc, col) => acc + col.tables * col.seatsPerTable, 0) -
                  Object.keys(seats).length}
              </div>
              <div className="text-xs text-gray-600">Places libres</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {config.columns.reduce((acc, col) => acc + col.tables, 0)}
              </div>
              <div className="text-xs text-gray-600">Tables</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {config.columns.reduce((acc, col) => acc + col.tables * col.seatsPerTable, 0)}
              </div>
              <div className="text-xs text-gray-600">Places totales</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          ${className ? `.${className}` : ""}
          .seating-chart-container,
          .seating-chart-container * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </Card>
  )
}
