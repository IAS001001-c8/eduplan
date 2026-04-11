'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-white">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-semibold text-[#29282B]">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-[#29282B]/60">
          L'application a rencontré un problème inattendu. Vos données sont en sécurité.
        </p>
      </div>
      <Button 
        onClick={reset}
        className="bg-[#E7A541] hover:bg-[#D4933A] text-white"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Réessayer
      </Button>
    </div>
  )
}
