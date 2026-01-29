# Configuration complète de la base de données

## Script exécuté : `010_complete_database_schema.sql`

Ce script ajoute TOUTES les colonnes et tables manquantes pour que l'application fonctionne complètement.

## Ce qui a été ajouté/corrigé :

### 1. **Table `classes`**
- ✅ `establishment_id` - Lien vers l'établissement

### 2. **Table `students`**
- ✅ `class_name` - Nom de la classe (pour affichage)
- ✅ `role` - Rôle de l'élève (eleve, delegue, eco-delegue)
- ✅ `can_create_subrooms` - Autorisation de créer des sous-salles
- ✅ `establishment_id` - Lien vers l'établissement
- ✅ `profile_id` - Lien vers le profil d'authentification
- ✅ `username` - Nom d'utilisateur (deprecated, utiliser profiles)
- ✅ `password_hash` - Hash du mot de passe (deprecated, utiliser profiles)

### 3. **Table `teachers`**
- ✅ `is_principal` - Indique si c'est un professeur principal
- ✅ `principal_class_id` - Classe dont il est le prof principal
- ✅ `allow_delegate_subrooms` - Autoriser les délégués à créer des sous-salles
- ✅ `profile_id` - Lien vers le profil d'authentification

### 4. **Table `rooms`** (Salles)
- ✅ `id` - Identifiant unique
- ✅ `establishment_id` - Lien vers l'établissement
- ✅ `name` - Nom de la salle
- ✅ `code` - Code unique de la salle
- ✅ `board_position` - Position du tableau (top/bottom/left/right)
- ✅ `config` - Configuration JSON (colonnes, tables, places)
- ✅ `created_by` - Créateur
- ✅ `created_at` / `updated_at` - Timestamps

### 5. **Table `sub_rooms`** (Sous-salles / Plans de classe)
- ✅ `id` - Identifiant unique
- ✅ `establishment_id` - Lien vers l'établissement
- ✅ `room_id` - Salle parente
- ✅ `name` - Nom auto-généré
- ✅ `custom_name` - Nom personnalisé
- ✅ `teacher_id` - Professeur
- ✅ `class_ids` - Liste des classes (array UUID)
- ✅ `is_multi_class` - Multi-classe ou non
- ✅ `created_by` - Créateur
- ✅ `type` - Type (temporary/indeterminate)
- ✅ `created_at` / `updated_at` - Timestamps

### 6. **Table `seating_assignments`** (Affectations de places)
- ✅ `id` - Identifiant unique
- ✅ `sub_room_id` - Sous-salle
- ✅ `student_id` - Élève assigné
- ✅ `seat_position` - Numéro de place
- ✅ `created_at` / `updated_at` - Timestamps
- ✅ Contraintes UNIQUE pour éviter les doublons

### 7. **Table `room_shares`** (Partages de plans)
- ✅ `id` - Identifiant unique
- ✅ `sub_room_id` - Sous-salle partagée
- ✅ `share_token` - Token de partage unique
- ✅ `created_by` - Créateur du partage
- ✅ `created_at` - Date de création
- ✅ `expires_at` - Date d'expiration (optionnel)
- ✅ `is_active` - Statut actif/inactif

### 8. **Table `access_codes`** (Codes d'accès)
- ✅ `id` - Identifiant unique
- ✅ `code` - Code d'accès (ex: cpdc001)
- ✅ `establishment_id` - Établissement
- ✅ `profile_id` - Profil lié
- ✅ `role` - Rôle associé
- ✅ `is_active` - Actif/inactif
- ✅ `expires_at` - Date d'expiration (optionnel)

### 9. **Table `teacher_classes`** (Relations professeur-classe)
- ✅ `teacher_id` - Professeur
- ✅ `class_id` - Classe
- ✅ Contrainte UNIQUE pour éviter les doublons

### 10. **Table `action_logs`** (Logs d'actions)
- ✅ `establishment_id` - Établissement
- ✅ `user_id` - Utilisateur
- ✅ `action_type` - Type d'action
- ✅ `entity_type` - Type d'entité modifiée
- ✅ `entity_id` - ID de l'entité
- ✅ `details` - Détails JSON
- ✅ `created_at` - Date

### 11. **Index de performance**
- ✅ Index sur tous les foreign keys
- ✅ Index sur les colonnes fréquemment recherchées
- ✅ Index sur establishment_id partout

### 12. **Triggers automatiques**
- ✅ Mise à jour automatique de `updated_at`
- ✅ Sur rooms, sub_rooms, seating_assignments

## Instructions d'exécution

\`\`\`bash
# Dans l'interface Supabase SQL Editor
# Coller et exécuter le contenu de : scripts/010_complete_database_schema.sql
\`\`\`

## Vérification

Le script affiche automatiquement la structure des tables à la fin pour vérifier que tout est OK.

## Prochaines étapes

Après l'exécution de ce script :
1. ✅ Testez l'ajout de classe
2. ✅ Testez la création de salle
3. ✅ Testez la création de sous-salle
4. ✅ Testez l'affectation d'élèves
5. ✅ Testez le partage de plan

Toutes les fonctionnalités devraient maintenant fonctionner !
