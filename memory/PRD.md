# EduPlan - Application de gestion de plans de classe

## Vue d'ensemble
Application Next.js 15 + Supabase pour la gestion de plans de classe scolaires.

## Stack technique
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI, Shadcn
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Email**: Resend (noreply@eduplan-lnc.com) - Désactivé dans l'UI
- **Auth**: Custom auth avec profils Supabase

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
