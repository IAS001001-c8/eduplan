# 📚 Guide de création d'établissements et d'utilisateurs

## EduPlan - Administration Supabase

Ce guide explique comment créer manuellement un établissement et son compte Vie Scolaire directement depuis l'interface Supabase.

---

## 📋 Table des matières

1. [Prérequis](#1-prérequis)
2. [Étape 1 : Créer un établissement](#2-étape-1--créer-un-établissement)
3. [Étape 2 : Créer le profil Vie Scolaire](#3-étape-2--créer-le-profil-vie-scolaire)
4. [Étape 3 : Ajouter les caractéristiques EBP par défaut](#4-étape-3--ajouter-les-caractéristiques-ebp-par-défaut)
5. [Étape 4 : Créer les paramètres établissement](#5-étape-4--créer-les-paramètres-établissement)
6. [Script SQL complet](#6-script-sql-complet)
7. [Vérification](#7-vérification)
8. [FAQ](#8-faq)

---

## 1. Prérequis

- Accès au **Dashboard Supabase** : https://supabase.com/dashboard
- Sélectionner votre projet EduPlan
- Aller dans **SQL Editor** (menu de gauche)

---

## 2. Étape 1 : Créer un établissement

### Via l'interface Table Editor

1. Aller dans **Table Editor** (menu gauche)
2. Sélectionner la table **`establishments`**
3. Cliquer sur **"Insert row"**
4. Remplir les champs :

| Champ | Valeur exemple | Description |
|-------|----------------|-------------|
| `id` | *(auto-généré)* | Laisser vide, UUID auto |
| `name` | `Collège Victor Hugo` | Nom complet de l'établissement |
| `code` | `cvh001` | Code unique (minuscules, pour la connexion) |
| `created_at` | *(auto)* | Date de création |

5. Cliquer sur **"Save"**

### Via SQL

```sql
INSERT INTO public.establishments (name, code)
VALUES ('Collège Victor Hugo', 'cvh001')
RETURNING id, name, code;
```

> ⚠️ **Important** : Notez l'`id` retourné, vous en aurez besoin pour les étapes suivantes.

---

## 3. Étape 2 : Créer le profil Vie Scolaire

### Via l'interface Table Editor

1. Aller dans **Table Editor**
2. Sélectionner la table **`profiles`**
3. Cliquer sur **"Insert row"**
4. Remplir les champs :

| Champ | Valeur exemple | Description |
|-------|----------------|-------------|
| `id` | *(auto-généré)* | Laisser vide |
| `establishment_id` | `{ID de l'établissement}` | Copier l'ID de l'étape 1 |
| `username` | `vs.victorhugo` | Identifiant de connexion |
| `password_hash` | `VieScol2024!` | Mot de passe (stocké en clair dans ce système) |
| `role` | `vie-scolaire` | **IMPORTANT** : exactement `vie-scolaire` |
| `first_name` | `Admin` | Prénom |
| `last_name` | `Vie Scolaire` | Nom |
| `email` | `vs@victorhugo.fr` | Email (optionnel) |
| `is_active` | `true` | Compte actif |

5. Cliquer sur **"Save"**

### Via SQL

```sql
-- Remplacez 'VOTRE_ESTABLISHMENT_ID' par l'ID obtenu à l'étape 1
INSERT INTO public.profiles (
  establishment_id,
  username,
  password_hash,
  role,
  first_name,
  last_name,
  email,
  is_active
)
VALUES (
  'VOTRE_ESTABLISHMENT_ID',  -- UUID de l'établissement
  'vs.victorhugo',            -- Identifiant
  'VieScol2024!',             -- Mot de passe
  'vie-scolaire',             -- Rôle (NE PAS MODIFIER)
  'Admin',                    -- Prénom
  'Vie Scolaire',             -- Nom
  'vs@victorhugo.fr',         -- Email
  true                        -- Actif
)
RETURNING id, username, role;
```

---

## 4. Étape 3 : Ajouter les caractéristiques EBP par défaut

Cette étape ajoute les besoins particuliers disponibles pour l'établissement.

### Via SQL (recommandé)

```sql
-- Remplacez 'VOTRE_ESTABLISHMENT_ID' par l'ID de l'établissement
INSERT INTO public.establishment_special_needs (establishment_id, code, label, description, is_default)
VALUES
  ('VOTRE_ESTABLISHMENT_ID', 'PAP', 'Plan d''Accompagnement Personnalisé', 'Élève avec PAP', true),
  ('VOTRE_ESTABLISHMENT_ID', 'PAI', 'Projet d''Accueil Individualisé', 'Élève avec PAI', true),
  ('VOTRE_ESTABLISHMENT_ID', 'TDAH', 'Trouble Déficit de l''Attention', 'Élève TDAH', true),
  ('VOTRE_ESTABLISHMENT_ID', 'VUE', 'Problèmes de vue', 'Placement premier rang recommandé', true),
  ('VOTRE_ESTABLISHMENT_ID', 'AUDITION', 'Problèmes d''audition', 'Placement premier rang recommandé', true),
  ('VOTRE_ESTABLISHMENT_ID', 'MOTEUR', 'Troubles moteurs', 'Accessibilité requise', true),
  ('VOTRE_ESTABLISHMENT_ID', 'DYS', 'Troubles DYS', 'Dyslexie, dyscalculie, etc.', true),
  ('VOTRE_ESTABLISHMENT_ID', 'ANXIETE', 'Anxiété/Panique', 'Gestion du stress', true),
  ('VOTRE_ESTABLISHMENT_ID', 'TSA', 'Trouble du Spectre Autistique', 'Placement périphérie recommandé', true),
  ('VOTRE_ESTABLISHMENT_ID', 'HPI', 'Haut Potentiel Intellectuel', 'Élève HPI', true),
  ('VOTRE_ESTABLISHMENT_ID', 'ALLOPHONE', 'Allophone', 'Élève non francophone', true),
  ('VOTRE_ESTABLISHMENT_ID', 'ULIS', 'ULIS', 'Unité Localisée pour l''Inclusion Scolaire', true),
  ('VOTRE_ESTABLISHMENT_ID', 'SEGPA', 'SEGPA', 'Section d''Enseignement Général et Professionnel Adapté', true);
```

---

## 5. Étape 4 : Créer les paramètres établissement

Cette étape configure les paramètres généraux (fuseau horaire, début d'année scolaire).

### Via SQL

```sql
-- Remplacez 'VOTRE_ESTABLISHMENT_ID' par l'ID de l'établissement
INSERT INTO public.establishment_settings (
  establishment_id,
  timezone,
  school_year_start_month
)
VALUES (
  'VOTRE_ESTABLISHMENT_ID',
  'Europe/Paris',
  9  -- Septembre
);
```

---

## 6. Script SQL complet

Voici un script complet qui fait tout en une seule fois :

```sql
-- ============================================
-- SCRIPT DE CRÉATION D'UN ÉTABLISSEMENT COMPLET
-- ============================================
-- 
-- Instructions :
-- 1. Modifiez les valeurs dans la section CONFIGURATION
-- 2. Exécutez le script entier dans Supabase SQL Editor
-- ============================================

-- ==========================================
-- CONFIGURATION (MODIFIER ICI)
-- ==========================================
DO $$
DECLARE
  v_establishment_name TEXT := 'Collège Victor Hugo';      -- Nom de l'établissement
  v_establishment_code TEXT := 'cvh001';                   -- Code unique (minuscules)
  v_vs_username TEXT := 'vs.victorhugo';                   -- Identifiant Vie Scolaire
  v_vs_password TEXT := 'VieScol2024!';                    -- Mot de passe
  v_vs_email TEXT := 'viescolaire@victorhugo.fr';          -- Email (optionnel)
  v_vs_first_name TEXT := 'Admin';                         -- Prénom
  v_vs_last_name TEXT := 'Vie Scolaire';                   -- Nom
  
  -- Variables internes (ne pas modifier)
  v_establishment_id UUID;
  v_profile_id UUID;
BEGIN
  -- ==========================================
  -- 1. CRÉATION DE L'ÉTABLISSEMENT
  -- ==========================================
  INSERT INTO public.establishments (name, code)
  VALUES (v_establishment_name, v_establishment_code)
  RETURNING id INTO v_establishment_id;
  
  RAISE NOTICE '✅ Établissement créé: % (ID: %)', v_establishment_name, v_establishment_id;
  
  -- ==========================================
  -- 2. CRÉATION DU PROFIL VIE SCOLAIRE
  -- ==========================================
  INSERT INTO public.profiles (
    establishment_id,
    username,
    password_hash,
    role,
    first_name,
    last_name,
    email,
    is_active
  )
  VALUES (
    v_establishment_id,
    v_vs_username,
    v_vs_password,
    'vie-scolaire',
    v_vs_first_name,
    v_vs_last_name,
    v_vs_email,
    true
  )
  RETURNING id INTO v_profile_id;
  
  RAISE NOTICE '✅ Profil Vie Scolaire créé: % (ID: %)', v_vs_username, v_profile_id;
  
  -- ==========================================
  -- 3. AJOUT DES CARACTÉRISTIQUES EBP
  -- ==========================================
  INSERT INTO public.establishment_special_needs (establishment_id, code, label, description, is_default)
  VALUES
    (v_establishment_id, 'PAP', 'Plan d''Accompagnement Personnalisé', 'Élève avec PAP', true),
    (v_establishment_id, 'PAI', 'Projet d''Accueil Individualisé', 'Élève avec PAI', true),
    (v_establishment_id, 'TDAH', 'Trouble Déficit de l''Attention', 'Élève TDAH', true),
    (v_establishment_id, 'VUE', 'Problèmes de vue', 'Placement premier rang recommandé', true),
    (v_establishment_id, 'AUDITION', 'Problèmes d''audition', 'Placement premier rang recommandé', true),
    (v_establishment_id, 'MOTEUR', 'Troubles moteurs', 'Accessibilité requise', true),
    (v_establishment_id, 'DYS', 'Troubles DYS', 'Dyslexie, dyscalculie, etc.', true),
    (v_establishment_id, 'ANXIETE', 'Anxiété/Panique', 'Gestion du stress', true),
    (v_establishment_id, 'TSA', 'Trouble du Spectre Autistique', 'Placement périphérie recommandé', true),
    (v_establishment_id, 'HPI', 'Haut Potentiel Intellectuel', 'Élève HPI', true),
    (v_establishment_id, 'ALLOPHONE', 'Allophone', 'Élève non francophone', true),
    (v_establishment_id, 'ULIS', 'ULIS', 'Unité Localisée pour l''Inclusion Scolaire', true),
    (v_establishment_id, 'SEGPA', 'SEGPA', 'Section d''Enseignement Général et Professionnel Adapté', true);
  
  RAISE NOTICE '✅ Caractéristiques EBP ajoutées (13 items)';
  
  -- ==========================================
  -- 4. CRÉATION DES PARAMÈTRES ÉTABLISSEMENT
  -- ==========================================
  INSERT INTO public.establishment_settings (establishment_id, timezone, school_year_start_month)
  VALUES (v_establishment_id, 'Europe/Paris', 9);
  
  RAISE NOTICE '✅ Paramètres établissement créés';
  
  -- ==========================================
  -- RÉSUMÉ
  -- ==========================================
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🎉 ÉTABLISSEMENT CRÉÉ AVEC SUCCÈS !';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Établissement : %', v_establishment_name;
  RAISE NOTICE 'Code          : %', v_establishment_code;
  RAISE NOTICE 'ID            : %', v_establishment_id;
  RAISE NOTICE '--------------------------------------------';
  RAISE NOTICE 'Compte Vie Scolaire :';
  RAISE NOTICE '  Identifiant : %', v_vs_username;
  RAISE NOTICE '  Mot de passe: %', v_vs_password;
  RAISE NOTICE '============================================';
  
END $$;
```

---

## 7. Vérification

### Vérifier l'établissement

```sql
SELECT id, name, code, created_at 
FROM establishments 
WHERE code = 'cvh001';
```

### Vérifier le profil Vie Scolaire

```sql
SELECT p.id, p.username, p.role, p.first_name, p.last_name, e.name as establishment
FROM profiles p
JOIN establishments e ON e.id = p.establishment_id
WHERE p.username = 'vs.victorhugo';
```

### Vérifier les EBP

```sql
SELECT code, label 
FROM establishment_special_needs 
WHERE establishment_id = 'VOTRE_ESTABLISHMENT_ID';
```

---

## 8. FAQ

### Q: Comment modifier le mot de passe d'un compte ?

```sql
UPDATE profiles 
SET password_hash = 'NouveauMotDePasse123!'
WHERE username = 'vs.victorhugo';
```

### Q: Comment désactiver un compte temporairement ?

```sql
UPDATE profiles 
SET is_active = false
WHERE username = 'vs.victorhugo';
```

### Q: Comment supprimer un établissement complet ?

> ⚠️ **ATTENTION** : Cette action est irréversible !

```sql
-- Remplacez l'ID par celui de l'établissement à supprimer
DO $$
DECLARE
  v_establishment_id UUID := 'VOTRE_ESTABLISHMENT_ID';
BEGIN
  -- Supprimer dans l'ordre (contraintes FK)
  DELETE FROM seating_assignments WHERE sub_room_id IN (SELECT id FROM sub_rooms WHERE establishment_id = v_establishment_id);
  DELETE FROM sub_room_schedules WHERE sub_room_id IN (SELECT id FROM sub_rooms WHERE establishment_id = v_establishment_id);
  DELETE FROM sub_rooms WHERE establishment_id = v_establishment_id;
  DELETE FROM rooms WHERE establishment_id = v_establishment_id;
  DELETE FROM students WHERE establishment_id = v_establishment_id;
  DELETE FROM teacher_classes WHERE teacher_id IN (SELECT id FROM teachers WHERE establishment_id = v_establishment_id);
  DELETE FROM teachers WHERE establishment_id = v_establishment_id;
  DELETE FROM classes WHERE establishment_id = v_establishment_id;
  DELETE FROM profiles WHERE establishment_id = v_establishment_id;
  DELETE FROM establishment_special_needs WHERE establishment_id = v_establishment_id;
  DELETE FROM establishment_settings WHERE establishment_id = v_establishment_id;
  DELETE FROM week_ab_calendar WHERE establishment_id = v_establishment_id;
  DELETE FROM establishments WHERE id = v_establishment_id;
  
  RAISE NOTICE '✅ Établissement supprimé';
END $$;
```

### Q: Comment voir tous les établissements ?

```sql
SELECT 
  e.id,
  e.name,
  e.code,
  COUNT(DISTINCT p.id) as nb_profiles,
  COUNT(DISTINCT t.id) as nb_teachers,
  COUNT(DISTINCT s.id) as nb_students,
  COUNT(DISTINCT c.id) as nb_classes
FROM establishments e
LEFT JOIN profiles p ON p.establishment_id = e.id
LEFT JOIN teachers t ON t.establishment_id = e.id
LEFT JOIN students s ON s.establishment_id = e.id
LEFT JOIN classes c ON c.establishment_id = e.id
GROUP BY e.id, e.name, e.code
ORDER BY e.name;
```

---

## 📝 Résumé des identifiants de connexion

Après création, pour se connecter à EduPlan :

| Champ | Valeur |
|-------|--------|
| **Code établissement** | `cvh001` |
| **Identifiant** | `vs.victorhugo` |
| **Mot de passe** | `VieScol2024!` |

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs dans **Supabase > Logs > Postgres**
2. Vérifier les erreurs dans la console du navigateur
3. S'assurer que les RLS policies permettent l'accès

---

*Guide créé pour EduPlan - Une École Un Plan*
