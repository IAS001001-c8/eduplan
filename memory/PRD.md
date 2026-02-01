# EduPlan - Application de gestion de plans de classe

## Vue d'ensemble
Application Next.js 15 + Supabase pour la gestion de plans de classe scolaires.

## Stack technique
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI, Shadcn, Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Email**: Resend (noreply@eduplan-lnc.com) - Désactivé dans l'UI
- **Auth**: Custom auth avec profils Supabase (auto-détection du rôle)

## Fonctionnalité EBP (Élèves à Besoins Particuliers) - Feb 1, 2026

### État d'implémentation - TERMINÉ ✅
- ✅ **Base de données** : Scripts exécutés (`add_ebp_feature.sql` + `fix_rls_policies.sql`)
- ✅ **Frontend** : Tous les composants UI implémentés et testés

### Modifications Frontend - Feb 1, 2026 (Session 14)
| Composant | Modification | Status |
|-----------|--------------|--------|
| `students-management.tsx` | Ajout EBP à élèves existants (handleSaveEdit) | ✅ |
| `students-management.tsx` | Badge EBP violet dans vue Tableau | ✅ |
| `students-management.tsx` | Badge EBP violet dans vue Cartes | ✅ |
| `students-management.tsx` | Dialog édition avec checkboxes EBP (VS uniquement) | ✅ |
| `import-excel-dialog.tsx` | Disclaimer sexe compact (corrigé débordement) | ✅ |
| `seating-plan-editor.tsx` | Élèves EBP colorés en bleu (prof/VS) | ✅ |
| `seating-plan-editor.tsx` | Légende couleurs (Élève, EBP, Délégué, Éco-délégué) | ✅ |

### Couleurs Plan de Classe (Prof/VS)
- 🟢 **Vert émeraude** : Élève standard
- 🔵 **Bleu** : Élève EBP (besoins particuliers)
- 🟠 **Orange** : Délégué
- 🟢 **Vert** : Éco-délégué

### Caractéristiques EBP par défaut
PAP, PAI, TDAH, Problèmes de vue, Problèmes d'audition, Troubles moteurs, DYS, Anxiété/Panique, TSA, HPI, PTSD, Allophone, ULIS, SEGPA

### État d'implémentation
- ✅ **Frontend** : Composants UI créés et intégrés
- ✅ **Tables DB** : Script exécuté par l'utilisateur
- ⚠️ **RLS Policies** : Script de correction à exécuter (`/app/scripts/fix_rls_policies.sql`)

### Scripts SQL
1. **Tables créées** : `/app/scripts/add_schedules_tables.sql` ✅
2. **Correction RLS** : `/app/scripts/fix_rls_policies.sql` ⏳ À EXÉCUTER

### Composants Frontend Implémentés (Session Feb 1, 2026)
| Composant | Fichier | Description | Status |
|-----------|---------|-------------|--------|
| Réglages Établissement | `establishment-settings.tsx` | Gestion timezone + Semaines A/B | ✅ |
| Calendrier A/B | `week-ab-calendar.tsx` | Vue tableau 52 semaines (REFAIT) | ✅ |
| Formulaire Créneaux | `sub-room-schedule-form.tsx` | Ajout de créneaux | ✅ |
| Edit Sub-Room | `edit-sub-room-dialog.tsx` | Modifier nom + créneaux (NEW) | ✅ |
| Plan de Classe Actuel | `current-class-plan.tsx` | Dashboard prof (CORRIGÉ) | ✅ |
| Vue Emploi du temps | `schedule-timeline.tsx` | Vue hebdomadaire (AGRANDI) | ✅ |
| Dashboard Professeur | `professeur-dashboard.tsx` | Avec emploi du temps journée (REFAIT) | ✅ |
| Composant Tabs UI | `components/ui/tabs.tsx` | Onglets pour dialogues (NEW) | ✅ |

### Modifications Session Actuelle (Feb 1, 2026)
- ✅ Sidebar : "Paramètres" → "Réglages A/B" (évite confusion)
- ✅ Calendrier A/B : Vue tableau claire (N°, Période, Type, Mois)
- ✅ Edit Sub-Room Dialog : Avec onglets (Informations + Créneaux)
- ✅ Dashboard Professeur : Remplacé "Mes classes" par "Emploi du temps - [Jour]"
- ✅ CurrentClassPlan : 
  - Corrigé lecture des élèves depuis table `seating_assignments` (utilise `seat_position`)
  - Corrigé affichage des classes (utilise `class_ids` + fallback `class_id`)
  - Mode plein écran **adaptatif** : taille calculée dynamiquement selon l'espace disponible
  - Affiche le compteur "X/Y élèves placés"
- ✅ ScheduleTimeline : "Timeline" → "Emploi du temps", taille agrandie (60px/heure, 140px/colonne)

## Charte Graphique EduPlan - Feb 1, 2026

### Couleurs
- **Couleur principale** : #E7A541 (orange doré)
- **Couleur secondaire** : #D9DADC (gris clair)
- **Couleur texte** : #29282B (noir)
- **Fond** : #FFFFFF (blanc)
- **Fond contenu** : #F9F9FA (gris très clair)
- **Accent** : #FDF6E9 (orange très clair)

### Logo
- **Fichier** : `/app/public/images/logo-eduplan.png` (sans slogan)
- **Police** : Insigna (à intégrer)

### PDF & Exports
- **Identifiants** : `/app/lib/generate-credentials-pdf.ts` - Header orange, boîte credentials orange clair
- **Plans de classe** : `/app/lib/export-pdf.ts` - Header orange, tableau orange, délégués en orange

## Refonte UX Complète - Feb 1, 2026

### Interface Simplifiée
- **Dark mode** : Désactivé (toggle supprimé de la top bar)
- **Vue par défaut** : Tableau (au lieu de cartes) sur toutes les sections
- **Statistiques élèves** : Supprimées de la section Élèves
- **Filtres** : Conservés (par rôle et par classe)

### Nouvelle Page de Connexion ✅
- **Simplification** : 3 champs seulement (code établissement, identifiant, mot de passe)
- **Auto-détection du rôle** : Plus besoin de sélectionner le rôle manuellement
- **Logo** : Nouveau logo EduPlan (sans slogan)
- **Fichier** : `/app/app/auth/login/page.tsx`

### Sidebar & Top Bar ✅
- **Logo** : Nouveau logo dans la sidebar
- **Pas de dark mode** dans la top bar
- **Notifications** : Badge visible
- **Profil** : Menu déroulant avec déconnexion

### Fichiers Modifiés
- `/app/app/globals.css` - Variables CSS avec palette EduPlan
- `/app/app/auth/login/page.tsx` - Page login avec nouveau logo
- `/app/components/layout/sidebar.tsx` - Sidebar avec nouveau logo
- `/app/components/layout/top-bar.tsx` - Sans dark mode toggle
- `/app/components/students-management.tsx` - Vue tableau par défaut, sans stats
- `/app/components/rooms-management.tsx` - Vue liste par défaut
- `/app/components/sandbox-management.tsx` - Vue liste par défaut
- `/app/components/seating-plan-management.tsx` - Vue liste par défaut
- `/app/lib/generate-credentials-pdf.ts` - Charte graphique EduPlan
- `/app/lib/export-pdf.ts` - Charte graphique EduPlan

## Corrections Feb 1, 2026 (Session 13)
| Vie Scolaire | Indigo (#4F46E5) |
| Professeur | Emerald (#10B981) |
| Délégué | Sky (#0EA5E9) |

### Composants UI Ajoutés ✅
- `/app/components/ui/tooltip.tsx` - Tooltips pour la sidebar
- Package `@radix-ui/react-tooltip` installé

### Fonctionnalités UX ✅
- ✅ Navigation sans rechargement de page
- ✅ Sidebar collapsible avec état persistant (localStorage)
- ✅ Menu contextuel utilisateur dans la top bar
- ✅ Badges de notification sur les sections
- ✅ Animations fluides (framer-motion)
- ✅ Mode sombre (toggle dans top bar)

## Corrections Feb 1, 2026 (Session 13)

### Renommage des sous-salles ✅
- Nouveau composant `RenameSubRoomDialog` créé
- Bouton crayon (icône Pencil) visible au survol des cartes
- Accessible via vue grille ET vue liste
- Permissions : vie-scolaire et professeurs uniquement
- Fichiers modifiés : `seating-plan-management.tsx`, `rename-sub-room-dialog.tsx`

### Restrictions Sandbox pour Délégués ✅
- Les délégués ne peuvent créer de propositions qu'à partir de sous-salles existantes
- **FIX** : Les salles physiques sont complètement masquées pour les délégués
- Condition: `(isDelegateOrEco || useExistingSubRoom)` pour sous-salles, `!isDelegateOrEco && !useExistingSubRoom` pour salles physiques
- Message d'information affiché dans le dialogue de création
- Fichier modifié : `create-proposal-dialog.tsx`

### Plans Retournés Modifiables ✅
- Badge "À revoir" (orange avec icône RotateCcw) pour les propositions retournées
- Affichage des commentaires du professeur dans la carte de proposition
- Section orange avec icône MessageSquare pour les commentaires
- `handleReturn` met maintenant `is_submitted = false`
- Bouton "Modifier et resoumettre" stylé en orange
- Fichiers modifiés : `sandbox-management.tsx`, `review-proposal-dialog.tsx`

### Notifications Délégués - FIX ✅
- **FIX** : Ajout de `proposed_by` et `establishment_id` à la requête de propositions
- Les notifications sont maintenant correctement envoyées lors de : validation, refus, renvoi
- Utilisation de `notifyProposalStatusChange` avec tous les statuts et les bons paramètres
- Fichier modifié : `sandbox-management.tsx` (requête), `lib/notifications.ts`

### Historique avec Commentaires Textuels ✅
- **FIX** : Les commentaires textuels du professeur sont maintenant affichés dans la chronologie
- Affichage en italique sous la date du renvoi/refus
- Style : bordure gauche grise, texte orange (renvoi) ou rouge (refus)
- Fichier modifié : `seating-plan-editor.tsx`

## Corrections Jan 30, 2026 (Session 12)

### Permissions corrigées ✅
**Vie Scolaire** :
- ✅ Créer/Modifier/Supprimer des salles
- ✅ Créer/Modifier/Supprimer des sous-salles

**Professeurs** :
- ❌ NE PEUVENT PAS créer/modifier des salles
- ✅ Peuvent créer des sous-salles
- ✅ Peuvent voir et visualiser les salles
- ✅ Option "Créer une sous-salle" dans le menu

**Délégués** :
- ❌ NE PEUVENT PAS créer/modifier de salles
- ❌ NE PEUVENT PAS créer de sous-salles directement
- ✅ Doivent utiliser le bac à sable (sandbox)
- ✅ Leurs propositions sont validées par le professeur

### Variables de permissions
- `canModifyRooms` = vie-scolaire uniquement
- `canCreateSubRooms` = vie-scolaire + professeurs

## Corrections Jan 30, 2026 (Session 11)

### Notifications - Fix erreurs 520 ✅
- Changé `sendNotification` pour utiliser Supabase directement au lieu de l'API
- Plus d'erreurs 520 sur `/api/notifications`
- Les notifications sont maintenant créées directement dans la base de données

### Drag & Drop amélioré ✅
- Zones de drop précises sur chaque siège individuellement
- Effet visuel au survol (ring vert + scale)
- Suppression du drop sur la table entière (évite les placements imprécis)
- Style "dashed" pour les sièges vides quand on drag
- `e.stopPropagation()` pour éviter les conflits

### Historique et commentaires dans l'éditeur sandbox ✅
- Section "Historique et commentaires" sous le plan de classe
- Affichage du statut actuel avec badge coloré
- Statut de soumission (soumis au professeur)
- Commentaires du professeur (renvoi) en orange
- Raison du refus définitif en rouge
- Chronologie complète avec points colorés :
  - Bleu : Création
  - Violet : Soumission
  - Vert/Rouge/Orange : Validation/Refus/Renvoi

## Corrections Jan 30, 2026 (Session 10)

### Commentaires du professeur pour les délégués ✅
- Section "Commentaires du professeur" ajoutée sous le plan de classe
- Visible uniquement pour les délégués/éco-délégués
- Affiche :
  - Les commentaires du professeur (`teacher_comments`)
  - La raison du refus/renvoi (`rejection_reason`)
  - La date de dernière révision (`reviewed_at`)
- Style orange pour attirer l'attention
- Conserve la liste des élèves non placés dans la colonne de droite

## Corrections Jan 30, 2026 (Session 9)

### Fix SandboxEditor - establishmentId ✅
- Ajout de `establishmentId` à l'interface `SandboxEditorProps`
- Passage de `establishmentId` lors de l'appel de `SandboxEditor`
- Ajout de `establishment_id` au `tempSubRoom` et `proposal_data`

### Système de Notifications Complet ✅
- Nouvelle fonction `notifyEstablishmentUsers` pour notifier tous les utilisateurs de l'établissement
- Notifications lors de :
  - Création de salle (`room_created`)
  - Suppression de salle (`room_deleted`)
  - Création de sous-salle (`sub_room_created`)
  - Soumission, validation, rejet et renvoi de plans

### Script SQL mis à jour ✅
- `/app/scripts/fix_notifications_rls.sql` avec nouveaux types de notification
- Types ajoutés : `room_created`, `room_deleted`, `sub_room_created`, `sub_room_deleted`

## Corrections Jan 30, 2026 (Session 8)

### Vue Tableau Élèves - Position du Toggle ✅
- ViewToggle déplacé sous les filtres (meilleure UX)
- Visible pour tous les rôles (vie-scolaire, professeur)
- Affichage du nombre d'élèves filtrés

### Notifications - Fix user_id/establishment_id ✅
- Ajout de `establishmentId` comme prop de `SeatingPlanEditor`
- Variable `effectiveEstablishmentId` avec fallbacks multiples
- Correction des appels `sendNotification` pour soumission, validation, rejet et renvoi
- Passage de `establishmentId` depuis `SandboxManagement` et `SeatingPlanManagement`

### Historique des commentaires du professeur ✅
- Alert orange visible par le délégué quand le plan est renvoyé
- Affichage de `teacher_comments` et `rejection_reason` dans la proposition
- Interface SubRoom mise à jour avec les champs `rejection_reason`, `teacher_comments`

### Script SQL RLS Notifications ✅
- `/app/scripts/fix_notifications_rls.sql` pour activer les policies RLS permissives

## Corrections Jan 30, 2026 (Session 7)

### Vue Tableau Élèves ✅
- Ajout d'un toggle Grid/Table dans la section élèves
- Vue tableau avec colonnes : Nom, Prénom, Classe, Rôle, Email, Actions
- Checkbox de sélection multiple en vue tableau
- Import du composant ViewToggle et Table de shadcn

### Popup Sélection Élève avec Recherche ✅
- Barre de recherche dans le popup de sélection d'élève (siège vide)
- Filtrage par nom, prénom et classe
- Message "Aucun élève trouvé" si recherche sans résultat

### Affichage Prénom.Initiale ✅
- Changement de T.U → Théo.U dans l'éditeur de plan
- Format: `${student.first_name}.${student.last_name.charAt(0).toUpperCase()}`

### Script SQL Notifications ✅
- Créé `/app/scripts/fix_notifications_rls.sql` (script simplifié)
- Active RLS et crée les policies permissives
- La table `notifications` existe déjà dans Supabase
- Realtime déjà activé

## Corrections Jan 30, 2026 (Session 6)

### Toasts Optimisés ✅
- Suppression des toasts de placement d'élèves (placement, échange, retrait)
- Suppression des toasts de placement aléatoire, alphabétique, compléter
- Suppression des toasts de vidage et réinitialisation du plan
- **Toasts conservés** : erreurs, sauvegarde, soumission, refus avec commentaires, renvoi avec commentaires

### Modification de Salle ✅
- Création du composant `EditRoomDialog` (edit-room-dialog.tsx)
- Intégration dans rooms-management.tsx
- Formulaire complet : nom, code, configuration des colonnes
- Aperçu visuel de la salle modifiée

### Système de Notifications ✅
- Interface NotificationData compatible camelCase et snake_case
- Notification au professeur lors de la soumission par le délégué
- Notification au délégué lors de la validation
- Notification au délégué lors du refus définitif
- Notification au délégué lors du renvoi avec commentaires
- Composant NotificationsDropdown avec :
  - Badge de notifications non lues
  - Mise à jour temps réel (Supabase Realtime)
  - Navigation vers la page concernée au clic

## Corrections Jan 30, 2026 (Session 5)
- ✅ Page Salles crash (`showCreateTemplate is not defined`) → Corrigé
- ✅ Page Étudiants: variable `credentialsToExport` non définie → Corrigé
- ✅ Téléchargement PDF: utilisation `password_hash` avec hachage
- ✅ Page Enseignants: logique téléchargement PDF client-side
- ✅ Éditeur de plan de classe: adaptabilité des tables

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

### Session 3 - Simplification création sous-salles + PDF accès
- ✅ Création sous-salle simplifiée (sans salles collaboratives pour l'instant):
  - Vie scolaire: sélection du professeur dans un menu déroulant
  - Professeur: auto-sélectionné et non modifiable
  - Sélection de classe simplifiée (menu déroulant ou checkboxes si multi-classes)
- ✅ "Tout sélectionner" checkbox (respecte les filtres appliqués) pour élèves et professeurs
- ✅ Téléchargement ZIP d'accès groupé:
  - Génère un ZIP avec PDFs individuels pour chaque profil
  - Utilise les mots de passe existants en base
  - Fonctionne pour élèves et professeurs
- ✅ Suppression de la fonctionnalité d'envoi par email (mise en pause)

### Session 4 - Nouveau formulaire création salle
- ✅ Nouveau dialogue "Créer une salle" (`CreateRoomDialog`):
  - Nom de la salle (ex: Salle Informatique)
  - Code (ex: B12)
  - Position du tableau toujours en haut (retiré le choix)
  - Configuration colonnes: nombre de rangées et places par rangée
  - Limite de 350 places max
- ✅ Retrait du bouton "Personnaliser" et de la carte templates
- ✅ Bouton unique "Créer une salle" dans l'en-tête
- ✅ JSZip installé pour génération de ZIP côté client
- ✅ API `/api/get-credentials` optimisée (limite 50 profils, maxDuration 30s)
- ✅ Correction passage props userRole/userId au CreateSubRoomDialog
- ✅ Fix référence showCreateTemplate et Mail manquantes
- ✅ Suppression complète des fonctionnalités email (frontend)
- ✅ Limite toasts déjà configurée à 3 max
- ✅ Correction filtrage classes pour professeurs (ajout dépendance classes)

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
- [ ] Fix warnings React 19 ref (mise à jour Radix UI)
- [ ] Statistiques vie scolaire dashboard (non dynamiques actuellement)
- [ ] Historique visuel timeline des propositions dans l'éditeur sandbox
- [ ] Import Excel complet (`import-excel-dialog.tsx`)
- [ ] Vue tableau élèves - vérifier fonctionnement complet

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
