-- Script de diagnostic pour voir ce qui existe déjà
-- Exécutez ce script pour voir l'état actuel de la base de données

-- Vérifier les établissements
SELECT 'ESTABLISHMENTS' as table_name, id, name, code 
FROM establishments 
ORDER BY name;

-- Vérifier les profils
SELECT 'PROFILES' as table_name, id, username, role, establishment_id, first_name, last_name
FROM profiles 
ORDER BY username;

-- Vérifier les élèves
SELECT 'STUDENTS' as table_name, id, profile_id, first_name, last_name, class_id
FROM students 
ORDER BY last_name;

-- Vérifier les professeurs
SELECT 'TEACHERS' as table_name, id, profile_id, first_name, last_name, subject
FROM teachers 
ORDER BY last_name;

-- Vérifier les classes
SELECT 'CLASSES' as table_name, id, name, level, establishment_id
FROM classes 
ORDER BY name;
