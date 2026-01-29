-- Script pour créer les utilisateurs en forçant la suppression des anciens
-- Ce script supprime d'abord tout ce qui existe, puis recrée

DO $$
DECLARE
    v_stmarie_id uuid;
    v_vhugo_id uuid;
    v_prof_profile_id uuid;
    v_del_profile_id uuid;
    v_vs_profile_id uuid;
    v_class_id uuid;
BEGIN
    RAISE NOTICE '=== DÉBUT DE LA CRÉATION DES UTILISATEURS ===';
    
    -- ============================================
    -- ÉTAPE 1 : SUPPRIMER LES ANCIENS UTILISATEURS
    -- ============================================
    RAISE NOTICE 'Suppression des anciens utilisateurs...';
    
    -- Supprimer les élèves
    DELETE FROM students WHERE username IN ('del.stmarie');
    RAISE NOTICE '✓ Élèves supprimés';
    
    -- Supprimer les professeurs
    DELETE FROM teachers WHERE username IN ('prof.stmarie');
    RAISE NOTICE '✓ Professeurs supprimés';
    
    -- Supprimer les profils
    DELETE FROM profiles WHERE username IN ('prof.stmarie', 'del.stmarie', 'vs.vhugo');
    RAISE NOTICE '✓ Profils supprimés';
    
    -- ============================================
    -- ÉTAPE 2 : CRÉER/VÉRIFIER LES ÉTABLISSEMENTS
    -- ============================================
    RAISE NOTICE 'Création des établissements...';
    
    -- ST-MARIE
    SELECT id INTO v_stmarie_id FROM establishments WHERE code = 'stm001';
    IF v_stmarie_id IS NULL THEN
        INSERT INTO establishments (name, code, created_at)
        VALUES ('ST-MARIE 14000', 'stm001', NOW())
        RETURNING id INTO v_stmarie_id;
        RAISE NOTICE '✓ Établissement ST-MARIE créé: %', v_stmarie_id;
    ELSE
        RAISE NOTICE '✓ Établissement ST-MARIE existe déjà: %', v_stmarie_id;
    END IF;
    
    -- VICTOR-HUGO
    SELECT id INTO v_vhugo_id FROM establishments WHERE code = 'vh001';
    IF v_vhugo_id IS NULL THEN
        INSERT INTO establishments (name, code, created_at)
        VALUES ('VICTOR-HUGO', 'vh001', NOW())
        RETURNING id INTO v_vhugo_id;
        RAISE NOTICE '✓ Établissement VICTOR-HUGO créé: %', v_vhugo_id;
    ELSE
        RAISE NOTICE '✓ Établissement VICTOR-HUGO existe déjà: %', v_vhugo_id;
    END IF;
    
    -- ============================================
    -- ÉTAPE 3 : CRÉER UNE CLASSE POUR LES TESTS
    -- ============================================
    RAISE NOTICE 'Création d''une classe de test...';
    
    SELECT id INTO v_class_id FROM classes WHERE name = '6ème A' AND establishment_id = v_stmarie_id;
    IF v_class_id IS NULL THEN
        INSERT INTO classes (name, level, establishment_id, created_at)
        VALUES ('6ème A', '6ème', v_stmarie_id, NOW())
        RETURNING id INTO v_class_id;
        RAISE NOTICE '✓ Classe 6ème A créée: %', v_class_id;
    ELSE
        RAISE NOTICE '✓ Classe 6ème A existe déjà: %', v_class_id;
    END IF;
    
    -- ============================================
    -- ÉTAPE 4 : CRÉER LE PROFESSEUR (prof.stmarie)
    -- ============================================
    RAISE NOTICE 'Création du professeur prof.stmarie...';
    
    INSERT INTO profiles (
        establishment_id, role, username, password_hash,
        first_name, last_name, email, phone,
        can_create_subrooms, created_at, updated_at
    ) VALUES (
        v_stmarie_id, 'professeur', 'prof.stmarie', 
        hash_password('Prof2024!'),
        'Jean', 'MARTIN', 'jean.martin@stmarie.fr', '0612345678',
        true, NOW(), NOW()
    ) RETURNING id INTO v_prof_profile_id;
    
    RAISE NOTICE '✓ Profil professeur créé: %', v_prof_profile_id;
    
    INSERT INTO teachers (
        profile_id, establishment_id,
        first_name, last_name, email, subject,
        created_at
    ) VALUES (
        v_prof_profile_id, v_stmarie_id,
        'Jean', 'MARTIN', 'jean.martin@stmarie.fr', 'Mathématiques',
        NOW()
    );
    
    RAISE NOTICE '✓ Entrée teachers créée pour prof.stmarie';
    
    -- ============================================
    -- ÉTAPE 5 : CRÉER LE DÉLÉGUÉ (del.stmarie)
    -- ============================================
    RAISE NOTICE 'Création du délégué del.stmarie...';
    
    INSERT INTO profiles (
        establishment_id, role, username, password_hash,
        first_name, last_name, email, phone,
        can_create_subrooms, created_at, updated_at
    ) VALUES (
        v_stmarie_id, 'delegue', 'del.stmarie',
        hash_password('Delegue2024!'),
        'Marie', 'DUBOIS', 'marie.dubois@stmarie.fr', '0623456789',
        true, NOW(), NOW()
    ) RETURNING id INTO v_del_profile_id;
    
    RAISE NOTICE '✓ Profil délégué créé: %', v_del_profile_id;
    
    INSERT INTO students (
        profile_id, establishment_id, class_id,
        first_name, last_name, email, phone,
        role, can_create_subrooms, created_at, updated_at
    ) VALUES (
        v_del_profile_id, v_stmarie_id, v_class_id,
        'Marie', 'DUBOIS', 'marie.dubois@stmarie.fr', '0623456789',
        'delegue', true, NOW(), NOW()
    );
    
    RAISE NOTICE '✓ Entrée students créée pour del.stmarie';
    
    -- ============================================
    -- ÉTAPE 6 : CRÉER LA VIE SCOLAIRE (vs.vhugo)
    -- ============================================
    RAISE NOTICE 'Création de la vie scolaire vs.vhugo...';
    
    INSERT INTO profiles (
        establishment_id, role, username, password_hash,
        first_name, last_name, email, phone,
        can_create_subrooms, created_at, updated_at
    ) VALUES (
        v_vhugo_id, 'vie-scolaire', 'vs.vhugo',
        hash_password('VieScol2024!'),
        'Sophie', 'BERNARD', 'sophie.bernard@vhugo.fr', '0634567890',
        true, NOW(), NOW()
    ) RETURNING id INTO v_vs_profile_id;
    
    RAISE NOTICE '✓ Profil vie-scolaire créé: %', v_vs_profile_id;
    
    -- ============================================
    -- RÉSUMÉ FINAL
    -- ============================================
    RAISE NOTICE '=== CRÉATION TERMINÉE AVEC SUCCÈS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'IDENTIFIANTS CRÉÉS:';
    RAISE NOTICE '1. Professeur ST-MARIE:';
    RAISE NOTICE '   - Identifiant: prof.stmarie';
    RAISE NOTICE '   - Mot de passe: Prof2024!';
    RAISE NOTICE '   - Code établissement: stm001';
    RAISE NOTICE '';
    RAISE NOTICE '2. Délégué ST-MARIE:';
    RAISE NOTICE '   - Identifiant: del.stmarie';
    RAISE NOTICE '   - Mot de passe: Delegue2024!';
    RAISE NOTICE '   - Code établissement: stm001';
    RAISE NOTICE '';
    RAISE NOTICE '3. Vie Scolaire VICTOR-HUGO:';
    RAISE NOTICE '   - Identifiant: vs.vhugo';
    RAISE NOTICE '   - Mot de passe: VieScol2024!';
    RAISE NOTICE '   - Code établissement: vh001';
    RAISE NOTICE '';
    RAISE NOTICE 'Vous pouvez maintenant vous connecter avec ces identifiants.';
    
END $$;

-- Vérification finale
SELECT 'VÉRIFICATION FINALE' as status;
SELECT 'Profils créés:' as info, username, role, first_name, last_name 
FROM profiles 
WHERE username IN ('prof.stmarie', 'del.stmarie', 'vs.vhugo');
