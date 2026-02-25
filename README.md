# Tablero de Diagnóstico Territorial - República Dominicana

Tablero interactivo que presenta estadísticas territoriales de la República Dominicana a tres niveles: **municipio** (158), **provincia** (32) y **región** (10 regiones únicas de planificación).

## Descripción

Este tablero permite visualizar y comparar indicadores demográficos, económicos, educativos, de salud y de condición de vida, con las siguientes funcionalidades:

- **Selector territorial de tres niveles**:
  - **Municipio**: Selección en dos pasos (provincia → municipio)
  - **Provincia**: Vista agregada de todos los municipios de una provincia
  - **Región**: Vista agregada de todas las provincias de una región de planificación (Ley 345-22)
- **Indicadores demográficos**: Población total, distribución por sexo, pirámides de población (2010 y 2022)
- **Hogares y patrón urbano–rural**: Tamaño de hogar, distribución urbana/rural
- **Condición de vida**: Agua, saneamiento, electricidad, combustible, residuos sólidos, TIC
- **Educación**: Oferta educativa, eficiencia del sistema, niveles de instrucción
- **Economía y empleo**: Estructura productiva (DEE 2024), empresas por tamaño, sectores CIIU
- **Salud**: Establecimientos de salud por tipo y cobertura
- **Mapa interactivo**: Visualización geográfica con Leaflet + GeoJSON (pantalla), SVG estático (impresión)
- **Comparaciones nacionales**: Cada indicador se compara con el promedio nacional y provincial
- **Resumen narrativo (IA)**: Generación automática de diagnóstico territorial mediante ChatGPT
- **Tabla resumen de comparación**: Comparación municipio vs. provincia vs. nacional
- **Exportación PDF**: Generación de informes tipo "Diagnóstico Territorial" mediante impresión del navegador

## Niveles territoriales

| Nivel | Cantidad | Selector | Ejemplo |
|-------|----------|----------|---------|
| Municipio | 158 | Provincia → Municipio | Santo Domingo de Guzmán |
| Provincia | 32 | Dropdown directo | Provincia de Santiago |
| Región | 10 | Dropdown directo | Región Cibao Norte |

### Regiones Únicas de Planificación (Ley 345-22)

| Región | Provincias incluidas |
|--------|---------------------|
| Cibao Norte | Santiago, Puerto Plata, Espaillat |
| Cibao Sur | La Vega, Monseñor Nouel, Sánchez Ramírez |
| Cibao Nordeste | Duarte, Samaná, María Trinidad Sánchez, Hermanas Mirabal |
| Cibao Noroeste | Santiago Rodríguez, Valverde, Montecristi, Dajabón |
| Valdesia | San Cristóbal, Peravia, San José de Ocoa |
| Enriquillo | Barahona, Bahoruco, Pedernales, Independencia |
| El Valle | San Juan, Elías Piña, Azua |
| Yuma | La Altagracia, La Romana, El Seibo, Hato Mayor |
| Higuamo | San Pedro de Macorís, Monte Plata |
| Ozama o Metropolitana | Distrito Nacional, Santo Domingo |

Cuando se selecciona una provincia o región, los datos se agregan automáticamente a partir de los municipios que la componen. El resumen narrativo generado por IA adapta automáticamente su terminología al nivel territorial (Plan Municipal / Provincial / Regional de Desarrollo).

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
│   ├── print.css                     # Estilos para impresión / exportación PDF
│   │
│   ├── components/                   # Componentes React
│   │   ├── TopSelectionAndMap.jsx    # Selector territorial + mapa
│   │   ├── RDMap.jsx                 # Mapa interactivo (Leaflet)
│   │   ├── PrintMapSVG.jsx          # Mapa estático SVG para impresión
│   │   ├── charts.jsx                # Gráficos (población, economía, etc.)
│   │   ├── PyramidsRow.jsx           # Pirámides de población (2010 y 2022)
│   │   ├── EducacionDashboard.jsx    # Sección de educación
│   │   ├── SaludSection.jsx          # Sección de salud
│   │   ├── CondicionVidaSection.jsx  # Condiciones de vida
│   │   ├── DemografiaHogaresSection.jsx  # Demografía y hogares
│   │   ├── ResumenNarrativoSection.jsx   # Resumen narrativo (IA / ChatGPT)
│   │   ├── ResumenComparacionSection.jsx # Tabla de comparación territorial
│   │   └── ui/                       # Componentes UI reutilizables
│   │
│   ├── data/                         # Datos JSON (bundled con la app)
│   │   └── adm2.json                 # GeoJSON de municipios
│   │
│   ├── hooks/                        # React hooks personalizados
│   │   └── useMunicipioData.js       # Hook para cargar y agregar datos territoriales
│   │
│   └── utils/                        # Funciones utilitarias
│       ├── formatters.js             # Formateo de números/texto
│       └── calculations.js           # Cálculos estadísticos
│
├── public/                           # Archivos estáticos
│   └── data/                         # Datos JSON (36+ archivos)
│       ├── municipios_index.json     # Índice de 158 municipios
│       ├── regions_index.json        # Índice de regiones y sus provincias
│       ├── indicadores_basicos.json  # Población total, hombres, mujeres, crecimiento
│       ├── pyramids.json             # Pirámide de población por edad y sexo (2022)
│       ├── edad_sexo_2010.json       # Pirámide de población histórica (2010)
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
│   └── deploy.mjs                    # Despliegue a servidor FTP
│
├── index.html                        # HTML principal
├── vite.config.mjs                   # Configuración de Vite
├── tailwind.config.js                # Configuración de Tailwind CSS
├── postcss.config.cjs                # Configuración de PostCSS
└── package.json                      # Dependencias y scripts
```

## Tecnologías

- **React 18** + Vite
- **Leaflet** (mapas interactivos)
- **Recharts** (gráficos)
- **Tailwind CSS** (estilos)
- **OpenAI API** (resumen narrativo automático)

## Datos

Los datos provienen de las siguientes fuentes:

- **Censo Nacional de Población y Vivienda 2022** (ONE)
- **Directorio de Empresas y Establecimientos (DEE) 2024** (ONE)
- **Anuario Estadístico Educativo** (MINERD)
- **Establecimientos de Salud 1878–2025** (SNS)

### Archivos de datos (`public/data/`)

| Archivo | Descripción |
|---------|-------------|
| `municipios_index.json` | Índice de 158 municipios (adm2_code, provincia, región) |
| `regions_index.json` | Índice de 10 regiones con sus provincias |
| `indicadores_basicos.json` | Población total, hombres, mujeres, crecimiento |
| `pyramids.json` | Pirámide de población por edad y sexo (2022) |
| `edad_sexo_2010.json` | Pirámide de población histórica (2010) |
| `hogares_resumen.json` | Total de hogares, personas por hogar |
| `tamano_hogar.json` | Distribución de tamaño de hogar (1-10+) |
| `poblacion_urbana_rural.json` | Población urbana vs rural |
| `condicion_vida.json` | Condiciones de vivienda (agua, electricidad, saneamiento) |
| `economia_empleo.json` | Economía y empleo (DEE 2024) |
| `educacion.json` | Indicadores educativos generales |
| `educacion_nivel.json` | Nivel educativo por grupo de edad |
| `educacion_oferta_municipal.json` | Oferta educativa (escuelas, universidades) |
| `salud_establecimientos.json` | Establecimientos de salud por tipo |
| `tic.json` | Acceso a tecnología (internet, computadora, celular) |

### Datos agregados por provincia (`*_provincia.json`)

Cada archivo de municipio tiene su equivalente agregado a nivel provincial.

### Promedios nacionales (`national_*.json`)

| Archivo | Descripción |
|---------|-------------|
| `national_basic.json` | Indicadores demográficos nacionales |
| `national_condicion_vida.json` | Condiciones de vida promedio nacional |
| `national_economia_empleo.json` | Economía y empleo nacional |
| `national_educacion_nivel.json` | Nivel educativo nacional |
| `national_educacion_oferta.json` | Oferta educativa nacional |
| `national_hogares.json` | Hogares promedio nacional |
| `national_salud_establecimientos.json` | Salud nacional |
| `national_tic.json` | Acceso TIC nacional |

### GeoJSON

| Archivo | Descripción |
|---------|-------------|
| `adm2.geojson` | Fronteras administrativas de municipios |
| `src/data/adm2.json` | GeoJSON bundled para el mapa interactivo |

## Deployment

- https://prodecare.net/dashboard/

## Licencia

MIT
