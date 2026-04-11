# Rapport de Revue UX - EduPlan
## Date : Avril 2026

---

## 1. Etat actuel de l'application

### Points forts
- **Design cohérent** : Palette orange (#E7A541) appliquée uniformément sur tous les composants (boutons, sidebar, icônes, états focus)
- **Navigation intuitive** : Sidebar avec tooltips, breadcrumb de retour, actions rapides sur le dashboard
- **Algorithme V3** : Placement intelligent avec 3 niveaux de priorité bien documentés dans l'UI
- **Gestion des rôles** : 3 dashboards distincts (Vie Scolaire, Professeur, Délégué) avec des vues adaptées
- **Interactions riches** : Drag-and-drop pour le placement des élèves, animations Framer Motion

---

## 2. Problèmes UX identifiés

### P0 - Critique

| # | Problème | Impact | Fichier(s) |
|---|----------|--------|------------|
| 1 | **Badge "3 errors" permanent** : Les warnings React 19/Radix-UI s'affichent en bas à gauche sur toutes les pages | Confond les utilisateurs qui pensent que l'app est cassée | Dépendances `@radix-ui` |
| 2 | **Aucun Error Boundary** : Si un composant plante, l'écran devient blanc sans message | L'utilisateur perd tout son travail en cours | `/app/app/` (aucun `error.tsx`) |
| 3 | **Editeur de plan non responsive** : Le composant `seating-plan-editor.tsx` (2981 lignes) n'a qu'1 seule classe responsive (`sm:`) | Inutilisable sur tablette/mobile, alors que les professeurs projettent souvent depuis des tablettes | `seating-plan-editor.tsx` |

### P1 - Important

| # | Problème | Impact | Fichier(s) |
|---|----------|--------|------------|
| 4 | **Composants monolithiques** : `seating-plan-editor.tsx` (2981 lignes), `students-management.tsx` (2378 lignes) | Performance dégradée, maintenance difficile, re-renders coûteux | Plusieurs fichiers |
| 5 | **Pas de confirmation de sauvegarde** : Quand on quitte l'éditeur de plan sans sauvegarder, aucun avertissement | Perte de données | `seating-plan-editor.tsx` |
| 6 | **Pas de raccourcis clavier documentés** : Aucun raccourci pour les actions fréquentes (sauvegarder, annuler, placement auto) | Perte de productivité | Global |
| 7 | **Accessibilité (a11y) nulle** dans l'éditeur : 0 attributs `aria-label`, `role`, ou `aria-describedby` dans les 2981 lignes de l'éditeur | Non-conforme RGAA/WCAG, inaccessible aux lecteurs d'écran | `seating-plan-editor.tsx` |

### P2 - Amélioration

| # | Problème | Impact | Fichier(s) |
|---|----------|--------|------------|
| 8 | **Pas d'undo/redo** dans l'éditeur de plan | Frustration quand on fait une erreur de placement | `seating-plan-editor.tsx` |
| 9 | **Pas de mode sombre** | Inconfort visuel en projection dans une salle obscure | Global |
| 10 | **Temps de chargement du dashboard** : Pas de skeleton/shimmer loading | L'écran reste vide quelques secondes au chargement | `professeur-dashboard.tsx` |
| 11 | **Liste des élèves non-placés** : La hauteur est fixée à 400px, ce qui oblige à scroller dans un petit espace | Difficile de trouver un élève quand la liste est longue | `seating-plan-editor.tsx` |

---

## 3. Recommandations d'implémentation

### 3.1 Error Boundary (P0)

Créer `/app/app/dashboard/error.tsx` avec un message utilisateur clair et un bouton "Recharger". Cela empêchera l'écran blanc en cas d'erreur dans un composant.

```tsx
// app/dashboard/error.tsx
'use client'
export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2>Une erreur est survenue</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Réessayer</button>
    </div>
  )
}
```

### 3.2 Supprimer le badge React 19 errors (P0)

Mettre à jour les dépendances Radix-UI vers les versions compatibles React 19, ou supprimer le mode strict React qui déclenche ces warnings en dev.

### 3.3 Responsive éditeur de plan (P0)

Ajouter un message d'avertissement sur mobile/tablette indiquant que l'éditeur fonctionne mieux sur desktop. Pour les tablettes en mode paysage, adapter le layout avec des breakpoints `md:` et `lg:`.

### 3.4 Découpage des composants (P1)

Diviser `seating-plan-editor.tsx` en sous-composants :
- `SeatGrid.tsx` : La grille de placement
- `StudentList.tsx` : Liste des élèves non-placés
- `PlacementControls.tsx` : Contrôles de l'algorithme V3
- `StudentInfoDialog.tsx` : Popup d'info élève
- `ExportPanel.tsx` : Options d'export

### 3.5 Confirmation de navigation (P1)

Implémenter un `beforeunload` handler et un intercepteur de navigation Next.js pour avertir quand des modifications non sauvegardées existent.

### 3.6 Skeleton Loading (P2)

Remplacer les états de chargement "loading..." par des composants Skeleton (déjà disponibles dans Shadcn UI) pour donner un retour visuel immédiat.

### 3.7 Mode sombre pour projection (P2)

Ajouter un toggle de mode sombre dans l'éditeur de plan spécifiquement, avec un fond très foncé et du texte clair, optimisé pour la projection en salle de classe.

---

## 4. Suggestions fonctionnelles

| # | Suggestion | Valeur |
|---|-----------|--------|
| 1 | **Export PDF du plan** avec noms lisibles pour impression et affichage en classe | Haute - les profs impriment souvent les plans |
| 2 | **Mode projection simplifié** : Vue plein écran du plan sans l'UI d'édition, avec les noms en gros | Haute - usage quotidien en classe |
| 3 | **Historique des placements** : Voir l'évolution du plan semaine par semaine | Moyenne - suivi pédagogique |
| 4 | **Statistiques de mixité** : Dashboard montrant le % de mixité G/F par plan, le nombre d'EBP correctement placés | Moyenne - pilotage vie scolaire |
| 5 | **Notifications push** quand un professeur modifie un plan ou quand un délégué fait une proposition | Basse - améliore la réactivité |

---

## 5. Résumé des priorités

```
P0 (Immédiat)     : Error Boundary, badge erreurs React 19, responsive éditeur
P1 (Court terme)  : Découpage composants, confirmation navigation, accessibilité
P2 (Moyen terme)  : Undo/redo, mode sombre, skeleton loading, export PDF
P3 (Long terme)   : Mode projection, statistiques, notifications push
```
