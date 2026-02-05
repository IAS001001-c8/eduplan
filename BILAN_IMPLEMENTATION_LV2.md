# BILAN TECHNIQUE - Implémentation LV2 (Option 1)
## Fonctionnalité : Import et filtrage des élèves par Langue Vivante 2

---

## 1. OBJECTIF

Permettre d'importer la LV2 des élèves et de créer des sous-salles regroupant les élèves d'une même LV2 provenant de plusieurs classes (ex: tous les élèves d'allemand des 4A, 4B et 4C).

---

## 2. MODIFICATIONS BASE DE DONNÉES

### 2.1 Ajouter le champ `lv2` à la table `students`

**Fichier SQL à exécuter sur Supabase :**

```sql
-- Ajouter la colonne lv2 à la table students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS lv2 TEXT DEFAULT NULL;

-- Créer un index pour optimiser les recherches par lv2
CREATE INDEX IF NOT EXISTS idx_students_lv2 ON public.students(lv2);

-- Commentaire pour documentation
COMMENT ON COLUMN public.students.lv2 IS 'Langue Vivante 2 de l élève (espagnol, allemand, italien, etc.)';
```

### 2.2 Valeurs possibles pour LV2

Laisser en texte libre pour flexibilité, mais les valeurs courantes seront :
- `Espagnol`
- `Allemand`
- `Italien`
- `Portugais`
- `Chinois`
- `Arabe`
- `null` (pas de LV2 ou non renseigné)

---

## 3. MODIFICATIONS FRONTEND

### 3.1 Import des élèves (`/app/components/import-students-dialog.tsx`)

**Modifications requises :**

1. **Ajouter le mapping de colonne LV2** (vers ligne 41) :
```typescript
const [columnMapping, setColumnMapping] = useState({
  firstName: null,
  lastName: null,
  className: null,
  email: null,
  phone: null,
  gender: null,
  lv2: null,  // NOUVEAU
})
```

2. **Ajouter l'extraction de la LV2** (vers ligne 123) :
```typescript
const lv2 = columnMapping.lv2 !== null && columnMapping.lv2 !== -1 
  ? row[columnMapping.lv2]?.trim() || null 
  : null
```

3. **Inclure lv2 dans l'objet étudiant** (vers ligne 138) :
```typescript
{
  first_name: firstName,
  last_name: lastName,
  class_name: className,
  email,
  phone,
  gender,
  lv2,  // NOUVEAU
  establishment_id: establishmentId,
}
```

4. **Ajouter le sélecteur de colonne LV2 dans l'UI** (vers ligne 340) :
```tsx
<div>
  <Label>LV2 (optionnel)</Label>
  <Select
    value={columnMapping.lv2?.toString() ?? "-1"}
    onValueChange={(value) =>
      setColumnMapping({ ...columnMapping, lv2: value === "-1" ? null : Number.parseInt(value) })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Colonne LV2" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="-1">Non mappé</SelectItem>
      {headers.map((header, index) => (
        <SelectItem key={index} value={index.toString()}>
          {header}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

5. **Mettre à jour les instructions d'import** (vers ligne 270) :
```tsx
<li>Colonnes optionnelles: Email, Téléphone, Genre, LV2</li>
```

---

### 3.2 Gestion des élèves (`/app/components/students-management.tsx`)

**Modifications requises :**

1. **Ajouter lv2 au type Student** (vers ligne 20) :
```typescript
interface Student {
  id: string
  first_name: string
  last_name: string
  class_name: string
  email?: string
  phone?: string
  gender?: number
  special_needs?: string[]
  lv2?: string  // NOUVEAU
  // ...
}
```

2. **Inclure lv2 dans la requête SELECT** (vers ligne 80) :
```typescript
.select("id, first_name, last_name, class_name, email, phone, gender, special_needs, lv2, role, profile_id, establishment_id")
```

3. **Ajouter une colonne LV2 dans le tableau d'affichage** :
```tsx
<TableHead>LV2</TableHead>
// ...
<TableCell>{student.lv2 || "-"}</TableCell>
```

4. **Ajouter un filtre par LV2** (similaire au filtre par classe) :
```tsx
const [filterLv2, setFilterLv2] = useState<string>("all")

// Liste des LV2 uniques
const uniqueLv2 = [...new Set(students.map(s => s.lv2).filter(Boolean))]

// Filtrage
const filteredStudents = students.filter(s => {
  const matchesClass = filterClass === "all" || s.class_name === filterClass
  const matchesLv2 = filterLv2 === "all" || s.lv2 === filterLv2
  const matchesSearch = s.first_name.toLowerCase().includes(search) || 
                        s.last_name.toLowerCase().includes(search)
  return matchesClass && matchesLv2 && matchesSearch
})
```

---

### 3.3 Formulaire de création/édition d'élève

**Fichier :** `/app/components/students-management.tsx` ou dialogue dédié

**Ajouter un champ LV2 :**
```tsx
<div>
  <Label htmlFor="lv2">Langue Vivante 2</Label>
  <Select
    value={formData.lv2 || ""}
    onValueChange={(value) => setFormData({...formData, lv2: value || null})}
  >
    <SelectTrigger>
      <SelectValue placeholder="Sélectionner une LV2" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">Non renseigné</SelectItem>
      <SelectItem value="Espagnol">Espagnol</SelectItem>
      <SelectItem value="Allemand">Allemand</SelectItem>
      <SelectItem value="Italien">Italien</SelectItem>
      <SelectItem value="Portugais">Portugais</SelectItem>
      <SelectItem value="Chinois">Chinois</SelectItem>
      <SelectItem value="Arabe">Arabe</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

### 3.4 Création de sous-salles (`/app/components/create-sub-room-dialog.tsx`)

**Modifications requises :**

1. **Ajouter un état pour le filtre LV2** :
```typescript
const [filterLv2, setFilterLv2] = useState<string>("all")
```

2. **Modifier la logique de sélection des élèves** :
```typescript
// Permettre de sélectionner PLUSIEURS classes
const [selectedClasses, setSelectedClasses] = useState<string[]>([])

// Filtrer les élèves par classes ET par LV2
const availableStudents = allStudents.filter(student => {
  const matchesClasses = selectedClasses.length === 0 || 
                         selectedClasses.includes(student.class_name)
  const matchesLv2 = filterLv2 === "all" || student.lv2 === filterLv2
  return matchesClasses && matchesLv2
})
```

3. **Ajouter l'UI pour le filtre LV2** :
```tsx
{/* Sélection des classes (multi-select) */}
<div>
  <Label>Classes</Label>
  <MultiSelect
    options={uniqueClasses.map(c => ({ label: c, value: c }))}
    selected={selectedClasses}
    onChange={setSelectedClasses}
    placeholder="Sélectionner les classes"
  />
</div>

{/* Filtre LV2 */}
<div>
  <Label>Filtrer par LV2</Label>
  <Select value={filterLv2} onValueChange={setFilterLv2}>
    <SelectTrigger>
      <SelectValue placeholder="Toutes les LV2" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Toutes les LV2</SelectItem>
      {uniqueLv2.map(lv2 => (
        <SelectItem key={lv2} value={lv2}>{lv2}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* Affichage du nombre d'élèves filtrés */}
<p className="text-sm text-muted-foreground">
  {availableStudents.length} élève(s) correspondant aux critères
</p>
```

---

## 4. FICHIERS À MODIFIER (RÉSUMÉ)

| Fichier | Modifications |
|---------|---------------|
| **Supabase** | Exécuter le script SQL pour ajouter la colonne `lv2` |
| `/app/components/import-students-dialog.tsx` | Ajouter mapping et extraction LV2 |
| `/app/components/students-management.tsx` | Ajouter colonne, filtre, et champ édition LV2 |
| `/app/components/create-sub-room-dialog.tsx` | Ajouter filtre multi-classes + filtre LV2 |

---

## 5. EXEMPLE DE CAS D'USAGE

**Scénario :** Créer une sous-salle pour le cours d'allemand regroupant les élèves des 4A, 4B et 4C.

**Étapes utilisateur :**
1. Aller dans "Créer une sous-salle"
2. Sélectionner les classes : 4A, 4B, 4C
3. Filtrer par LV2 : "Allemand"
4. Le système affiche uniquement les élèves d'allemand de ces 3 classes
5. Valider la création

---

## 6. FORMAT D'IMPORT EXCEL/CSV RECOMMANDÉ

| Prénom | Nom | Classe | Email | Téléphone | Genre | LV2 |
|--------|-----|--------|-------|-----------|-------|-----|
| Marie | Dupont | 4A | marie@... | 06... | F | Allemand |
| Pierre | Martin | 4B | pierre@... | 06... | M | Espagnol |
| Lucie | Bernard | 4C | lucie@... | 06... | F | Allemand |

---

## 7. POINTS D'ATTENTION

1. **Migration des données existantes** : Les élèves déjà importés auront `lv2 = null`. Prévoir un import de mise à jour ou une édition manuelle.

2. **Cohérence des valeurs** : Pour éviter "Allemand", "allemand", "ALLEMAND", normaliser la casse lors de l'import (première lettre en majuscule).

3. **Performance** : L'index sur `lv2` est important pour les requêtes de filtrage sur de grands établissements.

4. **UX** : Afficher clairement le nombre d'élèves filtrés avant validation pour éviter les erreurs.

---

## 8. ESTIMATION DE COMPLEXITÉ

| Composant | Complexité | Temps estimé |
|-----------|------------|--------------|
| Script SQL | Facile | 5 min |
| Import dialog | Moyenne | 30 min |
| Students management | Moyenne | 45 min |
| Create sub-room dialog | Moyenne-Haute | 1h |
| **Total** | - | **~2h30** |

---

## 9. TESTS À EFFECTUER

1. ✅ Import CSV avec colonne LV2
2. ✅ Affichage LV2 dans la liste des élèves
3. ✅ Filtrage par LV2 dans la gestion des élèves
4. ✅ Création de sous-salle avec filtre multi-classes + LV2
5. ✅ Édition manuelle de la LV2 d'un élève
6. ✅ Vérification que les élèves sans LV2 sont gérés correctement

---

*Document généré le : Février 2025*
*Pour : Agent d'implémentation*
