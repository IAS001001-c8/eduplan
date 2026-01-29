import { Suspense } from "react"
import { PlanPartageContent } from "@/components/plan-partage-content"

export default function PlanPartage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Chargement...</div>}>
        <PlanPartageContent />
      </Suspense>
    </main>
  )
}
