-- Script SQL pour réinitialiser le mot de passe d'un compte vie scolaire
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ============================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================
-- 1. Remplacez 'EMAIL_DU_COMPTE' par l'email du compte vie scolaire
-- 2. Remplacez 'NOUVEAU_MOT_DE_PASSE' par le nouveau mot de passe souhaité
--    (minimum 6 caractères recommandé)
-- 3. Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================

-- Option 1: Réinitialiser via l'email (RECOMMANDÉ)
-- Ceci envoie un email de réinitialisation au compte
-- 
-- DO $$
-- DECLARE
--   target_email TEXT := 'EMAIL_DU_COMPTE@example.com';
-- BEGIN
--   -- Vérifier que le compte existe et est bien vie-scolaire
--   IF NOT EXISTS (
--     SELECT 1 FROM auth.users u
--     JOIN public.profiles p ON u.id = p.id
--     WHERE u.email = target_email AND p.role = 'vie-scolaire'
--   ) THEN
--     RAISE EXCEPTION 'Aucun compte vie-scolaire trouvé avec cet email: %', target_email;
--   END IF;
--   
--   -- Note: Pour envoyer un email de reset, utilisez l'API Supabase Auth
--   RAISE NOTICE 'Compte vie-scolaire trouvé. Utilisez supabase.auth.resetPasswordForEmail() côté client.';
-- END $$;

-- Option 2: Réinitialiser directement le mot de passe
-- ATTENTION: Cette méthode nécessite que vous ayez accès à la fonction pgcrypto
-- et modifie directement la table auth.users

-- Fonction pour réinitialiser le mot de passe d'un compte vie-scolaire
CREATE OR REPLACE FUNCTION reset_vie_scolaire_password(
  target_email TEXT,
  new_password TEXT
)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- Vérifier que le mot de passe a au moins 6 caractères
  IF LENGTH(new_password) < 6 THEN
    RAISE EXCEPTION 'Le mot de passe doit contenir au moins 6 caractères';
  END IF;

  -- Trouver l'utilisateur vie-scolaire avec cet email
  SELECT u.id INTO target_user_id
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE u.email = target_email 
    AND p.role = 'vie-scolaire';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun compte vie-scolaire trouvé avec l''email: %', target_email;
  END IF;

  -- Hasher le nouveau mot de passe avec bcrypt
  encrypted_pw := crypt(new_password, gen_salt('bf'));

  -- Mettre à jour le mot de passe
  UPDATE auth.users
  SET 
    encrypted_password = encrypted_pw,
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN 'Mot de passe réinitialisé avec succès pour ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- EXEMPLE D'UTILISATION
-- ============================================================
-- Pour réinitialiser un mot de passe, exécutez:
--
-- SELECT reset_vie_scolaire_password('vs.stmarie@example.com', 'NouveauMotDePasse123!');
--
-- ============================================================

-- MÉTHODE ALTERNATIVE PLUS SIMPLE (sans fonction)
-- Décommentez et modifiez les valeurs ci-dessous pour utiliser

/*
DO $$
DECLARE
  target_email TEXT := 'vs.stmarie@example.com';  -- MODIFIER ICI
  new_password TEXT := 'NouveauMotDePasse123!';   -- MODIFIER ICI
  target_user_id UUID;
BEGIN
  -- Trouver l'utilisateur
  SELECT u.id INTO target_user_id
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE u.email = target_email AND p.role = 'vie-scolaire';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Compte vie-scolaire non trouvé: %', target_email;
  END IF;

  -- Mettre à jour le mot de passe
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;

  RAISE NOTICE 'Mot de passe réinitialisé avec succès pour %', target_email;
END $$;
*/

-- ============================================================
-- VÉRIFICATION: Lister tous les comptes vie-scolaire
-- ============================================================
-- SELECT u.email, p.first_name, p.last_name, p.role
-- FROM auth.users u
-- JOIN public.profiles p ON u.id = p.id
-- WHERE p.role = 'vie-scolaire';
