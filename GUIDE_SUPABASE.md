# Guide de Création - Établissements et Accès EduPlan

## Table des matières
1. [Création d'un Établissement](#1-création-dun-établissement)
2. [Création des Niveaux (Optionnel)](#2-création-des-niveaux-optionnel)
3. [Création des Classes](#3-création-des-classes)
4. [Création des Comptes Vie Scolaire](#4-création-des-comptes-vie-scolaire)
5. [Création des Professeurs](#5-création-des-professeurs)
6. [Création des Élèves](#6-création-des-élèves)
7. [Promotion d'un Élève en Délégué](#7-promotion-dun-élève-en-délégué)
8. [Scripts Complets](#8-scripts-complets)

---

## 1. Création d'un Établissement

```sql
-- Créer un nouvel établissement
INSERT INTO establishments (id, name, code, password)
VALUES (
  gen_random_uuid(),
  'Collège Saint-Marie',     -- Nom de l'établissement
  'stm001',                   -- Code unique (utilisé à la connexion)
  'MotDePasse2024!'           -- Mot de passe établissement
)
RETURNING id, name, code;
```

**Note importante** : Gardez l'`id` retourné, il sera utilisé pour créer les utilisateurs.

---

## 2. Création des Niveaux (Optionnel)

```sql
-- Récupérer l'ID de l'établissement
-- SELECT id FROM establishments WHERE code = 'stm001';

-- Créer les niveaux
INSERT INTO levels (establishment_id, name, display_order, is_custom)
VALUES
  ('ESTABLISHMENT_ID', '6ème', 1, false),
  ('ESTABLISHMENT_ID', '5ème', 2, false),
  ('ESTABLISHMENT_ID', '4ème', 3, false),
  ('ESTABLISHMENT_ID', '3ème', 4, false);
```

---

## 3. Création des Classes

```sql
-- Créer des classes
INSERT INTO classes (establishment_id, name, level, description)
VALUES
  ('ESTABLISHMENT_ID', '6ème A', '6ème', 'Classe de 6ème A'),
  ('ESTABLISHMENT_ID', '6ème B', '6ème', 'Classe de 6ème B'),
  ('ESTABLISHMENT_ID', '5ème A', '5ème', 'Classe de 5ème A'),
  ('ESTABLISHMENT_ID', '4ème A', '4ème', 'Classe de 4ème A'),
  ('ESTABLISHMENT_ID', '3ème A', '3ème', 'Classe de 3ème A');
```

---

## 4. Création des Comptes Vie Scolaire

### Étape 1 : Créer le profil

```sql
-- Fonction pour hasher le mot de passe (si elle n'existe pas)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

-- Créer le profil Vie Scolaire
INSERT INTO profiles (
  id,
  establishment_id,
  role,
  username,
  password_hash,
  first_name,
  last_name,
  email,
  can_create_subrooms
)
VALUES (
  gen_random_uuid(),
  'ESTABLISHMENT_ID',        -- ID de l'établissement
  'vie-scolaire',            -- Rôle
  'vs.stmarie',              -- Nom d'utilisateur (pour connexion)
  hash_password('VieScol2024!'),  -- Mot de passe hashé
  'Admin',                   -- Prénom
  'VIE SCOLAIRE',            -- Nom
  'vie.scolaire@etablissement.fr',
  true                       -- Peut créer des sous-salles
)
RETURNING id, username, role;
```

---

## 5. Création des Professeurs

### Étape 1 : Créer le profil

```sql
-- Créer le profil du professeur
INSERT INTO profiles (
  id,
  establishment_id,
  role,
  username,
  password_hash,
  first_name,
  last_name,
  email,
  can_create_subrooms
)
VALUES (
  gen_random_uuid(),
  'ESTABLISHMENT_ID',
  'professeur',
  'prof.dupont',             -- Nom d'utilisateur
  hash_password('Prof2024!'),
  'Jean',
  'DUPONT',
  'jean.dupont@etablissement.fr',
  true
)
RETURNING id, username;
```

### Étape 2 : Créer l'entrée dans la table teachers

```sql
-- Récupérer l'ID du profil créé
-- SELECT id FROM profiles WHERE username = 'prof.dupont';

INSERT INTO teachers (
  profile_id,
  establishment_id,
  first_name,
  last_name,
  email,
  subject,
  is_principal,
  allow_delegate_subrooms
)
VALUES (
  'PROFILE_ID',              -- ID du profil créé
  'ESTABLISHMENT_ID',
  'Jean',
  'DUPONT',
  'jean.dupont@etablissement.fr',
  'Mathématiques',           -- Matière enseignée
  false,                     -- Est professeur principal ?
  true                       -- Autorise les délégués à créer des sous-salles
)
RETURNING id;
```

### Étape 3 : Associer le professeur à ses classes

```sql
-- Récupérer l'ID du professeur
-- SELECT id FROM teachers WHERE profile_id = 'PROFILE_ID';

-- Récupérer les IDs des classes
-- SELECT id, name FROM classes WHERE establishment_id = 'ESTABLISHMENT_ID';

INSERT INTO teacher_classes (teacher_id, class_id)
VALUES
  ('TEACHER_ID', 'CLASS_6A_ID'),
  ('TEACHER_ID', 'CLASS_5A_ID');
```

---

## 6. Création des Élèves

### Élève simple (sans accès de connexion)

```sql
-- Récupérer l'ID de la classe
-- SELECT id FROM classes WHERE name = '6ème A' AND establishment_id = 'ESTABLISHMENT_ID';

INSERT INTO students (
  establishment_id,
  class_id,
  class_name,
  first_name,
  last_name,
  email,
  role,
  can_create_subrooms
)
VALUES (
  'ESTABLISHMENT_ID',
  'CLASS_ID',
  '6ème A',
  'Marie',
  'MARTIN',
  'marie.martin@email.com',
  'eleve',                   -- Rôle : eleve, delegue, ou eco-delegue
  false
)
RETURNING id, first_name, last_name;
```

### Import en masse d'élèves

```sql
INSERT INTO students (establishment_id, class_id, class_name, first_name, last_name, role)
VALUES
  ('ESTABLISHMENT_ID', 'CLASS_ID', '6ème A', 'Lucas', 'BERNARD', 'eleve'),
  ('ESTABLISHMENT_ID', 'CLASS_ID', '6ème A', 'Emma', 'PETIT', 'eleve'),
  ('ESTABLISHMENT_ID', 'CLASS_ID', '6ème A', 'Hugo', 'ROBERT', 'eleve'),
  ('ESTABLISHMENT_ID', 'CLASS_ID', '6ème A', 'Léa', 'RICHARD', 'eleve'),
  ('ESTABLISHMENT_ID', 'CLASS_ID', '6ème A', 'Louis', 'DURAND', 'eleve');
```

---

## 7. Promotion d'un Élève en Délégué

### Étape 1 : Créer un profil pour le délégué

```sql
-- Récupérer l'ID de l'élève à promouvoir
-- SELECT id, first_name, last_name FROM students WHERE first_name = 'Marie' AND last_name = 'MARTIN';

-- Créer le profil
INSERT INTO profiles (
  id,
  establishment_id,
  role,
  username,
  password_hash,
  first_name,
  last_name,
  can_create_subrooms
)
VALUES (
  gen_random_uuid(),
  'ESTABLISHMENT_ID',
  'delegue',                 -- ou 'eco-delegue'
  'del.martin',              -- Nom d'utilisateur
  hash_password('Delegue2024!'),
  'Marie',
  'MARTIN',
  true                       -- Peut créer des sous-salles (via sandbox)
)
RETURNING id;
```

### Étape 2 : Mettre à jour l'élève

```sql
-- Mettre à jour l'élève avec le profile_id et le nouveau rôle
UPDATE students
SET 
  role = 'delegue',
  profile_id = 'PROFILE_ID',
  can_create_subrooms = true
WHERE id = 'STUDENT_ID';
```

---

## 8. Scripts Complets

### Script complet pour un nouvel établissement

```sql
-- ============================================
-- SCRIPT COMPLET : CRÉATION D'UN ÉTABLISSEMENT
-- ============================================

-- 1. Créer l'établissement
DO $$
DECLARE
  v_establishment_id UUID;
  v_vie_scolaire_id UUID;
  v_prof_profile_id UUID;
  v_prof_teacher_id UUID;
  v_class_6a_id UUID;
  v_class_5a_id UUID;
BEGIN
  -- Créer l'établissement
  INSERT INTO establishments (name, code, password)
  VALUES ('Nouveau Collège', 'nouv001', 'College2024!')
  RETURNING id INTO v_establishment_id;
  
  RAISE NOTICE 'Établissement créé : %', v_establishment_id;
  
  -- Créer les classes
  INSERT INTO classes (establishment_id, name, level)
  VALUES (v_establishment_id, '6ème A', '6ème')
  RETURNING id INTO v_class_6a_id;
  
  INSERT INTO classes (establishment_id, name, level)
  VALUES (v_establishment_id, '5ème A', '5ème')
  RETURNING id INTO v_class_5a_id;
  
  RAISE NOTICE 'Classes créées : 6A=%, 5A=%', v_class_6a_id, v_class_5a_id;
  
  -- Créer le compte Vie Scolaire
  INSERT INTO profiles (establishment_id, role, username, password_hash, first_name, last_name, can_create_subrooms)
  VALUES (v_establishment_id, 'vie-scolaire', 'vs.nouveau', crypt('VieScol2024!', gen_salt('bf')), 'Admin', 'VIE SCOLAIRE', true)
  RETURNING id INTO v_vie_scolaire_id;
  
  RAISE NOTICE 'Vie Scolaire créé : % (username: vs.nouveau)', v_vie_scolaire_id;
  
  -- Créer un professeur
  INSERT INTO profiles (establishment_id, role, username, password_hash, first_name, last_name, can_create_subrooms)
  VALUES (v_establishment_id, 'professeur', 'prof.nouveau', crypt('Prof2024!', gen_salt('bf')), 'Pierre', 'LEPROF', true)
  RETURNING id INTO v_prof_profile_id;
  
  INSERT INTO teachers (profile_id, establishment_id, first_name, last_name, subject, allow_delegate_subrooms)
  VALUES (v_prof_profile_id, v_establishment_id, 'Pierre', 'LEPROF', 'Français', true)
  RETURNING id INTO v_prof_teacher_id;
  
  -- Associer le prof aux classes
  INSERT INTO teacher_classes (teacher_id, class_id) VALUES (v_prof_teacher_id, v_class_6a_id);
  INSERT INTO teacher_classes (teacher_id, class_id) VALUES (v_prof_teacher_id, v_class_5a_id);
  
  RAISE NOTICE 'Professeur créé : % (username: prof.nouveau)', v_prof_profile_id;
  
  -- Créer quelques élèves
  INSERT INTO students (establishment_id, class_id, class_name, first_name, last_name, role)
  VALUES 
    (v_establishment_id, v_class_6a_id, '6ème A', 'Alice', 'ELEVE1', 'eleve'),
    (v_establishment_id, v_class_6a_id, '6ème A', 'Bob', 'ELEVE2', 'eleve'),
    (v_establishment_id, v_class_6a_id, '6ème A', 'Claire', 'ELEVE3', 'eleve'),
    (v_establishment_id, v_class_5a_id, '5ème A', 'David', 'ELEVE4', 'eleve'),
    (v_establishment_id, v_class_5a_id, '5ème A', 'Eva', 'ELEVE5', 'eleve');
  
  RAISE NOTICE 'Élèves créés pour les classes 6A et 5A';
  
  -- Résumé
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RÉSUMÉ DE CRÉATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Code établissement : nouv001';
  RAISE NOTICE 'Vie Scolaire : vs.nouveau / VieScol2024!';
  RAISE NOTICE 'Professeur : prof.nouveau / Prof2024!';
  RAISE NOTICE '============================================';
  
END $$;
```

---

## Vérification des données créées

```sql
-- Vérifier l'établissement
SELECT id, name, code FROM establishments WHERE code = 'nouv001';

-- Vérifier les profils
SELECT id, role, username, first_name, last_name 
FROM profiles 
WHERE establishment_id = (SELECT id FROM establishments WHERE code = 'nouv001');

-- Vérifier les classes
SELECT id, name, level 
FROM classes 
WHERE establishment_id = (SELECT id FROM establishments WHERE code = 'nouv001');

-- Vérifier les élèves
SELECT s.id, s.first_name, s.last_name, s.role, c.name as class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
WHERE s.establishment_id = (SELECT id FROM establishments WHERE code = 'nouv001');

-- Vérifier les professeurs et leurs classes
SELECT t.first_name, t.last_name, t.subject, c.name as class_name
FROM teachers t
LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id
LEFT JOIN classes c ON tc.class_id = c.id
WHERE t.establishment_id = (SELECT id FROM establishments WHERE code = 'nouv001');
```

---

## Notes importantes

### Rôles disponibles
- `vie-scolaire` : Administration complète
- `professeur` : Gestion des sous-salles et plans de classe
- `delegue` : Propositions de plans via sandbox
- `eco-delegue` : Idem délégué

### Formats recommandés pour les usernames
- Vie Scolaire : `vs.{code_etab}` (ex: vs.stmarie)
- Professeurs : `prof.{nom}` (ex: prof.dupont)
- Délégués : `del.{nom}` (ex: del.martin)

### Mots de passe
Les mots de passe sont hashés avec bcrypt. Ne jamais stocker de mot de passe en clair !

### Fonction hash_password
Si la fonction `hash_password` n'existe pas, utilisez directement :
```sql
crypt('MonMotDePasse', gen_salt('bf'))
```
