"use client"

import { useState } from "react"

interface RoomSeatPreviewProps {
  columns: {
    id: string
    tables: number
    seatsPerTable: number
  }[]
  boardPosition?: "top" | "bottom" | "left" | "right"
  maxWidth?: number
  maxHeight?: number
}

export function RoomSeatPreview({ 
  columns, 
  boardPosition = "top",
  maxWidth = 200,
  maxHeight = 120 
}: RoomSeatPreviewProps) {
  if (!columns || columns.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg"
        style={{ width: maxWidth, height: maxHeight }}
      >
        <span className="text-xs text-muted-foreground">Pas de configuration</span>
      </div>
    )
  }

  // Calculate total tables and seats
  const totalTables = columns.reduce((sum, col) => sum + col.tables, 0)
  const maxTablesInColumn = Math.max(...columns.map(col => col.tables))
  
  // Calculate seat size based on available space
  const seatSize = Math.min(
    Math.floor((maxWidth - 20) / (columns.length * 2 + 1)),
    Math.floor((maxHeight - 30) / (maxTablesInColumn + 1)),
    12
  )
  const gap = Math.max(2, Math.floor(seatSize / 4))

  const isHorizontalBoard = boardPosition === "top" || boardPosition === "bottom"

  return (
    <div 
      className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-700"
      style={{ width: maxWidth, height: maxHeight }}
    >
      {/* Board indicator */}
      {boardPosition === "top" && (
        <div 
          className="bg-amber-400 dark:bg-amber-500 rounded mb-1"
          style={{ width: maxWidth - 20, height: 4 }}
        />
      )}
      
      <div className={`flex ${isHorizontalBoard ? 'flex-row' : 'flex-col'} items-center justify-center`} style={{ gap }}>
        {boardPosition === "left" && (
          <div 
            className="bg-amber-400 dark:bg-amber-500 rounded"
            style={{ width: 4, height: maxHeight - 30 }}
          />
        )}
        
        {/* Seats grid */}
        <div className="flex" style={{ gap }}>
          {columns.map((column, colIndex) => (
            <div key={column.id || colIndex} className="flex flex-col" style={{ gap }}>
              {Array.from({ length: column.tables }).map((_, tableIndex) => (
                <div key={tableIndex} className="flex" style={{ gap: gap / 2 }}>
                  {Array.from({ length: column.seatsPerTable }).map((_, seatIndex) => (
                    <div
                      key={seatIndex}
                      className="bg-emerald-400 dark:bg-emerald-500 rounded-sm shadow-sm"
                      style={{ 
                        width: seatSize, 
                        height: seatSize,
                        opacity: 0.8 + (Math.random() * 0.2)
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {boardPosition === "right" && (
          <div 
            className="bg-amber-400 dark:bg-amber-500 rounded"
            style={{ width: 4, height: maxHeight - 30 }}
          />
        )}
      </div>
      
      {boardPosition === "bottom" && (
        <div 
          className="bg-amber-400 dark:bg-amber-500 rounded mt-1"
          style={{ width: maxWidth - 20, height: 4 }}
        />
      )}
    </div>
  )
}
