"use client"

import type React from "react"
import { useState } from "react"

interface Student {
  id: string
  first_name: string
  last_name: string
  class_name: string
  role: string
}

interface Room {
  id: string
  name: string
  code: string
  board_position: "top" | "bottom" | "left" | "right"
  config: {
    columns: {
      id: string
      tables: number
      seatsPerTable: number
    }[]
  }
}

interface RoomLayoutProps {
  room: Room
  assignments: Map<number, string>
  students: Student[]
  onDragOver: (e: React.DragEvent) => void
  onDrop: (seatNumber: number) => void
  onRemove: (seatNumber: number) => void
  onDragStart: (student: Student) => void
}

export function RoomLayout({
  room,
  assignments,
  students,
  onDragOver,
  onDrop,
  onRemove,
  onDragStart,
}: RoomLayoutProps) {
  let seatNumber = 1
  const boardMargin = 80
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null)

  const getStudentById = (id: string) => students.find((s) => s.id === id)

  return (
    <div
      className="relative border-2 border-gray-300 dark:border-gray-700 rounded-xl p-12 bg-gray-50 dark:bg-gray-950 min-h-[700px]"
      style={{
        paddingTop: room.board_position === "top" ? `${boardMargin}px` : "48px",
        paddingBottom: room.board_position === "bottom" ? `${boardMargin}px` : "48px",
        paddingLeft: room.board_position === "left" ? `${boardMargin}px` : "48px",
        paddingRight: room.board_position === "right" ? `${boardMargin}px` : "48px",
      }}
    >
      {/* Board */}
      {room.board_position === "top" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black px-12 py-4 rounded-md font-semibold text-lg shadow-lg border-2 border-gray-800 dark:border-gray-200">
          TABLEAU
        </div>
      )}
      {room.board_position === "bottom" && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black px-12 py-4 rounded-md font-semibold text-lg shadow-lg border-2 border-gray-800 dark:border-gray-200">
          TABLEAU
        </div>
      )}
      {room.board_position === "left" && (
        <div
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black px-4 py-12 rounded-md font-semibold text-lg shadow-lg border-2 border-gray-800 dark:border-gray-200"
          style={{ writingMode: "vertical-rl" }}
        >
          TABLEAU
        </div>
      )}
      {room.board_position === "right" && (
        <div
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black px-4 py-12 rounded-md font-semibold text-lg shadow-lg border-2 border-gray-800 dark:border-gray-200"
          style={{ writingMode: "vertical-rl" }}
        >
          TABLEAU
        </div>
      )}

      {/* Seats */}
      <div className="flex justify-center items-center gap-16 h-full">
        {room.config.columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-8">
            {Array.from({ length: column.tables }).map((_, tableIndex) => (
              <div
                key={tableIndex}
                className="relative bg-gray-200 dark:bg-gray-800 rounded-xl p-4 shadow-md border-2 border-gray-300 dark:border-gray-700"
                style={{ minWidth: `${column.seatsPerTable * 90}px` }}
              >
                <div className="flex gap-4 justify-center">
                  {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => {
                    const currentSeatNumber = seatNumber++
                    const assignedStudentId = assignments.get(currentSeatNumber)
                    const assignedStudent = assignedStudentId ? getStudentById(assignedStudentId) : null
                    const isHovered = hoveredSeat === currentSeatNumber

                    return (
                      <div
                        key={seatIndex}
                        draggable={!!assignedStudent}
                        onDragStart={() => assignedStudent && onDragStart(assignedStudent)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setHoveredSeat(currentSeatNumber)
                        }}
                        onDragLeave={() => setHoveredSeat(null)}
                        onDrop={() => {
                          onDrop(currentSeatNumber)
                          setHoveredSeat(null)
                        }}
                        className={`w-20 h-20 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer ${
                          assignedStudent
                            ? `bg-black dark:bg-white text-white dark:text-black hover:scale-105 ${isHovered ? "ring-4 ring-blue-500" : ""}`
                            : `bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-600 hover:scale-105 border-2 border-dashed border-gray-300 dark:border-gray-700 ${isHovered ? "bg-gray-200 dark:bg-gray-800" : ""}`
                        }`}
                        onClick={() => assignedStudent && onRemove(currentSeatNumber)}
                        title={
                          assignedStudent
                            ? `${assignedStudent.last_name} ${assignedStudent.first_name} - Cliquer pour retirer ou glisser pour déplacer`
                            : `Place ${currentSeatNumber} - Glisser un élève ici`
                        }
                      >
                        {assignedStudent ? (
                          <div className="text-center leading-tight">
                            <div className="text-[11px]">{assignedStudent.last_name}</div>
                            <div className="text-[10px] opacity-90">{assignedStudent.first_name[0]}.</div>
                          </div>
                        ) : (
                          <span className="text-sm">{currentSeatNumber}</span>
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
