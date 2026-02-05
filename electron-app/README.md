# EduPlan - Application Windows (Electron)

## Prérequis
- Node.js 18+
- Yarn ou npm

## Installation
```bash
cd electron-app
yarn install
```

## Build

### Build AppX (Microsoft Store)
```bash
yarn build:appx
```

### Build NSIS (Installeur .exe)
```bash
yarn build:win
```

## Assets des icônes (Microsoft Store)

Les icônes de tuiles sont générées automatiquement dans le dossier `/assets`:

| Fichier | Taille | Description |
|---------|--------|-------------|
| `StoreLogo.png` | 50x50 | Logo du Store |
| `Square44x44Logo.png` | 44x44 | Petite tuile |
| `Square71x71Logo.png` | 71x71 | Tuile moyenne |
| `Square150x150Logo.png` | 150x150 | Tuile standard |
| `Square310x310Logo.png` | 310x310 | Grande tuile |
| `Wide310x150Logo.png` | 310x150 | Tuile large |
| `icon.ico` | Multi-tailles | Icône pour l'installeur NSIS |

Chaque icône a des versions avec scale factors (100%, 125%, 150%, 200%, 400%) pour s'adapter aux différentes résolutions d'écran.

## Configuration Microsoft Store

Dans `package.json`, les paramètres AppX :
- `identityName`: Identité du package depuis Partner Center
- `publisher`: CN du certificat depuis Partner Center
- `publisherDisplayName`: Nom d'affichage de l'éditeur
- `applicationId`: ID de l'application
- `displayName`: Nom affiché dans le Store
- `backgroundColor`: Couleur de fond des tuiles (#E7A541)

## Résolution des erreurs courantes

### "Tile icons include a default image"
Les icônes de tuiles personnalisées sont dans `/assets`. Vérifiez que tous les fichiers `Square*.png`, `Wide*.png` et `StoreLogo.png` sont présents.

### Build échoue avec "icon.ico not found"
Le fichier `icon.ico` doit être dans `/assets`. Il est généré avec les tailles 16, 32, 48, 64, 128, 256 pixels.

## Version
- Version actuelle: 1.0.2
- Incrémentez la version dans `package.json` avant chaque soumission au Store
