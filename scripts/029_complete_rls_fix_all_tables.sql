-- ============================================
-- COMPLETE RLS FIX FOR ALL TABLES
-- This script fixes RLS policies for ALL tables to work with custom authentication
-- ============================================

-- ============================================
-- ESTABLISHMENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "establishments_select_policy" ON establishments;
DROP POLICY IF EXISTS "establishments_insert_policy" ON establishments;
DROP POLICY IF EXISTS "establishments_update_policy" ON establishments;
DROP POLICY IF EXISTS "establishments_delete_policy" ON establishments;

ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "establishments_select_policy" ON establishments FOR SELECT USING (true);
CREATE POLICY "establishments_insert_policy" ON establishments FOR INSERT WITH CHECK (true);
CREATE POLICY "establishments_update_policy" ON establishments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "establishments_delete_policy" ON establishments FOR DELETE USING (true);

-- ============================================
-- PROFILES TABLE
-- ============================================
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE USING (true);

-- ============================================
-- CLASSES TABLE
-- ============================================
DROP POLICY IF EXISTS "classes_select_policy" ON classes;
DROP POLICY IF EXISTS "classes_insert_policy" ON classes;
DROP POLICY IF EXISTS "classes_update_policy" ON classes;
DROP POLICY IF EXISTS "classes_delete_policy" ON classes;

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_policy" ON classes FOR SELECT USING (true);
CREATE POLICY "classes_insert_policy" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "classes_update_policy" ON classes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "classes_delete_policy" ON classes FOR DELETE USING (true);

-- ============================================
-- STUDENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_insert_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select_policy" ON students FOR SELECT USING (true);
CREATE POLICY "students_insert_policy" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "students_update_policy" ON students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "students_delete_policy" ON students FOR DELETE USING (true);

-- ============================================
-- TEACHERS TABLE
-- ============================================
DROP POLICY IF EXISTS "teachers_select_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_insert_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON teachers;

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_select_policy" ON teachers FOR SELECT USING (true);
CREATE POLICY "teachers_insert_policy" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "teachers_update_policy" ON teachers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "teachers_delete_policy" ON teachers FOR DELETE USING (true);

-- ============================================
-- TEACHER_CLASSES TABLE
-- ============================================
DROP POLICY IF EXISTS "teacher_classes_select_policy" ON teacher_classes;
DROP POLICY IF EXISTS "teacher_classes_insert_policy" ON teacher_classes;
DROP POLICY IF EXISTS "teacher_classes_update_policy" ON teacher_classes;
DROP POLICY IF EXISTS "teacher_classes_delete_policy" ON teacher_classes;

ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_classes_select_policy" ON teacher_classes FOR SELECT USING (true);
CREATE POLICY "teacher_classes_insert_policy" ON teacher_classes FOR INSERT WITH CHECK (true);
CREATE POLICY "teacher_classes_update_policy" ON teacher_classes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "teacher_classes_delete_policy" ON teacher_classes FOR DELETE USING (true);

-- ============================================
-- ROOMS TABLE
-- ============================================
DROP POLICY IF EXISTS "rooms_select_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_insert_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_update_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_delete_policy" ON rooms;

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_policy" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert_policy" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update_policy" ON rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "rooms_delete_policy" ON rooms FOR DELETE USING (true);

-- ============================================
-- ROOM_ASSIGNMENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "room_assignments_select_policy" ON room_assignments;
DROP POLICY IF EXISTS "room_assignments_insert_policy" ON room_assignments;
DROP POLICY IF EXISTS "room_assignments_update_policy" ON room_assignments;
DROP POLICY IF EXISTS "room_assignments_delete_policy" ON room_assignments;

ALTER TABLE room_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_assignments_select_policy" ON room_assignments FOR SELECT USING (true);
CREATE POLICY "room_assignments_insert_policy" ON room_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "room_assignments_update_policy" ON room_assignments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "room_assignments_delete_policy" ON room_assignments FOR DELETE USING (true);

-- ============================================
-- SUB_ROOMS TABLE
-- ============================================
DROP POLICY IF EXISTS "sub_rooms_select_policy" ON sub_rooms;
DROP POLICY IF EXISTS "sub_rooms_insert_policy" ON sub_rooms;
DROP POLICY IF EXISTS "sub_rooms_update_policy" ON sub_rooms;
DROP POLICY IF EXISTS "sub_rooms_delete_policy" ON sub_rooms;

ALTER TABLE sub_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_rooms_select_policy" ON sub_rooms FOR SELECT USING (true);
CREATE POLICY "sub_rooms_insert_policy" ON sub_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_rooms_update_policy" ON sub_rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sub_rooms_delete_policy" ON sub_rooms FOR DELETE USING (true);

-- ============================================
-- ROOM_SHARES TABLE
-- ============================================
DROP POLICY IF EXISTS "room_shares_select_policy" ON room_shares;
DROP POLICY IF EXISTS "room_shares_insert_policy" ON room_shares;
DROP POLICY IF EXISTS "room_shares_update_policy" ON room_shares;
DROP POLICY IF EXISTS "room_shares_delete_policy" ON room_shares;

ALTER TABLE room_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_shares_select_policy" ON room_shares FOR SELECT USING (true);
CREATE POLICY "room_shares_insert_policy" ON room_shares FOR INSERT WITH CHECK (true);
CREATE POLICY "room_shares_update_policy" ON room_shares FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "room_shares_delete_policy" ON room_shares FOR DELETE USING (true);

-- ============================================
-- ACTION_LOGS TABLE
-- ============================================
DROP POLICY IF EXISTS "action_logs_select_policy" ON action_logs;
DROP POLICY IF EXISTS "action_logs_insert_policy" ON action_logs;
DROP POLICY IF EXISTS "action_logs_update_policy" ON action_logs;
DROP POLICY IF EXISTS "action_logs_delete_policy" ON action_logs;

ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_logs_select_policy" ON action_logs FOR SELECT USING (true);
CREATE POLICY "action_logs_insert_policy" ON action_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "action_logs_update_policy" ON action_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "action_logs_delete_policy" ON action_logs FOR DELETE USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ ✅ ✅ RLS POLICIES SUCCESSFULLY UPDATED FOR ALL TABLES ✅ ✅ ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated tables:';
    RAISE NOTICE '  - establishments';
    RAISE NOTICE '  - profiles';
    RAISE NOTICE '  - classes';
    RAISE NOTICE '  - students';
    RAISE NOTICE '  - teachers';
    RAISE NOTICE '  - teacher_classes';
    RAISE NOTICE '  - rooms';
    RAISE NOTICE '  - room_assignments';
    RAISE NOTICE '  - sub_rooms';
    RAISE NOTICE '  - room_shares';
    RAISE NOTICE '  - action_logs';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All users can now perform CRUD operations on all tables';
    RAISE NOTICE '✅ Custom authentication is now fully supported';
END $$;
