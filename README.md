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

## Estructura

```
├── src/
│   ├── components/    # Componentes React
│   ├── data/          # Datos JSON
│   └── *.jsx, *.css   # Archivos principales
├── public/
│   └── data/          # Datos JSON públicos
└── scripts/           # Utilidades de build
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
