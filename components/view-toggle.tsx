"use client"

import { LayoutGrid, List, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ViewToggleProps {
  view: "grid" | "list"
  onViewChange: (view: "grid" | "list") => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("grid")}
        className={cn(
          "h-8 px-3 rounded-md transition-all",
          view === "grid" 
            ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400" 
            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        )}
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        Cartes
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("list")}
        className={cn(
          "h-8 px-3 rounded-md transition-all",
          view === "list" 
            ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400" 
            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        )}
      >
        <Table2 className="h-4 w-4 mr-1.5" />
        Tableau
      </Button>
    </div>
  )
}
