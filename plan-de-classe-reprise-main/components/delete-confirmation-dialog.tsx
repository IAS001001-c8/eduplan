"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemCount: number
  itemType: string
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemCount,
  itemType,
}: DeleteConfirmationDialogProps) {
  const [confirmationCode, setConfirmationCode] = useState("")
  const [userInput, setUserInput] = useState("")

  useEffect(() => {
    if (open) {
      // Generate random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      setConfirmationCode(code)
      setUserInput("")
    }
  }, [open])

  const handleConfirm = () => {
    if (userInput === confirmationCode) {
      onConfirm()
      onOpenChange(false)
    }
  }

  const isValid = userInput === confirmationCode

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Confirmer la suppression</DialogTitle>
              <DialogDescription className="mt-1">
                Vous êtes sur le point de supprimer {itemCount} {itemType}
                {itemCount > 1 ? "s" : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-900 dark:text-amber-200 font-medium mb-2">
              ⚠️ Cette action est irréversible
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Toutes les données associées seront définitivement supprimées
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <Label className="text-sm text-muted-foreground">Saisissez le code suivant pour confirmer :</Label>
              <div className="mt-2 text-3xl font-bold tracking-widest text-primary bg-primary/10 rounded-lg py-3 px-4 font-mono">
                {confirmationCode}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Code de confirmation</Label>
              <Input
                id="confirmation"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                placeholder="Entrez le code"
                className="text-center text-lg font-mono tracking-widest"
                maxLength={6}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!isValid} className="w-full sm:w-auto">
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
