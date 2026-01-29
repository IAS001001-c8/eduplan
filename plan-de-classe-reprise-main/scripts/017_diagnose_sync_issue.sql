-- ============================================
-- Script de Diagnostic de la Synchronisation
-- ============================================

-- 1. Vérifier les élèves avec profile_id
SELECT 
    'Élèves avec profile_id' as check_name,
    COUNT(*) as count
FROM students 
WHERE profile_id IS NOT NULL;

-- 2. Vérifier les professeurs avec profile_id
SELECT 
    'Professeurs avec profile_id' as check_name,
    COUNT(*) as count
FROM teachers 
WHERE profile_id IS NOT NULL;

-- 3. Vérifier les profils de type délégué/éco-délégué
SELECT 
    'Profils délégués' as check_name,
    COUNT(*) as count
FROM profiles 
WHERE role = 'delegue';

-- 4. Vérifier les relations teacher_classes
SELECT 
    'Relations teacher_classes' as check_name,
    COUNT(*) as count
FROM teacher_classes;

-- 5. Exemple de données complètes pour un étudiant
SELECT 
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.class_name,
    s.profile_id,
    p.username,
    p.role as profile_role,
    c.name as class_name_from_classes,
    e.name as establishment
FROM students s
LEFT JOIN profiles p ON s.profile_id = p.id
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN establishments e ON s.establishment_id = e.id
LIMIT 5;

-- 6. Exemple de données complètes pour un professeur
SELECT 
    t.id as teacher_id,
    t.first_name,
    t.last_name,
    t.profile_id,
    p.username,
    p.role as profile_role,
    e.name as establishment
FROM teachers t
LEFT JOIN profiles p ON t.profile_id = p.id
LEFT JOIN establishments e ON t.establishment_id = e.id
LIMIT 5;

-- 7. Vérifier les relations professeur-classe
SELECT 
    t.first_name || ' ' || t.last_name as professeur,
    c.name as classe,
    e.name as etablissement
FROM teacher_classes tc
JOIN teachers t ON tc.teacher_id = t.id
JOIN classes c ON tc.class_id = c.id
JOIN establishments e ON t.establishment_id = e.id
LIMIT 10;
