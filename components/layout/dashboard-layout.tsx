"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { AppFooter } from "@/components/layout/app-footer"
import type { UserRole } from "@/lib/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
  userId: string
  establishmentId: string
  activeSection: string
  onNavigate: (section: string) => void
  onLogout: () => void
  onOpenSettings: () => void
  notificationCount?: number
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userId,
  establishmentId,
  activeSection,
  onNavigate,
  onLogout,
  onOpenSettings,
  notificationCount = 0,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Listen for sidebar collapse state from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem("sidebar-collapsed") === "true"
      setIsCollapsed(collapsed)
    }
    
    // Check initial state
    handleStorageChange()
    
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        onLogout={onLogout}
        notificationCount={notificationCount}
        onNavigate={onNavigate}
        activeSection={activeSection}
      />

      {/* Top Bar */}
      <TopBar
        userName={userName}
        userRole={userRole}
        userId={userId}
        establishmentId={establishmentId}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        isCollapsed={isCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          isCollapsed ? "pl-[70px]" : "pl-[260px]"
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
