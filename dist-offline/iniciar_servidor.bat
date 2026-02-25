@echo off
echo ============================================
echo  Tablero de Diagnostico Territorial
echo  Servidor local para uso offline
echo ============================================
echo.

REM Intentar con Python 3
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Iniciando servidor con Python...
    echo Abra su navegador en: http://localhost:8000
    echo Presione Ctrl+C para detener el servidor.
    echo.
    python -m http.server 8000
    goto :end
)

REM Intentar con Python (py launcher)
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Iniciando servidor con Python...
    echo Abra su navegador en: http://localhost:8000
    echo Presione Ctrl+C para detener el servidor.
    echo.
    py -m http.server 8000
    goto :end
)

REM Intentar con Node.js npx serve
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Iniciando servidor con Node.js...
    echo Abra su navegador en: http://localhost:3000
    echo Presione Ctrl+C para detener el servidor.
    echo.
    npx -y serve -s .
    goto :end
)

echo ERROR: No se encontro Python ni Node.js instalado.
echo.
echo Para usar esta version offline, necesita instalar uno de estos:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo Alternativamente, puede usar el navegador Firefox que permite
echo abrir archivos locales sin servidor.
echo.
pause

:end
