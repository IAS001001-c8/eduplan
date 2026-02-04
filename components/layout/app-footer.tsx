"use client"

import { Mail, Linkedin } from "lucide-react"

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#29282B] py-6 mt-auto" data-testid="app-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo et Copyright */}
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm">© {currentYear} EduPlan</span>
            <span className="text-white/30">|</span>
            <span className="text-white/40 text-xs">Une École Un Plan</span>
          </div>

          {/* Liens */}
          <div className="flex items-center gap-6">
            <a 
              href="https://rgpd.eduplan-lnc.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white/50 hover:text-[#E7A541] transition-colors text-sm"
            >
              Mentions légales
            </a>
            <a 
              href="https://rgpd.eduplan-lnc.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white/50 hover:text-[#E7A541] transition-colors text-sm"
            >
              RGPD
            </a>
            <a 
              href="mailto:info@linksync.fr" 
              className="text-white/50 hover:text-[#E7A541] transition-colors text-sm flex items-center gap-1"
            >
              <Mail size={14} />
              Support
            </a>
          </div>

          {/* Données hébergées */}
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <span>🇫🇷</span>
            <span>Données hébergées en Europe</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter
