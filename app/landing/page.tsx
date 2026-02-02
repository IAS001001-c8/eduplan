"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ChevronDown, 
  ChevronRight,
  Check, 
  Brain, 
  Users, 
  Smile, 
  Shield, 
  Upload, 
  Sparkles, 
  MessageSquare,
  Star,
  Menu,
  X,
  Play,
  ArrowRight,
  Mail,
  Phone,
  MapPin
} from "lucide-react"

// ============================================
// LANDING PAGE - EDUPLAN
// ============================================

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detect scroll for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      quote: "Depuis EduPlan, les élèves se sentent écoutés. Les conflits de placement ont disparu.",
      author: "Marie D.",
      role: "CPE au Collège Jean Moulin, Lyon",
      rating: 5
    },
    {
      quote: "Le placement intelligent m'a changé la vie. 30 élèves placés en 2 clics, en respectant tous les PAP.",
      author: "Thomas R.",
      role: "Professeur de Mathématiques, Nantes",
      rating: 5
    },
    {
      quote: "Simple à déployer, adopté par tout l'établissement en une semaine. Le support est réactif.",
      author: "Sophie M.",
      role: "Principale adjointe, Marseille",
      rating: 5
    }
  ]

  const faqs = [
    {
      question: "Est-ce compatible avec Pronote/SIECLE ?",
      answer: "Oui, vous pouvez importer vos élèves depuis un export Excel de ces outils. L'intégration directe est en cours de développement."
    },
    {
      question: "Où sont hébergées mes données ?",
      answer: "Toutes les données sont hébergées en France, sur des serveurs certifiés. Nous sommes 100% conformes au RGPD."
    },
    {
      question: "Combien de temps pour déployer EduPlan ?",
      answer: "En moyenne 30 minutes. Import des élèves, configuration des salles, et c'est parti. Notre équipe peut vous accompagner gratuitement."
    },
    {
      question: "Les élèves peuvent-ils modifier les plans ?",
      answer: "Non. Les délégués peuvent uniquement proposer des modifications. Le professeur garde toujours le contrôle final."
    },
    {
      question: "Puis-je tester avant d'acheter ?",
      answer: "Oui ! 14 jours d'essai gratuit, sans engagement et sans carte bancaire."
    },
    {
      question: "Proposez-vous des tarifs Éducation Nationale ?",
      answer: "Oui, contactez-nous pour un devis adapté aux marchés publics et conventions académiques."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* NAVBAR */}
      {/* ============================================ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E7A541] flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-xl text-[#29282B]" style={{ fontFamily: 'Insigna, sans-serif' }}>
                EduPlan
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-[#29282B] hover:text-[#E7A541] transition-colors text-sm">
                Fonctionnalités
              </a>
              <a href="#tarifs" className="text-[#29282B] hover:text-[#E7A541] transition-colors text-sm">
                Tarifs
              </a>
              <a href="#temoignages" className="text-[#29282B] hover:text-[#E7A541] transition-colors text-sm">
                Témoignages
              </a>
              <a href="#faq" className="text-[#29282B] hover:text-[#E7A541] transition-colors text-sm">
                FAQ
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="border-[#D9DADC] text-[#29282B] hover:border-[#E7A541] hover:bg-[#FDF6E9]">
                  Connexion
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-[#E7A541] hover:bg-[#D4933A] text-white">
                  Essai Gratuit
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#D9DADC] py-4 px-4">
            <div className="flex flex-col gap-4">
              <a href="#fonctionnalites" className="text-[#29282B] py-2">Fonctionnalités</a>
              <a href="#tarifs" className="text-[#29282B] py-2">Tarifs</a>
              <a href="#temoignages" className="text-[#29282B] py-2">Témoignages</a>
              <a href="#faq" className="text-[#29282B] py-2">FAQ</a>
              <hr className="border-[#D9DADC]" />
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">Connexion</Button>
              </Link>
              <Link href="/auth/login">
                <Button className="w-full bg-[#E7A541] hover:bg-[#D4933A]">Essai Gratuit</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Slogan Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDF6E9] mb-6">
            <span className="text-[#E7A541] font-semibold text-sm tracking-wide" style={{ fontFamily: 'Insigna, sans-serif' }}>
              EDUPLAN — UNE ÉCOLE UN PLAN
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#29282B] mb-6 leading-tight" style={{ fontFamily: 'Insigna, sans-serif' }}>
            Le plan de classe intelligent<br />
            <span className="text-[#E7A541]">qui implique vos élèves</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#29282B]/70 max-w-2xl mx-auto mb-8">
            Créez des plans adaptés aux besoins de chaque élève, en collaboration avec eux. 
            Simple pour tous, de la direction aux élèves.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/auth/login">
              <Button size="lg" className="bg-[#E7A541] hover:bg-[#D4933A] text-white px-8 py-6 text-lg">
                Démarrer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-[#D9DADC] text-[#29282B] px-8 py-6 text-lg">
              <Play className="mr-2 h-5 w-5" />
              Voir la démo
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#29282B]/60">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#E7A541]" />
              <span>14 jours gratuits</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#E7A541]" />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#E7A541]" />
              <span>Hébergé en France</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRODUCT VISUAL */}
      {/* ============================================ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA]">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#D9DADC] bg-white">
            {/* Browser Chrome */}
            <div className="bg-[#F5F5F6] px-4 py-3 border-b border-[#D9DADC] flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28CA41]"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-4 py-1.5 text-sm text-[#29282B]/50 max-w-md mx-auto">
                  app.eduplan.fr/dashboard
                </div>
              </div>
            </div>
            {/* App Screenshot Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-[#FDF6E9] to-[#F5F5F6] flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-[#E7A541] flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#29282B] mb-2" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Interface intuitive
                </h3>
                <p className="text-[#29282B]/60">
                  Placement intelligent • Vue fichiers • Collaboration élèves
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* LOGOS CLIENTS */}
      {/* ============================================ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-[#29282B]/50 uppercase tracking-wider mb-8">
            Ils nous font confiance
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {/* Placeholder logos */}
            {['Académie de Lyon', 'Académie de Paris', 'Académie de Nantes', 'Académie de Bordeaux', 'Académie de Marseille'].map((name, i) => (
              <div key={i} className="flex items-center gap-2 text-[#29282B]/40">
                <div className="w-8 h-8 rounded bg-[#D9DADC]"></div>
                <span className="text-sm font-medium hidden sm:block">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#D9DADC] mt-6">
            Collèges • Lycées • Académies
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* BENEFITS SECTION */}
      {/* ============================================ */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#29282B] mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>
              Pourquoi choisir EduPlan ?
            </h2>
            <div className="w-16 h-1 bg-[#E7A541] mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Benefit 1 */}
            <Card className="border-[#D9DADC] hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-[#FDF6E9] flex items-center justify-center mb-6">
                  <Brain className="h-7 w-7 text-[#E7A541]" />
                </div>
                <div className="w-10 h-1 bg-[#E7A541] mb-4"></div>
                <h3 className="text-xl font-bold text-[#29282B] mb-3" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Gagnez 2h par semaine
                </h3>
                <p className="text-[#29282B]/70">
                  Fini les plans de classe manuels. L'algorithme intelligent place automatiquement 
                  les élèves selon leurs besoins (vue, audition, TSA, mixité).
                </p>
              </CardContent>
            </Card>

            {/* Benefit 2 */}
            <Card className="border-[#D9DADC] hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-[#FDF6E9] flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-[#E7A541]" />
                </div>
                <div className="w-10 h-1 bg-[#E7A541] mb-4"></div>
                <h3 className="text-xl font-bold text-[#29282B] mb-3" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Impliquez vos élèves
                </h3>
                <p className="text-[#29282B]/70">
                  Les délégués proposent, les profs valident. Une co-construction qui 
                  responsabilise et apaise la classe.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 3 */}
            <Card className="border-[#D9DADC] hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-[#FDF6E9] flex items-center justify-center mb-6">
                  <Smile className="h-7 w-7 text-[#E7A541]" />
                </div>
                <div className="w-10 h-1 bg-[#E7A541] mb-4"></div>
                <h3 className="text-xl font-bold text-[#29282B] mb-3" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Zéro prise de tête
                </h3>
                <p className="text-[#29282B]/70">
                  Interface intuitive pensée pour tous. Direction, professeurs et élèves 
                  l'adoptent en 5 minutes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RGPD Card - Full Width */}
          <Card className="border-[#D9DADC] bg-[#FDF6E9]">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-[#E7A541] flex items-center justify-center shrink-0">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#29282B] mb-2" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Sécurisé & conforme RGPD
                </h3>
                <p className="text-[#29282B]/70">
                  Données hébergées en France, serveurs certifiés. Vos données ne quittent jamais l'Europe. 
                  Conformité totale avec les exigences de l'Éducation Nationale.
                </p>
              </div>
              <Badge className="bg-[#E7A541] text-white shrink-0">
                🇫🇷 Made in France
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#29282B] mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>
              Comment ça marche ?
            </h2>
            <div className="w-16 h-1 bg-[#E7A541] mx-auto mb-4"></div>
            <p className="text-[#29282B]/60 text-lg">
              3 étapes pour transformer vos plans de classe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-[#E7A541]"></div>

            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-[#E7A541] text-white font-bold flex items-center justify-center mx-auto mb-6 text-xl relative z-10" style={{ fontFamily: 'Insigna, sans-serif' }}>
                1
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#D9DADC] flex items-center justify-center mx-auto mb-6">
                <Upload className="h-10 w-10 text-[#E7A541]" />
              </div>
              <h3 className="text-xl font-bold text-[#29282B] mb-3" style={{ fontFamily: 'Insigna, sans-serif' }}>
                Importez vos élèves
              </h3>
              <p className="text-[#29282B]/70">
                Depuis Excel ou SIECLE. Les besoins particuliers sont automatiquement détectés.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-[#E7A541] text-white font-bold flex items-center justify-center mx-auto mb-6 text-xl relative z-10" style={{ fontFamily: 'Insigna, sans-serif' }}>
                2
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#D9DADC] flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-[#E7A541]" />
              </div>
              <h3 className="text-xl font-bold text-[#29282B] mb-3" style={{ fontFamily: 'Insigna, sans-serif' }}>
                Créez vos plans
              </h3>
              <p className="text-[#29282B]/70">
                Lancez le placement intelligent. L'algorithme respecte les besoins de chaque élève.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-[#E7A541] text-white font-bold flex items-center justify-center mx-auto mb-6 text-xl relative z-10" style={{ fontFamily: 'Insigna, sans-serif' }}>
                3
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#D9DADC] flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-[#E7A541]" />
              </div>
              <h3 className="text-xl font-bold text-[#29282B] mb-3" style={{ fontFamily: 'Insigna, sans-serif' }}>
                Collaborez
              </h3>
              <p className="text-[#29282B]/70">
                Les délégués proposent des ajustements, vous validez en un clic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING SECTION */}
      {/* ============================================ */}
      <section id="tarifs" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#29282B] mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>
              Un tarif adapté à votre établissement
            </h2>
            <div className="w-16 h-1 bg-[#E7A541] mx-auto mb-4"></div>
            <p className="text-[#29282B]/60">
              Facturation mensuelle ou annuelle (-20%)
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Starter */}
            <Card className="border-[#D9DADC] hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <p className="text-sm font-semibold text-[#29282B]/50 uppercase tracking-wider mb-2" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Starter
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-[#29282B]" style={{ fontFamily: 'Insigna, sans-serif' }}>99€</span>
                  <span className="text-[#29282B]/50">/mois</span>
                </div>
                <hr className="border-[#D9DADC] mb-6" />
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Jusqu'à 300 élèves
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Jusqu'à 20 professeurs
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Support email
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Formation vidéos
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-[#D9DADC]">
                  Choisir
                </Button>
              </CardContent>
            </Card>

            {/* Standard - Popular */}
            <Card className="border-2 border-[#E7A541] hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#E7A541] text-white">Populaire</Badge>
              </div>
              <CardContent className="p-8">
                <p className="text-sm font-semibold text-[#29282B]/50 uppercase tracking-wider mb-2" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Standard
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-[#29282B]" style={{ fontFamily: 'Insigna, sans-serif' }}>199€</span>
                  <span className="text-[#29282B]/50">/mois</span>
                </div>
                <hr className="border-[#E7A541]/30 mb-6" />
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Jusqu'à 800 élèves
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Jusqu'à 50 professeurs
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Support prioritaire
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Formation vidéos + 1h visio
                  </li>
                </ul>
                <Button className="w-full bg-[#E7A541] hover:bg-[#D4933A] text-white">
                  Choisir
                </Button>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-[#D9DADC] hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <p className="text-sm font-semibold text-[#29282B]/50 uppercase tracking-wider mb-2" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  Premium
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-[#29282B]" style={{ fontFamily: 'Insigna, sans-serif' }}>349€</span>
                  <span className="text-[#29282B]/50">/mois</span>
                </div>
                <hr className="border-[#D9DADC] mb-6" />
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Élèves illimités
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Professeurs illimités
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Support dédié
                  </li>
                  <li className="flex items-center gap-2 text-[#29282B]">
                    <Check className="h-5 w-5 text-[#E7A541]" />
                    Formation sur site
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-[#D9DADC]">
                  Choisir
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Options Box */}
          <div className="bg-[#F9F9FA] rounded-xl p-6 text-center mb-8">
            <p className="text-[#29282B]/70 mb-2">
              <strong className="text-[#29282B]">📊 Besoin de plus ?</strong>
            </p>
            <p className="text-sm text-[#29282B]/60">
              +50 élèves : +15€/mois • +10 profs : +20€/mois • Formation sur site : 500€ (forfait unique)
            </p>
          </div>

          <div className="text-center">
            <p className="text-[#29282B]/60 mb-4">
              Devis personnalisé pour les académies et groupements
            </p>
            <Button variant="outline" className="border-[#E7A541] text-[#E7A541] hover:bg-[#FDF6E9]">
              Demander un devis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section id="temoignages" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FDF6E9]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#29282B] mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>
              Ce qu'en disent nos utilisateurs
            </h2>
            <div className="w-16 h-1 bg-[#E7A541] mx-auto"></div>
          </div>

          {/* Testimonial Card */}
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-8 sm:p-12 text-center relative">
              <div className="text-6xl text-[#E7A541]/20 absolute top-4 left-8" style={{ fontFamily: 'serif' }}>
                "
              </div>
              <p className="text-xl sm:text-2xl text-[#29282B] italic mb-8 relative z-10">
                {testimonials[currentTestimonial].quote}
              </p>
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[#E7A541] text-[#E7A541]" />
                ))}
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#E7A541] flex items-center justify-center text-white font-bold text-lg">
                  {testimonials[currentTestimonial].author.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-[#29282B]" style={{ fontFamily: 'Insigna, sans-serif' }}>
                    {testimonials[currentTestimonial].author}
                  </p>
                  <p className="text-sm text-[#29282B]/60">
                    {testimonials[currentTestimonial].role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTestimonial(i)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === currentTestimonial ? 'bg-[#E7A541]' : 'bg-[#D9DADC]'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ SECTION */}
      {/* ============================================ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#29282B] mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>
              Questions fréquentes
            </h2>
            <div className="w-16 h-1 bg-[#E7A541] mx-auto"></div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg border transition-all ${
                  openFaq === index ? 'border-l-4 border-l-[#E7A541] border-[#D9DADC]' : 'border-[#D9DADC]'
                }`}
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-[#29282B]" style={{ fontFamily: 'Insigna, sans-serif' }}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#E7A541] transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-[#29282B]/80">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-[#29282B]/60 mb-4">Une autre question ?</p>
            <Button variant="outline" className="border-[#E7A541] text-[#E7A541] hover:bg-[#FDF6E9]">
              Contactez-nous
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL */}
      {/* ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#E7A541]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Insigna, sans-serif' }}>
            Prêt à transformer vos plans de classe ?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Rejoignez les centaines d'établissements qui ont simplifié leur gestion de classe.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="bg-white text-[#E7A541] hover:bg-[#F5F5F6] px-10 py-6 text-lg font-semibold shadow-lg">
              Démarrer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>14 jours gratuits</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Support inclus</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-[#29282B]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#E7A541] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="font-bold text-xl text-white" style={{ fontFamily: 'Insigna, sans-serif' }}>
                  EduPlan
                </span>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Une École Un Plan
              </p>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <span>🇫🇷</span>
                <span>Données hébergées en France</span>
              </div>
            </div>

            {/* Produit */}
            <div>
              <h4 className="font-bold text-white mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>Produit</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#fonctionnalites" className="hover:text-[#E7A541]">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-[#E7A541]">Tarifs</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">Changelog</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">Roadmap</a></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-bold text-white mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>Ressources</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-[#E7A541]">Blog</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">Webinaires</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">Documentation</a></li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="font-bold text-white mb-4" style={{ fontFamily: 'Insigna, sans-serif' }}>Légal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-[#E7A541]">Mentions légales</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">CGV</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">Confidentialité</a></li>
                <li><a href="#" className="hover:text-[#E7A541]">Cookies</a></li>
              </ul>
            </div>
          </div>

          <hr className="border-white/10 mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © 2026 EduPlan - Fait avec ❤️ en France
            </p>
            <div className="flex items-center gap-4 text-white/50 text-sm">
              <a href="mailto:contact@eduplan.fr" className="hover:text-[#E7A541] flex items-center gap-1">
                <Mail className="h-4 w-4" />
                contact@eduplan.fr
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
