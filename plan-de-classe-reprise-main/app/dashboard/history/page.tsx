"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/use-auth"
import { getActionLogs } from "@/lib/supabase-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

interface ActionLog {
  id: string
  action_type: string
  entity_type: string
  entity_name: string
  created_at: string
  user: {
    first_name: string
    last_name: string
    role: string
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth({ requireRole: "vie-scolaire" })
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      if (!user) return

      const actionLogs = await getActionLogs(100)
      setLogs(actionLogs as ActionLog[])
      setLoading(false)
    }

    if (user) {
      loadLogs()
    }
  }, [user])

  function getActionBadgeVariant(actionType: string) {
    switch (actionType) {
      case "create":
        return "default"
      case "update":
        return "secondary"
      case "delete":
        return "destructive"
      default:
        return "outline"
    }
  }

  function getActionLabel(actionType: string) {
    switch (actionType) {
      case "create":
        return "Création"
      case "update":
        return "Modification"
      case "delete":
        return "Suppression"
      case "view":
        return "Consultation"
      default:
        return actionType
    }
  }

  function getEntityLabel(entityType: string) {
    switch (entityType) {
      case "student":
        return "Élève"
      case "teacher":
        return "Professeur"
      case "room":
        return "Salle"
      case "class":
        return "Classe"
      case "sub_room":
        return "Sous-salle"
      default:
        return entityType
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold">Historique des actions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal d'activité</CardTitle>
          <CardDescription>Toutes les actions effectuées par les utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Élément</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucune action enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.created_at).toLocaleString("fr-FR")}</TableCell>
                    <TableCell>
                      {log.user?.first_name} {log.user?.last_name}
                      <span className="text-muted-foreground text-sm ml-2">({log.user?.role})</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)}>{getActionLabel(log.action_type)}</Badge>
                    </TableCell>
                    <TableCell>{getEntityLabel(log.entity_type)}</TableCell>
                    <TableCell className="font-medium">{log.entity_name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
