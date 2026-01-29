"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function Login() {
  const router = useRouter()
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Vérification des codes d'accès
    if (password === "cpdc002") {
      // Rediriger vers la page de sélection de professeur
      router.push("/teacher-selection")
    } else if (password === "viescolaire") {
      // Rediriger vers l'espace vie scolaire
      router.push("/vie-scolaire")
    } else {
      toast({
        title: "Erreur",
        description: "Code d'accès incorrect",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Entrez votre code d'accès pour vous connecter au système de plan de classe</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Code d'accès</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre code d'accès"
                />
              </div>
              <div className="text-sm text-gray-500">
                <p>Codes d'accès de test:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>cpdc002 - Accès professeur</li>
                  <li>viescolaire - Accès vie scolaire</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
            <div className="text-center text-sm text-gray-500 mt-2">
              <Link href="/vie-scolaire" className="text-primary hover:underline">
                Accéder à l'espace vie scolaire
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      <Toaster />
    </div>
  )
}
