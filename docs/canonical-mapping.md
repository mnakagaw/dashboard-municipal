# Mapeo de Atributos: JSON (Fase 1) → Canonical Schema (Fase 2)

Este documento define cómo cada campo de los archivos JSON estáticos se traduce al modelo dimensional canónico.

---

## Leyenda

| Columna | Significado |
|---------|-------------|
| **JSON Field** | Nombre del atributo en el archivo JSON original |
| **indicator_code** | Código asignado en `dim_indicator` |
| **Aggregation** | Método para roll-up geográfico (`sum`, `weighted_avg`) |
| **Status** | ✅ Implementado / ⏳ Pendiente (breakdown) |

---

## 1. `national_basic` → Dominio: `demography` + `household`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `poblacion_total` | `dem_pop_total` | sum | ✅ |
| `poblacion_hombres` | `dem_pop_male_2022` | sum | ✅ |
| `poblacion_mujeres` | `dem_pop_female_2022` | sum | ✅ |
| `poblacion_total_2010` | `dem_pop_total_2010` | sum | ✅ |
| `hogares_en_viviendas_particulares_ocupadas` | `hog_total` | sum | ✅ |
| `poblacion_en_hogares_particulares` | `hog_pop` | sum | ✅ |
| `personas_por_hogar_promedio` | `hog_size_avg` | weighted_avg | ✅ |

**Delivery regeneration**: ✅ `regenerate_delivery.js`

---

## 2. `indicadores_basicos` → Dominio: `demography`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `poblacion_total` | `dem_pop_total` | sum | ✅ |
| `poblacion_hombres` | `dem_pop_male_2022` | sum | ✅ |
| `poblacion_mujeres` | `dem_pop_female_2022` | sum | ✅ |
| `poblacion_2010` | `dem_pop_total_2010` | sum | ✅ |
| `viviendas_total` | `dem_viv_total` | sum | ✅ |
| `viviendas_ocupadas` | `dem_viv_ocup` | sum | ✅ |
| `viviendas_desocupadas` | `dem_viv_desocup` | sum | ✅ |
| `variacion_abs` | `dem_pop_var_abs` | sum | ✅ |
| `variacion_pct` | `dem_pop_var_pct` | weighted_avg | ✅ |

**Delivery regeneration**: ✅ `regenerate_delivery.js`

---

## 3. `hogares_resumen` → Dominio: `household`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `hogares_total` | `hog_total` | sum | ✅ |
| `poblacion_en_hogares` | `hog_pop` | sum | ✅ |
| `personas_por_hogar` | `hog_size_avg` | weighted_avg | ✅ |

**Delivery regeneration**: ✅ `regenerate_delivery.js`

---

## 4. `tic` → Dominio: `tic`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `internet.total` | `tic_internet_total` | sum | ✅ |
| `internet.used` | `tic_internet_used` | sum | ✅ |
| `internet.rate_used` | `tic_internet_rate` | weighted_avg | ✅ |
| `cellular.total` | `tic_cellular_total` | sum | ✅ |
| `cellular.used` | `tic_cellular_used` | sum | ✅ |
| `cellular.rate_used` | `tic_cellular_rate` | weighted_avg | ✅ |
| `computer.total` | `tic_computer_total` | sum | ✅ |
| `computer.used` | `tic_computer_used` | sum | ✅ |
| `computer.rate_used` | `tic_computer_rate` | weighted_avg | ✅ |

**Nota**: El campo `adm2_code` en `tic.json` es numérico (ej. `32001`), no string con padding. El ETL aplica `padCode()` para normalizar a 5 dígitos.

**Delivery regeneration**: ⏳ Planificada

---

## 5. `economia_empleo` → Dominio: `economy`

### Subset Plano (Implementado ✅)

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `dee_2024.total_establishments` | `eco_establishments` | sum | ✅ |
| `dee_2024.total_employees` | `eco_employees` | sum | ✅ |
| `dee_2024.avg_employees_per_establishment` | `eco_avg_employees` | weighted_avg | ✅ |

### Breakdown (Pendiente ⏳ — requiere dim_breakdown_type)

| JSON Structure | Descripción | Fase |
|----------------|-------------|------|
| `dee_2024.employment_size_bands[]` | Distribución por tamaño: micro, pequeña, mediana, grande | 2b |
| `dee_2024.sectors[]` | Distribución sectorial CIIU con LQ | 2b |
| `dee_2024.top_specialization` | Derivable de sectores | 2b |
| `labor_market_2022.*` | PET, PEA, tasas — Mayormente NULL en datos actuales | 2b |

**Delivery regeneration**: ⏳ Pendiente (se mantiene en dataset_assets)

---

## 6. `condicion_vida` → Dominio: `living_conditions`

### Estructura

Cada municipio contiene `servicios` con 7 sub-categorías, cada una con `categorias` detalladas:
- `cocina_vivienda` (urbana/rural)
- `servicios_sanitarios` (inodoro/letrina/no_tiene)
- `agua_uso_domestico` (11 categorías)
- `agua_para_beber` (12 categorías)
- `combustible_cocinar` (7 categorías)
- `alumbrado` (7 categorías)
- `eliminacion_basura` (7 categorías)

### Estrategia

Este dataset es **fuertemente anidado** con ~50 categorías por municipio. Requiere `dim_breakdown_type` para canonical. Se mantiene en `dataset_assets` (Fase 1).

**Posibilidad futura**: Extraer porcentajes sintéticos (ej. `% inodoro`, `% red pública de agua`) como indicadores planos en `fact_statistic`, manteniendo las distribuciones completas en la fase de breakdown.

---

## 7. `salud_establecimientos` → Dominio: `health`

### Estructura

Diccionario `{adm2_code: {centros: [{nombre, tipo_centro, regional_salud, latitud, longitud, ...}]}}`. Datos a nivel de entidad individual, no indicadores estadísticos agregados.

### Estrategia

Este es un **dataset de entidades**, no de indicadores. No entra en `fact_statistic`. Futuras opciones:
- Contar centros por tipo como indicador plano: `salud_centros_primer_nivel`, `salud_hospitales`.
- Crear tabla separada `facility` si se requiere georreferenciación.
- Mantener en `dataset_assets` para consumo directo del mapa interactivo.

---

## 8. `educacion` / `educacion_nivel` → Dominio: `education`

### Estructura

Distribución poblacional por rango etario × nivel educativo alcanzado. Estructura similar a pirámides con múltiples ejes.

### Estrategia

Requiere `dim_education_slice (age_range, attainment_level)`. Se mantiene en `dataset_assets` hasta implementación de Fase 2b.

**Inventory**:
- `educacion.json` — Matrícula y oferta educativa por municipio
- `educacion_nivel.json` — Nivel de instrucción por rangos de edad
- `educacion_oferta_municipal.json` — Centros educativos por tipo

---

## Resumen de Estado

| Dataset | Tipo | ETL | Delivery Regen | Fase |
|---------|------|-----|---------------|------|
| `national_basic` | flat | ✅ | ✅ | 2 |
| `indicadores_basicos` | flat | ✅ | ✅ | 2 |
| `hogares_resumen` | flat | ✅ | ✅ | 2 |
| `tic` | semi-flat | ✅ | ⏳ | 2 |
| `economia_empleo` (flat) | semi-flat | ✅ | ⏳ | 2 |
| `condicion_vida` | nested | ⏳ | — | 1 (bridge) |
| `salud_establecimientos` | entity | ⏳ | — | 1 (bridge) |
| `educacion*` | nested | ⏳ | — | 1 (bridge) |
| `economia_empleo` (sectors) | nested | ⏳ | — | 1 (bridge) |
| `pyramids` | nested | ⏳ | — | 1 (bridge) |
