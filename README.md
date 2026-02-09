# Tu Municipio en Cifras - República Dominicana

Dashboard interactivo que presenta estadísticas municipales de la República Dominicana (158 municipios).

## Descripción

Este dashboard permite visualizar y comparar indicadores demográficos, económicos, educativos y de salud a nivel municipal, con las siguientes funcionalidades:

- **Selector de municipio**: Selección en dos pasos (provincia → municipio)
- **Indicadores demográficos**: Población total, distribución por sexo, pirámides de población
- **Mapa interactivo**: Visualización geográfica con Leaflet + GeoJSON
- **Exportación PDF**: Generación de informes tipo "Diagnóstico Municipal"
- **Comparaciones nacionales**: Cada indicador se compara con el promedio nacional

## Instalación

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` en su navegador.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |

## Estructura del Proyecto

```
├── src/                              # Código fuente principal
│   ├── App.jsx                       # Componente principal de la aplicación
│   ├── main.jsx                      # Punto de entrada de React
│   ├── index.css                     # Estilos globales
│   ├── print.css                     # Estilos para exportación PDF
│   │
│   ├── components/                   # Componentes React
│   │   ├── TopSelectionAndMap.jsx    # Selector de municipio + mapa
│   │   ├── RDMap.jsx                 # Mapa interactivo (Leaflet)
│   │   ├── charts.jsx                # Gráficos (población, economía, etc.)
│   │   ├── PyramidsRow.jsx           # Pirámides de población
│   │   ├── EducacionDashboard.jsx    # Sección de educación
│   │   ├── SaludSection.jsx          # Sección de salud
│   │   ├── CondicionVidaSection.jsx  # Condiciones de vida
│   │   ├── DemografiaHogaresSection.jsx  # Demografía y hogares
│   │   ├── ResumenNarrativoSection.jsx   # Resumen narrativo (IA)
│   │   ├── ResumenComparacionSection.jsx # Comparaciones nacionales
│   │   └── ui/                       # Componentes UI reutilizables
│   │
│   ├── data/                         # Datos JSON (bundled con la app)
│   │   └── adm2.json                 # GeoJSON de municipios
│   │
│   ├── hooks/                        # React hooks personalizados
│   │   └── useMunicipioData.js       # Hook para cargar datos del municipio
│   │
│   └── utils/                        # Funciones utilitarias
│       ├── formatters.js             # Formateo de números/texto
│       └── calculations.js           # Cálculos estadísticos
│
├── public/                           # Archivos estáticos
│   └── data/                         # Datos JSON (36 archivos)
│       ├── municipios_index.json     # Índice de municipios
│       ├── indicadores_basicos.json  # Población, sexo, crecimiento
│       ├── pyramids.json             # Pirámides de población 2022
│       ├── edad_sexo_2010.json       # Datos históricos 2010
│       ├── economia_empleo.json      # Economía y empleo (DEE 2024)
│       ├── educacion.json            # Indicadores educativos
│       ├── educacion_nivel.json      # Nivel educativo por edad
│       ├── salud_establecimientos.json   # Establecimientos de salud
│       ├── condicion_vida.json       # Condiciones de vivienda
│       ├── hogares_resumen.json      # Resumen de hogares
│       ├── tic.json                  # Acceso a TIC
│       ├── national_*.json           # Promedios nacionales (8 archivos)
│       └── *_provincia.json          # Datos agregados por provincia
│
├── scripts/                          # Scripts de utilidad
│   ├── postbuild.mjs                 # Post-procesamiento del build
│   └── deploy.mjs                    # Despliegue a GitHub Pages
│
├── index.html                        # HTML principal
├── vite.config.mjs                   # Configuración de Vite
├── tailwind.config.js                # Configuración de Tailwind CSS
├── postcss.config.cjs                # Configuración de PostCSS
└── package.json                      # Dependencias y scripts
```

## Tecnologías

- **React 18** + Vite
- **Leaflet** (mapas)
- **Recharts** (gráficos)
- **Tailwind CSS** (estilos)
- **jsPDF** + html2canvas (exportación PDF)

## Datos

Los datos provienen del Censo Nacional de Población y Vivienda 2022 (ONE) y la Encuesta DEE 2024.

## Deployment

https://mnakagaw.github.io/dashboard-municipal/

## Licencia

MIT
