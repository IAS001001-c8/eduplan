# EduPlan - Application de gestion de plans de classe

## Vue d'ensemble
Application Next.js 15 + Supabase pour la gestion de plans de classe scolaires.

## Stack technique
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI, Shadcn
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Email**: Resend (noreply@eduplan-lnc.com) - Désactivé dans l'UI
- **Auth**: Custom auth avec profils Supabase

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
