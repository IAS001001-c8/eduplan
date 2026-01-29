/**
 * Obtient l'URL de base de l'application
 */
export function getBaseUrl() {
  // Vérifier si nous sommes dans un environnement de navigateur
  if (typeof window !== "undefined") {
    // Si nous sommes dans le navigateur, utiliser l'URL actuelle
    return window.location.origin
  }

  // Sinon, utiliser l'URL de déploiement Vercel si disponible
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // URL de secours
  return "https://plan-de-classe.vercel.app"
}
