# EduPlan - Application Windows

Application de gestion de plans de classe pour les établissements scolaires.

## Prérequis

- Node.js 18+ installé sur votre PC
- npm ou yarn

## Installation

```bash
cd electron-app
npm install
```

## Lancer en mode développement

```bash
npm start
```

## Compiler pour Windows

### Créer un installateur .exe (NSIS)
```bash
npm run build:win
```

### Créer un package Microsoft Store (.appx)
```bash
npm run build:appx
```

Les fichiers compilés seront dans le dossier `dist/`.

## Publication Microsoft Store

1. Créez un compte développeur sur [partner.microsoft.com](https://partner.microsoft.com) (~19€)
2. Créez une nouvelle application dans Partner Center
3. Uploadez le fichier `.appx` généré
4. Remplissez les informations (description, captures d'écran)
5. Soumettez pour validation

## Structure

```
electron-app/
├── main.js          # Code principal Electron
├── package.json     # Configuration et scripts
├── assets/
│   └── icon.png     # Icône de l'application
└── dist/            # Fichiers compilés (après build)
```
