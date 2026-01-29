// This allows admin users to work without Supabase dependency

export interface AdminClass {
  id: string
  name: string
  level: string
  establishment_id: string
  created_at: string
}

export interface AdminStudent {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  class_name: string
  role: "delegue" | "eco-delegue"
  can_create_subrooms: boolean
  establishment_id: string
  created_at: string
}

export interface AdminTeacher {
  id: string
  first_name: string
  last_name: string
  email: string
  subject: string
  classes: string[]
  establishment_id: string
  created_at: string
}

export interface AdminRoom {
  id: string
  establishment_id: string
  name: string
  code: string
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

const STORAGE_KEYS = {
  CLASSES: "admin_classes",
  STUDENTS: "admin_students",
  TEACHERS: "admin_teachers",
  ROOMS: "admin_rooms",
}

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

export const adminStorage = {
  // Classes
  getClasses: (): AdminClass[] => getFromStorage<AdminClass>(STORAGE_KEYS.CLASSES),
  addClass: (classData: Omit<AdminClass, "id" | "created_at">): AdminClass => {
    const classes = getFromStorage<AdminClass>(STORAGE_KEYS.CLASSES)
    const newClass: AdminClass = {
      ...classData,
      id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    }
    classes.push(newClass)
    saveToStorage(STORAGE_KEYS.CLASSES, classes)
    return newClass
  },
  updateClass: (id: string, updates: Partial<Omit<AdminClass, "id" | "created_at">>): AdminClass | null => {
    const classes = getFromStorage<AdminClass>(STORAGE_KEYS.CLASSES)
    const index = classes.findIndex((c) => c.id === id)
    if (index === -1) return null
    classes[index] = { ...classes[index], ...updates }
    saveToStorage(STORAGE_KEYS.CLASSES, classes)
    return classes[index]
  },
  deleteClass: (id: string): void => {
    const classes = getFromStorage<AdminClass>(STORAGE_KEYS.CLASSES)
    saveToStorage(
      STORAGE_KEYS.CLASSES,
      classes.filter((c) => c.id !== id),
    )
  },

  // Students
  getStudents: (): AdminStudent[] => getFromStorage<AdminStudent>(STORAGE_KEYS.STUDENTS),
  addStudent: (studentData: Omit<AdminStudent, "id" | "created_at">): AdminStudent => {
    const students = getFromStorage<AdminStudent>(STORAGE_KEYS.STUDENTS)
    const newStudent: AdminStudent = {
      ...studentData,
      id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    }
    students.push(newStudent)
    saveToStorage(STORAGE_KEYS.STUDENTS, students)
    return newStudent
  },
  updateStudent: (id: string, updates: Partial<Omit<AdminStudent, "id" | "created_at">>): AdminStudent | null => {
    const students = getFromStorage<AdminStudent>(STORAGE_KEYS.STUDENTS)
    const index = students.findIndex((s) => s.id === id)
    if (index === -1) return null
    students[index] = { ...students[index], ...updates }
    saveToStorage(STORAGE_KEYS.STUDENTS, students)
    return students[index]
  },
  deleteStudent: (id: string): void => {
    const students = getFromStorage<AdminStudent>(STORAGE_KEYS.STUDENTS)
    saveToStorage(
      STORAGE_KEYS.STUDENTS,
      students.filter((s) => s.id !== id),
    )
  },

  // Teachers
  getTeachers: (): AdminTeacher[] => getFromStorage<AdminTeacher>(STORAGE_KEYS.TEACHERS),
  addTeacher: (teacherData: Omit<AdminTeacher, "id" | "created_at">): AdminTeacher => {
    const teachers = getFromStorage<AdminTeacher>(STORAGE_KEYS.TEACHERS)
    const newTeacher: AdminTeacher = {
      ...teacherData,
      id: `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    }
    teachers.push(newTeacher)
    saveToStorage(STORAGE_KEYS.TEACHERS, teachers)
    return newTeacher
  },
  updateTeacher: (id: string, updates: Partial<Omit<AdminTeacher, "id" | "created_at">>): AdminTeacher | null => {
    const teachers = getFromStorage<AdminTeacher>(STORAGE_KEYS.TEACHERS)
    const index = teachers.findIndex((t) => t.id === id)
    if (index === -1) return null
    teachers[index] = { ...teachers[index], ...updates }
    saveToStorage(STORAGE_KEYS.TEACHERS, teachers)
    return teachers[index]
  },
  deleteTeacher: (id: string): void => {
    const teachers = getFromStorage<AdminTeacher>(STORAGE_KEYS.TEACHERS)
    saveToStorage(
      STORAGE_KEYS.TEACHERS,
      teachers.filter((t) => t.id !== id),
    )
  },

  // Rooms
  getRooms: (): AdminRoom[] => getFromStorage<AdminRoom>(STORAGE_KEYS.ROOMS),
  addRoom: (roomData: Omit<AdminRoom, "id" | "created_at" | "updated_at">): AdminRoom => {
    const rooms = getFromStorage<AdminRoom>(STORAGE_KEYS.ROOMS)
    const newRoom: AdminRoom = {
      ...roomData,
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    rooms.push(newRoom)
    saveToStorage(STORAGE_KEYS.ROOMS, rooms)
    return newRoom
  },
  updateRoom: (id: string, updates: Partial<Omit<AdminRoom, "id" | "created_at">>): AdminRoom | null => {
    const rooms = getFromStorage<AdminRoom>(STORAGE_KEYS.ROOMS)
    const index = rooms.findIndex((r) => r.id === id)
    if (index === -1) return null
    rooms[index] = { ...rooms[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(STORAGE_KEYS.ROOMS, rooms)
    return rooms[index]
  },
  deleteRoom: (id: string): void => {
    const rooms = getFromStorage<AdminRoom>(STORAGE_KEYS.ROOMS)
    saveToStorage(
      STORAGE_KEYS.ROOMS,
      rooms.filter((r) => r.id !== id),
    )
  },
}
