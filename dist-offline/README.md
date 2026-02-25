# Tablero de Diagnóstico Territorial - Versión Offline

Esta carpeta contiene la versión offline del Tablero de Diagnóstico Territorial.

## Cómo usar

### Opción 1: Usar el script de inicio (recomendado)

1. Haga doble clic en `iniciar_servidor.bat`
2. Se abrirá una ventana de terminal con un servidor local
3. Abra su navegador en `http://localhost:8000`
4. Para detener el servidor, presione `Ctrl+C` en la ventana de terminal

> **Requisito**: Necesita tener instalado [Python](https://www.python.org/downloads/) o [Node.js](https://nodejs.org/).

### Opción 2: Usar Firefox

El navegador **Mozilla Firefox** permite abrir archivos locales sin las restricciones de CORS que tienen Chrome y Edge. Simplemente abra el archivo `index.html` directamente en Firefox.

### ⚠️ Nota sobre Chrome / Edge

Chrome y Edge **no permiten** abrir esta aplicación directamente desde el sistema de archivos (`file://`) debido a restricciones de seguridad (CORS). Debe usar el script de inicio o Firefox.

## Limitaciones del modo offline

| Función | Disponible offline | Razón |
|---------|-------------------|-------|
| Datos y gráficos | ✅ Sí | Todos los datos están incluidos |
| Impresión / PDF | ✅ Sí | Usa funciones del navegador |
| Mapa de fondo | ❌ No | Requiere conexión a OpenStreetMap |
| Resumen narrativo (IA) | ❌ No | Requiere conexión al servidor API |

El mapa interactivo no mostrará el fondo cartográfico (tiles de OpenStreetMap) sin conexión a Internet, pero las fronteras de los municipios y la selección territorial seguirán funcionando.
