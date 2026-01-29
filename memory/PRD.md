# EduPlan - Plan de Classe Application

## Project Overview
Application de gestion de plans de classe pour établissements scolaires.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Email**: Resend API (noreply@eduplan-lnc.com)
- **Auth**: Custom auth avec profils Supabase

## Features Implemented ✅
- Authentification multi-rôles (Vie Scolaire, Professeur, Délégué)
- Dashboard avec 6 sections principales
- Gestion des classes, élèves, professeurs
- Gestion des salles avec aperçu visuel des sièges
- Plans de classe avec éditeur drag & drop
- Bac à sable (propositions)
- Toggle vue Cartes/Tableau pour toutes les sections
- Système de notifications (Realtime activé)

## Corrections effectuées (Jan 29, 2026)
1. ✅ Grid3x3 → Grid (icône lucide)
2. ✅ Columns3 → Columns
3. ✅ Dialog imports dans rooms-management
4. ✅ Resend configuré avec eduplan-lnc.com (clé: re_gACbhKUg...)
5. ✅ Bug élève placé 2 fois - Corrigé
6. ✅ Échange de places élèves - Swap automatique
7. ✅ Popup info élève au clic + bouton retirer
8. ✅ Section Salles redessinée - Aperçu sièges
9. ✅ Vue Cartes/Tableau compacte pour Salles, Plans, Sandbox
10. ✅ Toasts limités à 3 maximum
11. ✅ Restrictions délégués (ne peuvent pas créer sous-salles)
12. ✅ Profs créent uniquement pour eux + salles collaboratives (max 3 profs)

## Fonctionnalités Prévues (Phase 3)
- [ ] Export PDF des plans
- [ ] Drag & Drop mobile amélioré
- [ ] Historique des modifications
- [ ] Import Excel (prénom, nom, email, téléphone)
- [ ] Statistiques dashboard (vie scolaire)
- [ ] Recherche globale

## Database
- URL: https://bdvdrzohbieqeisxwmwh.supabase.co
- Realtime: Activé pour notifications

## Test Credentials
- **ST-MARIE**: stm001 / vs.stmarie / VieScol2024!

## API Keys
- Resend: re_gACbhKUg_FXfWchA2ZYG2mVu6TUx57ZYJ
- Domaine: eduplan-lnc.com
