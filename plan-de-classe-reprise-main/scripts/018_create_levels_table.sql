-- Create levels table for managing educational levels (6ème, 5ème, 4ème, etc.)
CREATE TABLE IF NOT EXISTS public.levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  name text NOT NULL,
  display_order integer DEFAULT 0,
  is_custom boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT levels_pkey PRIMARY KEY (id),
  CONSTRAINT levels_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE CASCADE,
  CONSTRAINT levels_unique_per_establishment UNIQUE (establishment_id, name)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_levels_establishment_id ON public.levels(establishment_id);
CREATE INDEX IF NOT EXISTS idx_levels_display_order ON public.levels(display_order);

-- Add level_id to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS level_id uuid,
ADD CONSTRAINT students_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_students_level_id ON public.students(level_id);

-- Create teacher_levels junction table (teachers can teach multiple levels)
CREATE TABLE IF NOT EXISTS public.teacher_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  level_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_levels_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_levels_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE,
  CONSTRAINT teacher_levels_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE,
  CONSTRAINT teacher_levels_unique UNIQUE (teacher_id, level_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teacher_levels_teacher_id ON public.teacher_levels(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_levels_level_id ON public.teacher_levels(level_id);

-- Create custom_templates table for user-created templates
CREATE TABLE IF NOT EXISTS public.custom_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  total_seats integer NOT NULL,
  columns jsonb NOT NULL,
  board_position text DEFAULT 'top' CHECK (board_position IN ('top', 'bottom', 'left', 'right')),
  is_pinned boolean DEFAULT false,
  pin_order integer,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_templates_pkey PRIMARY KEY (id),
  CONSTRAINT custom_templates_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE CASCADE,
  CONSTRAINT custom_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_templates_establishment_id ON public.custom_templates(establishment_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_pinned ON public.custom_templates(is_pinned, pin_order) WHERE is_pinned = true;

-- Verification
SELECT 'Levels table created' as status, COUNT(*) as count FROM public.levels;
SELECT 'Custom templates table created' as status, COUNT(*) as count FROM public.custom_templates;
SELECT 'Teacher levels table created' as status, COUNT(*) as count FROM public.teacher_levels;
