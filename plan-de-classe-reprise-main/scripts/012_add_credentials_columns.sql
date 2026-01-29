-- Add username and password columns to students and teachers tables
-- This allows students and teachers to login without Supabase Auth accounts

-- Add columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add columns to teachers table
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add columns to profiles table for vie-scolaire users
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create a function to hash passwords (simple hash for demo - use bcrypt in production)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash using encode and digest
  -- In production, use a proper password hashing library like bcrypt
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;
