SELECT 
    'Testing password verification' as test,
    username,
    verify_password('VieScol2024!', password_hash) as password_matches,
    password_hash
FROM profiles 
WHERE username = 'vs.stmarie';

-- Si password_matches = false, on régénère le hash
UPDATE profiles 
SET password_hash = hash_password('VieScol2024!')
WHERE username = 'vs.stmarie';

-- On teste à nouveau
SELECT 
    'After update' as test,
    username,
    verify_password('VieScol2024!', password_hash) as password_matches_now
FROM profiles 
WHERE username = 'vs.stmarie';
