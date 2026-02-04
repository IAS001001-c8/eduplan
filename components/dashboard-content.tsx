"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { clearUserSession } from "@/lib/custom-auth"
import { clearAdminSession, isAdminSession } from "@/lib/admin-auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Key } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types"

// Layout Components
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { AppFooter } from "@/components/layout/app-footer"
import { cn } from "@/lib/utils"

// Dashboard Components
import { VieScolaireDashboard } from "@/components/dashboards/vie-scolaire-dashboard"
import { ProfesseurDashboard } from "@/components/dashboards/professeur-dashboard"
import { DelegueDashboard } from "@/components/dashboards/delegue-dashboard"

// Management Components
import { StudentsManagement } from "@/components/students-management"
import { TeachersManagement } from "@/components/teachers-management"
import { ClassesManagement } from "@/components/classes-management"
import { RoomsManagement } from "@/components/rooms-management"
import { SeatingPlanManagement } from "@/components/seating-plan-management"
import { SandboxManagement } from "@/components/sandbox-management"
import { EstablishmentSettings } from "@/components/establishment-settings"

interface DashboardContentProps {
  user: User
  profile: Profile
}

type SectionType = "home" | "students" | "teachers" | "classes" | "rooms" | "seating-plan" | "sandbox" | "settings" | "establishment-settings"

export function DashboardContent({ user, profile }: DashboardContentProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionType>("home")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsData, setSettingsData] = useState({
    username: "",
    password: "",
  })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }
  }, [])

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  // Fetch notification count for sandbox
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (profile.role === "professeur") {
        const supabase = createClient()
        const { data: teacher } = await supabase
          .from("teachers")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle()

        if (teacher) {
          const { count } = await supabase
            .from("sub_room_proposals")
            .select("id", { count: "exact", head: true })
            .eq("teacher_id", teacher.id)
            .eq("status", "pending")
            .eq("is_submitted", true)

          setNotificationCount(count || 0)
        }
      }
    }

    fetchNotificationCount()
  }, [profile.id, profile.role])

  function generateStrongPassword(length = 8): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "!@#$%&*"

    const allChars = lowercase + uppercase + numbers + symbols

    let password = ""
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    // Clear custom auth session
    clearUserSession()

    if (isAdminSession()) {
      clearAdminSession()
    }

    // Also clear Supabase session if exists
    const supabase = createClient()
    await supabase.auth.signOut()

    router.push("/auth/login")
    router.refresh()
  }

  const openSettings = async () => {
    const supabase = createClient()

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("username, password_hash")
      .eq("id", profile.id)
      .maybeSingle()

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les identifiants actuels",
        variant: "destructive",
      })
      return
    }

    if (!profileData) {
      setSettingsData({
        username: profile.username || `${profile.first_name?.toLowerCase()}.${profile.last_name?.toLowerCase()}`,
        password: "",
      })
    } else {
      setSettingsData({
        username: profileData.username || "",
        password: "",
      })
    }

    setIsSettingsOpen(true)
  }

  const handleUpdateCredentials = async () => {
    if (!settingsData.username || settingsData.username.trim() === "") {
      toast({
        title: "Erreur",
        description: "L'identifiant ne peut pas être vide",
        variant: "destructive",
      })
      return
    }

    const supabase = createClient()

    if (settingsData.password !== "") {
      const { data: hashedPassword, error: hashError } = await supabase.rpc("hash_password", {
        password: settingsData.password,
      })

      if (hashError) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les identifiants",
          variant: "destructive",
        })
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: settingsData.username,
          password_hash: hashedPassword,
        })
        .eq("id", profile.id)

      if (updateError) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les identifiants",
          variant: "destructive",
        })
        return
      }
    } else {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: settingsData.username,
        })
        .eq("id", profile.id)

      if (updateError) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les identifiants",
          variant: "destructive",
        })
        return
      }
    }

    toast({
      title: "Succès",
      description: "Identifiants mis à jour avec succès",
    })
    setIsSettingsOpen(false)
  }

  const handleNavigate = (section: string) => {
    if (section === "settings") {
      openSettings()
      return
    }
    setActiveSection(section as SectionType)
  }

  const userName = profile.first_name && profile.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : profile.username || "Utilisateur"

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case "students":
        return (
          <StudentsManagement
            establishmentId={profile.establishment_id}
            userRole={profile.role}
            userId={profile.id}
            onBack={() => setActiveSection("home")}
          />
        )
      case "teachers":
        return (
          <TeachersManagement
            establishmentId={profile.establishment_id}
            userRole={profile.role}
            userId={profile.id}
            onBack={() => setActiveSection("home")}
          />
        )
      case "classes":
        return (
          <ClassesManagement
            establishmentId={profile.establishment_id}
            onBack={() => setActiveSection("home")}
          />
        )
      case "rooms":
        return (
          <RoomsManagement
            establishmentId={profile.establishment_id}
            userRole={profile.role}
            userId={profile.id}
            onBack={() => setActiveSection("home")}
          />
        )
      case "seating-plan":
        return (
          <SeatingPlanManagement
            establishmentId={profile.establishment_id}
            userRole={profile.role}
            userId={profile.id}
            onBack={() => setActiveSection("home")}
          />
        )
      case "sandbox":
        return (
          <SandboxManagement
            establishmentId={profile.establishment_id}
            userRole={profile.role}
            userId={profile.id}
            onBack={() => setActiveSection("home")}
          />
        )
      case "establishment-settings":
        return (
          <EstablishmentSettings
            establishmentId={profile.establishment_id}
            onBack={() => setActiveSection("home")}
          />
        )
      case "home":
      default:
        return renderDashboard()
    }
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (profile.role) {
      case "vie-scolaire":
        return (
          <VieScolaireDashboard
            establishmentId={profile.establishment_id}
            onNavigate={handleNavigate}
          />
        )
      case "professeur":
        return (
          <ProfesseurDashboard
            establishmentId={profile.establishment_id}
            userId={profile.id}
            userName={userName}
            onNavigate={handleNavigate}
          />
        )
      case "delegue":
      case "eco-delegue":
        return (
          <DelegueDashboard
            establishmentId={profile.establishment_id}
            userId={profile.id}
            userName={userName}
            onNavigate={handleNavigate}
          />
        )
      default:
        return <div>Rôle non reconnu</div>
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sidebar */}
      <Sidebar
        userRole={profile.role}
        userName={userName}
        onLogout={handleLogout}
        notificationCount={notificationCount}
        onNavigate={handleNavigate}
        activeSection={activeSection}
      />

      {/* Top Bar */}
      <TopBar
        userName={userName}
        userRole={profile.role}
        userId={profile.id}
        establishmentId={profile.establishment_id}
        onLogout={handleLogout}
        onOpenSettings={openSettings}
        isCollapsed={isCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 flex-1 transition-all duration-300 bg-[#F9F9FA]",
          isCollapsed ? "pl-[70px]" : "pl-[260px]"
        )}
      >
        <div className="p-6">
          {renderContent()}
        </div>
      </main>

      {/* Footer - Full width, below sidebar */}
      <AppFooter />

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres du compte</DialogTitle>
            <DialogDescription>Gérez vos identifiants de connexion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="settings-username">Identifiant</Label>
              <Input
                id="settings-username"
                value={settingsData.username}
                onChange={(e) => setSettingsData({ ...settingsData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="settings-password">Nouveau mot de passe</Label>
              <div className="flex gap-2">
                <Input
                  id="settings-password"
                  type="text"
                  value={settingsData.password}
                  onChange={(e) => setSettingsData({ ...settingsData, password: e.target.value })}
                  placeholder="Saisir un nouveau mot de passe"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsData({ ...settingsData, password: generateStrongPassword(8) })}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Laissez vide pour conserver le mot de passe actuel. Cliquez sur l'icône pour générer un mot de passe fort.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateCredentials}>
              <Key className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
