@echo off
echo ================================================
echo    EduPlan - Build pour Microsoft Store
echo    Version 1.0.6
echo ================================================
echo.

REM Verifier que Node.js est installe
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Node.js n'est pas installe!
    echo Telechargez-le sur https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installation des dependances...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Installation des dependances echouee
    pause
    exit /b 1
)

echo.
echo [2/3] Build du package .appx...
call npm run build:win
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Build echoue
    pause
    exit /b 1
)

echo.
echo ================================================
echo    BUILD TERMINE AVEC SUCCES!
echo ================================================
echo.
echo Le fichier .appx se trouve dans: dist\EduPlan-1.0.6.appx
echo.
echo Prochaine etape:
echo 1. Allez sur https://partner.microsoft.com/
echo 2. Soumettez le fichier .appx
echo.
pause
