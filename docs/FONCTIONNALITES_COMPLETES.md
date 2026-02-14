# EduPlan - Bilan Complet des Fonctionnalités

## 📋 Table des matières
1. [Rôles utilisateurs et permissions](#1-rôles-utilisateurs-et-permissions)
2. [Authentification](#2-authentification)
3. [Gestion des élèves](#3-gestion-des-élèves)
4. [Gestion des professeurs](#4-gestion-des-professeurs)
5. [Gestion des classes](#5-gestion-des-classes)
6. [Gestion des salles physiques](#6-gestion-des-salles-physiques)
7. [Gestion des sous-salles](#7-gestion-des-sous-salles)
8. [Éditeur de plan de classe](#8-éditeur-de-plan-de-classe)
9. [Algorithmes de placement](#9-algorithmes-de-placement)
10. [Système de propositions (Sandbox)](#10-système-de-propositions-sandbox)
11. [Sous-salles temporaires](#11-sous-salles-temporaires)
12. [Filtrage LV2](#12-filtrage-lv2)
13. [Calendrier Semaine A/B](#13-calendrier-semaine-ab)
14. [Notifications](#14-notifications)
15. [Export et partage](#15-export-et-partage)
16. [Paramètres établissement](#16-paramètres-établissement)
17. [Historique des modifications](#17-historique-des-modifications)
18. [Modèle de données](#18-modèle-de-données)
19. [Liens entre fonctionnalités](#19-liens-entre-fonctionnalités)

---

## 1. Rôles utilisateurs et permissions

### 1.1 Vie Scolaire (`vie-scolaire`)
**Permissions complètes** :
- CRUD complet sur : élèves, professeurs, classes, salles, sous-salles
- Gestion des besoins EBP (Élèves à Besoins Particuliers)
- Création/modification des accès utilisateurs
- Export PDF des identifiants
- Configuration de l'établissement
- Accès aux statistiques globales

### 1.2 Professeur (`professeur`)
**Permissions** :
- Visualisation des élèves de ses classes
- Création et édition des plans de classe pour ses sous-salles
- Validation/rejet/retour des propositions de délégués
- Export PDF des plans
- Accès au tableau de bord avec emploi du temps

### 1.3 Délégué (`delegue`)
**Permissions** :
- Visualisation des élèves de sa classe
- Création de propositions de plans de classe (Sandbox)
- Modification de ses propositions non soumises
- Visualisation en lecture seule des plans validés

### 1.4 Éco-délégué (`eco-delegue`)
**Permissions identiques au délégué**

### 1.5 Élève simple (`eleve`)
**Permissions** :
- Pas d'accès à l'application (pas de profile_id)
- Données stockées mais sans connexion possible

---

## 2. Authentification

### 2.1 Système de connexion
**Fichiers** : `/app/app/auth/login/page.tsx`, `/lib/supabase/`

- Connexion par : `code_etablissement` + `identifiant` + `mot_de_passe`
- Hash des mots de passe via fonction RPC Supabase `hash_password`
- Détection automatique du rôle depuis la table `profiles`
- Redirection vers le dashboard approprié selon le rôle

### 2.2 Gestion des sessions
- Cookies Supabase pour maintien de session
- Middleware de protection des routes (`/middleware.ts`)

### 2.3 Génération d'identifiants
**Algorithme** :
```
username = NOM.prénom.CLASSE (ex: DUPONT.jean.3A)
password = 8 caractères aléatoires (min 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole)
```

---

## 3. Gestion des élèves

### 3.1 CRUD Élèves
**Fichier** : `/app/components/students-management.tsx` (2378 lignes)

**Champs élève** :
- `id`, `first_name`, `last_name`
- `email`, `phone`
- `class_id`, `class_name`
- `role` : "eleve" | "delegue" | "eco-delegue"
- `gender` : 1=Homme, 2=Femme, 3=Autre
- `special_needs[]` : Codes EBP (VUE, AUDITION, TSA, etc.)
- `lv2` : Langue vivante 2 (Espagnol, Allemand, etc.)
- `can_create_subrooms` : boolean
- `profile_id` : Lien vers profil de connexion
- `is_deleted` : Soft delete

### 3.2 Import d'élèves
**Fichiers** : 
- `/app/components/import-students-dialog.tsx` - Import texte (copier-coller)
- `/app/components/import-excel-dialog.tsx` - Import Excel avec mapping de colonnes

**Import Excel** :
- Upload fichier .xlsx/.xls
- Mapping automatique des colonnes
- Support du genre (H/F, Homme/Femme, M/F)
- Support LV2

### 3.3 Promotion/Rétrogradation
- Promouvoir élève → délégué/éco-délégué (crée un profil)
- Rétrograder délégué → élève (supprime le profil)
- Génération automatique des identifiants lors de la promotion

### 3.4 Gestion en masse
- Sélection multiple d'élèves
- Suppression en masse (soft delete)
- Rétrogradation en masse
- Export PDF des identifiants en masse (ZIP)

### 3.5 Filtres et recherche
- Filtre par classe
- Filtre par rôle
- Filtre par LV2
- Recherche par nom/prénom

---

## 4. Gestion des professeurs

### 4.1 CRUD Professeurs
**Fichier** : `/app/components/teachers-management.tsx` (1659 lignes)

**Champs professeur** :
- `id`, `first_name`, `last_name`
- `email`, `phone`
- `subjects[]` : Matières enseignées
- `profile_id` : Lien vers profil de connexion

### 4.2 Association professeur-classes
**Table** : `teacher_classes`
- Un professeur peut enseigner à plusieurs classes
- Association via interface d'édition

### 4.3 Import de professeurs
**Fichier** : `/app/components/import-teachers-dialog.tsx`
- Import texte (copier-coller)
- Format : Prénom Nom

---

## 5. Gestion des classes

### 5.1 CRUD Classes
**Fichier** : `/app/components/classes-management.tsx` (425 lignes)

**Champs classe** :
- `id`, `name`
- `level_id` : Niveau (6ème, 5ème, etc.)
- `establishment_id`

### 5.2 Gestion des niveaux
**Fichier** : `/app/components/levels-management-dialog.tsx`
- Création de niveaux personnalisés
- Ordre d'affichage configurable

---

## 6. Gestion des salles physiques

### 6.1 CRUD Salles
**Fichiers** : 
- `/app/components/rooms-management.tsx` (873 lignes)
- `/app/components/create-room-dialog.tsx`
- `/app/components/edit-room-dialog.tsx`

**Champs salle** :
- `id`, `name`, `code`
- `board_position` : Position du tableau ("top", "bottom", "left", "right")
- `config` : Configuration des colonnes et tables

### 6.2 Configuration de salle
**Structure `config`** :
```json
{
  "columns": [
    {
      "id": "col-1",
      "tables": 4,        // Nombre de tables dans la colonne
      "seatsPerTable": 2  // Places par table
    }
  ]
}
```

### 6.3 Modèles de salle
**Fichiers** :
- `/app/components/room-templates.tsx`
- `/app/components/create-template-dialog.tsx`
- `/app/components/template-selection-dialog.tsx`

- Sauvegarde de configurations comme modèles
- Réutilisation pour créer de nouvelles salles

---

## 7. Gestion des sous-salles

### 7.1 Concept
Une **sous-salle** = une salle physique + une ou plusieurs classes + un professeur
- Représente l'utilisation d'une salle par un groupe spécifique
- Contient le plan de classe (placements des élèves)

### 7.2 CRUD Sous-salles
**Fichiers** :
- `/app/components/seating-plan-management.tsx` (1155 lignes)
- `/app/components/create-sub-room-dialog.tsx` (737 lignes)
- `/app/components/sub-room-dialog.tsx`

**Champs sous-salle** :
- `id`, `name`
- `room_id` : Salle physique
- `class_ids[]` : Classes associées
- `filtered_student_ids[]` : Élèves filtrés (pour LV2)
- `lv2_filter` : Filtre LV2 actif
- `is_temporary` : Sous-salle temporaire
- `temporary_date` : Date de la sous-salle temporaire
- `created_by`, `establishment_id`

### 7.3 Organisation en dossiers
- Vue "Fichiers" avec arborescence par classe puis professeur
- Vue "Plans" pour accès direct aux sous-salles
- Compteurs de sous-salles par professeur

---

## 8. Éditeur de plan de classe

### 8.1 Interface principale
**Fichier** : `/app/components/seating-plan-editor.tsx` (3034 lignes)

### 8.2 Fonctionnalités d'édition
- **Drag & Drop** : Glisser-déposer élèves vers places
- **Clic pour placer** : Sélectionner élève puis cliquer sur place
- **Échange (Swap)** : Déposer sur une place occupée échange les deux élèves
- **Retrait** : Drag vers zone "non placés" ou clic sur bouton supprimer

### 8.3 Affichage des places
**Couleurs des élèves** :
- 🔵 **Bleu** : EBP (prioritaire sur tout)
- 🟠 **Orange** : Délégué
- 🟢 **Vert** : Éco-délégué
- ⬜ **Émeraude** : Élève normal

**Informations affichées** :
- Initiales (Prénom.Initiale du nom)
- Badge genre (H/F)
- Tooltip avec infos complètes au survol
- Popup détaillé au clic

### 8.4 Légende et statistiques
- Compteur élèves placés / total
- Compteur places libres
- Légende des couleurs par rôle
- Indicateurs EBP

### 8.5 Actions disponibles
- **Sauvegarder** : Enregistre les placements
- **Réinitialiser** : Revient à la dernière sauvegarde
- **Tout supprimer** : Vide tous les placements
- **Historique** : Affiche l'historique des modifications
- **Exporter PDF** : Génère un PDF du plan

---

## 9. Algorithmes de placement

### 9.1 Placement aléatoire
**Fonction** : `handleRandomPlacementAll()`
```
1. Mélanger les places aléatoirement
2. Mélanger les élèves aléatoirement
3. Assigner séquentiellement
```

### 9.2 Placement alphabétique
**Fonction** : `handleAlphabeticalPlacement(order)`
```
1. Trier élèves par nom+prénom (A-Z ou Z-A)
2. Assigner séquentiellement aux places (1, 2, 3...)
```

### 9.3 Complétion simple
**Fonction** : `handleCompletePlan()`
```
1. Identifier les élèves non placés
2. Identifier les places libres
3. Selon méthode choisie (random/asc/desc), trier les non placés
4. Assigner aux places libres
```

### 9.4 Placement Intelligent V2 (EBP + Mixité + Rotation)
**Fonction** : `handleIntelligentPlacement()`

**Algorithme en 4 étapes** :

#### Étape 0 : Rotation des rangs (si élèves déjà placés)
```
Si des élèves sont déjà placés (sauf EBP):
  - Dernier rang → Premier rang
  - Premier rang → Deuxième rang
  - etc.
Les EBP restent à leur place.
```

#### Étape 1 : Placement EBP Vue/Audition
```
Codes: VUE, AUDITION, VISION, MALVOYANT, MALENTENDANT, SOURD, AVEUGLE
Placement: Premier rang obligatoire
Contrainte: Éviter d'être à côté d'un autre EBP si possible
```

#### Étape 2 : Placement EBP TSA
```
Codes: TSA, AUTISME, AESH, ASPERGER
Placement: 1er ou 2ème rang, sur les bords
Contrainte: Place libre à côté (pour AESH) si possible
Score = -voisins*10 + placesLibresAdjacentes*5 + distanceCentre*2 + bonus30 si place libre
```

#### Étape 3 : Placement autres EBP
```
Placement: 1er ou 2ème rang si possible
Contrainte: Jamais côte à côte avec autre EBP
Score = -voisins*5 + mixité*3 - distanceTableau*3
```

#### Étape 4 : Placement élèves réguliers avec mixité
```
1. Séparer garçons et filles
2. Créer liste alternée (G-F-G-F-...)
3. Pour chaque élève:
   - Trouver place maximisant le score de mixité
   - Score = -voisins*3 + mixité*5 - 10 si à côté d'EBP
```

### 9.5 Complétion Intelligente V2
**Fonction** : `handleIntelligentComplete()`
```
Même algorithme que placement intelligent V2, mais:
- Ne déplace PAS les élèves déjà placés
- Place uniquement les élèves non assignés
- Respecte les mêmes priorités EBP et mixité
```

### 9.6 Calcul de la carte des places
**Structure `SeatInfo`** :
```typescript
{
  seatNumber: number,     // Numéro de place (1, 2, 3...)
  colIndex: number,       // Index colonne (0 = gauche)
  tableIndex: number,     // Index table dans colonne
  seatIndex: number,      // Index siège dans table
  isEdge: boolean,        // Sur un bord (gauche/droite)
  distanceFromBoard: number,  // Distance au tableau
  distanceFromCenter: number  // Distance au centre
}
```

### 9.7 Score de mixité
**Fonction** : `getMixityScore()`
```
Si élève garçon (1):
  - Voisins filles uniquement → +2
  - Au moins une fille → +1
  - Que des garçons → -1
Inverse pour les filles (2).
Genre autre (3) ou non défini → 0
```

---

## 10. Système de propositions (Sandbox)

### 10.1 Concept
Les délégués peuvent proposer des plans de classe que les professeurs valident/refusent.

### 10.2 Cycle de vie d'une proposition
```
draft → pending → approved/rejected/returned
  ↑                    ↓ (returned)
  └────────────────────┘
```

**États** :
- `draft` : Brouillon, non soumis
- `pending` : Soumis, en attente de validation
- `approved` : Validé par le professeur
- `rejected` : Refusé définitivement
- `returned` : Renvoyé avec commentaires pour modification

### 10.3 Création de proposition
**Fichier** : `/app/components/create-proposal-dialog.tsx`
- Sélection de la sous-salle existante
- Sélection du professeur destinataire
- Option "Temporaire" avec date

### 10.4 Édition de proposition
**Fichier** : `/app/components/proposal-editor.tsx`
- Interface identique à l'éditeur de plan
- Sauvegarde dans `sub_room_proposals.seat_assignments`

### 10.5 Validation par le professeur
**Fichier** : `/app/components/review-proposal-dialog.tsx`

**Actions disponibles** :
- **Imposer** : Applique le plan à la sous-salle réelle
- **Refuser** : Rejette définitivement avec raison
- **Renvoyer** : Renvoie avec commentaires pour modification

### 10.6 Dashboard Sandbox
**Fichiers** :
- `/app/components/sandbox-management.tsx`
- `/app/components/dashboards/delegue-dashboard.tsx`

---

## 11. Sous-salles temporaires

### 11.1 Concept
Sous-salle valide pour une seule date, puis masquée automatiquement.

### 11.2 Champs spécifiques
```sql
is_temporary BOOLEAN DEFAULT FALSE
temporary_date DATE
```

### 11.3 Comportement
- Affichée en priorité dans "Cours en cours" si date = aujourd'hui
- Masquée de la liste principale après la date
- Badge "Temporaire" avec date affichée
- Limite à 1 seul créneau horaire

### 11.4 Création
- Checkbox "Sous-salle temporaire" dans le dialogue de création
- Date picker obligatoire si temporaire
- Le sélecteur semaine A/B est masqué (non pertinent)

---

## 12. Filtrage LV2

### 12.1 Concept
Créer des sous-salles regroupant des élèves de plusieurs classes par leur LV2.

### 12.2 Création de sous-salle LV2
1. Sélectionner plusieurs classes
2. Activer "Filtrer par LV2"
3. Choisir la LV2 (Espagnol, Allemand, etc.)
4. Seuls les élèves avec cette LV2 sont inclus

### 12.3 Stockage
```sql
filtered_student_ids UUID[]  -- IDs des élèves filtrés
lv2_filter TEXT              -- LV2 sélectionnée
```

---

## 13. Calendrier Semaine A/B

### 13.1 Concept
Certains établissements alternent semaine A et semaine B.

### 13.2 Configuration
**Fichier** : `/app/components/week-ab-calendar.tsx`
- Définir quelle semaine est A ou B
- Affectation par date

### 13.3 Créneaux horaires
**Table** : `sub_room_schedules`
```sql
day_of_week INTEGER      -- 0=Lundi, 1=Mardi, etc.
start_time TIME
end_time TIME
week_type TEXT           -- "A", "B", ou "both"
```

### 13.4 Affichage "Cours en cours"
- Détecte automatiquement si semaine A ou B
- Affiche les sous-salles actives selon l'heure actuelle

---

## 14. Notifications

### 14.1 Types de notifications
**Table** : `notifications`

| Type | Déclencheur | Destinataire |
|------|-------------|--------------|
| `proposal_submitted` | Délégué soumet proposition | Professeur |
| `plan_validated` | Professeur approuve | Délégué |
| `plan_rejected` | Professeur refuse | Délégué |
| `plan_returned` | Professeur renvoie | Délégué |
| `plan_modified` | Plan modifié | Élèves concernés |

### 14.2 Interface
**Fichier** : `/app/components/notifications-dropdown.tsx`
- Icône cloche dans la barre supérieure
- Badge compteur non lus
- Liste déroulante des notifications
- Marquer comme lu

---

## 15. Export et partage

### 15.1 Export PDF du plan
**Fichier** : `/lib/export-pdf.ts`
- Utilise `jspdf` + `html2canvas`
- Capture visuelle du plan
- Génération d'un PDF téléchargeable

### 15.2 Export PDF des identifiants
**Fichier** : `/lib/generate-credentials-pdf.ts`
- Génère un PDF par élève avec ses identifiants
- Export en masse dans un ZIP
- Régénère les mots de passe avant export

### 15.3 Partage de salle (Collaboratif)
**Fichiers** :
- `/app/components/collaborative-invitations.tsx`
- `/app/components/shared-room-view.tsx`

**Tables** : `room_shares`, `room_invitations`, `collaborative_approvals`

- Inviter un autre professeur à co-gérer une sous-salle
- Permissions lecture/écriture
- Approbation requise par le destinataire

---

## 16. Paramètres établissement

### 16.1 Configuration générale
**Fichier** : `/app/components/establishment-settings.tsx`

**Paramètres** :
- Nom de l'établissement
- Code établissement
- Email de contact
- Configuration semaine A/B activée

### 16.2 Codes EBP personnalisés
**Table** : `establishment_special_needs`
- Code (ex: "VUE", "TSA")
- Label (ex: "Déficience visuelle")
- Ordre d'affichage
- Personnalisables par établissement

---

## 17. Historique des modifications

### 17.1 Table `modification_history`
```sql
entity_type TEXT        -- "student", "sub_room", etc.
entity_id UUID
action TEXT             -- "update_special_needs", etc.
old_value JSONB
new_value JSONB
user_id UUID
establishment_id UUID
created_at TIMESTAMP
```

### 17.2 Historique des plans
**Fichier** : `/app/components/history-dialog.tsx`
- Affiche les modifications d'un plan
- Qui a modifié, quand, quoi

---

## 18. Modèle de données

### 18.1 Tables principales
```
┌─────────────────┐     ┌─────────────────┐
│  establishments │────▶│     profiles    │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│     classes     │────▶│    students     │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│    teachers     │────▶│    sub_rooms    │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│     rooms       │     │seating_assignments│
└─────────────────┘     └─────────────────┘
```

### 18.2 Tables de liaison
- `teacher_classes` : Professeur ↔ Classes
- `sub_room_teachers` : Sous-salle ↔ Professeurs
- `sub_room_schedules` : Sous-salle ↔ Créneaux horaires

### 18.3 Tables de fonctionnalités
- `sub_room_proposals` : Propositions de délégués
- `notifications` : Système de notifications
- `modification_history` : Historique
- `room_shares`, `room_invitations` : Partage collaboratif
- `week_ab_calendar` : Configuration semaines A/B
- `custom_room_templates` : Modèles de salles
- `establishment_special_needs` : Codes EBP personnalisés

---

## 19. Liens entre fonctionnalités

### 19.1 Flux de création d'un plan

```
1. Vie Scolaire crée une salle physique (rooms)
         ↓
2. Vie Scolaire crée des classes et importe les élèves
         ↓
3. Vie Scolaire crée les professeurs et les associe aux classes
         ↓
4. Professeur crée une sous-salle (sub_rooms)
   - Sélectionne sa salle physique
   - Sélectionne ses classes
   - Définit les créneaux horaires
         ↓
5. Professeur édite le plan (seating_assignments)
   - Utilise drag & drop ou placement intelligent
   - Sauvegarde
         ↓
6. Les élèves voient leur place (si accès)
```

### 19.2 Flux de proposition (Délégué)

```
1. Délégué crée une proposition (sub_room_proposals)
         ↓
2. Délégué édite le plan dans le Sandbox
         ↓
3. Délégué soumet → Notification au professeur
         ↓
4. Professeur examine la proposition
         │
         ├─→ Approuve → Plan copié vers seating_assignments
         │              Notification au délégué
         │
         ├─→ Refuse → Notification avec raison
         │
         └─→ Renvoie → Notification avec commentaires
                       Délégué peut modifier et resoumettre
```

### 19.3 Flux EBP

```
1. Vie Scolaire configure les codes EBP (establishment_special_needs)
         ↓
2. Vie Scolaire assigne des besoins aux élèves
         ↓
3. Professeur utilise "Placement Intelligent"
         ↓
4. Algorithme analyse les besoins:
   - VUE/AUDITION → Premier rang
   - TSA → Bord + place libre adjacente
   - Autres EBP → 1-2ème rang, pas côte à côte
         ↓
5. Couleur bleue prioritaire dans l'affichage
```

### 19.4 Flux LV2

```
1. Import Excel avec colonne LV2
         ↓
2. Élèves ont leur LV2 renseignée
         ↓
3. Création sous-salle "Groupe LV2 Espagnol"
   - Sélectionner plusieurs classes
   - Filtrer par LV2 = "Espagnol"
         ↓
4. Seuls les élèves avec LV2="Espagnol" sont inclus
```

### 19.5 Flux Temporaire

```
1. Professeur/Délégué crée sous-salle temporaire
   - is_temporary = true
   - temporary_date = "2025-02-15"
   - 1 seul créneau horaire
         ↓
2. Le 15/02, la sous-salle apparaît dans "Cours en cours"
         ↓
3. Après le 15/02, la sous-salle est masquée
   (mais non supprimée de la base)
```

---

## Annexe : Scripts SQL utiles

### Reset mot de passe vie-scolaire
**Fichier** : `/app/scripts/reset_vie_scolaire_password.sql`

### Migration LV2 + Temporaire
**Fichier** : `/app/scripts/add_lv2_column.sql`

---

*Document généré le 12/02/2025 - EduPlan v1.0.6*
