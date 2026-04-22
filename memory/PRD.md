# EduPlan (plan-de-classe) — Product Requirements

## Original Problem Statement
Next.js 15 + Supabase full-stack app for French middle/high schools to manage classrooms, students, and intelligent seating plans. Roles: Vie Scolaire (admin), Professeur, Délégué.

## Core Requirements
1. **Intelligent Placement V4 (3-tier)**:
   - Priority 0: Teacher-defined constraints (Ensemble, Séparés, Devant, AESH)
   - Priority 1: EBP students (violet coding, row-specific placement)
   - Priority 2: Gender mix
   - Priority 3: Row rotation
2. **Teacher Constraints UI**: Per-class student selection → apply 1 of 4 constraint types with optional reason
3. **Temporary Sub-Rooms**: Visible on professor dashboard
4. **Desktop app (Electron)**: Microsoft Store distribution

## Implementation Status (2026-02-22)

### ✅ Completed
- [x] Intelligent Placement V4 algorithm (3-tier) — seating-plan-editor.tsx
- [x] Temporary sub-room visibility on Professor Dashboard
- [x] Teacher Constraints UI (Ensemble / Séparés / Devant / AESH) — teacher-student-constraints.tsx
- [x] EBP violet color coding + AESH free-seat logic
- [x] Fixed `allSeatsSorted` initialization bug
- [x] UX Recommendations Report (/app/docs/RAPPORT_UX_RECOMMANDATIONS.md)
- [x] Microsoft Store custom icons (user verification pending)
- [x] Bug fix: constraint panel now filters by currently selected class only
- [x] Bug fix: Ensemble algorithm now places students on SAME physical table (same colIndex + tableIndex) with adjacent-table fallback
- [x] Improved error message for schema-drift (23514 CHECK violation)

### 🔴 Blocker (user action required)
- User must verify `/app/scripts/fix_placement_constraints.sql` actually ran in Supabase project `bdvdrzohbieqeisxwmwh`. Testing agent confirmed the CHECK constraint still rejects `aesh`. Re-run script and verify with:
  ```sql
  SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='placement_constraints_constraint_type_check';
  ```

### 🟡 Awaiting User Verification
- Microsoft Store submission (icons replaced)
- Cross-class constraint isolation UI (teacher DUBOIS.emma only has 1 class)
- Bug 4 UI retest (Vie Scolaire → Plans de classe → editor → test same-table algorithm)

## Roadmap / Backlog
- **P2**: Constraint templates (reusable "Bavards à séparer" groups across classes)
- **P3**: Projection mode (F11 fullscreen) + QR code for substitute teachers
- **P3**: Collaborative plan sharing between teachers
- **Refactor**: seating-plan-editor.tsx is 3300+ lines — split into editor / algorithm / dialogs

## Key Files
- `/app/components/teacher-student-constraints.tsx` — Teacher constraints UI
- `/app/components/seating-plan-editor.tsx` — Main editor + V4 algorithm + new `findTableForGroup` helper
- `/app/scripts/add_placement_constraints.sql` — Initial schema
- `/app/scripts/fix_placement_constraints.sql` — Patch for `aesh` CHECK + RLS policy (MUST be run in Supabase)

## DB Schema
- `placement_constraints`: `id`, `teacher_id`, `establishment_id`, `constraint_type` ∈ {ensemble, separes, devant, aesh}, `student_ids uuid[]`, `reason`, `created_at`, `updated_at`

## 3rd Party
- Supabase (Auth + Postgres + RLS)
- Vercel (hosting)
- Electron (Desktop, Microsoft Store)
