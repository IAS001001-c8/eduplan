# EduPlan - Plan de Classe Application

## Project Overview
Application de gestion de plans de classe pour établissements scolaires.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Auth**: Custom auth avec profils Supabase

## Core Features Implemented
- ✅ Authentification multi-rôles (Vie Scolaire, Professeur, Délégué)
- ✅ Dashboard avec 6 sections principales
- ✅ Gestion des classes (4 classes)
- ✅ Gestion des élèves (18 élèves) 
- ✅ Gestion des professeurs (6 professeurs)
- ✅ Gestion des salles (4 salles)
- ✅ Plans de classe (10 sous-salles)
- ✅ Bac à sable (propositions de plans)

## Bugs Fixed During Reproduction
1. **Grid3x3 icon** - Remplacé par Grid (lucide-react version incompatible)
2. **Columns3 icon** - Remplacé par Columns
3. **Dialog imports manquants** - Ajoutés dans rooms-management.tsx:
   - DeleteConfirmationDialog
   - TemplateSelectionDialog
   - CreateSubRoomDialog

## Database
- Supabase URL: https://bdvdrzohbieqeisxwmwh.supabase.co
- Tables principales: establishments, profiles, classes, students, teachers, rooms, sub_rooms, seating_assignments

## Test Credentials
- **ST-MARIE**: stm001 / vs.stmarie / VieScol2024! (vie-scolaire)
- **VICTOR-HUGO**: vh001 / vs.vhugo / VieScol2024! (vie-scolaire)

## Remaining Issues (Low Priority)
- React 19 ref warnings (cosmetic)
- Session timeout court (UX improvement)

## Date
- Reproduced: January 29, 2026
