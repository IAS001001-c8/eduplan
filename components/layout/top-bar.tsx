"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, User, Settings, LogOut, Moon, Sun, Command } from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { GlobalSearch } from "@/components/global-search"
import type { UserRole } from "@/lib/types"

interface TopBarProps {
  userName: string
  userRole: UserRole
  userId: string
  establishmentId: string
  onLogout: () => void
  onOpenSettings: () => void
  isCollapsed?: boolean
}

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case "vie-scolaire":
      return "Vie Scolaire"
    case "professeur":
      return "Professeur"
    case "delegue":
      return "Délégué"
    case "eco-delegue":
      return "Éco-délégué"
    default:
      return "Utilisateur"
  }
}

const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case "vie-scolaire":
      return "bg-indigo-500"
    case "professeur":
      return "bg-emerald-500"
    case "delegue":
    case "eco-delegue":
      return "bg-sky-500"
    default:
      return "bg-slate-500"
  }
}

export function TopBar({
  userName,
  userRole,
  userId,
  establishmentId,
  onLogout,
  onOpenSettings,
  isCollapsed = false,
}: TopBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm transition-all duration-300",
          isCollapsed ? "left-[70px]" : "left-[260px]"
        )}
      >
        <div className="flex h-full items-center justify-between px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <Button
              variant="outline"
              className="w-full justify-start text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Rechercher...</span>
              <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-500">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notifications */}
            <NotificationsDropdown userId={userId} establishmentId={establishmentId} />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium", getRoleColor(userRole))}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(userRole)}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(userRole)}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        establishmentId={establishmentId}
      />
    </>
  )
}
