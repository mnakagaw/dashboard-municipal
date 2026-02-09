/**
 * postbuild.mjs - Script de post-construcción
 * 
 * Este script se ejecuta automáticamente después de "npm run build".
 * Su propósito principal es preparar los archivos para GitHub Pages.
 * 
 * ¿Qué hace?
 * 1. Copia index.html a 404.html para permitir el enrutamiento SPA
 *    (Single Page Application) en GitHub Pages.
 * 
 * ¿Por qué es necesario?
 * GitHub Pages no soporta rutas dinámicas por defecto.
 * Al crear un 404.html idéntico al index.html, cuando el usuario
 * accede a una ruta como /municipio/02001, GitHub sirve el 404.html
 * que luego carga la aplicación React correctamente.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// En ES Modules no existe __dirname, así que lo recreamos manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio raíz del proyecto (un nivel arriba de /scripts)
const rootDir = path.resolve(__dirname, '..');

// ============================================
// PASO 1: Copiar index.html a 404.html
// ============================================
const indexHtml = path.join(rootDir, 'dist', 'index.html');
const notFoundHtml = path.join(rootDir, 'dist', '404.html');

try {
    // Verificar si el archivo index.html existe
    if (fs.existsSync(indexHtml)) {
        // Copiar el archivo
        fs.copyFileSync(indexHtml, notFoundHtml);
        console.log(`✅ Copiado dist/index.html a dist/404.html para enrutamiento SPA.`);
    } else {
        console.warn(`⚠️ dist/index.html no encontrado. Saltando creación de 404.html.`);
    }
} catch (err) {
    console.error(`❌ Error al crear 404.html:`, err);
}

// ============================================
// PASO 2: Copiar carpeta API (deshabilitado)
// ============================================
// Esta sección está comentada porque GitHub Pages es un hosting
// estático y no puede ejecutar código PHP del servidor.

const src = path.join(rootDir, 'public', 'api');
const dest = path.join(rootDir, 'dist', 'api');

console.log(`Post-build: Copia de carpeta API deshabilitada para GitHub Pages.`);

/*
// Código comentado - Solo usar si se despliega en servidor con PHP
if (fs.existsSync(src)) {
    try {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.cpSync(src, dest, { recursive: true });
        console.log(`✅ Copiado public/api a dist/api exitosamente.`);
    } catch (err) {
        console.warn(`⚠️ Error al copiar public/api:`, err.message);
    }
} else {
    console.warn(`⚠️ Directorio public/api no existe. Saltando copia.`);
}
*/
