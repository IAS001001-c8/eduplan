"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  School,
  LayoutGrid,
  Lightbulb,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react"
import type { UserRole } from "@/lib/types"

interface SidebarProps {
  userRole: UserRole
  userName: string
  onLogout: () => void
  notificationCount?: number
  onNavigate: (section: string) => void
  activeSection: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    roles: ["vie-scolaire", "professeur", "delegue", "eco-delegue"],
  },
  {
    id: "students",
    label: "Élèves",
    icon: Users,
    roles: ["vie-scolaire", "professeur", "delegue", "eco-delegue"],
  },
  {
    id: "teachers",
    label: "Professeurs",
    icon: GraduationCap,
    roles: ["vie-scolaire", "professeur", "delegue", "eco-delegue"],
  },
  {
    id: "classes",
    label: "Classes",
    icon: BookOpen,
    roles: ["vie-scolaire"],
  },
  {
    id: "rooms",
    label: "Salles",
    icon: School,
    roles: ["vie-scolaire", "professeur", "delegue", "eco-delegue"],
  },
  {
    id: "seating-plan",
    label: "Plans de classe",
    icon: LayoutGrid,
    roles: ["vie-scolaire", "professeur", "delegue", "eco-delegue"],
  },
  {
    id: "sandbox",
    label: "Bac à sable",
    icon: Lightbulb,
    roles: ["vie-scolaire", "professeur", "delegue", "eco-delegue"],
  },
]

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

export function Sidebar({
  userRole,
  userName,
  onLogout,
  notificationCount = 0,
  onNavigate,
  activeSection,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole))

  // Custom labels based on role
  const getItemLabel = (item: NavItem): string => {
    if (item.id === "students") {
      if (userRole === "professeur") return "Mes élèves"
      if (userRole === "delegue" || userRole === "eco-delegue") return "Ma classe"
    }
    if (item.id === "teachers") {
      if (userRole === "professeur") return "Mes collègues"
      if (userRole === "delegue" || userRole === "eco-delegue") return "Mes professeurs"
    }
    if (item.id === "sandbox") {
      if (userRole === "delegue" || userRole === "eco-delegue") return "Mes propositions"
    }
    return item.label
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={cn(
            "flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold", getRoleColor(userRole))}>
                  E
                </div>
                <span className="font-semibold text-lg text-slate-900 dark:text-white">EduPlan</span>
              </div>
            )}
            {isCollapsed && (
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold", getRoleColor(userRole))}>
                E
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 shrink-0", isCollapsed && "absolute -right-3 top-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm")}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* User Info */}
          <div className={cn(
            "border-b border-slate-200 dark:border-slate-800 p-4",
            isCollapsed && "flex justify-center"
          )}>
            {!isCollapsed ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(userRole)}</p>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium", getRoleColor(userRole))}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{userName}</p>
                  <p className="text-xs text-slate-400">{getRoleLabel(userRole)}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                const label = getItemLabel(item)
                const showBadge = item.id === "sandbox" && notificationCount > 0

                const button = (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11 transition-all",
                      isCollapsed && "justify-center px-0",
                      isActive && "bg-slate-100 dark:bg-slate-800 font-medium",
                      !isActive && "hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                    onClick={() => onNavigate(item.id)}
                  >
                    <div className="relative">
                      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-500")} />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-medium text-white flex items-center justify-center">
                          {notificationCount > 9 ? "9+" : notificationCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className={cn("truncate", isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                        {label}
                      </span>
                    )}
                  </Button>
                )

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {label}
                        {showBadge && (
                          <span className="h-5 w-5 rounded-full bg-rose-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {notificationCount}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return button
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className={cn(
            "border-t border-slate-200 dark:border-slate-800 p-3 space-y-1",
            isCollapsed && "flex flex-col items-center"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                    isCollapsed && "justify-center px-0"
                  )}
                  onClick={() => onNavigate("settings")}
                >
                  <Settings className="h-5 w-5" />
                  {!isCollapsed && <span>Paramètres</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Paramètres</TooltipContent>}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950",
                    isCollapsed && "justify-center px-0"
                  )}
                  onClick={onLogout}
                >
                  <LogOut className="h-5 w-5" />
                  {!isCollapsed && <span>Déconnexion</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Déconnexion</TooltipContent>}
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
