@echo off
echo ========================================
echo   FIGHT GAME - Instalador Windows
echo ========================================

:: Crear estructura de carpetas
echo Creando carpetas...
mkdir css 2>nul
mkdir js 2>nul
mkdir assets\images 2>nul
mkdir assets\sounds 2>nul
mkdir server 2>nul

echo.
echo ========================================
echo Carpetas creadas correctamente:
echo   css/
echo   js/
echo   assets/images/
echo   assets/sounds/
echo   server/
echo ========================================
echo.
echo PASO SIGUIENTE:
echo   Copia cada archivo .js en js/
echo   Copia style.css en css/
echo   Copia index.html aqui (raiz)
echo.
echo Para correr el servidor local:
echo   cd server
echo   pnpm install
echo   pnpm start
echo.
echo Para abrir el juego sin servidor:
echo   Doble click en index.html
echo ========================================
pause