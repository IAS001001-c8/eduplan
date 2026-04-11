# EduPlan - PRD (Product Requirements Document)

## Problème original
Application de gestion de plans de classe scolaires avec placement intelligent des élèves, gestion des EBP (élèves à besoins particuliers), sous-salles, et déploiement Windows via Electron.

## Architecture
- **Frontend** : Next.js 15 + React 19 + TypeScript + Tailwind CSS + Shadcn UI
- **Backend** : Supabase (PostgreSQL) - requêtes directes via client
- **Desktop** : Electron pour Windows (.appx pour Microsoft Store)
- **Hébergement** : Vercel (web), Microsoft Store (Windows)

## Rôles utilisateurs
1. **Vie Scolaire (CPE)** : Administration complète, gestion des élèves/profs/salles/plans
2. **Professeur** : Gestion de ses plans de classe, vue du créneau en cours
3. **Délégué de classe** : Propositions de modifications, vue limitée

## Fonctionnalités implémentées

### Session actuelle (Avril 2026)
- [x] **Algorithme de Placement Intelligent V3** - 3 règles strictes :
  - Règle 1 (EBP) : Vue/Audition → Rang 1 ; TSA → Rang 1-2 ; Autre EBP → Rang 1-2 (places libres adjacentes si possible)
  - Règle 2 : Mixité garçons/filles (alternance)
  - Règle 3 : Rotation des rangs (placement uniquement, pas complétion)
- [x] **Bug fix sous-salles temporaires** : day_of_week auto-dérivé de la date temporaire, affichage correct sur dashboard professeur
- [x] **Nettoyage console.log** debug excessifs supprimés
- [x] **Error Boundary** : `/app/dashboard/error.tsx` pour éviter les écrans blancs
- [x] **Rapport UX** : `/app/docs/RAPPORT_UX_RECOMMANDATIONS.md`

### Sessions précédentes
- [x] Système d'authentification par rôle (vie-scolaire, professeur, délégué)
- [x] Gestion CRUD élèves, professeurs, classes, salles
- [x] Import Excel des élèves
- [x] Éditeur de plan de classe avec drag-and-drop
- [x] Placement intelligent V2 (EBP, mixité)
- [x] Sous-salles (normales et temporaires)
- [x] Limitation 1 créneau pour sous-salles temporaires
- [x] Suppression en cascade des sous-salles
- [x] Propositions temporaires des délégués
- [x] Priorité couleur EBP (bleu) > délégué (orange)
- [x] Script réinitialisation mot de passe vie scolaire
- [x] Remplacement icônes Electron (logo EduPlan)
- [x] Documentation complète (`FONCTIONNALITES_COMPLETES.md`)
- [x] Sandbox de test
- [x] Partage de plans (lien public)
- [x] Calendrier semaine A/B
- [x] Dashboard multi-rôle
- [x] Plan de classe en cours sur dashboard professeur

## Backlog priorité

### P0 (Bloquant)
- [ ] Exécuter le script SQL `/app/scripts/add_lv2_column.sql` sur Supabase (colonnes is_temporary/temporary_date pour sub_room_proposals)
- [ ] Soumission Microsoft Store (en attente retour utilisateur sur le build Windows)

### P1 (Important)
- [ ] Supprimer le badge "3 errors" React 19/Radix-UI (mise à jour dépendances)
- [ ] Responsive de l'éditeur de plan (au minimum message sur mobile)
- [ ] Confirmation de navigation quand modifications non sauvegardées
- [ ] Accessibilité (aria-labels) dans l'éditeur

### P2 (Amélioration)
- [ ] Undo/redo dans l'éditeur de plan
- [ ] Mode sombre pour projection
- [ ] Skeleton loading sur les dashboards
- [ ] Export PDF des plans de classe
- [ ] Mode projection simplifié (plein écran, noms en gros)

### P3 (Futur)
- [ ] Système collaboratif de partage de plans entre enseignants
- [ ] Réintégration Resend pour les emails
- [ ] Polices personnalisées (Insigna, Univers)
- [ ] Statistiques de mixité par plan
- [ ] Notifications push
- [ ] Support mobile drag-and-drop

## Schéma DB clé
- `sub_rooms` : is_temporary BOOLEAN, temporary_date DATE
- `sub_room_proposals` : is_temporary BOOLEAN, temporary_date DATE (nécessite exécution du script SQL)
- `sub_room_schedules` : day_of_week INT, start_time TIME, end_time TIME, week_type TEXT

## Fichiers critiques
- `/app/components/seating-plan-editor.tsx` : Algorithme de placement V3 (2981 lignes)
- `/app/components/current-class-plan.tsx` : Affichage plan en cours (sous-salles temporaires)
- `/app/components/dashboards/professeur-dashboard.tsx` : Dashboard professeur
- `/app/components/create-sub-room-dialog.tsx` : Création sous-salles
- `/app/scripts/add_lv2_column.sql` : Script SQL à exécuter

## Identifiants de test
- Rôle : vie-scolaire
- Code : stm001
- Identifiant : vs.stmarie
- Mot de passe : VieScol2024!
