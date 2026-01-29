import { Suspense } from "react"
import { SharedPlanContent } from "@/components/shared-plan-content"

export default function SharedPlan() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Chargement...</div>}>
        <SharedPlanContent />
      </Suspense>
    </main>
  )
}
