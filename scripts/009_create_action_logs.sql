-- Create action_logs table to track all user actions
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  entity_type TEXT NOT NULL, -- 'student', 'teacher', 'room', 'class', 'sub_room'
  entity_id UUID,
  entity_name TEXT,
  details JSONB, -- Additional details about the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Policies for action_logs
CREATE POLICY "action_logs_select_own_establishment" ON action_logs
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "action_logs_insert_authenticated" ON action_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_establishment ON action_logs(establishment_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_entity ON action_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at DESC);

-- Function to log actions
CREATE OR REPLACE FUNCTION log_action(
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_establishment_id UUID;
BEGIN
  -- Get user's establishment
  SELECT establishment_id INTO v_establishment_id
  FROM profiles
  WHERE id = auth.uid();

  -- Insert log
  INSERT INTO action_logs (
    user_id,
    establishment_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    details
  ) VALUES (
    auth.uid(),
    v_establishment_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_details
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
