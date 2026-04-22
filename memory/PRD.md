# EduPlan - PRD (Product Requirements Document)

## Problème original
Application de gestion de plans de classe scolaires avec placement intelligent des élèves, gestion des EBP, sous-salles, et déploiement Windows via Electron.

## Architecture
- **Frontend** : Next.js 15 + React 19 + TypeScript + Tailwind CSS + Shadcn UI
- **Backend** : Supabase (PostgreSQL) - requêtes directes via client
- **Desktop** : Electron pour Windows (.appx pour Microsoft Store)

## Rôles utilisateurs
1. **Vie Scolaire (CPE)** : Administration complète, pas d'accès aux contraintes prof
2. **Professeur** : Gestion de ses plans + contraintes de placement par élève
3. **Délégué de classe** : Propositions de modifications

## Fonctionnalités implémentées

### Session actuelle (Avril 2026)
- [x] Section "Mes élèves & contraintes" (Professeur)
  - Grille d'élèves (Prénom I.), sélection multi, contraintes (Ensemble/Séparés/Devant/AESH)
  - Affichage EBP en violet quand sélectionnés (ex: "Arthur F. : PAP")
  - AESH : place libre à côté de l'élève (1 élève max à la fois)
  - EBP entourés en violet (pas bleu)
  - Gestion des conflits robuste
- [x] Algorithme Placement V4 avec 4 priorités :
  - P0 : Contraintes prof (devant/ensemble/séparés/AESH)
  - P1 : EBP (vue/audition→R1, TSA→R1-2, autre→R1-2)
  - P2 : Mixité G/F
  - P3 : Rotation
- [x] Bug fix : allSeatsSorted déclaré avant utilisation
- [x] Bug fix : sous-salles temporaires (day_of_week auto-dérivé)
- [x] Error Boundary dashboard
- [x] Rapport UX complet

### Sessions antérieures
- [x] Auth par rôle, CRUD élèves/profs/classes/salles
- [x] Import Excel, drag-and-drop éditeur
- [x] Sous-salles (normales + temporaires)
- [x] Propositions délégués, priorité couleur EBP
- [x] Partage plans, calendrier A/B, dashboard multi-rôle
- [x] Plan en cours dashboard professeur, sandbox

## Backlog

### P0 (Bloquant)
- [ ] EXÉCUTER `/app/scripts/add_placement_constraints.sql` sur Supabase
- [ ] EXÉCUTER `/app/scripts/add_lv2_column.sql` sur Supabase
- [ ] Soumission Microsoft Store

### P1
- [ ] Templates de contraintes (concept documenté)
- [ ] Badge "3 errors" React 19/Radix-UI
- [ ] Responsive éditeur

### P2
- [ ] Mode projection, QR code remplaçants
- [ ] Binômes/groupes TP, Export PDF
- [ ] Undo/redo, mode sombre

### P3
- [ ] Système collaboratif, Resend emails
- [ ] Polices (Insigna, Univers), statistiques mixité
