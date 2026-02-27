# Guía de Despliegue

## Requisitos previos

- Node.js >= 18
- Servidor web con soporte PHP (para función de IA, opcional)
- Acceso al directorio de destino en el servidor

## Paso 1: Configurar el base path

Editar `vite.config.mjs` y cambiar el `base` según la ruta en el servidor:

```js
export default defineConfig({
  base: "/ruta-en-one/",   // Ejemplo: "/estadisticas/dashboard/"
  // ...
});
```

## Paso 2: Configurar las variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Desactivar la función de IA para el despliegue
VITE_ENABLE_AI=true

# URL para la generación narrativa (API PHP)
# - Dejar en blanco o usar ruta relativa (ej. "./api/generateNarrative.php") si el API y el frontend están en el mismo servidor/dominio.
# - Para desarrollo local con API remoto, incluir la URL completa (ej. "https://prodecare.net/dashboard/api/generateNarrative.php").
VITE_API_URL=
```

> **Nota**: Con `VITE_ENABLE_AI=false`, la sección de resumen narrativo no se mostrará
> en la interfaz y no se realizará ninguna solicitud a servidores externos.
> Esto garantiza que la aplicación funcione sin conexión externa.

## Paso 3: Construir la aplicación

```bash
npm ci              # Instalar dependencias (reproducible)
npm run build       # Generar archivos de producción en dist/
```

## Paso 4: Desplegar

Copiar el contenido de la carpeta `dist/` al directorio del servidor web.

```bash
# Ejemplo con rsync
rsync -avz dist/ usuario@servidor:/var/www/html/dashboard/

# O simplemente copiar los archivos
cp -r dist/* /ruta/del/servidor/web/
```

## Paso 5 (Opcional): Habilitar función de IA

Si se desea habilitar la generación de narrativa con IA:

1. Cambiar `VITE_ENABLE_AI=true` en `.env` y reconstruir
2. Asegurar que el servidor tenga PHP con la extensión `curl`
3. Crear el archivo `api/.env.local` en el servidor con:

```
OPENAI_API_KEY=sk-...tu-clave-aquí...
```

4. Verificar que `api/generateNarrative.php` tenga permisos de lectura

## Verificación

1. Abrir la URL del dashboard en un navegador
2. Verificar que el selector de territorio funcione
3. Verificar que los gráficos y mapas se muestren
4. Verificar que la impresión/PDF funcione
5. Si AI está habilitada, verificar que se genere el resumen narrativo

## Notas importantes

- **Sin conexión externa**: Con `VITE_ENABLE_AI=false`, la aplicación no realiza ninguna solicitud a servidores externos. Todos los datos están incluidos en el build.
- **Mapa base**: El mapa interactivo utiliza tiles de OpenStreetMap. Si el servidor no tiene acceso a internet, el mapa se mostrará sin fondo pero los polígonos de municipios seguirán visibles.
- **Datos estáticos**: Todos los datos estadísticos están embebidos como JSON en el build. No se requiere base de datos.
