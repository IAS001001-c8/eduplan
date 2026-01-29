# EduPlan - Plan de Classe Application

## Project Overview
Application de gestion de plans de classe pour établissements scolaires.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Email**: Resend API (noreply@eduplan-lnc.com)
- **Auth**: Custom auth avec profils Supabase

## Core Features Implemented
- ✅ Authentification multi-rôles
- ✅ Dashboard avec 6 sections principales
- ✅ Gestion des classes, élèves, professeurs
- ✅ Gestion des salles avec aperçu visuel des sièges
- ✅ Plans de classe avec éditeur drag & drop
- ✅ Bac à sable (propositions)
- ✅ Toggle vue Cartes/Tableau pour toutes les sections
- ✅ Notifications (API prête)

## Corrections Phase 1 (Jan 29, 2026)
1. ✅ Grid3x3 → Grid (icône lucide)
2. ✅ Columns3 → Columns
3. ✅ Dialog imports dans rooms-management
4. ✅ Resend configuré avec eduplan-lnc.com
5. ✅ Clé API Resend mise à jour

## Corrections Phase 2 (En cours)
1. ✅ Bug élève placé 2 fois - Corrigé (déplacement auto)
2. ✅ Échange de places élèves - Corrigé (swap automatique)
3. ✅ Popup info élève au clic - Ajouté avec bouton retirer
4. ✅ Section Salles redessinée - Aperçu sièges + toggle vue
5. ✅ Toggle Cartes/Tableau - Ajouté pour Salles, Plans, Sandbox
6. ✅ Notifications Realtime - Déjà configuré sur Supabase

## À Faire (Phase 3)
- [ ] Vue tableau compacte sans preview (lignes serrées)
- [ ] Animation templates hover (supprimer superposition)
- [ ] Restrictions délégués (ne peuvent pas créer de sous-salles)
- [ ] Profs ne créent que pour eux-mêmes
- [ ] Système salles collaboratives avec invitations
- [ ] Export PDF
- [ ] Drag & Drop mobile
- [ ] Historique modifications
- [ ] Import Excel
- [ ] Statistiques vie scolaire
- [ ] Recherche globale

## Database
- Supabase URL: https://bdvdrzohbieqeisxwmwh.supabase.co
- Realtime: Activé pour notifications

## API Keys
- Resend: re_gACbhKUg_FXfWchA2ZYG2mVu6TUx57ZYJ
- Domaine: eduplan-lnc.com

## Test Credentials
- **ST-MARIE**: stm001 / vs.stmarie / VieScol2024!

## Scripts SQL disponibles
- `/app/scripts/supabase_realtime_setup.sql` - Configuration Realtime (déjà fait)
