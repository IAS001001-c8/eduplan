# EduPlan - PRD (Product Requirements Document)

## Problème original
Application de gestion de plans de classe scolaires avec placement intelligent des élèves, gestion des EBP, sous-salles, et déploiement Windows via Electron.

## Architecture
- **Frontend** : Next.js 15 + React 19 + TypeScript + Tailwind CSS + Shadcn UI
- **Backend** : Supabase (PostgreSQL) - requêtes directes via client
- **Desktop** : Electron pour Windows (.appx pour Microsoft Store)
- **Hébergement** : Vercel (web), Microsoft Store (Windows)

## Rôles utilisateurs
1. **Vie Scolaire (CPE)** : Administration complète, pas d'accès aux contraintes prof
2. **Professeur** : Gestion de ses plans + contraintes de placement par élève
3. **Délégué de classe** : Propositions de modifications, vue limitée

## Fonctionnalités implémentées

### Session actuelle (Avril 2026 - Phase 2)
- [x] **Section "Mes élèves & contraintes"** (Professeur uniquement)
  - Grille d'élèves par classe (format "Prénom I.")
  - Sélection multi-élèves (1 à 4 max par action)
  - 3 types de contraintes : Ensemble (côte à côte), Séparés (min 2 places), Devant (rang 1-2)
  - Panneau droit avec liste des contraintes + date + raison optionnelle
  - Gestion robuste des conflits (ensemble ≠ séparés)
  - EBP visuellement identifiés (anneau bleu)
- [x] **Algorithme de Placement V4** avec 4 niveaux de priorité :
  - P0 : Contraintes professeur (devant → ensemble → séparés)
  - P1 : EBP (vue/audition → rang 1, TSA → rang 1-2, autre EBP → rang 1-2)
  - P2 : Mixité garçons/filles
  - P3 : Rotation des rangs (placement uniquement)
- [x] **Alertes de placement** quand une contrainte est impossible à respecter
- [x] **Error Boundary** pour le dashboard
- [x] Script SQL pour table `placement_constraints`
- [x] Identifiants test professeur (DUBOIS.emma / Prof2024!)

### Session précédente (Avril 2026 - Phase 1)
- [x] Algorithme Placement Intelligent V3
- [x] Bug fix sous-salles temporaires (day_of_week auto-dérivé)
- [x] Nettoyage console.log debug
- [x] Rapport UX complet

### Sessions antérieures
- [x] Système d'authentification par rôle
- [x] Gestion CRUD élèves, professeurs, classes, salles
- [x] Import Excel des élèves
- [x] Éditeur de plan de classe avec drag-and-drop
- [x] Sous-salles (normales et temporaires)
- [x] Propositions temporaires des délégués
- [x] Priorité couleur EBP > délégué
- [x] Partage de plans (lien public)
- [x] Calendrier semaine A/B
- [x] Dashboard multi-rôle
- [x] Plan de classe en cours sur dashboard professeur
- [x] Sandbox de test
- [x] Documentation complète

## Backlog priorité

### P0 (Bloquant)
- [ ] **EXÉCUTER** `/app/scripts/add_placement_constraints.sql` sur Supabase
- [ ] **EXÉCUTER** `/app/scripts/add_lv2_column.sql` sur Supabase (colonnes is_temporary pour proposals)
- [ ] Soumission Microsoft Store (en attente retour user)

### P1 (Important)
- [ ] Templates de contraintes (concept documenté, non implémenté)
- [ ] Historique des contraintes avec raisons
- [ ] Supprimer badge "3 errors" React 19/Radix-UI
- [ ] Responsive éditeur de plan

### P2 (Amélioration)
- [ ] Mode projection (plein écran, noms en gros, fond sombre)
- [ ] QR Code pour remplaçants
- [ ] Gestion des binômes/groupes de TP
- [ ] Export PDF des plans
- [ ] Undo/redo dans l'éditeur
- [ ] Mode sombre

### P3 (Futur)
- [ ] Système collaboratif entre enseignants
- [ ] Réintégration Resend pour emails
- [ ] Polices personnalisées (Insigna, Univers)
- [ ] Statistiques de mixité
- [ ] Notifications push

## Schéma DB clé
- `placement_constraints` : teacher_id, constraint_type (ensemble/separes/devant), student_ids UUID[], reason TEXT
- `sub_rooms` : is_temporary BOOLEAN, temporary_date DATE
- `sub_room_proposals` : is_temporary BOOLEAN, temporary_date DATE
- `sub_room_schedules` : day_of_week INT, start_time TIME, end_time TIME

## Fichiers critiques
- `/app/components/teacher-student-constraints.tsx` : Section contraintes professeur
- `/app/components/seating-plan-editor.tsx` : Algorithme V4 (3200+ lignes)
- `/app/components/current-class-plan.tsx` : Affichage plan en cours
- `/app/components/dashboard-content.tsx` : Routage par rôle
- `/app/scripts/add_placement_constraints.sql` : Script SQL à exécuter
- `/app/scripts/add_lv2_column.sql` : Script SQL à exécuter
