# EduPlan - Plan de Classe Application

## Project Overview
Application de gestion de plans de classe pour établissements scolaires.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Email**: Resend API (eduplan-lnc.com)
- **Auth**: Custom auth avec profils Supabase

## Core Features Implemented
- ✅ Authentification multi-rôles (Vie Scolaire, Professeur, Délégué)
- ✅ Dashboard avec 6 sections principales
- ✅ Gestion des classes (4 classes)
- ✅ Gestion des élèves (18 élèves) 
- ✅ Gestion des professeurs (6 professeurs)
- ✅ Gestion des salles avec aperçu visuel (4 salles)
- ✅ Plans de classe avec aperçu visuel (10 sous-salles)
- ✅ Bac à sable avec aperçu visuel (propositions)
- ✅ Toggle vue Grille/Liste pour Salles, Plans, Bac à sable

## Bugs Fixed (Jan 29, 2026)
1. ✅ **Grid3x3 icon** - Remplacé par Grid
2. ✅ **Columns3 icon** - Remplacé par Columns
3. ✅ **Dialog imports manquants** - Ajoutés dans rooms-management.tsx
4. ✅ **Resend domain** - Configuré avec `noreply@eduplan-lnc.com`
5. ✅ **Élève placé 2 fois** - Validation ajoutée pour empêcher les doublons
6. ✅ **Section Salles** - Rework complet avec aperçu des sièges
7. ✅ **Vue Grille/Liste** - Ajoutée aux 3 sections (Salles, Plans, Sandbox)

## Configuration Resend
- Domaine: eduplan-lnc.com
- Email: noreply@eduplan-lnc.com
- Clé API: re_gACbhKUg_FXfWchA2ZYG2mVu6TUx57ZYJ

## Script Supabase Realtime
Exécuter `/app/scripts/supabase_realtime_setup.sql` dans Supabase SQL Editor pour activer les notifications en temps réel.

## Test Credentials
- **ST-MARIE**: stm001 / vs.stmarie / VieScol2024! (vie-scolaire)
- **VICTOR-HUGO**: vh001 / vs.vhugo / VieScol2024! (vie-scolaire)

## Prochaines fonctionnalités à implémenter
- [ ] Export PDF des plans de classe
- [ ] Drag & Drop amélioré (mobile)
- [ ] Historique des modifications
- [ ] Import Excel (prénom, nom, email, téléphone)
- [ ] Statistiques dashboard (vie scolaire)
- [ ] Recherche globale élèves

## Remaining Issues (Low Priority)
- React 19 ref warnings dans Radix UI (cosmétique)

## Date
- Last updated: January 29, 2026
