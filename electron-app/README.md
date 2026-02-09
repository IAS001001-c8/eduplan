# EduPlan - Application Windows (Electron)

## Version: 1.0.4

## Structure des dossiers

```
electron-app/
├── build/              # Icônes pour Microsoft Store (AppX)
│   ├── icon.png        # Icône principale 256x256
│   ├── StoreLogo*.png  # Logo du Store (50-200px)
│   ├── Square44x44Logo*.png    # Petites tuiles
│   ├── Square71x71Logo*.png    # Tuiles moyennes (legacy)
│   ├── Square150x150Logo*.png  # Tuiles moyennes
│   ├── Square310x310Logo*.png  # Grandes tuiles
│   ├── Wide310x150Logo*.png    # Tuiles larges
│   ├── SplashScreen*.png       # Écran de démarrage
│   ├── BadgeLogo*.png          # Badge notifications
│   └── LockScreenLogo*.png     # Écran de verrouillage
├── assets/             # Icônes pour installeur NSIS
│   ├── icon.png
│   └── icon.ico
├── main.js             # Point d'entrée Electron
└── package.json        # Configuration
```

## Build pour Microsoft Store

```bash
# 1. Nettoyer le cache
rd /s /q dist

# 2. Construire l'AppX
yarn build:appx
```

Le fichier `.appx` sera dans `dist/`.

## Configuration AppX

| Paramètre | Valeur |
|-----------|--------|
| identityName | mauboussin.597364587809B |
| publisher | CN=1C530B69-D6AE-43AC-A089-794FC1E30BDB |
| publisherDisplayName | mauboussin |
| applicationId | EduPlan |
| displayName | EduPlan-LNC |
| backgroundColor | #E7A541 |

## Icônes (59 fichiers)

Toutes les icônes utilisent `icone-eduplan-sans-slogan.png` :
- Fond doré (#E7A541)
- Logo centré avec 20% de padding
- Toutes les tailles requises par Microsoft (scale-100 à scale-400)
- Versions targetsize pour la barre des tâches
- Versions altform-unplated (fond transparent)

## Dépannage

### "Tile icons include a default image"
- Vérifiez que le dossier `build/` contient tous les fichiers
- Supprimez `dist/` et reconstruisez
- Les icônes doivent être dans `build/`, pas `assets/`

### Après git pull
```bash
cd electron-app
rd /s /q dist
yarn build:appx
```
