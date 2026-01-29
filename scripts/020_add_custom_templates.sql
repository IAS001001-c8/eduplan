-- Add custom templates table
CREATE TABLE IF NOT EXISTS custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  total_seats INTEGER NOT NULL,
  config JSONB NOT NULL,
  board_position TEXT DEFAULT 'top',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_templates_establishment ON custom_templates(establishment_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_pinned ON custom_templates(establishment_id, is_pinned) WHERE is_pinned = true;

SELECT 'Custom templates table created!' as status;
