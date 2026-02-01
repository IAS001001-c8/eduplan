"use client"

import { jsPDF } from "jspdf"

interface Student {
  id: string
  first_name: string
  last_name: string
  class_name?: string
  role?: string
}

interface SeatAssignment {
  seatNumber: number
  student: Student | null
}

interface ExportPDFOptions {
  subRoomName: string
  roomName: string
  teacherName: string
  className: string
  columns: { id: string; tables: number; seatsPerTable: number }[]
  assignments: Map<number, string>
  students: Student[]
  boardPosition?: "top" | "bottom" | "left" | "right"
  establishmentName?: string
}

// EduPlan brand colors
const EDUPLAN_PRIMARY = { r: 231, g: 165, b: 65 } // #E7A541
const EDUPLAN_TEXT = { r: 41, g: 40, b: 43 } // #29282B
const EDUPLAN_SECONDARY = { r: 217, g: 218, b: 220 } // #D9DADC

export function exportSeatingPlanToPDF(options: ExportPDFOptions) {
  const {
    subRoomName,
    roomName,
    teacherName,
    className,
    columns,
    assignments,
    students,
    boardPosition = "top",
    establishmentName = "EduPlan"
  } = options

  // Créer le document PDF
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // En-tête avec la couleur EduPlan
  doc.setFillColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b)
  doc.rect(0, 0, pageWidth, 25, "F")
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("EduPlan", margin, 12)
  
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Plan de classe - ${subRoomName}`, margin, 20)

  // Nom de l'établissement à droite
  doc.setFontSize(10)
  doc.text(establishmentName, pageWidth - margin, 12, { align: "right" })

  // Informations
  doc.setTextColor(EDUPLAN_TEXT.r, EDUPLAN_TEXT.g, EDUPLAN_TEXT.b)
  doc.setFontSize(11)
  let yPos = 35
  
  doc.setFont("helvetica", "bold")
  doc.text("Salle:", margin, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(roomName, margin + 20, yPos)
  
  doc.setFont("helvetica", "bold")
  doc.text("Classe:", margin + 80, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(className, margin + 100, yPos)
  
  doc.setFont("helvetica", "bold")
  doc.text("Professeur:", margin + 160, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(teacherName, margin + 190, yPos)

  // Date
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text(`Généré le ${today}`, pageWidth - margin - 50, yPos)

  // Calculs pour le plan
  yPos = 50
  const planWidth = pageWidth - 2 * margin
  const planHeight = pageHeight - yPos - margin - 30

  // Dessiner le tableau (position du professeur) avec couleur EduPlan
  const boardHeight = 8
  const boardWidth = planWidth * 0.6
  const boardX = margin + (planWidth - boardWidth) / 2
  
  doc.setFillColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b)
  if (boardPosition === "top") {
    doc.rect(boardX, yPos, boardWidth, boardHeight, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("TABLEAU", boardX + boardWidth / 2, yPos + 5, { align: "center" })
    yPos += boardHeight + 10
  }

  // Calculer les dimensions des places
  const totalTables = columns.reduce((sum, col) => sum + col.tables, 0)
  const maxSeatsPerRow = Math.max(...columns.map(col => col.seatsPerTable))
  
  const seatWidth = Math.min(25, (planWidth - 20) / (columns.length * maxSeatsPerRow + columns.length - 1))
  const seatHeight = Math.min(20, (planHeight - 20) / (Math.max(...columns.map(col => col.tables)) + 1))
  const colGap = 15
  const rowGap = 8

  // Dessiner les places
  let xOffset = margin + (planWidth - (columns.length * maxSeatsPerRow * seatWidth + (columns.length - 1) * colGap)) / 2
  let seatNumber = 1

  columns.forEach((column, colIndex) => {
    let currentY = yPos

    for (let tableIdx = 0; tableIdx < column.tables; tableIdx++) {
      for (let seatIdx = 0; seatIdx < column.seatsPerTable; seatIdx++) {
        const studentId = assignments.get(seatNumber)
        const student = studentId ? students.find(s => s.id === studentId) : null
        
        const x = xOffset + seatIdx * seatWidth
        const y = currentY

        // Couleur de fond avec palette EduPlan
        if (student) {
          if (student.role === "delegue") {
            doc.setFillColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b) // Orange for delegates
          } else if (student.role === "eco-delegue") {
            doc.setFillColor(34, 197, 94) // green for eco-delegates
          } else {
            doc.setFillColor(EDUPLAN_SECONDARY.r, EDUPLAN_SECONDARY.g, EDUPLAN_SECONDARY.b) // Light gray for regular students
          }
        } else {
          doc.setFillColor(248, 250, 252) // slate-50 for empty seats
        }
        
        doc.rect(x, y, seatWidth - 2, seatHeight - 2, "F")
        doc.setDrawColor(EDUPLAN_SECONDARY.r, EDUPLAN_SECONDARY.g, EDUPLAN_SECONDARY.b)
        doc.rect(x, y, seatWidth - 2, seatHeight - 2, "S")

        // Numéro de place
        doc.setFontSize(6)
        doc.setTextColor(148, 163, 184)
        doc.text(seatNumber.toString(), x + 1, y + 3)

        // Nom de l'élève
        if (student) {
          doc.setFontSize(7)
          doc.setTextColor(EDUPLAN_TEXT.r, EDUPLAN_TEXT.g, EDUPLAN_TEXT.b)
          doc.setFont("helvetica", "bold")
          
          const lastName = student.last_name.substring(0, 10)
          const firstName = student.first_name.substring(0, 8)
          
          doc.text(lastName, x + (seatWidth - 2) / 2, y + seatHeight / 2 - 1, { align: "center" })
          doc.setFont("helvetica", "normal")
          doc.text(firstName, x + (seatWidth - 2) / 2, y + seatHeight / 2 + 3, { align: "center" })
        }

        seatNumber++
      }
      currentY += seatHeight + rowGap
    }
    xOffset += column.seatsPerTable * seatWidth + colGap
  })

  // Tableau si en bas
  if (boardPosition === "bottom") {
    const bottomY = pageHeight - margin - boardHeight - 15
    doc.setFillColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b)
    doc.rect(boardX, bottomY, boardWidth, boardHeight, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("TABLEAU", boardX + boardWidth / 2, bottomY + 5, { align: "center" })
  }

  // Légende avec couleurs EduPlan
  const legendY = pageHeight - margin - 10
  doc.setFontSize(8)
  doc.setTextColor(EDUPLAN_TEXT.r, EDUPLAN_TEXT.g, EDUPLAN_TEXT.b)
  
  // Place normale
  doc.setFillColor(EDUPLAN_SECONDARY.r, EDUPLAN_SECONDARY.g, EDUPLAN_SECONDARY.b)
  doc.rect(margin, legendY, 8, 6, "F")
  doc.text("Élève", margin + 10, legendY + 4)
  
  // Délégué
  doc.setFillColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b)
  doc.rect(margin + 40, legendY, 8, 6, "F")
  doc.text("Délégué", margin + 50, legendY + 4)
  
  // Éco-délégué
  doc.setFillColor(34, 197, 94)
  doc.rect(margin + 90, legendY, 8, 6, "F")
  doc.text("Éco-délégué", margin + 100, legendY + 4)

  // Statistiques
  const placedCount = assignments.size
  const totalSeats = columns.reduce((sum, col) => sum + col.tables * col.seatsPerTable, 0)
  doc.setTextColor(128, 128, 128)
  doc.text(`${placedCount}/${totalSeats} élèves placés`, pageWidth - margin - 40, legendY + 4)

  // Télécharger
  const fileName = `plan-${subRoomName.replace(/\s+/g, "-").toLowerCase()}-${today.replace(/\s+/g, "-")}.pdf`
  doc.save(fileName)
  
  return fileName
}
