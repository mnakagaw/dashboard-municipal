
# Tu Municipio en Cifras - República Dominicana

Dashboard interactivo por municipio (158 municipios) con:

- Selector en dos pasos: provincia → municipio (incluye "Provincia de XXX").
- Indicadores básicos (población total, hombres, mujeres).
- Pirámide de población (municipio o provincia agregada).
- Distribución por sexo (gráfico de pastel).
- Mapa clicable (Leaflet + GeoJSON): al hacer clic en un municipio, se actualiza el selector.
- Exportación en PDF tipo "Diagnóstico municipal: Municipio", incluyendo:
  - Gráfico de pirámide.
  - Gráfico de sexo.
  - Mapa con el municipio resaltado.

## Instalación

```bash
npm install
npm run dev
```

Luego abra `http://localhost:5173` en su navegador.

## Datos

- `public/data/municipios_index.json`: listado de municipios con adm2_code, provincia, región.
- `public/data/adm2.geojson`: fronteras administrativas a nivel municipal, con los mismos adm2_code.
- `public/data/indicadores_basicos.json`: indicadores básicos por municipio (esta versión contiene ceros como marcador de posición; puede reemplazarse por datos reales).
- `public/data/pyramids.json`: pirámide de población por edad y sexo por municipio (actualmente vacío; se puede rellenar con los datos del Censo).



## Nueva sección: Economía y empleo

Este proyecto incluye ahora una sección de **Economía y empleo (DEE 2024 + Censo 2022)**:

- `public/data/economia_empleo.json`: plantilla de datos por municipio (adm2_code).
- Panel en React: componente `EconomyEmployment` dentro de `src/components/charts.jsx`.
- Exportación a PDF desde el navegador: `PdfExportPanel` captura el contenido de `#dashboard-pdf`.

### Generación de PDF por lotes (plantilla ReportLab)

En `scripts/generate_municipio_pdf.py` hay un script de ejemplo que genera un PDF
tipo “Diagnóstico municipal – Economía y empleo” a partir de:

- `public/data/indicadores_basicos.json`
- `public/data/economia_empleo.json`

Uso:

```bash
pip install reportlab
python scripts/generate_municipio_pdf.py public/data/indicadores_basicos.json public/data/economia_empleo.json 02001 salida.pdf
```
Trigger deploy
