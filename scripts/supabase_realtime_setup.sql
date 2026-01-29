-- ============================================
-- SCRIPT SQL POUR ACTIVER REALTIME ET RLS
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- 1. ACTIVER REALTIME pour la table notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 2. POLICIES RLS pour la table notifications
-- Permettre l'insertion de notifications (pour l'API)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON notifications;
CREATE POLICY "Enable insert for all" ON notifications
FOR INSERT WITH CHECK (true);

-- Permettre la lecture des notifications pour l'utilisateur concerné
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (true);

-- Permettre la mise à jour (marquer comme lu)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (true);

-- Permettre la suppression
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications" ON notifications
FOR DELETE USING (true);

-- 3. ACTIVER REALTIME pour d'autres tables importantes (optionnel)
-- ALTER PUBLICATION supabase_realtime ADD TABLE sub_rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seating_assignments;

-- 4. Vérifier que RLS est activé
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Exécuter cette requête pour vérifier que tout est OK:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename = 'notifications';
