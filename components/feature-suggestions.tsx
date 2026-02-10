"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Lightbulb,
  Users,
  Share2,
  Smartphone,
  BarChart3,
  Bell,
  Mail,
  QrCode,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureSuggestion {
  id: string
  icon: React.ReactNode
  title: string
  shortDescription: string
  fullDescription: string
  benefits: string[]
  priority: "haute" | "moyenne" | "basse"
  category: "collaboration" | "communication" | "mobile" | "analytics" | "automatisation"
}

const featureSuggestions: FeatureSuggestion[] = [
  {
    id: "collaborative-rooms",
    icon: <Share2 className="h-5 w-5" />,
    title: "Salles collaboratives",
    shortDescription: "Partagez vos plans entre professeurs",
    fullDescription: "Permettez à plusieurs professeurs de partager et co-éditer des plans de classe. Idéal pour les cours en binôme, les remplacements ou la passation de classe en fin d'année.",
    benefits: [
      "Partagez un plan avec un collègue d'un simple clic",
      "Définissez des permissions (lecture seule ou modification)",
      "Historique des modifications par chaque collaborateur",
      "Notifications quand un collaborateur modifie le plan",
    ],
    priority: "haute",
    category: "collaboration",
  },
  {
    id: "parent-notifications",
    icon: <Bell className="h-5 w-5" />,
    title: "Notifications aux parents",
    shortDescription: "Informez les parents des changements de place",
    fullDescription: "Envoyez automatiquement un email ou une notification aux parents lorsque leur enfant change de place. Particulièrement utile pour les élèves à besoins particuliers (EBP).",
    benefits: [
      "Email automatique lors d'un changement de place",
      "Option de désactivation par les parents",
      "Historique des notifications envoyées",
      "Modèles de message personnalisables",
    ],
    priority: "moyenne",
    category: "communication",
  },
  {
    id: "mobile-app",
    icon: <Smartphone className="h-5 w-5" />,
    title: "Application mobile",
    shortDescription: "Gérez vos plans depuis votre téléphone",
    fullDescription: "Une application mobile native pour consulter et modifier vos plans de classe en déplacement. Fonctionnement hors-ligne avec synchronisation automatique.",
    benefits: [
      "Consultez le plan de la classe actuelle en un geste",
      "Mode hors-ligne pour les zones sans connexion",
      "Notifications push pour les propositions de délégués",
      "Widget pour accès rapide au cours en cours",
    ],
    priority: "haute",
    category: "mobile",
  },
  {
    id: "analytics-dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Tableau de bord analytique",
    shortDescription: "Statistiques avancées sur vos classes",
    fullDescription: "Visualisez des statistiques détaillées sur vos classes : répartition par genre, placement des EBP, fréquence des changements de place, etc.",
    benefits: [
      "Graphiques de répartition par genre et par rangée",
      "Suivi du placement des élèves EBP dans le temps",
      "Comparaison entre classes et périodes",
      "Export des données pour rapports",
    ],
    priority: "moyenne",
    category: "analytics",
  },
  {
    id: "qr-code-display",
    icon: <QrCode className="h-5 w-5" />,
    title: "Affichage QR Code",
    shortDescription: "Élèves scannent pour voir leur place",
    fullDescription: "Générez un QR code unique pour chaque plan de classe. Les élèves scannent avec leur téléphone pour voir instantanément leur place assignée.",
    benefits: [
      "Gain de temps à l'entrée en classe",
      "Réduction des questions 'je suis où ?'",
      "Fonctionne sans compte élève",
      "QR code imprimable pour affichage en salle",
    ],
    priority: "basse",
    category: "automatisation",
  },
  {
    id: "email-export",
    icon: <Mail className="h-5 w-5" />,
    title: "Export email automatique",
    shortDescription: "Envoyez le plan par email aux élèves",
    fullDescription: "Envoyez automatiquement le plan de classe par email à tous les élèves ou à leur famille en début de période ou après modification.",
    benefits: [
      "Envoi groupé à toute la classe",
      "Envoi individuel avec uniquement la place de l'élève",
      "Planification d'envois automatiques",
      "Suivi des emails ouverts",
    ],
    priority: "moyenne",
    category: "communication",
  },
]

const priorityColors = {
  haute: "bg-red-100 text-red-700 border-red-200",
  moyenne: "bg-orange-100 text-orange-700 border-orange-200",
  basse: "bg-green-100 text-green-700 border-green-200",
}

const categoryColors = {
  collaboration: "bg-purple-100 text-purple-700",
  communication: "bg-blue-100 text-blue-700",
  mobile: "bg-cyan-100 text-cyan-700",
  analytics: "bg-amber-100 text-amber-700",
  automatisation: "bg-emerald-100 text-emerald-700",
}

const categoryLabels = {
  collaboration: "Collaboration",
  communication: "Communication",
  mobile: "Mobile",
  analytics: "Analytique",
  automatisation: "Automatisation",
}

export function FeatureSuggestions() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureSuggestion | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const displayedFeatures = isExpanded ? featureSuggestions : featureSuggestions.slice(0, 3)

  return (
    <>
      <Card className="border-[#D9DADC] bg-gradient-to-br from-[#FDF6E9] to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E7A541]/20">
                <Lightbulb className="h-5 w-5 text-[#E7A541]" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#29282B]">
                  Fonctionnalités suggérées
                </CardTitle>
                <CardDescription className="text-[#29282B]/60">
                  Découvrez les prochaines améliorations possibles
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-[#E7A541]/20 text-[#E7A541] border-[#E7A541]/30">
              <Sparkles className="h-3 w-3 mr-1" />
              {featureSuggestions.length} idées
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayedFeatures.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[#D9DADC] hover:border-[#E7A541]/50 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedFeature(feature)}
              >
                <div className="p-2.5 rounded-lg bg-[#F5F5F6] text-[#29282B] group-hover:bg-[#E7A541]/10 group-hover:text-[#E7A541] transition-colors">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[#29282B] truncate">
                      {feature.title}
                    </p>
                    <Badge className={cn("text-[10px] px-1.5 py-0", categoryColors[feature.category])}>
                      {categoryLabels[feature.category]}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#29282B]/60 truncate">
                    {feature.shortDescription}
                  </p>
                </div>
                <Badge className={cn("text-xs border", priorityColors[feature.priority])}>
                  {feature.priority === "haute" ? "Priorité haute" : feature.priority === "moyenne" ? "Priorité moyenne" : "Priorité basse"}
                </Badge>
                <ChevronRight className="h-4 w-4 text-[#29282B]/40 group-hover:text-[#E7A541] transition-colors" />
              </div>
            ))}
          </div>

          {featureSuggestions.length > 3 && (
            <Button
              variant="ghost"
              className="w-full mt-4 text-[#E7A541] hover:text-[#D4933A] hover:bg-[#FDF6E9]"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Voir moins" : `Voir les ${featureSuggestions.length - 3} autres suggestions`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détail */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#E7A541]/20 text-[#E7A541]">
                  {selectedFeature?.icon}
                </div>
                <div>
                  <DialogTitle className="text-xl text-[#29282B]">
                    {selectedFeature?.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn("text-xs", selectedFeature && categoryColors[selectedFeature.category])}>
                      {selectedFeature && categoryLabels[selectedFeature.category]}
                    </Badge>
                    <Badge className={cn("text-xs border", selectedFeature && priorityColors[selectedFeature.priority])}>
                      Priorité {selectedFeature?.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <DialogDescription className="text-[#29282B]/80 text-base leading-relaxed">
              {selectedFeature?.fullDescription}
            </DialogDescription>

            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <p className="text-sm font-semibold text-[#29282B] mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E7A541]" />
                Avantages
              </p>
              <ul className="space-y-2">
                {selectedFeature?.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-[#29282B]/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E7A541] mt-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-[#D9DADC]">
              <p className="text-xs text-[#29282B]/50 text-center">
                Cette fonctionnalité est en cours d'étude. Contactez-nous pour partager votre intérêt !
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
