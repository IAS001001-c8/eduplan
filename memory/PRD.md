# EduPlan - Application de gestion de plans de classe

## Vue d'ensemble
Application Next.js 15 + Supabase pour la gestion de plans de classe scolaires.

## Stack technique
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI, Shadcn
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Email**: Resend (noreply@eduplan-lnc.com)
- **Auth**: Custom auth avec profils Supabase

## Fonctionnalités implémentées

### Core
- ✅ Authentification multi-rôles (Vie Scolaire, Professeur, Délégué, Éco-délégué)
- ✅ Dashboard avec 6 sections principales
- ✅ Gestion des classes, élèves, professeurs
- ✅ Gestion des salles avec aperçu visuel des sièges
- ✅ Plans de classe avec éditeur drag & drop
- ✅ Bac à sable (propositions de plans)

### Corrections Jan 29-30, 2026
- ✅ Grid3x3/Columns3 → Grid/Columns (icônes lucide)
- ✅ Bug élève placé 2 fois → Déplacement automatique
- ✅ Échange de places → Swap automatique quand on dépose sur place occupée
- ✅ Popup info élève au clic → Affiche nom/prénom + bouton "Retirer"
- ✅ Toggle Cartes/Tableau pour Salles, Plans de classe, Bac à sable
- ✅ Vue Tableau compacte sans aperçu (lignes serrées avec actions)
- ✅ Limite toasts à 3 maximum
- ✅ Resend configuré avec eduplan-lnc.com
- ✅ Restrictions délégués → Ne peuvent pas créer de sous-salles
- ✅ Profs créent uniquement pour eux-mêmes + salles collaboratives (3 profs max)

### Processus de révision
- ✅ Professeurs peuvent : Valider / Refuser / Renvoyer avec commentaire

### Corrections Jan 30, 2026 (Session 2)
- ✅ Création de sous-salles: Amélioration du chargement de l'ID professeur (userId prop + cookie fallback)
- ✅ Superposition templates: Correction du z-index et de l'affichage hover overlay
- ✅ Bac à sable révision: Dialog de révision maintenant ouvert pour les profs (avec options Valider/Refuser/Renvoyer)
- ✅ Ajout bouton "Modifier le plan dans l'éditeur" dans le dialog de révision
- ✅ Resend 520: Ajout retry logic (2 retries) + meilleur message d'erreur pour timeout plateforme
- ✅ Corrections paramètres sendNotification (snake_case)
- ✅ Ajout options Refuser/Renvoyer dans l'éditeur de plan pour les profs (sandbox)
- ✅ Dialogue création sous-salle: Options multi-classes visibles pour profs
- ✅ Affichage professeurs pour vie scolaire corrigé

### Intégrations Jan 30, 2026
- ✅ Export PDF des plans de classe (jspdf + html2canvas)
- ✅ Historique des modifications (HistoryDialog)
- ✅ Import Excel (xlsx - prénom, nom, email, téléphone)
- ✅ Statistiques vie scolaire (VieScolaireStats - visible uniquement pour role vie-scolaire)
- ✅ Recherche globale (GlobalSearch - ⌘K dans le header)
- ✅ Composants UI: scroll-area.tsx, progress.tsx

## À faire (fonctionnalités avancées)
- [ ] Drag & Drop mobile optimisé (@dnd-kit/core)
- [ ] Système invitations salles collaboratives avec notifications
- [ ] Modification de salle en popup (au lieu de page séparée)
- [ ] Fix warnings React 19 ref (mise à jour Radix UI)

## Base de données
- URL: https://bdvdrzohbieqeisxwmwh.supabase.co
- Realtime: Activé pour notifications

## Clés API
- Resend: re_gACbhKUg_FXfWchA2ZYG2mVu6TUx57ZYJ
- Domaine: eduplan-lnc.com

## Identifiants de test
- **ST-MARIE**: stm001 / vs.stmarie / VieScol2024! (vie-scolaire)
- **VICTOR-HUGO**: vh001 / vs.vhugo / VieScol2024! (vie-scolaire)

## Notes techniques
- Les warnings React 19 ref viennent de Radix UI (cosmétique)
- L'erreur 520 Resend est temporaire (Cloudflare) - l'API fonctionne
