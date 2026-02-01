"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Settings, LogOut, Moon, Sun, Command } from "lucide-react"
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
          "fixed top-0 right-0 z-30 h-16 border-b border-[#D9DADC] bg-white transition-all duration-300",
          isCollapsed ? "left-[70px]" : "left-[260px]"
        )}
      >
        <div className="flex h-full items-center justify-between px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <Button
              variant="outline"
              className="w-full justify-start text-[#29282B]/50 bg-[#F5F5F6] border-[#D9DADC] hover:bg-[#EBEBED] hover:border-[#D9DADC]"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Rechercher...</span>
              <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[#D9DADC] bg-white px-1.5 font-mono text-[10px] font-medium text-[#29282B]/50">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {/* Notifications */}
            <NotificationsDropdown userId={userId} establishmentId={establishmentId} />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-2 px-2 hover:bg-[#F5F5F6]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#E7A541] flex items-center justify-center text-white text-xs font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-[#29282B] leading-none">{userName}</p>
                    <p className="text-xs text-[#29282B]/60">{getRoleLabel(userRole)}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-[#D9DADC]">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-[#29282B]">{userName}</p>
                  <p className="text-xs text-[#29282B]/60">{getRoleLabel(userRole)}</p>
                </div>
                <DropdownMenuSeparator className="bg-[#D9DADC]" />
                <DropdownMenuItem onClick={onOpenSettings} className="text-[#29282B] focus:bg-[#F5F5F6] focus:text-[#29282B]">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#D9DADC]" />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
