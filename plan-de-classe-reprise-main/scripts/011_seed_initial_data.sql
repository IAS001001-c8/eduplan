-- Seed initial classes for ST-MARIE
DO $$
DECLARE
  v_stmarie_id UUID;
  v_vhugo_id UUID;
BEGIN
  -- Get establishment IDs
  SELECT id INTO v_stmarie_id FROM establishments WHERE code = 'stm001';
  SELECT id INTO v_vhugo_id FROM establishments WHERE code = 'vh001';

  -- Insert classes for ST-MARIE
  INSERT INTO classes (name, level, establishment_id) VALUES
    ('6ème A', '6ème', v_stmarie_id),
    ('6ème B', '6ème', v_stmarie_id),
    ('5ème A', '5ème', v_stmarie_id),
    ('5ème B', '5ème', v_stmarie_id),
    ('4ème A', '4ème', v_stmarie_id),
    ('4ème B', '4ème', v_stmarie_id),
    ('3ème A', '3ème', v_stmarie_id),
    ('3ème B', '3ème', v_stmarie_id)
  ON CONFLICT (name, establishment_id) DO NOTHING;

  -- Insert classes for VICTOR-HUGO
  INSERT INTO classes (name, level, establishment_id) VALUES
    ('6ème A', '6ème', v_vhugo_id),
    ('6ème B', '6ème', v_vhugo_id),
    ('5ème A', '5ème', v_vhugo_id),
    ('5ème B', '5ème', v_vhugo_id),
    ('4ème A', '4ème', v_vhugo_id),
    ('4ème B', '4ème', v_vhugo_id),
    ('3ème A', '3ème', v_vhugo_id),
    ('3ème B', '3ème', v_vhugo_id)
  ON CONFLICT (name, establishment_id) DO NOTHING;
END $$;
