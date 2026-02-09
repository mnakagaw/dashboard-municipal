# Tu Municipio en Cifras - República Dominicana

Dashboard interactivo por municipio (158 municipios) con:

- Selector en dos pasos: provincia → municipio (incluye "Provincia de XXX").
- Indicadores básicos (población total, hombres, mujeres).
- Pirámide de población (municipio o provincia agregada).
- Distribución por sexo (gráfico de pastel).
- Mapa clicable (Leaflet + GeoJSON): al hacer clic en un municipio, se actualiza el selector.
- Exportación en PDF tipo "Diagnóstico municipal: Municipio".

## Instalación

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` en su navegador.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Vista previa de la versión de producción |
| `npm run deploy` | Despliega a GitHub Pages |

## Estructura del proyecto

```
├── src/                    # Código fuente React
│   ├── components/         # Componentes React
│   ├── data/               # Datos JSON (municipios, pirámides, etc.)
│   └── *.jsx, *.css        # Archivos principales
├── public/                 # Archivos estáticos
│   ├── data/               # Datos JSON públicos
│   └── api/                # API PHP (para servidor)
├── scripts/                # Scripts de utilidad
└── dist/                   # Salida del build (generado)
```

## Datos

- `public/data/municipios_index.json`: listado de municipios con adm2_code, provincia, región.
- `public/data/indicadores_basicos.json`: indicadores básicos por municipio.
- `public/data/pyramids.json`: pirámide de población por edad y sexo.
- `src/data/adm2.json`: fronteras administrativas GeoJSON.

## Deployment

El dashboard está desplegado en: https://mnakagaw.github.io/dashboard-municipal/

## Licencia

MIT
