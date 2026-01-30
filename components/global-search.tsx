"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  User, 
  Users, 
  GraduationCap, 
  DoorOpen, 
  LayoutGrid,
  Loader2,
  ArrowRight
} from "lucide-react"
import { useRouter } from "next/navigation"

interface SearchResult {
  type: "student" | "teacher" | "class" | "room" | "sub_room"
  id: string
  title: string
  subtitle?: string
  extra?: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  establishmentId: string
}

const TYPE_CONFIG = {
  student: { icon: User, label: "Élève", color: "bg-blue-100 text-blue-700", path: "/dashboard/students" },
  teacher: { icon: GraduationCap, label: "Professeur", color: "bg-purple-100 text-purple-700", path: "/dashboard/teachers" },
  class: { icon: Users, label: "Classe", color: "bg-green-100 text-green-700", path: "/dashboard/classes" },
  room: { icon: DoorOpen, label: "Salle", color: "bg-amber-100 text-amber-700", path: "/dashboard/rooms" },
  sub_room: { icon: LayoutGrid, label: "Sous-salle", color: "bg-indigo-100 text-indigo-700", path: "/dashboard/seating-plan" }
}

export function GlobalSearch({ open, onOpenChange, establishmentId }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    const searchResults: SearchResult[] = []

    try {
      // Recherche élèves
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name, class_name, email")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5)

      students?.forEach(s => {
        searchResults.push({
          type: "student",
          id: s.id,
          title: `${s.first_name} ${s.last_name}`,
          subtitle: s.class_name || undefined,
          extra: s.email || undefined
        })
      })

      // Recherche professeurs
      const { data: teachers } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, subject, email")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`)
        .limit(5)

      teachers?.forEach(t => {
        searchResults.push({
          type: "teacher",
          id: t.id,
          title: `${t.first_name} ${t.last_name}`,
          subtitle: t.subject || undefined,
          extra: t.email || undefined
        })
      })

      // Recherche classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, description")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5)

      classes?.forEach(c => {
        searchResults.push({
          type: "class",
          id: c.id,
          title: c.name,
          subtitle: c.description || undefined
        })
      })

      // Recherche salles
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, name, code")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)
        .or(`name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%`)
        .limit(5)

      rooms?.forEach(r => {
        searchResults.push({
          type: "room",
          id: r.id,
          title: r.name,
          subtitle: `Code: ${r.code}`
        })
      })

      // Recherche sous-salles
      const { data: subRooms } = await supabase
        .from("sub_rooms")
        .select("id, name, custom_name, rooms(name)")
        .eq("establishment_id", establishmentId)
        .eq("is_deleted", false)
        .or(`name.ilike.%${searchQuery}%,custom_name.ilike.%${searchQuery}%`)
        .limit(5)

      subRooms?.forEach((sr: any) => {
        searchResults.push({
          type: "sub_room",
          id: sr.id,
          title: sr.custom_name || sr.name,
          subtitle: sr.rooms?.name
        })
      })

      setResults(searchResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [establishmentId, supabase])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query) {
        search(query)
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [query, search])

  function handleSelect(result: SearchResult) {
    const config = TYPE_CONFIG[result.type]
    router.push(config.path)
    onOpenChange(false)
    setQuery("")
    setResults([])
  }

  // Raccourci clavier
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un élève, professeur, classe, salle..."
              className="border-0 shadow-none focus-visible:ring-0 text-lg"
              autoFocus
            />
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {query.length < 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Tapez au moins 2 caractères pour rechercher</p>
              <p className="text-sm mt-2">
                Raccourci: <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">⌘K</kbd> ou{" "}
                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+K</kbd>
              </p>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Aucun résultat pour "{query}"</p>
            </div>
          ) : (
            <div className="p-2">
              {/* Grouper par type */}
              {Object.entries(TYPE_CONFIG).map(([type, config]) => {
                const typeResults = results.filter(r => r.type === type)
                if (typeResults.length === 0) return null

                const Icon = config.icon
                return (
                  <div key={type} className="mb-4">
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {config.label}s
                    </div>
                    {typeResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                      >
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                          )}
                        </div>
                        {result.extra && (
                          <span className="text-xs text-muted-foreground hidden sm:block">{result.extra}</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
