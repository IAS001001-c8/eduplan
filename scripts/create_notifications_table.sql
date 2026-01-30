-- Script SQL pour créer la table notifications dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- 1. Créer la table notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sub_room_id UUID REFERENCES sub_rooms(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES sub_room_proposals(id) ON DELETE SET NULL,
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_establishment_id ON notifications(establishment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- 5. Créer les policies RLS
-- Lecture: les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Insertion: tout utilisateur authentifié peut créer une notification
CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Mise à jour: les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Suppression: les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- 6. Activer Realtime pour la table notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- 9. Vérifier que la table existe et afficher sa structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
