-- Script pour corriger le mot de passe de vs.stmarie
-- Ce script va tester et corriger le hash du mot de passe

DO $$
DECLARE
    v_profile_id uuid;
    v_new_hash text;
    v_test_result boolean;
BEGIN
    -- Trouver le profil
    SELECT id INTO v_profile_id
    FROM profiles
    WHERE username = 'vs.stmarie';

    IF v_profile_id IS NULL THEN
        RAISE NOTICE 'Profil vs.stmarie non trouvé!';
        RETURN;
    END IF;

    RAISE NOTICE 'Profil trouvé: %', v_profile_id;

    -- Générer un nouveau hash avec la fonction hash_password
    SELECT hash_password('VieScol2024!') INTO v_new_hash;
    RAISE NOTICE 'Nouveau hash généré: %', v_new_hash;

    -- Mettre à jour le profil avec le nouveau hash
    UPDATE profiles
    SET password_hash = v_new_hash,
        updated_at = NOW()
    WHERE id = v_profile_id;

    RAISE NOTICE 'Mot de passe mis à jour!';

    -- Tester la vérification
    SELECT verify_password('VieScol2024!', v_new_hash) INTO v_test_result;
    
    IF v_test_result THEN
        RAISE NOTICE '✅ SUCCÈS: Le mot de passe est maintenant correct!';
    ELSE
        RAISE NOTICE '❌ ERREUR: La vérification a échoué';
    END IF;

    -- Afficher les informations de connexion
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Identifiants de connexion:';
    RAISE NOTICE 'Code établissement: stm001';
    RAISE NOTICE 'Rôle: Vie-scolaire';
    RAISE NOTICE 'Identifiant: vs.stmarie';
    RAISE NOTICE 'Mot de passe: VieScol2024!';
    RAISE NOTICE '=================================';

END $$;

-- Vérifier le profil final
SELECT 
    username,
    role,
    first_name,
    last_name,
    email,
    LEFT(password_hash, 20) || '...' as password_hash_preview
FROM profiles
WHERE username = 'vs.stmarie';
