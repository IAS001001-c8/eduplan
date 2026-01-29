-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.verify_password(text, text);
DROP FUNCTION IF EXISTS public.hash_password(text);

-- Create hash_password function
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- Create verify_password function with correct signature
CREATE OR REPLACE FUNCTION public.verify_password(password text, password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.hash_password(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_password(text, text) TO anon, authenticated;

-- Test the functions
DO $$
DECLARE
  test_hash text;
  test_result boolean;
BEGIN
  -- Test hash_password
  test_hash := hash_password('Test123!');
  RAISE NOTICE 'Hash created: %', test_hash;
  
  -- Test verify_password
  test_result := verify_password('Test123!', test_hash);
  RAISE NOTICE 'Verification result: %', test_result;
  
  IF test_result THEN
    RAISE NOTICE 'Functions are working correctly!';
  ELSE
    RAISE EXCEPTION 'Functions are not working correctly!';
  END IF;
END;
$$;

-- Update the existing user's password with proper hash
UPDATE profiles 
SET password_hash = hash_password('Delegue2024!')
WHERE username = 'del.stmarie';

UPDATE students 
SET password_hash = hash_password('Delegue2024!')
WHERE username = 'del.stmarie';
