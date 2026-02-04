"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/use-auth"
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Copy,
  Trash,
  Edit,
  Search,
  Eye,
  X,
  LayoutTemplate,
  Sparkles,
  Grid,
  LayoutGrid,
  Trash2,
  List,
  Users,
  ChevronRight,
} from "lucide-react"
import type { RoomTemplate } from "@/components/room-templates"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { TemplateSelectionDialog } from "@/components/template-selection-dialog"
import { CreateSubRoomDialog } from "@/components/create-sub-room-dialog"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { EditRoomDialog } from "@/components/edit-room-dialog"
import { RoomSeatPreview } from "@/components/room-seat-preview"
import { ViewToggle } from "@/components/view-toggle"
import { sendNotification, notifyEstablishmentUsers } from "@/lib/notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Room {
  id: string
  establishment_id: string
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
  created_by: string | null
  created_at: string
  updated_at: string
}

interface RoomsManagementProps {
  rooms?: Room[]
  establishmentId: string
  userRole?: string
  userId?: string
  onBack?: () => void
}

export function RoomsManagement({ rooms: initialRooms = [], establishmentId, userRole, userId, onBack }: RoomsManagementProps) {
  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuth()

  // Fonction pour retourner au dashboard
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push("/dashboard")
    }
  }

  const [localRooms, setLocalRooms] = useState<Room[]>(initialRooms)
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(initialRooms)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [viewedRoom, setViewedRoom] = useState<Room | null>(null)
  const [showCreateRoom, setShowCreateRoom] = useState(false) // New room creation dialog
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCreateSubRoom, setShowCreateSubRoom] = useState(false)
  const [selectedRoomForSubRoom, setSelectedRoomForSubRoom] = useState<Room | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    boardPosition: "top" as "top" | "bottom" | "left" | "right",
    columns: [
      { id: "col1", tables: 5, seatsPerTable: 2 },
      { id: "col2", tables: 5, seatsPerTable: 2 },
      { id: "col3", tables: 4, seatsPerTable: 2 },
    ],
  })

  const effectiveUserRole = userRole || user?.role || ""
  const effectiveUserId = userId || user?.id || ""

  const isVieScolaire = effectiveUserRole === "vie-scolaire"
  const isTeacher = effectiveUserRole === "professeur"
  const isDelegate = effectiveUserRole === "delegue" || effectiveUserRole === "eco-delegue"

  // Permissions:
  // - Vie Scolaire: can create/modify rooms and sub-rooms
  // - Professeurs: can create sub-rooms only (NOT rooms)
  // - Délégués: can only use sandbox mode (no direct room/sub-room creation)
  const canModifyRooms = isVieScolaire // Only vie-scolaire can modify rooms
  const canCreateSubRooms = isVieScolaire || isTeacher // Both can create sub-rooms

  const canViewRooms = true

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching rooms:", error)
    } else {
      setLocalRooms(data || [])
      setFilteredRooms(data || [])
    }
  }

  useEffect(() => {
    console.log("[v0] RoomsManagement rendering, initialRooms:", initialRooms?.length)
    console.log("[v0] RoomsManagement userRole:", userRole)
    console.log("[v0] RoomsManagement userId:", userId)
    loadRooms()
  }, [establishmentId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRooms(localRooms)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredRooms(
        localRooms.filter((room) => room.name.toLowerCase().includes(query) || room.code.toLowerCase().includes(query)),
      )
    }
  }, [searchQuery, localRooms])

  const handleAddColumn = () => {
    if (formData.columns.length >= 4) {
      return
    }

    setFormData({
      ...formData,
      columns: [...formData.columns, { id: `col${formData.columns.length + 1}`, tables: 5, seatsPerTable: 2 }],
    })
  }

  const handleRemoveColumn = (index: number) => {
    if (formData.columns.length <= 1) {
      return
    }

    setFormData({
      ...formData,
      columns: formData.columns.filter((_, i) => i !== index),
    })
  }

  const handleColumnChange = (index: number, field: "tables" | "seatsPerTable", value: number) => {
    const newColumns = [...formData.columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setFormData({ ...formData, columns: newColumns })
  }

  const calculateTotalSeats = () => {
    if (!formData?.columns || !Array.isArray(formData.columns)) return 0

    return formData.columns.reduce((total, column) => {
      if (!column || typeof column !== "object") return total
      const tables = Number(column.tables) || 0
      const seatsPerTable = Number(column.seatsPerTable) || 0
      return total + tables * seatsPerTable
    }, 0)
  }

  const calculateTotalWidth = () => {
    if (!formData?.columns || !Array.isArray(formData.columns)) return 0

    return formData.columns.reduce((total, column) => {
      if (!column || typeof column !== "object") return total
      const seatsPerTable = Number(column.seatsPerTable) || 0
      return total + seatsPerTable
    }, 0)
  }

  const handleAddRoom = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      return
    }

    const totalSeats = calculateTotalSeats()
    if (totalSeats > 350) {
      return
    }

    const totalWidth = calculateTotalWidth()
    if (totalWidth > 10) {
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          establishment_id: establishmentId,
          name: formData.name,
          code: formData.code,
          board_position: formData.boardPosition,
          config: { columns: formData.columns },
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      setLocalRooms((prevRooms) => [...prevRooms, data])
      setFilteredRooms((prevFilteredRooms) => [...prevFilteredRooms, data])
    } catch (error: any) {
      console.error("[v0] Error creating room:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicateRooms = async (roomIds: string[]) => {
    try {
      const roomsToDuplicate = localRooms.filter((r) => roomIds.includes(r.id))

      for (const room of roomsToDuplicate) {
        const { error } = await supabase.from("rooms").insert({
          establishment_id: room.establishment_id,
          name: `${room.name} (copie)`,
          code: `${room.code}-copy-${Date.now().toString().slice(-4)}`,
          board_position: room.board_position,
          config: room.config,
          created_by: user?.id,
        })

        if (error) throw error
      }

      loadRooms()

      setSelectedRoomIds([])
    } catch (error) {
      console.error("[v0] Error duplicating rooms:", error)
    }
  }

  const handleEditRoom = async () => {
    if (!editingRoom) return

    if (!formData.name.trim() || !formData.code.trim()) {
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          name: formData.name,
          code: formData.code,
          board_position: formData.boardPosition,
          config: { columns: formData.columns },
        })
        .eq("id", editingRoom.id)

      if (error) throw error

      loadRooms()

      setEditingRoom(null)
    } catch (error: any) {
      console.error("[v0] Error editing room:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteDialog = (roomIds: string[]) => {
    setSelectedRoomIds(roomIds)
    setShowDeleteDialog(true)
  }

  const handleDeleteRooms = async (roomIdsToDelete?: string[]) => {
    const idsToDelete = roomIdsToDelete || selectedRoomIds
    if (idsToDelete.length === 0) return

    try {
      // Get room names before deletion for notification
      const roomsToDelete = localRooms.filter(r => idsToDelete.includes(r.id))
      const roomNames = roomsToDelete.map(r => r.name).join(", ")

      const { error } = await supabase.from("rooms").delete().in("id", idsToDelete)

      if (error) throw error

      // Notify users about deletion
      await notifyEstablishmentUsers({
        establishmentId,
        type: "room_deleted",
        title: "Salle(s) supprimée(s)",
        message: `La/les salle(s) "${roomNames}" a/ont été supprimée(s)`,
        triggeredBy: userId,
        excludeUserId: userId,
      })

      loadRooms()
      setSelectedRoomIds([])
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("[v0] Error deleting rooms:", error)
    }
  }

  const openEditDialog = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      code: room.code,
      boardPosition: room.board_position,
      columns: room.config.columns,
    })
  }

  const handleToggleSelection = (roomId: string) => {
    setSelectedRoomIds((prev) => (prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]))
  }

  const handleSelectAll = () => {
    if (selectedRoomIds.length === filteredRooms.length) {
      setSelectedRoomIds([])
    } else {
      setSelectedRoomIds(filteredRooms.map((r) => r.id))
    }
  }

  const handleViewRoom = (room: Room) => {
    setViewedRoom(room)
  }

  const handleTemplateSelect = (template: RoomTemplate) => {
    setFormData({
      name: "",
      code: "",
      boardPosition: template.boardPosition,
      columns: template.columns,
    })
    setShowCreateSubRoom(true)
  }

  const handleCustomCreation = () => {
    setFormData({
      name: "",
      code: "",
      boardPosition: "top",
      columns: [
        { id: "col1", tables: 5, seatsPerTable: 2 },
        { id: "col2", tables: 5, seatsPerTable: 2 },
        { id: "col3", tables: 4, seatsPerTable: 2 },
      ],
    })
    setShowCreateRoom(true)
  }

  const handleCreateCustomRoom = () => {
    setFormData({
      name: "",
      code: "",
      boardPosition: "top",
      columns: [
        { id: "col1", tables: 5, seatsPerTable: 2 },
        { id: "col2", tables: 5, seatsPerTable: 2 },
        { id: "col3", tables: 4, seatsPerTable: 2 },
      ],
    })
    setShowCreateSubRoom(true)
  }

  console.log("[v0] RoomsManagement component rendering with props:", { rooms: initialRooms, userRole, userId })

  console.log("[v0] About to render Dialogs - state:", {
    showCreateRoom,
    editingRoom: editingRoom !== null,
    selectedRoomIds: selectedRoomIds.length,
    showTemplates,
    showCreateSubRoom,
    effectiveUserId,
    effectiveUserRole,
    establishmentId,
  })

  return (
    <div className="h-full flex flex-col">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="hover:bg-white/50 dark:hover:bg-slate-800/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Gestion des salles
              </h1>
              <p className="text-muted-foreground mt-1">
                {localRooms.length} salle{localRooms.length > 1 ? "s" : ""} • {filteredRooms.length} affichée
                {filteredRooms.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {canModifyRooms && (
            <Button
              onClick={() => setShowCreateRoom(true)}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="mr-2 h-5 w-5" />
              Créer une salle
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher une salle par nom ou code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {canModifyRooms && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Checkbox
                checked={selectedRoomIds.length === filteredRooms.length && filteredRooms.length > 0}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <Label className="text-sm cursor-pointer font-medium" onClick={handleSelectAll}>
                Tout sélectionner
              </Label>
            </div>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        )}

        {!canModifyRooms && (
          <div className="mb-6 flex justify-end">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        )}

        {selectedRoomIds.length > 0 && canModifyRooms && (
          <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDuplicateRooms(selectedRoomIds)}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer ({selectedRoomIds.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDeleteDialog(selectedRoomIds)}
              className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ({selectedRoomIds.length})
            </Button>
          </div>
        )}

        {filteredRooms.length > 0 ? (
          <>
          {viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const columns = Array.isArray(room.config?.columns) && room.config.columns ? room.config.columns : []
              const totalSeats = columns.reduce(
                (total, col) => total + (col?.tables || 0) * (col?.seatsPerTable || 0),
                0,
              )
              const isSelected = selectedRoomIds.includes(room.id)

              return (
                <Card
                  key={room.id}
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                    isSelected
                      ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900"
                      : "hover:ring-1 hover:ring-emerald-300"
                  } bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700`}
                  onClick={() => handleViewRoom(room)}
                >
                  <div className="p-4">
                    {/* Header with checkbox and menu */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {canModifyRooms && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(e) => {
                              e && e.preventDefault?.()
                              handleToggleSelection(room.id)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{room.name}</h3>
                          <p className="text-sm text-muted-foreground">Code: {room.code}</p>
                        </div>
                      </div>
                      {(canModifyRooms || canCreateSubRooms) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleViewRoom(room)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualiser
                            </DropdownMenuItem>
                            {canCreateSubRooms && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedRoomForSubRoom(room)
                                setShowCreateSubRoom(true)
                              }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Créer une sous-salle
                              </DropdownMenuItem>
                            )}
                            {canModifyRooms && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(room)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateRooms([room.id])}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDeleteDialog([room.id])} className="text-red-600">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Seat Preview */}
                    <div className="flex justify-center my-4">
                      <RoomSeatPreview 
                        columns={columns} 
                        boardPosition={room.board_position}
                        maxWidth={200}
                        maxHeight={120}
                      />
                    </div>

                    {/* Footer stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" />
                        <span>{columns.length} colonne{columns.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {totalSeats} places
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          ) : (
          /* TABLE VIEW - Compact */
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {canModifyRooms && (
                    <th className="w-10 px-3 py-2">
                      <Checkbox
                        checked={selectedRoomIds.length === filteredRooms.length && filteredRooms.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </th>
                  )}
                  <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Nom</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 hidden sm:table-cell">Code</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-300">Colonnes</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-300">Places</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredRooms.map((room) => {
                  const columns = Array.isArray(room.config?.columns) ? room.config.columns : []
                  const totalSeats = columns.reduce((t, c) => t + (c?.tables || 0) * (c?.seatsPerTable || 0), 0)
                  const isSelected = selectedRoomIds.includes(room.id)

                  return (
                    <tr 
                      key={room.id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
                      }`}
                      onClick={() => handleViewRoom(room)}
                    >
                      {canModifyRooms && (
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelection(room.id)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{room.name}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{room.code}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">{columns.length}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Users className="h-3 w-3" />
                          {totalSeats}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewRoom(room)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualiser
                            </DropdownMenuItem>
                            {canCreateSubRooms && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedRoomForSubRoom(room)
                                setShowCreateSubRoom(true)
                              }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Créer une sous-salle
                              </DropdownMenuItem>
                            )}
                            {canModifyRooms && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(room)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateRooms([room.id])}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDeleteDialog([room.id])} className="text-red-600">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}
          </>
        ) : (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800">
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <LayoutTemplate className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Aucune salle trouvée</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Aucune salle ne correspond à votre recherche"
                  : "Commencez par créer votre première salle"}
              </p>
              {canModifyRooms && (
                <Button
                  onClick={() => setShowTemplates(true)}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Créer une salle
                </Button>
              )}
            </div>
          </Card>
        )}

        {viewedRoom && (
          <Card className="mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{viewedRoom.name}</CardTitle>
                  <CardDescription>Code: {viewedRoom.code}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewedRoom(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-6 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-4">
                    Position du tableau:{" "}
                    {viewedRoom.board_position === "top"
                      ? "Haut"
                      : viewedRoom.board_position === "bottom"
                        ? "Bas"
                        : viewedRoom.board_position === "left"
                          ? "Gauche"
                          : "Droite"}
                  </div>
                  <div className="grid gap-4">
                    {viewedRoom.config.columns.map((col: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-background rounded border">
                        <span className="font-medium">Colonne {idx + 1}:</span>
                        <span>{col.tables} tables</span>
                        <span className="text-muted-foreground">×</span>
                        <span>{col.seatsPerTable} places</span>
                        <span className="ml-auto text-sm text-muted-foreground">
                          = {col.tables * col.seatsPerTable} places
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total:{" "}
                  {viewedRoom.config.columns.reduce((sum: number, col: any) => sum + col.tables * col.seatsPerTable, 0)}{" "}
                  places
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Room Dialog */}
      {effectiveUserId && establishmentId && (
        <CreateRoomDialog
          open={showCreateRoom}
          onOpenChange={setShowCreateRoom}
          onSuccess={loadRooms}
          userId={effectiveUserId}
          establishmentId={establishmentId}
        />
      )}

      {showDeleteDialog && (
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={() => handleDeleteRooms(selectedRoomIds)}
          itemCount={selectedRoomIds.length}
          itemType="salle"
        />
      )}

      {showTemplates && effectiveUserId && establishmentId && (
        <TemplateSelectionDialog
          open={showTemplates}
          onOpenChange={setShowTemplates}
          onSelectTemplate={handleTemplateSelect}
          userId={effectiveUserId}
          establishmentId={establishmentId}
          onTemplateSelected={() => {
            setShowTemplates(false)
            loadRooms()
          }}
        />
      )}

      {showCreateSubRoom && establishmentId && effectiveUserId && (
        <CreateSubRoomDialog
          open={showCreateSubRoom}
          onOpenChange={setShowCreateSubRoom}
          onSuccess={() => {
            setShowCreateSubRoom(false)
            loadRooms()
          }}
          establishmentId={establishmentId}
          selectedRoom={selectedRoomForSubRoom}
          userRole={effectiveUserRole}
          userId={effectiveUserId}
        />
      )}

      {/* Edit Room Dialog */}
      <EditRoomDialog
        open={editingRoom !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRoom(null)
        }}
        onSuccess={loadRooms}
        room={editingRoom}
      />

      <div />
    </div>
  )
}
