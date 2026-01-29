"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash, Plus, FileText } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ImportStudentsDialog } from "@/components/import-students-dialog"

interface StudentListProps {
  students: string[]
  onStudentsChange: (students: string[]) => void
}

export function StudentList({ students, onStudentsChange }: StudentListProps) {
  const [newStudent, setNewStudent] = useState("")
  const [editingStudent, setEditingStudent] = useState<{ index: number; name: string } | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  const handleAddStudent = () => {
    if (!newStudent.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'élève ne peut pas être vide",
        variant: "destructive",
      })
      return
    }

    if (students.includes(newStudent)) {
      toast({
        title: "Erreur",
        description: "Cet élève existe déjà dans la liste",
        variant: "destructive",
      })
      return
    }

    onStudentsChange([...students, newStudent])
    setNewStudent("")
    setShowAddDialog(false)

    toast({
      title: "Élève ajouté",
      description: `${newStudent} a été ajouté à la liste`,
    })
  }

  const handleEditStudent = () => {
    if (!editingStudent || !editingStudent.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'élève ne peut pas être vide",
        variant: "destructive",
      })
      return
    }

    if (students.includes(editingStudent.name) && students[editingStudent.index] !== editingStudent.name) {
      toast({
        title: "Erreur",
        description: "Cet élève existe déjà dans la liste",
        variant: "destructive",
      })
      return
    }

    const updatedStudents = [...students]
    updatedStudents[editingStudent.index] = editingStudent.name
    onStudentsChange(updatedStudents)
    setEditingStudent(null)
    setShowEditDialog(false)

    toast({
      title: "Élève modifié",
      description: `Le nom a été mis à jour`,
    })
  }

  const handleDeleteStudent = (index: number) => {
    const studentName = students[index]
    const updatedStudents = students.filter((_, i) => i !== index)
    onStudentsChange(updatedStudents)

    toast({
      title: "Élève supprimé",
      description: `${studentName} a été supprimé de la liste`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des élèves</CardTitle>
        <CardDescription>Gérez la liste des élèves de la classe</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun élève dans cette classe. Ajoutez des élèves pour commencer.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>{student}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingStudent({ index, name: student })
                          setShowEditDialog(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un élève
        </Button>
        <Button variant="outline" onClick={() => setShowImportDialog(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Importer des élèves
        </Button>
      </CardFooter>

      {/* Dialog pour ajouter un élève */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un élève</DialogTitle>
            <DialogDescription>Entrez le nom de l'élève à ajouter à la classe</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studentName" className="text-right">
                Nom
              </Label>
              <Input
                id="studentName"
                value={newStudent}
                onChange={(e) => setNewStudent(e.target.value)}
                className="col-span-3"
                placeholder="Prénom NOM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddStudent}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un élève */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier un élève</DialogTitle>
            <DialogDescription>Modifiez le nom de l'élève</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editStudentName" className="text-right">
                Nom
              </Label>
              <Input
                id="editStudentName"
                value={editingStudent?.name || ""}
                onChange={(e) => setEditingStudent(editingStudent ? { ...editingStudent, name: e.target.value } : null)}
                className="col-span-3"
                placeholder="Prénom NOM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditStudent}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImportStudentsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={(newStudents) => {
          // Filtrer les doublons
          const uniqueStudents = [...new Set([...students, ...newStudents])]
          onStudentsChange(uniqueStudents)

          toast({
            title: "Élèves importés",
            description: `${newStudents.length} élèves ont été importés`,
          })
        }}
        existingStudents={students}
      />
    </Card>
  )
}
