-- Supprimer la dépendance à auth.users et rendre profiles autonome

-- 1. Supprimer la contrainte de clé étrangère vers auth.users si elle existe
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- 2. Modifier la colonne id de profiles pour qu'elle soit auto-générée
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. S'assurer que username et password_hash sont obligatoires
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN password_hash SET NOT NULL;

-- 4. Ajouter un index unique sur username pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON profiles(username);

-- 5. Ajouter un index sur establishment_id pour les performances
CREATE INDEX IF NOT EXISTS profiles_establishment_id_idx ON profiles(establishment_id);

-- 6. Mettre à jour les politiques RLS pour profiles
DROP POLICY IF EXISTS "profiles_select_own_establishment" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own_establishment" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_all"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "profiles_update_all"
  ON profiles FOR UPDATE
  USING (true);

CREATE POLICY "profiles_delete_all"
  ON profiles FOR DELETE
  USING (true);

-- 7. Fonction pour hasher les mots de passe (simple pour le développement)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Pour la production, utilisez pgcrypto: crypt(password, gen_salt('bf'))
  -- Pour le développement, on utilise encode pour simplifier
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hash_password IS 'Hash un mot de passe avec SHA256 (développement uniquement)';
