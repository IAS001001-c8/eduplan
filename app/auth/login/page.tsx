"use client"

import type React from "react"
import { authenticateUserSimple, setUserSession } from "@/lib/custom-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { School, User, Lock, ArrowRight, Loader2 } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [establishmentCode, setEstablishmentCode] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const router = useRouter()

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        const form = document.querySelector("form")
        if (form) form.requestSubmit()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLoading])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!establishmentCode || !username || !password) {
      setError("Tous les champs sont requis")
      setIsLoading(false)
      return
    }

    try {
      const { user, error: authError } = await authenticateUserSimple(
        establishmentCode.toLowerCase().trim(),
        username.trim(),
        password
      )

      if (authError || !user) {
        throw new Error(authError || "Identifiant ou mot de passe incorrect")
      }

      // Store user session
      setUserSession(user)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Identifiant ou mot de passe incorrect")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo-edu-plan-remove.png"
              alt="EduPlan Logo"
              width={180}
              height={60}
              priority
              className="h-auto"
            />
          </div>
          <p className="text-sm text-[#29282B]/60 mt-2" style={{ fontFamily: 'Insigna, sans-serif' }}>
            Une école. Un Plan.
          </p>
        </motion.div>

        <Card className="border border-[#D9DADC] shadow-lg bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-[#29282B]">
              Connexion
            </CardTitle>
            <CardDescription className="text-center text-[#29282B]/60">
              Connectez-vous à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Establishment Code */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <Label 
                  htmlFor="establishmentCode" 
                  className={`text-sm font-medium transition-colors text-[#29282B] ${
                    focusedField === "establishment" ? "text-[#E7A541]" : ""
                  }`}
                >
                  Code établissement
                </Label>
                <div className="relative">
                  <School className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    focusedField === "establishment" ? "text-[#E7A541]" : "text-[#29282B]/40"
                  }`} />
                  <Input
                    id="establishmentCode"
                    type="text"
                    placeholder="Ex: stm001"
                    value={establishmentCode}
                    onChange={(e) => setEstablishmentCode(e.target.value)}
                    onFocus={() => setFocusedField("establishment")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 h-11 bg-white border-[#D9DADC] text-[#29282B] placeholder:text-[#29282B]/40 focus:border-[#E7A541] focus:ring-[#E7A541]"
                    autoComplete="organization"
                    required
                  />
                </div>
              </motion.div>

              {/* Username */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label 
                  htmlFor="username"
                  className={`text-sm font-medium transition-colors text-[#29282B] ${
                    focusedField === "username" ? "text-[#E7A541]" : ""
                  }`}
                >
                  Identifiant
                </Label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    focusedField === "username" ? "text-[#E7A541]" : "text-[#29282B]/40"
                  }`} />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ex: vs.stmarie"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 h-11 bg-white border-[#D9DADC] text-[#29282B] placeholder:text-[#29282B]/40 focus:border-[#E7A541] focus:ring-[#E7A541]"
                    autoComplete="username"
                    required
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label 
                  htmlFor="password"
                  className={`text-sm font-medium transition-colors text-[#29282B] ${
                    focusedField === "password" ? "text-[#E7A541]" : ""
                  }`}
                >
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    focusedField === "password" ? "text-[#E7A541]" : "text-[#29282B]/40"
                  }`} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 h-11 bg-white border-[#D9DADC] text-[#29282B] placeholder:text-[#29282B]/40 focus:border-[#E7A541] focus:ring-[#E7A541]"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-[#E7A541] hover:bg-[#D4933A] text-white font-medium shadow-md transition-all hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-[#29282B]/50 mt-6"
        >
          Besoin d'aide ? Contactez votre CPE
        </motion.p>
      </motion.div>
    </div>
  )
}
