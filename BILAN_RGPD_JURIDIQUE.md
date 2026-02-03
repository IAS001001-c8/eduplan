# BILAN TECHNIQUE RGPD - APPLICATION EDUPLAN
## Document destiné au service juridique pour la rédaction des CGV/CGU

---

## 1. PRÉSENTATION GÉNÉRALE

**Nom de l'application** : EduPlan
**URL** : https://eduplan-lnc.com
**Finalité** : Gestion de plans de classe pour les établissements scolaires
**Utilisateurs cibles** : Établissements scolaires (collèges, lycées), personnel vie scolaire, professeurs, délégués de classe

---

## 2. DONNÉES COLLECTÉES ET STOCKÉES

### 2.1 Données relatives aux établissements

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Nom de l'établissement | Texte | Oui | Identification |
| Code établissement | Texte | Oui | Connexion |
| Mot de passe établissement | Texte (haché) | Oui | Authentification |

### 2.2 Données relatives aux utilisateurs (Profils)

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Identifiant (username) | Texte | Oui | Connexion |
| Mot de passe | Texte (haché) | Oui | Authentification |
| Prénom | Texte | Oui | Identification |
| Nom | Texte | Oui | Identification |
| Email | Texte | Non | Communication (optionnel) |
| Téléphone | Texte | Non | Communication (optionnel) |
| Rôle | Enum | Oui | Gestion des permissions |

**Rôles possibles** : vie-scolaire, professeur, delegue, eco-delegue

### 2.3 Données relatives aux professeurs

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Prénom | Texte | Oui | Identification |
| Nom | Texte | Oui | Identification |
| Email | Texte | Non | Communication |
| Matière enseignée | Texte | Non | Organisation pédagogique |
| Classes enseignées | Liste | Non | Attribution des plans de classe |
| Professeur principal | Booléen | Non | Identification du rôle |

### 2.4 Données relatives aux élèves

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Prénom | Texte | Oui | Identification |
| Nom | Texte | Oui | Identification |
| Email | Texte | Non | Communication (optionnel) |
| Téléphone | Texte | Non | Communication (optionnel) |
| Classe | Texte | Oui | Organisation scolaire |
| Rôle élève | Enum | Non | Délégué/Éco-délégué |
| Genre | Entier (1/2/3) | Non | Placement mixte (algorithme) |
| Besoins particuliers (EBP) | Liste | Non | Adaptation pédagogique |

**⚠️ DONNÉES SENSIBLES - Besoins particuliers (EBP)** :
- Problèmes de vision
- Problèmes d'audition
- Troubles du spectre autistique (TSA)
- Autres besoins spécifiques définis par l'établissement

### 2.5 Données relatives aux salles et plans de classe

| Donnée | Type | Finalité |
|--------|------|----------|
| Nom de la salle | Texte | Identification |
| Code de la salle | Texte | Référence |
| Configuration (colonnes, tables, places) | JSON | Disposition physique |
| Position du tableau | Texte | Orientation de la salle |
| Placements des élèves | Relation | Plans de classe |

### 2.6 Données relatives aux propositions de plans

| Donnée | Type | Finalité |
|--------|------|----------|
| Nom de la proposition | Texte | Identification |
| Statut | Enum | Workflow de validation |
| Commentaires | Texte | Communication interne |
| Date de création | Horodatage | Traçabilité |
| Créateur | Relation | Responsabilité |

---

## 3. HÉBERGEMENT ET STOCKAGE DES DONNÉES

### 3.1 Infrastructure technique

| Service | Fournisseur | Localisation | Certification |
|---------|-------------|--------------|---------------|
| Base de données | Supabase (PostgreSQL) | Union Européenne | SOC 2 Type II, GDPR compliant |
| Hébergement web | Vercel | Global (Edge) | SOC 2 Type II, GDPR compliant |
| Application Windows | Microsoft Store | N/A (app locale) | N/A |

### 3.2 Détails Supabase

- **Type** : PostgreSQL managé
- **Région** : Europe (Francfort, Allemagne)
- **Chiffrement** : 
  - Au repos : AES-256
  - En transit : TLS 1.3
- **Sauvegardes** : Automatiques quotidiennes
- **URL du projet** : https://bdvdrzohbieqeisxwmwh.supabase.co

### 3.3 Sécurité des accès

- **Row Level Security (RLS)** : Activé sur toutes les tables
- **Isolation des données** : Chaque établissement ne peut accéder qu'à ses propres données
- **Authentification** : JWT tokens avec expiration
- **Mots de passe** : Stockés sous forme hachée (bcrypt)

---

## 4. DURÉE DE CONSERVATION DES DONNÉES

| Type de données | Durée de conservation | Justification |
|-----------------|----------------------|---------------|
| Comptes utilisateurs | Durée de la relation contractuelle + 1 an | Gestion du service |
| Données élèves | Année scolaire en cours + 1 an | Continuité pédagogique |
| Plans de classe | Année scolaire en cours + 1 an | Historique et référence |
| Logs de connexion | 1 an | Sécurité et audit |
| Données supprimées | Suppression définitive (soft delete puis hard delete) | - |

---

## 5. DROITS DES UTILISATEURS (RGPD)

### 5.1 Droits applicables

| Droit | Description | Modalité d'exercice |
|-------|-------------|---------------------|
| **Accès** (Art. 15) | Obtenir une copie de ses données | Demande par email |
| **Rectification** (Art. 16) | Corriger des données inexactes | Interface utilisateur ou demande |
| **Effacement** (Art. 17) | Suppression des données ("droit à l'oubli") | Demande par email |
| **Limitation** (Art. 18) | Restreindre le traitement | Demande par email |
| **Portabilité** (Art. 20) | Recevoir ses données dans un format structuré | Export JSON/CSV sur demande |
| **Opposition** (Art. 21) | S'opposer au traitement | Demande par email |

### 5.2 Délai de réponse

- **Délai standard** : 1 mois maximum
- **Extension possible** : 2 mois supplémentaires si complexité (notification requise)

### 5.3 Contact pour exercer ses droits

- **Email** : [À DÉFINIR - ex: dpo@eduplan-lnc.com]
- **Formulaire** : [À DÉFINIR]

---

## 6. BASES LÉGALES DU TRAITEMENT (Art. 6 RGPD)

| Traitement | Base légale | Justification |
|------------|-------------|---------------|
| Gestion des comptes utilisateurs | Exécution du contrat | Nécessaire pour fournir le service |
| Données des élèves | Intérêt légitime | Mission éducative de l'établissement |
| Données EBP (besoins particuliers) | Consentement explicite | Données sensibles (Art. 9) |
| Statistiques anonymisées | Intérêt légitime | Amélioration du service |
| Cookies techniques | Intérêt légitime | Fonctionnement du service |

**⚠️ ATTENTION** : Les données relatives aux besoins particuliers (EBP) sont des **données de santé** (catégorie particulière Art. 9 RGPD). Leur traitement nécessite :
- Consentement explicite des parents/tuteurs pour les mineurs
- Ou dérogation pour motif d'intérêt public dans le domaine de l'éducation

---

## 7. TRANSFERTS DE DONNÉES

### 7.1 Sous-traitants

| Sous-traitant | Rôle | Pays | Garanties |
|---------------|------|------|-----------|
| Supabase Inc. | Hébergement BDD | USA (données EU) | Clauses contractuelles types, Data Processing Agreement |
| Vercel Inc. | Hébergement web | USA (CDN global) | Clauses contractuelles types |
| Resend | Envoi d'emails | USA | Clauses contractuelles types |

### 7.2 Garanties pour les transferts hors UE

- Clauses Contractuelles Types (CCT) de la Commission Européenne
- Certification des sous-traitants (SOC 2, ISO 27001)

---

## 8. SÉCURITÉ DES DONNÉES

### 8.1 Mesures techniques

- ✅ Chiffrement des données au repos (AES-256)
- ✅ Chiffrement en transit (TLS 1.3 / HTTPS)
- ✅ Authentification forte (JWT + mot de passe haché)
- ✅ Row Level Security (isolation par établissement)
- ✅ Sauvegardes automatiques quotidiennes
- ✅ Logs d'accès et d'audit

### 8.2 Mesures organisationnelles

- ✅ Accès limité aux données selon le rôle
- ✅ Principe du moindre privilège
- ✅ Séparation des environnements (dev/prod)

---

## 9. COOKIES ET TRACEURS

| Cookie | Type | Finalité | Durée |
|--------|------|----------|-------|
| Session auth | Technique | Maintien de la connexion | Session |
| Préférences UI | Technique | Thème, langue | 1 an |

**Pas de cookies publicitaires ni de tracking tiers.**

---

## 10. MINEURS

- L'application traite des données de mineurs (élèves)
- Le consentement des parents/tuteurs légaux est requis via l'établissement scolaire
- L'établissement scolaire est responsable de la collecte du consentement
- Les délégués mineurs qui utilisent l'application doivent avoir l'autorisation de leur établissement

---

## 11. INCIDENTS DE SÉCURITÉ

En cas de violation de données :
- Notification à la CNIL sous 72h
- Notification aux personnes concernées si risque élevé
- Documentation de l'incident

---

## 12. POINTS D'ATTENTION POUR LE JURISTE

### À inclure dans les CGV/CGU :

1. **Responsabilités** :
   - L'établissement est responsable de traitement
   - EduPlan est sous-traitant (Art. 28 RGPD)
   - Nécessité d'un DPA (Data Processing Agreement)

2. **Consentement EBP** :
   - Obtenir un consentement spécifique pour les données de santé
   - Prévoir un mécanisme de retrait du consentement

3. **Durée de conservation** :
   - Définir clairement les durées
   - Prévoir la suppression automatique

4. **Droits des personnes** :
   - Procédure claire d'exercice des droits
   - Délais de réponse

5. **Clauses de confidentialité** :
   - Engagement de confidentialité du personnel
   - Interdiction de réutilisation des données

6. **Responsabilité** :
   - Limitation de responsabilité
   - Cas de force majeure
   - Disponibilité du service (SLA)

---

## 13. DOCUMENTS À PRODUIRE

1. **CGV** (Conditions Générales de Vente)
2. **CGU** (Conditions Générales d'Utilisation)
3. **Politique de confidentialité**
4. **DPA** (Data Processing Agreement) pour les établissements
5. **Formulaire de consentement EBP** (pour les parents)
6. **Registre des traitements** (Art. 30 RGPD)
7. **PIA** (Analyse d'impact) recommandée vu les données de mineurs

---

## 14. CONTACTS

- **Responsable technique** : [À DÉFINIR]
- **DPO** (si désigné) : [À DÉFINIR]
- **Support** : [À DÉFINIR]
- **CNIL** : https://www.cnil.fr

---

*Document généré le : Février 2025*
*Version : 1.0*
