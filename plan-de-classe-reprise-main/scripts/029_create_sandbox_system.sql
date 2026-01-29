-- Create sub_room_proposals table for delegate sandbox
CREATE TABLE IF NOT EXISTS sub_room_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_room_id uuid REFERENCES sub_rooms(id) ON DELETE CASCADE, -- NULL si nouvelle proposition, sinon modification d'une sous-salle existante
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  proposed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE, -- Prof destinataire de la validation
  name text NOT NULL,
  seat_assignments jsonb DEFAULT '[]'::jsonb, -- Configuration du plan de classe
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('plan_modified', 'plan_validated', 'plan_rejected', 'plan_created', 'plan_deleted', 'proposal_submitted')),
  title text NOT NULL,
  message text NOT NULL,
  sub_room_id uuid REFERENCES sub_rooms(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES sub_room_proposals(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES profiles(id),
  is_read boolean DEFAULT false,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_room_proposals_status ON sub_room_proposals(status);
CREATE INDEX IF NOT EXISTS idx_sub_room_proposals_teacher ON sub_room_proposals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sub_room_proposals_class ON sub_room_proposals(class_id);
CREATE INDEX IF NOT EXISTS idx_sub_room_proposals_establishment ON sub_room_proposals(establishment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_establishment ON notifications(establishment_id);

-- Enable RLS
ALTER TABLE sub_room_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_room_proposals

-- Délégués peuvent voir leurs propres propositions
CREATE POLICY "Delegates can view their own proposals"
  ON sub_room_proposals FOR SELECT
  USING (
    proposed_by = auth.uid()
  );

-- Délégués peuvent créer des propositions
CREATE POLICY "Delegates can create proposals"
  ON sub_room_proposals FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('eleve', 'delegate', 'eco-delegate')
      AND can_create_subrooms = true
    )
  );

-- Délégués peuvent modifier leurs propositions en attente
CREATE POLICY "Delegates can update their pending proposals"
  ON sub_room_proposals FOR UPDATE
  USING (
    proposed_by = auth.uid() AND
    status = 'pending'
  );

-- Délégués peuvent supprimer leurs propositions en attente
CREATE POLICY "Delegates can delete their pending proposals"
  ON sub_room_proposals FOR DELETE
  USING (
    proposed_by = auth.uid() AND
    status = 'pending'
  );

-- Professeurs peuvent voir les propositions qui leur sont destinées
CREATE POLICY "Teachers can view proposals assigned to them"
  ON sub_room_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN teachers t ON t.profile_id = p.id
      WHERE p.id = auth.uid()
      AND t.id = teacher_id
    )
  );

-- Professeurs peuvent modifier le statut des propositions (validation/rejet)
CREATE POLICY "Teachers can review proposals"
  ON sub_room_proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN teachers t ON t.profile_id = p.id
      WHERE p.id = auth.uid()
      AND t.id = teacher_id
    )
  );

-- Vie scolaire peut tout voir
CREATE POLICY "Vie scolaire can view all proposals in their establishment"
  ON sub_room_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'vie-scolaire'
      AND establishment_id = sub_room_proposals.establishment_id
    )
  );

-- Vie scolaire peut valider/rejeter toutes les propositions
CREATE POLICY "Vie scolaire can review all proposals"
  ON sub_room_proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'vie-scolaire'
      AND establishment_id = sub_room_proposals.establishment_id
    )
  );

-- RLS Policies for notifications

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Le système peut créer des notifications pour tout le monde
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sub_room_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sub_room_proposals_timestamp
  BEFORE UPDATE ON sub_room_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_sub_room_proposals_updated_at();
