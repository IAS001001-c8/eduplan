-- Script pour créer l'établissement VICTOR-HUGO et tous les utilisateurs de test
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. CRÉER L'ÉTABLISSEMENT VICTOR-HUGO
-- ============================================

-- Vérifier si VICTOR-HUGO existe déjà, sinon le créer
INSERT INTO establishments (id, name, code, created_at)
VALUES (
  'f9b3c4d5-e6f7-4a5b-9c8d-7e6f5a4b3c2d',
  'VICTOR-HUGO 18760',
  'vh001',
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. CRÉER LE PROFESSEUR (prof.stmarie)
-- ============================================

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
  phone,
  can_create_subrooms,
  created_at,
  updated_at
)
VALUES (
  'ac977d24-eea6-4845-b95c-8bec0b2f73e0',
  '8aed3485-7b52-4efa-a56f-0a18c74dc6b9', -- ST-MARIE
  'professeur',
  'prof.stmarie',
  hash_password('Prof2024!'),
  'Jean',
  'Dupont',
  'jean.dupont@stmarie.fr',
  '0612345678',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = hash_password('Prof2024!'),
  updated_at = NOW();

-- Créer l'entrée dans la table teachers
INSERT INTO teachers (
  id,
  profile_id,
  establishment_id,
  first_name,
  last_name,
  email,
  subject,
  created_at
)
VALUES (
  'd727989d-ddc1-482a-a9df-49f7df5eebb0',
  'ac977d24-eea6-4845-b95c-8bec0b2f73e0',
  '8aed3485-7b52-4efa-a56f-0a18c74dc6b9', -- ST-MARIE
  'Jean',
  'Dupont',
  'jean.dupont@stmarie.fr',
  'Mathématiques',
  NOW()
)
ON CONFLICT (profile_id) DO UPDATE SET
  subject = 'Mathématiques',
  updated_at = NOW();

-- ============================================
-- 3. CRÉER LE DÉLÉGUÉ (del.stmarie)
-- ============================================

-- Créer le profil du délégué
INSERT INTO profiles (
  id,
  establishment_id,
  role,
  username,
  password_hash,
  first_name,
  last_name,
  email,
  phone,
  can_create_subrooms,
  created_at,
  updated_at
)
VALUES (
  'e6f90118-2f6f-4f55-8b21-2e3f7c639e51',
  '8aed3485-7b52-4efa-a56f-0a18c74dc6b9', -- ST-MARIE
  'delegue',
  'del.stmarie',
  hash_password('Delegue2024!'),
  'Martin',
  'MAUBOUSSIN',
  'mauboussin.martin@linksync.fr',
  '0767704306',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = hash_password('Delegue2024!'),
  updated_at = NOW();

-- Créer l'entrée dans la table students
INSERT INTO students (
  id,
  profile_id,
  establishment_id,
  first_name,
  last_name,
  email,
  phone,
  class_id,
  role,
  can_create_subrooms,
  created_at,
  updated_at
)
VALUES (
  '57683924-ea49-4589-8987-02ceb110b953',
  'e6f90118-2f6f-4f55-8b21-2e3f7c639e51',
  '8aed3485-7b52-4efa-a56f-0a18c74dc6b9', -- ST-MARIE
  'Martin',
  'MAUBOUSSIN',
  'mauboussin.martin@linksync.fr',
  '0767704306',
  '4849ecaf-2bfd-43f9-98b8-f0fa2005c36f', -- Classe existante
  'delegue',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (profile_id) DO UPDATE SET
  role = 'delegue',
  updated_at = NOW();

-- ============================================
-- 4. CRÉER LA VIE SCOLAIRE (vs.vhugo)
-- ============================================

-- Créer le profil de la vie scolaire
-- Note: La vie scolaire n'a pas besoin d'entrée dans students ou teachers
-- C'est juste un profil avec le rôle 'vie-scolaire'
INSERT INTO profiles (
  id,
  establishment_id,
  role,
  username,
  password_hash,
  first_name,
  last_name,
  email,
  phone,
  can_create_subrooms,
  created_at,
  updated_at
)
VALUES (
  'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e',
  'f9b3c4d5-e6f7-4a5b-9c8d-7e6f5a4b3c2d', -- VICTOR-HUGO
  'vie-scolaire',
  'vs.vhugo',
  hash_password('VieScol2024!'),
  'Marie',
  'Leblanc',
  'marie.leblanc@victorhugo.fr',
  '0623456789',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = hash_password('VieScol2024!'),
  updated_at = NOW();

-- ============================================
-- 5. VÉRIFICATION
-- ============================================

-- Afficher tous les utilisateurs créés
SELECT 
  p.username,
  p.role,
  e.name as establishment,
  e.code as establishment_code,
  CASE 
    WHEN p.role = 'professeur' THEN 'Table: teachers'
    WHEN p.role = 'delegue' THEN 'Table: students'
    WHEN p.role = 'vie-scolaire' THEN 'Table: profiles only'
  END as table_location
FROM profiles p
JOIN establishments e ON p.establishment_id = e.id
WHERE p.username IN ('prof.stmarie', 'del.stmarie', 'vs.vhugo')
ORDER BY p.username;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Tous les utilisateurs ont été créés avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Identifiants de connexion:';
  RAISE NOTICE '1. Professeur ST-MARIE:';
  RAISE NOTICE '   - Code établissement: stm001';
  RAISE NOTICE '   - Rôle: Professeur';
  RAISE NOTICE '   - Identifiant: prof.stmarie';
  RAISE NOTICE '   - Mot de passe: Prof2024!';
  RAISE NOTICE '   - Stocké dans: profiles + teachers';
  RAISE NOTICE '';
  RAISE NOTICE '2. Délégué ST-MARIE:';
  RAISE NOTICE '   - Code établissement: stm001';
  RAISE NOTICE '   - Rôle: Délégué';
  RAISE NOTICE '   - Identifiant: del.stmarie';
  RAISE NOTICE '   - Mot de passe: Delegue2024!';
  RAISE NOTICE '   - Stocké dans: profiles + students';
  RAISE NOTICE '';
  RAISE NOTICE '3. Vie Scolaire VICTOR-HUGO:';
  RAISE NOTICE '   - Code établissement: vh001';
  RAISE NOTICE '   - Rôle: Vie Scolaire';
  RAISE NOTICE '   - Identifiant: vs.vhugo';
  RAISE NOTICE '   - Mot de passe: VieScol2024!';
  RAISE NOTICE '   - Stocké dans: profiles uniquement';
END $$;
