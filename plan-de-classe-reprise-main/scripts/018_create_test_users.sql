-- Script pour créer les utilisateurs de test avec mots de passe cryptés
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Créer le professeur prof.stmarie
DO $$
DECLARE
  v_establishment_id uuid;
  v_profile_id uuid;
  v_class_id uuid;
BEGIN
  -- Récupérer l'ID de l'établissement ST-MARIE
  SELECT id INTO v_establishment_id 
  FROM establishments 
  WHERE code = 'stm001';

  -- Récupérer une classe pour le professeur (première classe de ST-MARIE)
  SELECT id INTO v_class_id 
  FROM classes 
  WHERE establishment_id = v_establishment_id 
  LIMIT 1;

  -- Créer le profil du professeur
  INSERT INTO profiles (
    establishment_id,
    role,
    username,
    password_hash,
    first_name,
    last_name,
    email,
    phone,
    can_create_subrooms
  ) VALUES (
    v_establishment_id,
    'professeur',
    'prof.stmarie',
    hash_password('Prof2024!'),
    'Professeur',
    'Test',
    'prof.stmarie@test.fr',
    '0612345678',
    true
  ) RETURNING id INTO v_profile_id;

  -- Créer l'entrée dans la table teachers
  INSERT INTO teachers (
    profile_id,
    establishment_id,
    first_name,
    last_name,
    email,
    subject,
    username,
    password_hash
  ) VALUES (
    v_profile_id,
    v_establishment_id,
    'Professeur',
    'Test',
    'prof.stmarie@test.fr',
    'Mathématiques',
    'prof.stmarie',
    hash_password('Prof2024!')
  );

  -- Lier le professeur à une classe
  IF v_class_id IS NOT NULL THEN
    INSERT INTO teacher_classes (teacher_id, class_id)
    SELECT id, v_class_id FROM teachers WHERE profile_id = v_profile_id;
  END IF;

  RAISE NOTICE 'Professeur créé: prof.stmarie / Prof2024!';
END $$;

-- 2. Créer le délégué del.stmarie
DO $$
DECLARE
  v_establishment_id uuid;
  v_profile_id uuid;
  v_class_id uuid;
BEGIN
  -- Récupérer l'ID de l'établissement ST-MARIE
  SELECT id INTO v_establishment_id 
  FROM establishments 
  WHERE code = 'stm001';

  -- Récupérer une classe pour l'élève
  SELECT id INTO v_class_id 
  FROM classes 
  WHERE establishment_id = v_establishment_id 
  LIMIT 1;

  -- Vérifier si le profil existe déjà
  SELECT id INTO v_profile_id 
  FROM profiles 
  WHERE username = 'del.stmarie';

  IF v_profile_id IS NULL THEN
    -- Créer le profil du délégué
    INSERT INTO profiles (
      establishment_id,
      role,
      username,
      password_hash,
      first_name,
      last_name,
      email,
      phone,
      can_create_subrooms
    ) VALUES (
      v_establishment_id,
      'delegue',
      'del.stmarie',
      hash_password('Delegue2024!'),
      'Délégué',
      'Test',
      'del.stmarie@test.fr',
      '0612345679',
      false
    ) RETURNING id INTO v_profile_id;
  ELSE
    -- Mettre à jour le mot de passe si le profil existe
    UPDATE profiles 
    SET password_hash = hash_password('Delegue2024!')
    WHERE id = v_profile_id;
  END IF;

  -- Vérifier si l'élève existe déjà
  IF NOT EXISTS (SELECT 1 FROM students WHERE profile_id = v_profile_id) THEN
    -- Créer l'entrée dans la table students
    INSERT INTO students (
      profile_id,
      establishment_id,
      first_name,
      last_name,
      email,
      phone,
      class_id,
      role,
      can_create_subrooms,
      username,
      password_hash
    ) VALUES (
      v_profile_id,
      v_establishment_id,
      'Délégué',
      'Test',
      'del.stmarie@test.fr',
      '0612345679',
      v_class_id,
      'delegue',
      false,
      'del.stmarie',
      hash_password('Delegue2024!')
    );
  ELSE
    -- Mettre à jour le mot de passe si l'élève existe
    UPDATE students 
    SET password_hash = hash_password('Delegue2024!')
    WHERE profile_id = v_profile_id;
  END IF;

  RAISE NOTICE 'Délégué créé/mis à jour: del.stmarie / Delegue2024!';
END $$;

-- 3. Créer la vie scolaire vs.vhugo
DO $$
DECLARE
  v_establishment_id uuid;
  v_profile_id uuid;
BEGIN
  -- Récupérer l'ID de l'établissement VICTOR-HUGO
  SELECT id INTO v_establishment_id 
  FROM establishments 
  WHERE code = 'vh001';

  -- Si l'établissement n'existe pas, le créer
  IF v_establishment_id IS NULL THEN
    INSERT INTO establishments (name, code)
    VALUES ('VICTOR-HUGO 18760', 'vh001')
    RETURNING id INTO v_establishment_id;
    
    RAISE NOTICE 'Établissement VICTOR-HUGO créé';
  END IF;

  -- Créer le profil de la vie scolaire
  INSERT INTO profiles (
    establishment_id,
    role,
    username,
    password_hash,
    first_name,
    last_name,
    email,
    phone,
    can_create_subrooms
  ) VALUES (
    v_establishment_id,
    'vie-scolaire',
    'vs.vhugo',
    hash_password('VieScol2024!'),
    'Vie Scolaire',
    'Victor Hugo',
    'vs.vhugo@test.fr',
    '0612345680',
    true
  ) RETURNING id INTO v_profile_id;

  RAISE NOTICE 'Vie Scolaire créée: vs.vhugo / VieScol2024!';
END $$;

-- Afficher un résumé des utilisateurs créés
SELECT 
  p.username,
  p.role,
  e.name as etablissement,
  e.code as code_etablissement,
  'Mot de passe crypté avec bcrypt' as password_status
FROM profiles p
JOIN establishments e ON p.establishment_id = e.id
WHERE p.username IN ('prof.stmarie', 'del.stmarie', 'vs.vhugo')
ORDER BY p.username;
