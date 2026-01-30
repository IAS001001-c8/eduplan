"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { History, User, Clock, ArrowRight, UserPlus, UserMinus, RefreshCw, Plus, Trash, Edit } from "lucide-react"

interface HistoryEntry {
  id: string
  entity_type: string
  entity_id: string
  action: string
  old_value: any
  new_value: any
  user_id: string
  user_name: string
  created_at: string
}

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType?: string
  entityId?: string
  establishmentId: string
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  create: { label: "Création", icon: Plus, color: "bg-green-100 text-green-700" },
  update: { label: "Modification", icon: Edit, color: "bg-blue-100 text-blue-700" },
  delete: { label: "Suppression", icon: Trash, color: "bg-red-100 text-red-700" },
  place_student: { label: "Élève placé", icon: UserPlus, color: "bg-emerald-100 text-emerald-700" },
  remove_student: { label: "Élève retiré", icon: UserMinus, color: "bg-orange-100 text-orange-700" },
  swap_students: { label: "Échange", icon: RefreshCw, color: "bg-purple-100 text-purple-700" },
  validate: { label: "Validation", icon: Plus, color: "bg-green-100 text-green-700" },
  reject: { label: "Refus", icon: Trash, color: "bg-red-100 text-red-700" },
  return: { label: "Renvoi", icon: RefreshCw, color: "bg-amber-100 text-amber-700" },
}

export function HistoryDialog({ 
  open, 
  onOpenChange, 
  entityType, 
  entityId, 
  establishmentId 
}: HistoryDialogProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open, entityType, entityId])

  async function fetchHistory() {
    setIsLoading(true)
    try {
      let query = supabase
        .from("modification_history")
        .select("*")
        .eq("establishment_id", establishmentId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (entityType) {
        query = query.eq("entity_type", entityType)
      }
      if (entityId) {
        query = query.eq("entity_id", entityId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching history:", error)
      } else {
        setHistory(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  function getActionInfo(action: string) {
    return ACTION_LABELS[action] || { label: action, icon: History, color: "bg-gray-100 text-gray-700" }
  }

  function renderDetails(entry: HistoryEntry) {
    const { action, old_value, new_value } = entry

    if (action === "place_student" && new_value) {
      return (
        <p className="text-sm text-muted-foreground mt-1">
          {new_value.student_name} → Place {new_value.seat_number}
        </p>
      )
    }

    if (action === "remove_student" && old_value) {
      return (
        <p className="text-sm text-muted-foreground mt-1">
          {old_value.student_name} retiré de la place {old_value.seat_number}
        </p>
      )
    }

    if (action === "swap_students" && old_value && new_value) {
      return (
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          {old_value.student1_name} <ArrowRight className="h-3 w-3" /> {old_value.student2_name}
        </p>
      )
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des modifications
          </DialogTitle>
          <DialogDescription>
            {entityType 
              ? `Historique pour ${entityType}` 
              : "Historique complet de l'établissement"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const actionInfo = getActionInfo(entry.action)
                const ActionIcon = actionInfo.icon

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow"
                  >
                    <div className={`p-2 rounded-full ${actionInfo.color}`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {entry.entity_type}
                        </Badge>
                        <span className="font-medium">{actionInfo.label}</span>
                      </div>

                      {renderDetails(entry)}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.user_name || "Système"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook pour enregistrer les modifications
export function useHistoryLogger(establishmentId: string, userId: string, userName: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function logAction(
    entityType: string,
    entityId: string,
    action: string,
    oldValue?: any,
    newValue?: any
  ) {
    try {
      const { error } = await supabase.from("modification_history").insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        old_value: oldValue,
        new_value: newValue,
        user_id: userId,
        user_name: userName,
        establishment_id: establishmentId
      })

      if (error) {
        console.error("Error logging history:", error)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return { logAction }
}
