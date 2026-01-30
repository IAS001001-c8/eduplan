-- ============================================
-- SCRIPT SQL COMPLET POUR EDUPLAN
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- =============================================
-- 1. TABLE POUR HISTORIQUE DES MODIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.modification_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
    entity_type text NOT NULL, -- 'sub_room', 'seating_assignment', 'proposal', etc.
      entity_id uuid NOT NULL,
        action text NOT NULL, -- 'create', 'update', 'delete', 'place_student', 'remove_student', 'swap_students'
          old_value jsonb,
            new_value jsonb,
              user_id uuid,
                user_name text,
                  establishment_id uuid NOT NULL,
                    created_at timestamp with time zone DEFAULT now(),
                      CONSTRAINT modification_history_pkey PRIMARY KEY (id),
                        CONSTRAINT modification_history_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id),
                          CONSTRAINT modification_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
                          );

                          -- Index pour performance
                          CREATE INDEX IF NOT EXISTS idx_modification_history_entity ON modification_history(entity_type, entity_id);
                          CREATE INDEX IF NOT EXISTS idx_modification_history_establishment ON modification_history(establishment_id);
                          CREATE INDEX IF NOT EXISTS idx_modification_history_created_at ON modification_history(created_at DESC);

                          -- =============================================
                          -- 2. TABLE POUR APPROBATIONS COLLABORATIVES
                          -- =============================================
                          CREATE TABLE IF NOT EXISTS public.collaborative_approvals (
                            id uuid NOT NULL DEFAULT gen_random_uuid(),
                              teacher_id uuid NOT NULL,
                                approved_teacher_id uuid NOT NULL, -- Le prof qui a approuvé
                                  establishment_id uuid NOT NULL,
                                    created_at timestamp with time zone DEFAULT now(),
                                      CONSTRAINT collaborative_approvals_pkey PRIMARY KEY (id),
                                        CONSTRAINT collaborative_approvals_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
                                          CONSTRAINT collaborative_approvals_approved_teacher_id_fkey FOREIGN KEY (approved_teacher_id) REFERENCES public.teachers(id),
                                            CONSTRAINT collaborative_approvals_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id),
                                              CONSTRAINT collaborative_approvals_unique UNIQUE (teacher_id, approved_teacher_id)
                                              );

                                              -- =============================================
                                              -- 3. POLICIES RLS POUR MODIFICATION_HISTORY
                                              -- =============================================
                                              ALTER TABLE modification_history ENABLE ROW LEVEL SECURITY;

                                              DROP POLICY IF EXISTS "Allow all operations on modification_history" ON modification_history;
                                              CREATE POLICY "Allow all operations on modification_history" ON modification_history
                                              FOR ALL USING (true) WITH CHECK (true);

                                              -- =============================================
                                              -- 4. POLICIES RLS POUR COLLABORATIVE_APPROVALS
                                              -- =============================================
                                              ALTER TABLE collaborative_approvals ENABLE ROW LEVEL SECURITY;

                                              DROP POLICY IF EXISTS "Allow all operations on collaborative_approvals" ON collaborative_approvals;
                                              CREATE POLICY "Allow all operations on collaborative_approvals" ON collaborative_approvals
                                              FOR ALL USING (true) WITH CHECK (true);

                                              -- =============================================
                                              -- 5. POLICIES RLS POUR ROOM_INVITATIONS
                                              -- =============================================
                                              ALTER TABLE room_invitations ENABLE ROW LEVEL SECURITY;

                                              DROP POLICY IF EXISTS "Allow all operations on room_invitations" ON room_invitations;
                                              CREATE POLICY "Allow all operations on room_invitations" ON room_invitations
                                              FOR ALL USING (true) WITH CHECK (true);

                                              -- =============================================
                                              -- 6. POLICIES RLS POUR NOTIFICATIONS
                                              -- =============================================
                                              ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

                                              DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
                                              CREATE POLICY "Allow all operations on notifications" ON notifications
                                              FOR ALL USING (true) WITH CHECK (true);

                                              -- =============================================
                                              -- 7. ACTIVER REALTIME
                                              -- =============================================
                                              -- Notifications (pour les invitations en temps réel)
                                              DO $$
                                              BEGIN
                                                IF NOT EXISTS (
                                                    SELECT 1 FROM pg_publication_tables 
                                                        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
                                                          ) THEN
                                                              ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
                                                                END IF;
                                                                END $$;

                                                                -- Room invitations
                                                                DO $$
                                                                BEGIN
                                                                  IF NOT EXISTS (
                                                                      SELECT 1 FROM pg_publication_tables 
                                                                          WHERE pubname = 'supabase_realtime' AND tablename = 'room_invitations'
                                                                            ) THEN
                                                                                ALTER PUBLICATION supabase_realtime ADD TABLE room_invitations;
                                                                                  END IF;
                                                                                  END $$;

                                                                                  -- =============================================
                                                                                  -- 8. FONCTION POUR ENREGISTRER L'HISTORIQUE
                                                                                  -- =============================================
                                                                                  CREATE OR REPLACE FUNCTION log_modification(
                                                                                    p_entity_type text,
                                                                                      p_entity_id uuid,
                                                                                        p_action text,
                                                                                          p_old_value jsonb,
                                                                                            p_new_value jsonb,
                                                                                              p_user_id uuid,
                                                                                                p_user_name text,
                                                                                                  p_establishment_id uuid
                                                                                                  ) RETURNS uuid AS $$
                                                                                                  DECLARE
                                                                                                    v_id uuid;
                                                                                                    BEGIN
                                                                                                      INSERT INTO modification_history (
                                                                                                          entity_type, entity_id, action, old_value, new_value, 
                                                                                                              user_id, user_name, establishment_id
                                                                                                                ) VALUES (
                                                                                                                    p_entity_type, p_entity_id, p_action, p_old_value, p_new_value,
                                                                                                                        p_user_id, p_user_name, p_establishment_id
                                                                                                                          ) RETURNING id INTO v_id;
                                                                                                                            
                                                                                                                              RETURN v_id;
                                                                                                                              END;
                                                                                                                              $$ LANGUAGE plpgsql;

                                                                                                                              -- =============================================
                                                                                                                              -- VÉRIFICATION
                                                                                                                              -- =============================================
                                                                                                                              -- Exécuter ces requêtes pour vérifier:
                                                                                                                              -- SELECT * FROM modification_history LIMIT 5;
                                                                                                                              -- SELECT * FROM collaborative_approvals LIMIT 5;
                                                                                                                              -- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
                                                                                                                              