"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Plus, Search, Users, BookOpen, Trash2, LayoutGrid, ChevronRight, MoreVertical, Eye, Edit, Pencil, Calendar, Folder, FolderOpen, FileText, ChevronDown, Table } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { SeatingPlanEditor } from "@/components/seating-plan-editor"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { CreateSubRoomDialog } from "./create-sub-room-dialog"
import { RoomSeatPreview } from "@/components/room-seat-preview"
import { EditSubRoomDialog } from "@/components/edit-sub-room-dialog"
import { ScheduleTimeline } from "@/components/schedule-timeline"
import { Badge } from "@/components/ui/badge"

interface Room {
  id: string
  name: string
  code: string
  config: {
    columns: {
      id: string
      tables: number
      seatsPerTable: number
    }[]
  }
}

interface Class {
  id: string
  name: string
  is_level: boolean
}

interface Teacher {
  id: string
  first_name: string
  last_name: string
  subject: string
  allow_delegate_subrooms: boolean
}

interface SubRoom {
  id: string
  name: string
  custom_name: string
  room_id: string
  teacher_id: string
  class_ids: string[]
  is_multi_class: boolean
  created_by: string
  created_at: string
  filtered_student_ids?: string[]
  lv2_filter?: string
  rooms: { name: string; code: string }
  teachers: { first_name: string; last_name: string }
}

interface SeatingPlanManagementProps {
  establishmentId: string
  userRole: UserRole
  userId: string
  onBack?: () => void
}

export function SeatingPlanManagement({ establishmentId, userRole, userId, onBack }: SeatingPlanManagementProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subRooms, setSubRooms] = useState<SubRoom[]>([])
  const [filteredSubRooms, setFilteredSubRooms] = useState<SubRoom[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])
  const [availableClasses, setAvailableClasses] = useState<Class[]>([])

  const [formData, setFormData] = useState({
    roomId: "",
    customName: "",
    teacherId: "",
    classIds: [] as string[],
    isMultiClass: false,
  })

  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")

  const [selectedSubRoom, setSelectedSubRoom] = useState<SubRoom | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const [filterClass, setFilterClass] = useState<string>("all")
  const [filterTeacher, setFilterTeacher] = useState<string>("all")
  const [filterRoom, setFilterRoom] = useState<string>("all")

  const [selectedSubRoomIds, setSelectedSubRoomIds] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [subRoomsToDelete, setSubRoomsToDelete] = useState<string[]>([])

  const [currentUserRecord, setCurrentUserRecord] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"files" | "timeline">("files")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [subRoomToEdit, setSubRoomToEdit] = useState<SubRoom | null>(null)
  
  // États pour la navigation dans les dossiers
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [expandedSubFolders, setExpandedSubFolders] = useState<Set<string>>(new Set())
  
  // Teacher classes mapping (for folder structure)
  const [teacherClasses, setTeacherClasses] = useState<Map<string, string[]>>(new Map())

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = subRooms

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (subRoom) => subRoom.name.toLowerCase().includes(query) || subRoom.custom_name.toLowerCase().includes(query),
      )
    }

    if (filterClass !== "all") {
      filtered = filtered.filter((subRoom) => subRoom.class_ids.includes(filterClass))
    }

    if (filterTeacher !== "all") {
      filtered = filtered.filter((subRoom) => subRoom.teacher_id === filterTeacher)
    }

    if (filterRoom !== "all") {
      filtered = filtered.filter((subRoom) => subRoom.room_id === filterRoom)
    }

    setFilteredSubRooms(filtered)
  }, [searchQuery, subRooms, filterClass, filterTeacher, filterRoom])

  useEffect(() => {
    if (formData.roomId && formData.classIds.length > 0) {
      checkCapacity()
    } else {
      setShowWarning(false)
    }
  }, [formData.roomId, formData.classIds])

  const fetchData = async () => {
    const supabase = createClient()

    const { data: roomsData } = await supabase.from("rooms").select("*").eq("establishment_id", establishmentId)
    if (roomsData) setRooms(roomsData)

    const { data: classesData } = await supabase.from("classes").select("*").eq("establishment_id", establishmentId)
    if (classesData) setClasses(classesData)

    const { data: teachersData } = await supabase.from("teachers").select("*").eq("establishment_id", establishmentId)
    if (teachersData) setTeachers(teachersData)

    await fetchSubRooms()
  }

  const setAvailableOptions = async (supabase: any) => {

    if (userRole === "vie-scolaire") {
      const { data: allTeachers, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .eq("establishment_id", establishmentId)

      const { data: allClasses, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("establishment_id", establishmentId)
        .eq("is_level", false) // Only show actual classes, not custom levels


      if (allTeachers) setAvailableTeachers(allTeachers)
      if (allClasses) setAvailableClasses(allClasses)
      return
    }

    // For teachers and delegates, find their record first
    let currentUserRecord: any = null

    if (userRole === "professeur") {
      const { data: teacherRecord, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("profile_id", userId)
        .maybeSingle()

      currentUserRecord = teacherRecord
    } else if (userRole === "delegue" || userRole === "eco-delegue") {
      const { data: studentRecord, error } = await supabase
        .from("students")
        .select("*")
        .eq("profile_id", userId)
        .maybeSingle()

      currentUserRecord = studentRecord
    }

    if (!currentUserRecord) {
      setAvailableTeachers([])
      setAvailableClasses([])
      return
    }

    // Get classes this user has access to
    let classIds: string[] = []

    if (userRole === "professeur") {
      const { data: teacherClasses } = await supabase
        .from("teacher_classes")
        .select("class_id")
        .eq("teacher_id", currentUserRecord.id)

      classIds = teacherClasses?.map((tc: any) => tc.class_id) || []
    } else if (userRole === "delegue" || userRole === "eco-delegue") {
      if (currentUserRecord.class_id) {
        classIds = [currentUserRecord.class_id]
      }
    }

    // Load classes - filter out custom levels
    if (classIds.length > 0) {
      const { data: userClasses } = await supabase.from("classes").select("*").in("id", classIds).eq("is_level", false) // Exclude custom levels

      if (userClasses) setAvailableClasses(userClasses)
    }

    // Load teachers who teach these classes
    if (classIds.length > 0) {
      const { data: classTeachers } = await supabase
        .from("teacher_classes")
        .select("teacher_id")
        .in("class_id", classIds)

      const teacherIds = [...new Set(classTeachers?.map((tc: any) => tc.teacher_id) || [])]

      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase.from("teachers").select("*").in("id", teacherIds)

        if (teachers) setAvailableTeachers(teachers)
      }
    }

    setCurrentUserRecord(currentUserRecord)
  }

  const checkCapacity = async () => {
    const supabase = createClient()
    const selectedRoom = rooms.find((r) => r.id === formData.roomId)

    if (!selectedRoom) return

    const totalSeats = selectedRoom.config.columns.reduce((total, col) => total + col.tables * col.seatsPerTable, 0)

    const { data: studentsData } = await supabase.from("students").select("id").in("class_id", formData.classIds)

    const studentCount = studentsData?.length || 0

    if (studentCount > totalSeats) {
      setShowWarning(true)
      setWarningMessage(`Attention : ${studentCount} élèves pour ${totalSeats} places disponibles`)
    } else {
      setShowWarning(false)
    }
  }

  const fetchSubRooms = async () => {
    const supabase = createClient()

    let subRoomsQuery = supabase
      .from("sub_rooms")
      .select(`
        *,
        rooms(name, code),
        teachers(first_name, last_name)
      `)
      .eq("establishment_id", establishmentId)

    if (userRole === "professeur") {
      // Get teacher_id first
      const { data: teacherData } = await supabase.from("teachers").select("id").eq("profile_id", userId).maybeSingle()

      if (teacherData) {
        // Get sub_room IDs where teacher is in sub_room_teachers
        const { data: subRoomTeachersData } = await supabase
          .from("sub_room_teachers")
          .select("sub_room_id")
          .eq("teacher_id", teacherData.id)

        const subRoomIds = subRoomTeachersData?.map((srt) => srt.sub_room_id) || []

        // Include: created by me, main teacher, or in sub_room_teachers
        if (subRoomIds.length > 0) {
          subRoomsQuery = subRoomsQuery.or(
            `teacher_id.eq.${teacherData.id},created_by.eq.${userId},id.in.(${subRoomIds.join(",")})`,
          )
        } else {
          subRoomsQuery = subRoomsQuery.or(`teacher_id.eq.${teacherData.id},created_by.eq.${userId}`)
        }
      }
    } else if (userRole === "delegue" || userRole === "eco-delegue") {
      // Delegates need to see sub-rooms containing their class_id in class_ids array
      const { data: studentRecord } = await supabase
        .from("students")
        .select("class_id")
        .eq("profile_id", userId)
        .maybeSingle()

      if (studentRecord?.class_id) {
        subRoomsQuery = subRoomsQuery.contains("class_ids", [studentRecord.class_id])
      } else {
        subRoomsQuery = subRoomsQuery.eq("created_by", userId)
      }
    }
    // vie-scolaire sees all sub-rooms (no additional filter)

    const { data: subRoomsData } = await subRoomsQuery.order("created_at", { ascending: false })
    if (subRoomsData) setSubRooms(subRoomsData)

    await setAvailableOptions(supabase)
    
    // Fetch teacher-class associations for folder structure
    const { data: tcData } = await supabase
      .from("teacher_classes")
      .select("teacher_id, class_id")
    
    if (tcData) {
      const mapping = new Map<string, string[]>()
      tcData.forEach((tc: any) => {
        const existing = mapping.get(tc.teacher_id) || []
        if (!existing.includes(tc.class_id)) {
          mapping.set(tc.teacher_id, [...existing, tc.class_id])
        }
      })
      setTeacherClasses(mapping)
    }
  }
  
  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }
  
  const toggleSubFolder = (subFolderId: string) => {
    setExpandedSubFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subFolderId)) {
        newSet.delete(subFolderId)
      } else {
        newSet.add(subFolderId)
      }
      return newSet
    })
  }
  
  // Organize sub-rooms into folder structure based on role
  const folderStructure = useMemo(() => {
    if (userRole === "vie-scolaire") {
      // VS: Folders by class > sub-folders by teacher > sub-rooms
      const structure: Map<string, Map<string, SubRoom[]>> = new Map()
      
      classes.filter(c => !c.is_level).forEach(cls => {
        structure.set(cls.id, new Map())
      })
      
      subRooms.forEach(subRoom => {
        const classIds = subRoom.class_ids || []
        classIds.forEach(classId => {
          if (!structure.has(classId)) {
            structure.set(classId, new Map())
          }
          const classMap = structure.get(classId)!
          const teacherId = subRoom.teacher_id
          if (!classMap.has(teacherId)) {
            classMap.set(teacherId, [])
          }
          // Avoid duplicates
          const existing = classMap.get(teacherId)!
          if (!existing.find(sr => sr.id === subRoom.id)) {
            classMap.get(teacherId)!.push(subRoom)
          }
        })
      })
      
      return { type: "vie-scolaire" as const, data: structure }
    } else if (userRole === "professeur") {
      // Prof: Folders by class > sub-rooms directly
      const structure: Map<string, SubRoom[]> = new Map()
      
      subRooms.forEach(subRoom => {
        const classIds = subRoom.class_ids || []
        classIds.forEach(classId => {
          if (!structure.has(classId)) {
            structure.set(classId, [])
          }
          const existing = structure.get(classId)!
          if (!existing.find(sr => sr.id === subRoom.id)) {
            structure.get(classId)!.push(subRoom)
          }
        })
      })
      
      return { type: "professeur" as const, data: structure }
    } else {
      // Delegate/Eco-delegate: Folders by teacher > sub-rooms
      const structure: Map<string, SubRoom[]> = new Map()
      
      subRooms.forEach(subRoom => {
        const teacherId = subRoom.teacher_id
        if (!structure.has(teacherId)) {
          structure.set(teacherId, [])
        }
        const existing = structure.get(teacherId)!
        if (!existing.find(sr => sr.id === subRoom.id)) {
          structure.get(teacherId)!.push(subRoom)
        }
      })
      
      return { type: "delegue" as const, data: structure }
    }
  }, [subRooms, classes, userRole])

  const handleToggleClass = (classId: string) => {
    if (formData.isMultiClass) {
      setFormData((prev) => ({
        ...prev,
        classIds: prev.classIds.includes(classId)
          ? prev.classIds.filter((id) => id !== classId)
          : [...prev.classIds, classId],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        classIds: [classId],
      }))
    }
  }

  const openDeleteDialog = (subRoomIds: string[]) => {
    setSubRoomsToDelete(subRoomIds)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSubRooms = async () => {
    try {

      const supabase = createClient()

      // Delete seating assignments first
      const { error: assignmentsError } = await supabase
        .from("seating_assignments")
        .delete()
        .in("sub_room_id", subRoomsToDelete)

      if (assignmentsError) {
        throw assignmentsError
      }

      // Delete sub-rooms
      const { error: subRoomError } = await supabase.from("sub_rooms").delete().in("id", subRoomsToDelete)

      if (subRoomError) {
        throw subRoomError
      }

      toast({
        title: "Succès",
        description: `${subRoomsToDelete.length} sous-salle(s) supprimée(s) avec succès`,
      })

      // Clear selection and refresh
      setSelectedSubRoomIds([])
      setSubRoomsToDelete([])
      await fetchData()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les sous-salles",
        variant: "destructive",
      })
    }
  }

  const toggleSubRoomSelection = (subRoomId: string) => {
    setSelectedSubRoomIds((prev) =>
      prev.includes(subRoomId) ? prev.filter((id) => id !== subRoomId) : [...prev, subRoomId],
    )
  }

  const isVieScolaire = userRole === "vie-scolaire"
  const isTeacher = userRole === "professeur"
  const isDelegate = userRole === "delegue" || userRole === "eco-delegue"
  
  // Only vie-scolaire and teachers can create sub-rooms directly
  // Delegates must use the sandbox (bac à sable) mode
  const canCreateSubRooms = isVieScolaire || isTeacher

  const filterTeachers = userRole === "professeur" ? teachers.filter((t) => t.id === userId) : teachers
  const filterClasses = isDelegate ? availableClasses : classes

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 w-full">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBack?.()}
              className="hover:bg-[#F5F5F6]"
            >
              <ArrowLeft className="h-5 w-5 text-[#29282B]" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#29282B]">
                Plans de classe
              </h1>
              <p className="text-[#29282B]/60 mt-1">
                {subRooms.length} sous-salle{subRooms.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {canCreateSubRooms && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="bg-[#E7A541] hover:bg-[#D4933A] text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer une sous-salle
            </Button>
          )}
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#29282B]/50" />
            <Input
              placeholder="Rechercher une sous-salle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white border-[#D9DADC]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="bg-white border-[#D9DADC]">
                  <SelectValue placeholder="Filtrer par classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {filterClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="bg-white border-[#D9DADC]">
                  <SelectValue placeholder="Filtrer par professeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les professeurs</SelectItem>
                  {filterTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="bg-white border-[#D9DADC]">
                  <SelectValue placeholder="Filtrer par salle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les salles</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-4 gap-2">
          {userRole === "professeur" && currentUserRecord && (
            <>
              <Button
                variant={viewMode === "files" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("files")}
                className={viewMode === "files" ? "bg-[#E7A541] hover:bg-[#D4933A] text-white" : "border-[#D9DADC] hover:border-[#E7A541] hover:bg-[#FDF6E9]"}
              >
                <Folder className="h-4 w-4 mr-1" />
                Fichiers
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className={viewMode === "timeline" ? "bg-[#E7A541] hover:bg-[#D4933A] text-white" : "border-[#D9DADC] hover:border-[#E7A541] hover:bg-[#FDF6E9]"}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Emploi du temps
              </Button>
            </>
          )}
        </div>

        {/* Timeline View for Professors */}
        {viewMode === "timeline" && userRole === "professeur" && currentUserRecord && (
          <ScheduleTimeline
            teacherId={currentUserRecord.id}
            establishmentId={establishmentId}
            onEditSubRoom={(subRoomId) => {
              const subRoom = subRooms.find(s => s.id === subRoomId)
              if (subRoom) {
                setSubRoomToEdit(subRoom)
                setIsEditDialogOpen(true)
              }
            }}
          />
        )}

        {/* Files/Folders View */}
        {viewMode === "files" && (
          <div className="space-y-2">
            {/* VIE SCOLAIRE: Folders by Class > Sub-folders by Teacher > Sub-rooms */}
            {folderStructure.type === "vie-scolaire" && (
              <>
                {Array.from((folderStructure.data as Map<string, Map<string, SubRoom[]>>).entries())
                  .filter(([classId, teacherMap]) => {
                    // Filter by class if selected
                    if (filterClass !== "all" && classId !== filterClass) return false
                    // Filter by teacher if selected
                    if (filterTeacher !== "all") {
                      return teacherMap.has(filterTeacher)
                    }
                    return teacherMap.size > 0
                  })
                  .map(([classId, teacherMap]) => {
                    const cls = classes.find(c => c.id === classId)
                    if (!cls) return null
                    const isExpanded = expandedFolders.has(classId)
                    const totalSubRooms = Array.from(teacherMap.values()).reduce((acc, arr) => acc + arr.length, 0)
                    
                    return (
                      <div key={classId} className="bg-white rounded-lg border border-[#D9DADC] overflow-hidden">
                        {/* Class Folder Header */}
                        <div 
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F5F5F6] transition-colors"
                          onClick={() => toggleFolder(classId)}
                        >
                          <ChevronDown className={`h-4 w-4 text-[#29282B]/50 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-[#E7A541]" />
                          ) : (
                            <Folder className="h-5 w-5 text-[#E7A541]" />
                          )}
                          <span className="font-semibold text-[#29282B]">{cls.name}</span>
                          <Badge variant="secondary" className="ml-auto bg-[#F5F5F6] text-[#29282B]/60">
                            {totalSubRooms} plan(s)
                          </Badge>
                        </div>
                        
                        {/* Teacher Sub-folders */}
                        {isExpanded && (
                          <div className="border-t border-[#D9DADC] bg-[#FAFAFA]">
                            {Array.from(teacherMap.entries())
                              .filter(([teacherId]) => filterTeacher === "all" || teacherId === filterTeacher)
                              .map(([teacherId, teacherSubRooms]) => {
                                const teacher = teachers.find(t => t.id === teacherId)
                                if (!teacher) return null
                                const subFolderId = `${classId}-${teacherId}`
                                const isSubExpanded = expandedSubFolders.has(subFolderId)
                                
                                return (
                                  <div key={teacherId}>
                                    {/* Teacher Sub-folder Header */}
                                    <div 
                                      className="flex items-center gap-3 px-4 py-2 pl-10 cursor-pointer hover:bg-[#F0F0F1] transition-colors"
                                      onClick={() => toggleSubFolder(subFolderId)}
                                    >
                                      <ChevronDown className={`h-3 w-3 text-[#29282B]/50 transition-transform ${isSubExpanded ? '' : '-rotate-90'}`} />
                                      {isSubExpanded ? (
                                        <FolderOpen className="h-4 w-4 text-blue-500" />
                                      ) : (
                                        <Folder className="h-4 w-4 text-blue-500" />
                                      )}
                                      <span className="text-sm text-[#29282B]">
                                        {teacher.first_name} {teacher.last_name}
                                      </span>
                                      <span className="text-xs text-[#29282B]/50 ml-1">({teacher.subject})</span>
                                      <Badge variant="outline" className="ml-auto text-xs">
                                        {teacherSubRooms.length}
                                      </Badge>
                                    </div>
                                    
                                    {/* Sub-rooms Table */}
                                    {isSubExpanded && teacherSubRooms.length > 0 && (
                                      <div className="pl-16 pr-4 pb-3">
                                        <table className="w-full text-sm">
                                          <thead className="bg-[#F5F5F6]">
                                            <tr>
                                              <th className="w-8 px-2 py-1.5"></th>
                                              <th className="px-2 py-1.5 text-left font-medium text-[#29282B]/70 text-xs">Nom</th>
                                              <th className="px-2 py-1.5 text-left font-medium text-[#29282B]/70 text-xs hidden sm:table-cell">Salle</th>
                                              <th className="px-2 py-1.5 text-center font-medium text-[#29282B]/70 text-xs">Classes</th>
                                              <th className="px-2 py-1.5 text-right font-medium text-[#29282B]/70 text-xs">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[#E5E5E5]">
                                            {teacherSubRooms
                                              .filter(sr => filterRoom === "all" || sr.room_id === filterRoom)
                                              .filter(sr => !searchQuery || sr.name.toLowerCase().includes(searchQuery.toLowerCase()) || sr.custom_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                              .map(subRoom => (
                                                <tr 
                                                  key={subRoom.id}
                                                  className="hover:bg-white cursor-pointer transition-colors"
                                                  onClick={() => { setSelectedSubRoom(subRoom); setIsEditorOpen(true) }}
                                                >
                                                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                      type="checkbox"
                                                      checked={selectedSubRoomIds.includes(subRoom.id)}
                                                      onChange={() => toggleSubRoomSelection(subRoom.id)}
                                                      className="w-3.5 h-3.5 rounded border-[#D9DADC]"
                                                    />
                                                  </td>
                                                  <td className="px-2 py-1.5">
                                                    <div className="flex items-center gap-2">
                                                      <FileText className="h-3.5 w-3.5 text-[#29282B]/40" />
                                                      <span className="font-medium text-[#29282B] text-xs">{subRoom.name}</span>
                                                      {subRoom.is_multi_class && (
                                                        <Badge className="text-[9px] px-1 py-0 bg-violet-100 text-violet-700 border-violet-200">Multi</Badge>
                                                      )}
                                                    </div>
                                                  </td>
                                                  <td className="px-2 py-1.5 text-[#29282B]/60 text-xs hidden sm:table-cell">{subRoom.rooms?.name}</td>
                                                  <td className="px-2 py-1.5 text-center">
                                                    <span className="text-xs text-[#E7A541] font-medium">{subRoom.class_ids?.length || 1}</span>
                                                  </td>
                                                  <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-1">
                                                      <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 w-6 p-0 hover:bg-[#FDF6E9]"
                                                        onClick={() => { setSubRoomToEdit(subRoom); setIsEditDialogOpen(true) }}
                                                      >
                                                        <Pencil className="h-3 w-3" />
                                                      </Button>
                                                      <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 w-6 p-0 hover:bg-[#FDF6E9]"
                                                        onClick={() => { setSelectedSubRoom(subRoom); setIsEditorOpen(true) }}
                                                      >
                                                        <Eye className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </>
            )}
            
            {/* PROFESSEUR: Folders by Class > Sub-rooms directly */}
            {folderStructure.type === "professeur" && (
              <>
                {Array.from((folderStructure.data as Map<string, SubRoom[]>).entries())
                  .filter(([classId]) => filterClass === "all" || classId === filterClass)
                  .map(([classId, classSubRooms]) => {
                    const cls = classes.find(c => c.id === classId)
                    if (!cls) return null
                    const isExpanded = expandedFolders.has(classId)
                    const filteredRooms = classSubRooms
                      .filter(sr => filterRoom === "all" || sr.room_id === filterRoom)
                      .filter(sr => !searchQuery || sr.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    
                    return (
                      <div key={classId} className="bg-white rounded-lg border border-[#D9DADC] overflow-hidden">
                        {/* Class Folder Header */}
                        <div 
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F5F5F6] transition-colors"
                          onClick={() => toggleFolder(classId)}
                        >
                          <ChevronDown className={`h-4 w-4 text-[#29282B]/50 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-[#E7A541]" />
                          ) : (
                            <Folder className="h-5 w-5 text-[#E7A541]" />
                          )}
                          <span className="font-semibold text-[#29282B]">{cls.name}</span>
                          <Badge variant="secondary" className="ml-auto bg-[#F5F5F6] text-[#29282B]/60">
                            {filteredRooms.length} plan(s)
                          </Badge>
                        </div>
                        
                        {/* Sub-rooms Table */}
                        {isExpanded && filteredRooms.length > 0 && (
                          <div className="border-t border-[#D9DADC] bg-[#FAFAFA] px-4 py-3">
                            <table className="w-full text-sm">
                              <thead className="bg-[#F5F5F6]">
                                <tr>
                                  <th className="w-8 px-2 py-1.5"></th>
                                  <th className="px-2 py-1.5 text-left font-medium text-[#29282B]/70 text-xs">Nom</th>
                                  <th className="px-2 py-1.5 text-left font-medium text-[#29282B]/70 text-xs hidden sm:table-cell">Salle</th>
                                  <th className="px-2 py-1.5 text-center font-medium text-[#29282B]/70 text-xs">Classes</th>
                                  <th className="px-2 py-1.5 text-right font-medium text-[#29282B]/70 text-xs">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E5E5]">
                                {filteredRooms.map(subRoom => (
                                  <tr 
                                    key={subRoom.id}
                                    className="hover:bg-white cursor-pointer transition-colors"
                                    onClick={() => { setSelectedSubRoom(subRoom); setIsEditorOpen(true) }}
                                  >
                                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={selectedSubRoomIds.includes(subRoom.id)}
                                        onChange={() => toggleSubRoomSelection(subRoom.id)}
                                        className="w-3.5 h-3.5 rounded border-[#D9DADC]"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-[#29282B]/40" />
                                        <span className="font-medium text-[#29282B] text-xs">{subRoom.name}</span>
                                        {subRoom.is_multi_class && (
                                          <Badge className="text-[9px] px-1 py-0 bg-violet-100 text-violet-700 border-violet-200">Multi</Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-[#29282B]/60 text-xs hidden sm:table-cell">{subRoom.rooms?.name}</td>
                                    <td className="px-2 py-1.5 text-center">
                                      <span className="text-xs text-[#E7A541] font-medium">{subRoom.class_ids?.length || 1}</span>
                                    </td>
                                    <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex justify-end gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 w-6 p-0 hover:bg-[#FDF6E9]"
                                          onClick={() => { setSubRoomToEdit(subRoom); setIsEditDialogOpen(true) }}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 w-6 p-0 hover:bg-[#FDF6E9]"
                                          onClick={() => { setSelectedSubRoom(subRoom); setIsEditorOpen(true) }}
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </>
            )}
            
            {/* DELEGUE/ECO-DELEGUE: Folders by Teacher > Sub-rooms */}
            {folderStructure.type === "delegue" && (
              <>
                {Array.from((folderStructure.data as Map<string, SubRoom[]>).entries())
                  .filter(([teacherId]) => filterTeacher === "all" || teacherId === filterTeacher)
                  .map(([teacherId, teacherSubRooms]) => {
                    const teacher = teachers.find(t => t.id === teacherId)
                    if (!teacher) return null
                    const isExpanded = expandedFolders.has(teacherId)
                    const filteredRooms = teacherSubRooms
                      .filter(sr => filterRoom === "all" || sr.room_id === filterRoom)
                      .filter(sr => !searchQuery || sr.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    
                    return (
                      <div key={teacherId} className="bg-white rounded-lg border border-[#D9DADC] overflow-hidden">
                        {/* Teacher Folder Header */}
                        <div 
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F5F5F6] transition-colors"
                          onClick={() => toggleFolder(teacherId)}
                        >
                          <ChevronDown className={`h-4 w-4 text-[#29282B]/50 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-[#E7A541]" />
                          ) : (
                            <Folder className="h-5 w-5 text-[#E7A541]" />
                          )}
                          <span className="font-semibold text-[#29282B]">
                            {teacher.first_name} {teacher.last_name}
                          </span>
                          <span className="text-sm text-[#29282B]/50">({teacher.subject})</span>
                          <Badge variant="secondary" className="ml-auto bg-[#F5F5F6] text-[#29282B]/60">
                            {filteredRooms.length} plan(s)
                          </Badge>
                        </div>
                        
                        {/* Sub-rooms Table */}
                        {isExpanded && filteredRooms.length > 0 && (
                          <div className="border-t border-[#D9DADC] bg-[#FAFAFA] px-4 py-3">
                            <table className="w-full text-sm">
                              <thead className="bg-[#F5F5F6]">
                                <tr>
                                  <th className="px-2 py-1.5 text-left font-medium text-[#29282B]/70 text-xs">Nom</th>
                                  <th className="px-2 py-1.5 text-left font-medium text-[#29282B]/70 text-xs hidden sm:table-cell">Salle</th>
                                  <th className="px-2 py-1.5 text-right font-medium text-[#29282B]/70 text-xs">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E5E5]">
                                {filteredRooms.map(subRoom => (
                                  <tr 
                                    key={subRoom.id}
                                    className="hover:bg-white cursor-pointer transition-colors"
                                    onClick={() => { setSelectedSubRoom(subRoom); setIsEditorOpen(true) }}
                                  >
                                    <td className="px-2 py-1.5">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-[#29282B]/40" />
                                        <span className="font-medium text-[#29282B] text-xs">{subRoom.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-[#29282B]/60 text-xs hidden sm:table-cell">{subRoom.rooms?.name}</td>
                                    <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 hover:bg-[#FDF6E9]"
                                        onClick={() => { setSelectedSubRoom(subRoom); setIsEditorOpen(true) }}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </>
            )}
            
            {/* Empty State */}
            {((folderStructure.type === "vie-scolaire" && Array.from((folderStructure.data as Map<string, Map<string, SubRoom[]>>).values()).every(m => m.size === 0)) ||
              (folderStructure.type === "professeur" && (folderStructure.data as Map<string, SubRoom[]>).size === 0) ||
              (folderStructure.type === "delegue" && (folderStructure.data as Map<string, SubRoom[]>).size === 0)) && (
              <Card className="bg-white border-[#D9DADC]">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#FDF6E9] flex items-center justify-center mx-auto mb-4">
                    <Folder className="w-10 h-10 text-[#E7A541]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#29282B] mb-2">
                    Aucun plan de classe
                  </h3>
                  <p className="text-[#29282B]/60">
                    {isVieScolaire || isTeacher 
                      ? "Commencez par créer votre premier plan de classe"
                      : "Aucun plan de classe disponible pour l'instant"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <CreateSubRoomDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            fetchSubRooms()
            toast({
              title: "Succès",
              description: "Sous-salle créée avec succès",
            })
          }}
          establishmentId={establishmentId}
          userRole={userRole}
          userId={userId}
        />

        {isEditorOpen && selectedSubRoom && (
          <SeatingPlanEditor
            subRoom={selectedSubRoom}
            room={rooms.find(r => r.id === selectedSubRoom.room_id) || null}
            onBack={() => {
              setIsEditorOpen(false)
              setSelectedSubRoom(null)
            }}
            userRole={userRole}
            userId={userId}
            establishmentId={establishmentId}
          />
        )}

        {/* Delete action bar - only for users who can modify */}
        {(isVieScolaire || isTeacher) && selectedSubRoomIds.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => openDeleteDialog(selectedSubRoomIds)}
              className="shadow-xl"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Supprimer {selectedSubRoomIds.length} sous-salle(s)
            </Button>
          </div>
        )}

        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteSubRooms}
          itemCount={subRoomsToDelete.length}
          itemType="sous-salle"
        />

        <EditSubRoomDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          subRoom={subRoomToEdit}
          onSuccess={() => {
            fetchSubRooms()
            setSubRoomToEdit(null)
          }}
        />
      </div>

      <Toaster />
    </div>
  )
}
