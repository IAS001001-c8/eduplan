"use client"

import { useState } from "react"
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
  Sliders,
} from "lucide-react"
import Image from "next/image"
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

  const handleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-[#D9DADC] bg-white transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div className={cn(
            "flex h-16 items-center border-b border-[#D9DADC] px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logo-eduplan.png"
                  alt="EduPlan"
                  width={130}
                  height={45}
                  className="h-9 w-auto"
                />
              </div>
            )}
            {isCollapsed && (
              <Image
                src="/images/logo-eduplan.png"
                alt="EduPlan"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 shrink-0 text-[#29282B]/60 hover:text-[#E7A541] hover:bg-[#FDF6E9]",
                isCollapsed && "absolute -right-3 top-6 bg-white border border-[#D9DADC] rounded-full shadow-sm"
              )}
              onClick={handleCollapse}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* User Info */}
          <div className={cn(
            "border-b border-[#D9DADC] p-4",
            isCollapsed && "flex justify-center"
          )}>
            {!isCollapsed ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#29282B] truncate">{userName}</p>
                <p className="text-xs text-[#29282B]/60">{getRoleLabel(userRole)}</p>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-9 h-9 rounded-full bg-[#E7A541] flex items-center justify-center text-white text-sm font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{userName}</p>
                  <p className="text-xs text-[#29282B]/60">{getRoleLabel(userRole)}</p>
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
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-11 transition-all",
                      isCollapsed && "justify-center px-0",
                      isActive && "bg-[#FDF6E9] text-[#E7A541] font-medium hover:bg-[#FDF6E9]",
                      !isActive && "text-[#29282B]/70 hover:bg-[#F5F5F6] hover:text-[#29282B]"
                    )}
                    onClick={() => onNavigate(item.id)}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-[#E7A541]" : "text-[#29282B]/50"
                      )} />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                          {notificationCount > 9 ? "9+" : notificationCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="truncate">
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
                          <span className="h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
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
            "border-t border-[#D9DADC] p-3 space-y-1",
            isCollapsed && "flex flex-col items-center"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-[#29282B]/70 hover:text-[#29282B] hover:bg-[#F5F5F6]",
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
                    "w-full justify-start gap-3 h-10 text-red-600 hover:text-red-700 hover:bg-red-50",
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
