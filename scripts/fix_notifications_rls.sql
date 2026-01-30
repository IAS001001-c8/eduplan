-- Script pour mettre à jour les contraintes de la table notifications
-- Ajoute les nouveaux types de notification

-- 1. Supprimer l'ancienne contrainte de type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Recréer la contrainte avec tous les types nécessaires
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'plan_modified'::text, 
  'plan_validated'::text, 
  'plan_rejected'::text, 
  'plan_returned'::text, 
  'plan_created'::text, 
  'plan_deleted'::text, 
  'proposal_submitted'::text, 
  'sub_room_created'::text,
  'sub_room_deleted'::text,
  'room_created'::text,
  'room_deleted'::text,
  'room_invitation'::text
]));

-- 3. Activer RLS si pas déjà fait
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow users to view notifications" ON notifications;
DROP POLICY IF EXISTS "Allow users to insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow users to update notifications" ON notifications;
DROP POLICY IF EXISTS "Allow users to delete notifications" ON notifications;

-- 5. Créer les policies RLS permissives
CREATE POLICY "Allow users to view notifications"
ON notifications FOR SELECT
USING (true);

CREATE POLICY "Allow users to insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow users to update notifications"
ON notifications FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow users to delete notifications"
ON notifications FOR DELETE
USING (true);

-- 6. Vérifier la contrainte
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass AND conname = 'notifications_type_check';
