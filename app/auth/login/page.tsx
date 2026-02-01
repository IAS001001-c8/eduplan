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
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-50" />
      </div>

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">EduPlan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Une école. Un Plan.</p>
        </motion.div>

        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
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
                  className={`text-sm font-medium transition-colors ${
                    focusedField === "establishment" ? "text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                >
                  Code établissement
                </Label>
                <div className="relative">
                  <School className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    focusedField === "establishment" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                  }`} />
                  <Input
                    id="establishmentCode"
                    type="text"
                    placeholder="Ex: stm001"
                    value={establishmentCode}
                    onChange={(e) => setEstablishmentCode(e.target.value)}
                    onFocus={() => setFocusedField("establishment")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
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
                  className={`text-sm font-medium transition-colors ${
                    focusedField === "username" ? "text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                >
                  Identifiant
                </Label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    focusedField === "username" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                  }`} />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ex: vs.stmarie"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
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
                  className={`text-sm font-medium transition-colors ${
                    focusedField === "password" ? "text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                >
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    focusedField === "password" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                  }`} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
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
                  className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
                >
                  <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
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
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
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
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6"
        >
          Besoin d'aide ? Contactez votre CPE
        </motion.p>
      </motion.div>
    </div>
  )
}
