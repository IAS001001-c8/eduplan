/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Désactivé pour React 16
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL || "plan-de-classe.vercel.app",
  },
  // Ajout de la configuration pour React 16
  webpack: (config, { isServer }) => {
    // Ajustements pour React 16 si nécessaire
    return config
  },
}

module.exports = nextConfig
