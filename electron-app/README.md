# EduPlan - Application Windows (Microsoft Store)

## Version actuelle : 1.0.6

## Prérequis
- Node.js 18+
- Windows 10/11 pour le build

## Build pour Microsoft Store

### 1. Régénérer les icônes (si nécessaire)
```bash
python3 generate_all_icons.py
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Build le package .appx
```bash
npm run build:win
```

Le fichier `.appx` sera créé dans le dossier `dist/`.

## Structure des icônes

Toutes les icônes sont générées à partir du logo EduPlan source et placées dans :
- `assets/` - Icône principale (.ico et .png)
- `build/` - Toutes les tailles requises par Microsoft Store

### Icônes Microsoft Store requises
| Type | Tailles |
|------|---------|
| Square44x44Logo | 44, 55, 66, 88, 176 + target sizes (16, 24, 32, 48, 256) |
| Square71x71Logo | 71, 89, 107, 142, 284 |
| Square150x150Logo | 150, 188, 225, 300, 600 |
| Square310x310Logo | 310, 388, 465, 620 |
| Wide310x150Logo | 310x150, 388x188, 465x225, 620x300 |
| StoreLogo | 50, 63, 75, 100, 200 |
| BadgeLogo | 24, 30, 36, 48, 96 |
| LockScreenLogo | 24, 48 |
| SplashScreen | 620x300, 775x375, 930x450, 1240x600 |

## Soumettre au Microsoft Store

1. Connectez-vous au [Microsoft Partner Center](https://partner.microsoft.com/)
2. Allez dans Applications > EduPlan-LNC
3. Créez une nouvelle soumission
4. Téléchargez le fichier `dist/EduPlan-1.0.6.appx`
5. Soumettez pour certification

## Historique des versions
- **1.0.6** - Régénération complète des icônes avec le logo EduPlan officiel
- **1.0.5** - Tentative de fix des icônes avec manifest personnalisé
- **1.0.4** - Tentative de fix des icônes
- **1.0.0** - Version initiale
