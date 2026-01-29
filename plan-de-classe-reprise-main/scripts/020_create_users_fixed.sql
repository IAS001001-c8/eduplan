-- Script pour créer les utilisateurs de test
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Créer ou récupérer l'établissement ST-MARIE
DO $$
DECLARE
  v_stmarie_id uuid;
  v_vhugo_id uuid;
  v_prof_profile_id uuid;
  v_del_profile_id uuid;
  v_vs_profile_id uuid;
  v_class_id uuid;
BEGIN
  -- Récupérer ou créer ST-MARIE
  SELECT id INTO v_stmarie_id FROM establishments WHERE code = 'stm001';
  IF v_stmarie_id IS NULL THEN
    INSERT INTO establishments (name, code)
    VALUES ('ST-MARIE 14000', 'stm001')
    RETURNING id INTO v_stmarie_id;
    RAISE NOTICE 'Établissement ST-MARIE créé avec ID: %', v_stmarie_id;
  ELSE
    RAISE NOTICE 'Établissement ST-MARIE existe déjà avec ID: %', v_stmarie_id;
  END IF;

  -- Récupérer ou créer VICTOR-HUGO
  SELECT id INTO v_vhugo_id FROM establishments WHERE code = 'vh001';
  IF v_vhugo_id IS NULL THEN
    INSERT INTO establishments (name, code)
    VALUES ('VICTOR-HUGO 18760', 'vh001')
    RETURNING id INTO v_vhugo_id;
    RAISE NOTICE 'Établissement VICTOR-HUGO créé avec ID: %', v_vhugo_id;
  ELSE
    RAISE NOTICE 'Établissement VICTOR-HUGO existe déjà avec ID: %', v_vhugo_id;
  END IF;

  -- Créer une classe de test pour ST-MARIE si elle n'existe pas
  SELECT id INTO v_class_id FROM classes WHERE name = '6ème A' AND establishment_id = v_stmarie_id;
  IF v_class_id IS NULL THEN
    INSERT INTO classes (name, level, establishment_id)
    VALUES ('6ème A', '6ème', v_stmarie_id)
    RETURNING id INTO v_class_id;
    RAISE NOTICE 'Classe 6ème A créée avec ID: %', v_class_id;
  END IF;

  -- 2. PROFESSEUR ST-MARIE (prof.stmarie / Prof2024!)
  -- Supprimer l'ancien si existe
  DELETE FROM teachers WHERE username = 'prof.stmarie';
  DELETE FROM profiles WHERE username = 'prof.stmarie';
  
  -- Créer le profil
  INSERT INTO profiles (establishment_id, role, username, first_name, last_name, email, phone, password_hash)
  VALUES (
    v_stmarie_id,
    'professeur',
    'prof.stmarie',
    'Jean',
    'Professeur',
    'prof.stmarie@test.fr',
    '0612345678',
    hash_password('Prof2024!')
  )
  RETURNING id INTO v_prof_profile_id;
  
  -- Créer l'entrée teacher
  INSERT INTO teachers (profile_id, establishment_id, first_name, last_name, email, subject, username, password_hash)
  VALUES (
    v_prof_profile_id,
    v_stmarie_id,
    'Jean',
    'Professeur',
    'prof.stmarie@test.fr',
    'Mathématiques',
    'prof.stmarie',
    hash_password('Prof2024!')
  );
  
  RAISE NOTICE 'Professeur créé: prof.stmarie / Prof2024!';

  -- 3. DÉLÉGUÉ ST-MARIE (del.stmarie / Delegue2024!)
  -- Supprimer l'ancien si existe
  DELETE FROM students WHERE username = 'del.stmarie';
  DELETE FROM profiles WHERE username = 'del.stmarie';
  
  -- Créer le profil
  INSERT INTO profiles (establishment_id, role, username, first_name, last_name, email, phone, password_hash)
  VALUES (
    v_stmarie_id,
    'delegue',
    'del.stmarie',
    'Martin',
    'MAUBOUSSIN',
    'mauboussin.martin@linksync.fr',
    '0767704306',
    hash_password('Delegue2024!')
  )
  RETURNING id INTO v_del_profile_id;
  
  -- Créer l'entrée student
  INSERT INTO students (profile_id, establishment_id, first_name, last_name, email, phone, class_name, class_id, role, username, password_hash)
  VALUES (
    v_del_profile_id,
    v_stmarie_id,
    'Martin',
    'MAUBOUSSIN',
    'mauboussin.martin@linksync.fr',
    '0767704306',
    '6ème A',
    v_class_id,
    'delegue',
    'del.stmarie',
    hash_password('Delegue2024!')
  );
  
  RAISE NOTICE 'Délégué créé: del.stmarie / Delegue2024!';

  -- 4. VIE SCOLAIRE VICTOR-HUGO (vs.vhugo / VieScol2024!)
  -- Supprimer l'ancien si existe
  DELETE FROM profiles WHERE username = 'vs.vhugo';
  
  -- Créer le profil (pas besoin d'entrée dans students ou teachers)
  INSERT INTO profiles (establishment_id, role, username, first_name, last_name, email, phone, password_hash)
  VALUES (
    v_vhugo_id,
    'vie-scolaire',
    'vs.vhugo',
    'Sophie',
    'Vie Scolaire',
    'vs.vhugo@test.fr',
    '0612345679',
    hash_password('VieScol2024!')
  )
  RETURNING id INTO v_vs_profile_id;
  
  RAISE NOTICE 'Vie Scolaire créée: vs.vhugo / VieScol2024!';

  -- Résumé
  RAISE NOTICE '=== UTILISATEURS CRÉÉS ===';
  RAISE NOTICE 'Professeur ST-MARIE: prof.stmarie / Prof2024!';
  RAISE NOTICE 'Délégué ST-MARIE: del.stmarie / Delegue2024!';
  RAISE NOTICE 'Vie Scolaire VICTOR-HUGO: vs.vhugo / VieScol2024!';
  RAISE NOTICE '========================';
  
END $$;
