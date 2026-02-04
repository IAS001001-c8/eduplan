"use client"

import { Mail, Linkedin, ChevronRight } from "lucide-react"
import Image from "next/image"

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#29282B] pt-16 pb-6 w-full" data-testid="app-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-white/10">
          {/* Logo et slogan */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/logo-eduplan.png"
              alt="EduPlan"
              width={120}
              height={40}
              className="h-10 w-auto mb-3 brightness-0 invert"
            />
            <p className="text-white/60 text-sm">Une École Un Plan</p>
            <p className="text-white/40 text-xs mt-2">+2h42 de cours par semaine</p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produit</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://eduplan-lnc.com/#features" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="https://eduplan-lnc.com/#pricing" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Tarifs
                </a>
              </li>
              <li>
                <a href="https://eduplan-lnc.com/#faq" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Ressources</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:info@linksync.fr" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Centre d'aide
                </a>
              </li>
              <li>
                <a href="mailto:info@linksync.fr" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="mailto:info@linksync.fr" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Légal</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://rgpd.eduplan-lnc.com/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Mentions légales
                </a>
              </li>
              <li>
                <a href="https://rgpd.eduplan-lnc.com/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  CGV
                </a>
              </li>
              <li>
                <a href="https://rgpd.eduplan-lnc.com/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  CGU
                </a>
              </li>
              <li>
                <a href="https://rgpd.eduplan-lnc.com/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  RGPD & Confidentialité
                </a>
              </li>
              <li>
                <a href="https://rgpd.eduplan-lnc.com/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Cookies
                </a>
              </li>
              <li>
                <a href="https://rgpd.eduplan-lnc.com/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm">
                  Stockage des données
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:info@linksync.fr" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm flex items-center gap-2">
                  <Mail size={14} /> info@linksync.fr
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/company/groupe-lnc/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-[#E7A541] transition-colors text-sm flex items-center gap-2">
                  <Linkedin size={14} /> LinkedIn
                </a>
              </li>
            </ul>
            <div className="mt-5 pt-4 border-t border-white/10">
              <a href="/auth/login" className="inline-flex items-center text-[#E7A541] font-medium text-sm hover:underline">
                Portail de connexion
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-4">
          <p className="text-white/50 text-sm">© {currentYear} EduPlan - Fait avec ❤️ en France</p>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <span>🇫🇷</span>
            <span>Données hébergées en Europe</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter
