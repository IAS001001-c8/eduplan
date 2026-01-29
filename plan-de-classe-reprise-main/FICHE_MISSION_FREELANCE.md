# FICHE MISSION - Réparation et Amélioration Application Classroom Seating

## 1. CONTEXTE DU PROJET

**Nom du projet:** Plan de Classe (Classroom Seating Software)
**Stack technologique:** Next.js 13.4.12, React 18.2.0, Supabase, Tailwind CSS
**État actuel:** Application partiellement fonctionnelle avec problèmes d'affichage CSS et d'hydratation React 18

---

## 2. PROBLÈMES À RÉSOUDRE

### 2.1 Problèmes Critiques
- ❌ Les styles CSS ne s'affichent pas correctement au déploiement (OK en développement local)
- ❌ Erreurs d'hydratation React 18 entre serveur et client
- ❌ L'application ne charge pas correctement en production
- ❌ Les routes d'authentification causent des redirections infinies

### 2.2 Problèmes Secondaires
- ⚠️ Code fragmenté avec plusieurs tentatives de correction
- ⚠️ Middleware et authentification à nettoyer et simplifier
- ⚠️ Structure de fichiers à consolider

---

## 3. OBJECTIFS PRINCIPAUX

### 3.1 Objectif 1 : Corriger les Styles CSS (PRIORITÉ 1)
**Tâche:** Assurer que tous les styles CSS s'affichent correctement en production
- Vérifier l'import du fichier `app/globals.css` dans `app/layout.tsx`
- Configurer correctement Tailwind CSS dans `tailwind.config.ts`
- Vérifier les routes absolues des imports CSS
- Tester le déploiement sur Vercel en vérifiant les styles dans F12
- **Critère de succès:** L'application affiche les styles correctement en production et en développement

### 3.2 Objectif 2 : Corriger les Erreurs d'Hydratation React 18 (PRIORITÉ 1)
**Tâche:** Éliminer tous les mismatches d'hydratation entre serveur et client
- Auditer tout le code pour identifier les appels à `localStorage`, `window`, `document` côté serveur
- Convertir les composants utilisant ces APIs en composants client (`"use client"`)
- Ajouter `suppressHydrationWarning` où nécessaire
- Vérifier que tous les hooks d'état sont initialisés correctement
- **Critère de succès:** Aucune erreur d'hydratation en F12, application stable

### 3.3 Objectif 3 : Nettoyer l'Authentification (PRIORITÉ 1)
**Tâche:** Simplifier et réparer le flux d'authentification
- Auditer `middleware.ts` et supprimer les redirections infinies
- Vérifier la logique d'authentification dans `lib/use-auth.ts`
- Tester le flux de connexion/déconnexion
- S'assurer que l'authentification fonctionne via Supabase
- **Critère de succès:** Connexion/déconnexion fonctionnelle, pas de redirections infinies

---

## 4. SPÉCIFICATIONS FONCTIONNELLES

### 4.1 Système de Permissions pour les Sous-Salles (DÉJÀ PARTIELLEMENT IMPLÉMENTÉ)

#### 4.1.1 Paramètres Professeur
- ✅ Case à cocher "Autoriser les délégués à créer des sous-salles pour moi" (cochée par défaut)
- Implémenter dans `components/teachers-management.tsx`
- Stocker dans Supabase : `teachers.allow_delegate_subrooms` (booléen, défaut TRUE)

#### 4.1.2 Règles de Création
- **Professeurs:** Peuvent créer des sous-salles uniquement pour leurs propres classes
- **Délégués:** Peuvent créer des sous-salles uniquement pour les professeurs qui les autorisent ET qui leur enseignent

#### 4.1.3 Règles de Visibilité
- **Professeurs:** Voient uniquement leurs sous-salles + celles créées par leurs délégués
- **Délégués:** Voient uniquement les sous-salles qu'ils ont créées

#### 4.1.4 Filtres Adaptés par Rôle
- **Professeurs:** Filtres montrent leurs classes et eux-mêmes comme créateur
- **Délégués:** Filtres montrent uniquement leurs professeurs et leurs classes (6ème A, 3ème B, etc.)

### 4.2 Autres Fonctionnalités (À VÉRIFIER)
- Gestion des classes (CRUD)
- Gestion des professeurs (CRUD)
- Gestion des étudiants (CRUD)
- Gestion des plans de classe
- Historique et archivage

---

## 5. STRUCTURE DE LA BASE DE DONNÉES

### Schéma Supabase Requis
\`\`\`sql
-- Tables existantes à vérifier
- users (id, email, role, created_at)
- classes (id, name, teacher_id, created_at)
- students (id, name, class_id, created_at)
- sub_rooms (id, name, class_id, created_by, type, created_at)
- teachers (id, user_id, name, allow_delegate_subrooms, created_at)
\`\`\`

---

## 6. TÂCHES DÉTAILLÉES

### PHASE 1 : DIAGNOSTIC ET NETTOYAGE (Jour 1)
1. **Audit du code**
   - Lister tous les fichiers avec "use client"
   - Identifier tous les appels localStorage/window/document
   - Documenter les erreurs actuelles

2. **Nettoyage**
   - Supprimer les fichiers redondants (client-layout.tsx, client-wrapper.tsx, etc.)
   - Consolider les imports
   - Supprimer les console.log de débogage

3. **Configuration**
   - Vérifier `next.config.mjs`
   - Vérifier `tailwind.config.ts`
   - Vérifier `tsconfig.json`

### PHASE 2 : CORRECTION CSS (Jour 1-2)
1. **Vérifier l'import CSS**
   \`\`\`tsx
   // app/layout.tsx doit importer
   import './globals.css'
   \`\`\`

2. **Tester en local**
   - `npm run dev` puis ouvrir localhost:3000
   - F12 → Elements → Vérifier les styles appliqués

3. **Tester en production**
   - Déployer sur Vercel
   - F12 → Elements → Vérifier les styles appliqués
   - Vérifier les Network requests → CSS file loaded

### PHASE 3 : CORRECTION HYDRATATION (Jour 2)
1. **Audit components utilisant localStorage**
   - Envelopper dans `useEffect` avec vérification `typeof window`
   - OU convertir le composant parent en "use client"

2. **Test de déploiement**
   - Déployer et vérifier console en F12
   - Zero hydration warnings

3. **Validation**
   - Tester navigation entre pages
   - Tester rafraîchissement page (F5)
   - Tester accès URL direct

### PHASE 4 : CORRECTION AUTHENTIFICATION (Jour 2-3)
1. **Auditer middleware.ts**
   - Identifier les causes de redirections infinies
   - Simplifier ou désactiver si nécessaire

2. **Tester flux d'auth**
   - Login → Dashboard → Logout
   - Persister session via cookies/localStorage
   - Redirection correcte des utilisateurs non-auth

3. **Validation**
   - Fermer/réouvrir navigateur → rester loggé
   - Accès /dashboard sans auth → redirect vers login

### PHASE 5 : IMPLÉMENTATION PERMISSIONS (Jour 3-4)
1. **Database**
   - Ajouter colonne `allow_delegate_subrooms` à table `teachers`
   - Migration SQL si nécessaire

2. **UI Teachers Management**
   - Ajouter checkbox dans `components/teachers-management.tsx`
   - Implémenter sauvegarde via API

3. **Logique Sous-Salles**
   - Modifier `components/seating-plan-management.tsx`
   - Implémenter filtres selon permissions
   - Tester création par professeur/délégué

### PHASE 6 : TESTS ET DÉPLOIEMENT (Jour 4-5)
1. **Tests fonctionnels**
   - Tous les CRUD pour chaque entité
   - Tous les flux d'authentification
   - Tous les filtres et permissions

2. **Tests de déploiement**
   - Build local : `npm run build`
   - Déploiement Vercel : vérifier console F12
   - Tests sur mobile

3. **Documentation**
   - Documenter les changements
   - Documenter les points d'entrée API
   - Documenter les variables d'environnement

---

## 7. CRITÈRES D'ACCEPTATION

### ✅ Application Fonctionne
- [ ] L'app charge sans erreur en production
- [ ] Aucune erreur en F12 → Console
- [ ] Styles CSS visibles et corrects
- [ ] Navigation fluide entre pages

### ✅ Authentification Fonctionne
- [ ] Login/logout sans erreur
- [ ] Session persiste au refresh
- [ ] Redirection utilisateurs non-auth vers login
- [ ] Pas de redirections infinies

### ✅ Permissions Implémentées
- [ ] Checkbox "autoriser délégués" visible dans settings prof
- [ ] Professeurs ne voient que leurs sous-salles
- [ ] Délégués ne voient que les autorises
- [ ] Filtres correctement appliqués

### ✅ Qualité du Code
- [ ] Aucune console.log de débogage
- [ ] Imports nettoyés
- [ ] Fichiers redondants supprimés
- [ ] Code formaté et cohérent

---

## 8. OUTILS ET ACCÈS

### Accès Requis
- Repository GitHub (si applicable)
- Vercel project
- Supabase project
- Compte Supabase

### Variables d'Environnement
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=
\`\`\`

---

## 9. DURÉE ESTIMÉE
- **Total:** 4-5 jours de travail
- **Phase 1:** 1 jour
- **Phase 2:** 1 jour
- **Phase 3:** 1 jour
- **Phase 4:** 1 jour
- **Phase 5:** 1 jour
- **Phase 6:** 1 jour

---

## 10. LIVÉRABLES

1. ✅ Code corrigé et nettoyé (GitHub)
2. ✅ Application déployée et fonctionnelle (Vercel)
3. ✅ Tous les tests passant
4. ✅ Documentation des changements
5. ✅ Liste des bugs connus (s'il y en a)

---

## 11. QUESTIONS IMPORTANTES AVANT DE COMMENCER

- [ ] Y a-t-il une branche de staging pour tester avant production?
- [ ] Quelle est la fréquence des tests souhaités?
- [ ] Y a-t-il d'autres utilisateurs actuellement sur l'app?
- [ ] Faut-il préserver les données existantes?
- [ ] Y a-t-il un design final à respecter?

---

**Date de création:** 23/11/2025
**Version:** 1.0
**Statut:** Prête pour freelance
