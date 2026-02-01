import jsPDF from "jspdf"
import JSZip from "jszip"

interface CredentialData {
  first_name: string
  last_name: string
  username: string
  password: string
  role: string
  class_name?: string
}

// EduPlan brand colors
const EDUPLAN_PRIMARY = { r: 231, g: 165, b: 65 } // #E7A541
const EDUPLAN_TEXT = { r: 41, g: 40, b: 43 } // #29282B
const EDUPLAN_SECONDARY = { r: 217, g: 218, b: 220 } // #D9DADC

// Generate a single credential PDF
function generateSingleCredentialPDF(data: CredentialData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 30

  // Header with EduPlan primary color
  doc.setFillColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b)
  doc.rect(0, 0, pageWidth, 50, "F")
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("EduPlan", pageWidth / 2, 25, { align: "center" })
  
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Identifiants de connexion", pageWidth / 2, 40, { align: "center" })

  y = 70

  // User info
  doc.setTextColor(EDUPLAN_TEXT.r, EDUPLAN_TEXT.g, EDUPLAN_TEXT.b)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(`${data.first_name} ${data.last_name}`, margin, y)
  
  y += 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  
  const roleLabels: Record<string, string> = {
    "delegue": "Délégué de classe",
    "eco-delegue": "Éco-délégué",
    "eleve": "Élève",
    "professeur": "Professeur",
    "vie-scolaire": "Vie scolaire"
  }
  doc.text(roleLabels[data.role] || data.role, margin, y)
  
  if (data.class_name) {
    y += 7
    doc.text(`Classe: ${data.class_name}`, margin, y)
  }

  // Credentials box with EduPlan styling
  y += 25
  doc.setFillColor(253, 246, 233) // Light orange background (#FDF6E9)
  doc.setDrawColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 5, 5, "FD")

  y += 15
  doc.setTextColor(EDUPLAN_PRIMARY.r, EDUPLAN_PRIMARY.g, EDUPLAN_PRIMARY.b)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Vos identifiants", margin + 10, y)

  y += 15
  doc.setTextColor(EDUPLAN_TEXT.r, EDUPLAN_TEXT.g, EDUPLAN_TEXT.b)
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Identifiant:", margin + 10, y)
  doc.setFont("helvetica", "bold")
  doc.text(data.username, margin + 70, y)

  y += 12
  doc.setFont("helvetica", "normal")
  doc.text("Mot de passe:", margin + 10, y)
  doc.setFont("helvetica", "bold")
  doc.text(data.password, margin + 70, y)

  // Instructions box with secondary color
  y += 35
  doc.setFillColor(EDUPLAN_SECONDARY.r, EDUPLAN_SECONDARY.g, EDUPLAN_SECONDARY.b)
  doc.setDrawColor(EDUPLAN_TEXT.r, EDUPLAN_TEXT.g, EDUPLAN_TEXT.b)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, "FD")
  
  y += 12
  doc.setTextColor(EDUPLAN_TEXT.r, EDUPLAN_TEXT.g, EDUPLAN_TEXT.b)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Important:", margin + 10, y)
  doc.setFont("helvetica", "normal")
  doc.text("Conservez ces identifiants en lieu sûr. Changez votre mot de passe après la première connexion.", margin + 45, y)

  // Footer
  y += 45
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(9)
  doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} - EduPlan`, pageWidth / 2, y, { align: "center" })

  return doc
}

// Generate ZIP with individual PDFs
export async function downloadCredentialsAsZip(credentials: CredentialData[], filename: string = "identifiants"): Promise<void> {
  const zip = new JSZip()
  const folder = zip.folder("identifiants")
  
  if (!folder) {
    throw new Error("Failed to create ZIP folder")
  }

  for (const cred of credentials) {
    const doc = generateSingleCredentialPDF(cred)
    const pdfBlob = doc.output("blob")
    const safeName = `${cred.last_name}_${cred.first_name}`.replace(/[^a-zA-Z0-9]/g, "_")
    folder.file(`${safeName}.pdf`, pdfBlob)
  }

  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(zipBlob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate single PDF (kept for backward compatibility)
export function downloadCredentialsPDF(credentials: CredentialData[], filename: string = "identifiants") {
  if (credentials.length === 1) {
    const doc = generateSingleCredentialPDF(credentials[0])
    doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`)
    return
  }
  
  // For multiple credentials, use ZIP
  downloadCredentialsAsZip(credentials, filename)
}

// Generate random password
export function generateRandomPassword(length: number = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const special = "!@#$%"
  
  const allChars = lowercase + uppercase + numbers + special
  
  // Ensure at least one of each type
  let password = ""
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle
  return password.split("").sort(() => Math.random() - 0.5).join("")
}
