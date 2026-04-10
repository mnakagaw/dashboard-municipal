# Plan de Migración: Phase 1 → Phase 2

## Definiciones

- **Phase 1**: SQL-backed JSON Asset Store (`dataset_assets` con `json_content`)
- **Phase 2**: Canonical Statistical Data Layer (esquema en estrella: `dim_*` + `fact_statistic`)
- **Ideal Target**: Original Source → Canonical → Delivery Views / APIs
- **`dataset_assets`**: No es objeto de deprecación. Es la capa de entrega (*delivery artifact / bridge / cache*) que el frontend consume. Se regenera desde el canonical.

---

## Estado de Implementación

### Completado ✅

| Paso | Descripción | Script |
|------|-------------|--------|
| DDL MariaDB | Tablas canónicas con `UNIQUE` constraint | `create_canonical_tables.sql` |
| DDL SQL Server | Versión T-SQL con `IDENTITY`, `NVARCHAR`, `DATETIME2` | `create_canonical_tables_sqlserver.sql` |
| Dimensiones seed | 7 dominios, 24 indicadores, 2 fuentes | `etl_phase2_mariadb.js` |
| Jerarquía territorial | 1 nacional + 10 regiones + 32 provincias + 158 municipios | `etl_phase2_mariadb.js` |
| ETL: `national_basic` | 7 hechos nacionales | `etl_phase2_mariadb.js` |
| ETL: `indicadores_basicos` | ~1,422 hechos (158 × 9 indicadores) | `etl_phase2_mariadb.js` |
| ETL: `hogares_resumen` | ~474 hechos (158 × 3) | `etl_phase2_mariadb.js` |
| ETL: `tic` | ~1,422 hechos (158 × 9) | `etl_phase2_mariadb.js` |
| ETL: `economia_empleo` (flat) | ~474 hechos (158 × 3) | `etl_phase2_mariadb.js` |
| UPSERT safety | `ON DUPLICATE KEY UPDATE` en MariaDB | `etl_phase2_mariadb.js` |
| Batch tracking | `raw_import_batch` con estado y conteos | `etl_phase2_mariadb.js` |
| QA | 7 categorías de verificación automatizada | `qa_canonical.js` |
| Delivery regen | `national_basic`, `indicadores_basicos`, `hogares_resumen` | `regenerate_delivery.js` |

### Pendiente ⏳ (Fase 2b / Futuro)

| Paso | Descripción | Razón de posponer |
|------|-------------|-------------------|
| `condicion_vida` canonical | ~50 categorías por municipio, fuertemente anidado | Requiere `dim_breakdown_type` |
| `salud_establecimientos` | Datos a nivel de entidad, no indicadores | Requiere tabla `facility` separada |
| `educacion*` | Nivel de instrucción × rango etario | Requiere `dim_education_slice` |
| `economia_empleo` (sectors) | Distribución CIIU por municipio | Requiere `dim_ciiu_section` |
| `pyramids` | Pirámides: decil × sexo | Requiere `dim_demographic_slice` |
| Delivery regen: TIC | Regenerar `tic.json` desde canonical | Factible, se pospone por complejidad de formato |
| Delivery regen: economía | Regenerar `economia_empleo.json` | Requiere recombinar flat + breakdown |

---

## Orden de Ejecución

Para un despliegue limpio en una instancia nueva:

```bash
# 1. Crear tablas canónicas
mysql -u USER -p DB < scripts/create_canonical_tables.sql

# 2. Ejecutar ETL (seed dimensions + load facts)
node scripts/etl_phase2_mariadb.js

# 3. Verificar integridad
node scripts/qa_canonical.js

# 4. Regenerar delivery artifacts
node scripts/regenerate_delivery.js
```

---

## SQL Server: UPSERT Equivalente

MariaDB usa `INSERT ... ON DUPLICATE KEY UPDATE`. En SQL Server, el equivalente es `MERGE`:

```sql
MERGE INTO fact_statistic AS target
USING (VALUES (@territory_id, @indicator_id, @source_id, @period_year, @numeric_value))
  AS source (territory_id, indicator_id, source_id, period_year, numeric_value)
ON target.territory_id = source.territory_id
   AND target.indicator_id = source.indicator_id
   AND target.source_id = source.source_id
   AND ISNULL(target.period_year, 0) = ISNULL(source.period_year, 0)
WHEN MATCHED THEN
  UPDATE SET numeric_value = source.numeric_value, updated_at = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (territory_id, indicator_id, source_id, period_year, numeric_value, quality_flag)
  VALUES (source.territory_id, source.indicator_id, source.source_id, source.period_year, source.numeric_value, 'oficial');
```

---

## Delivery Regeneration: SQL Server `FOR JSON PATH`

En producción SQL Server, la regeneración de JSON para `indicadores_basicos` sería:

```sql
UPDATE dataset_assets
SET json_content = (
  SELECT t.territory_code AS adm2_code,
         t.territory_name AS municipio,
         p.territory_name AS provincia,
         t.region_oficial_ley345 AS region,
         MAX(CASE WHEN i.indicator_code='dem_pop_total' THEN f.numeric_value END) AS poblacion_total,
         MAX(CASE WHEN i.indicator_code='dem_pop_male_2022' THEN f.numeric_value END) AS poblacion_hombres,
         MAX(CASE WHEN i.indicator_code='dem_pop_female_2022' THEN f.numeric_value END) AS poblacion_mujeres,
         MAX(CASE WHEN i.indicator_code='dem_viv_total' THEN f.numeric_value END) AS viviendas_total,
         MAX(CASE WHEN i.indicator_code='dem_viv_ocup' THEN f.numeric_value END) AS viviendas_ocupadas,
         MAX(CASE WHEN i.indicator_code='dem_viv_desocup' THEN f.numeric_value END) AS viviendas_desocupadas,
         MAX(CASE WHEN i.indicator_code='dem_pop_total_2010' THEN f.numeric_value END) AS poblacion_2010,
         MAX(CASE WHEN i.indicator_code='dem_pop_var_abs' THEN f.numeric_value END) AS variacion_abs,
         MAX(CASE WHEN i.indicator_code='dem_pop_var_pct' THEN f.numeric_value END) AS variacion_pct
  FROM fact_statistic f
  JOIN dim_territory t ON f.territory_id = t.territory_id
  JOIN dim_territory p ON t.parent_territory_id = p.territory_id
  JOIN dim_indicator i ON f.indicator_id = i.indicator_id
  WHERE t.territory_type = 'municipio'
    AND i.indicator_code LIKE 'dem_%'
  GROUP BY t.territory_code, t.territory_name, p.territory_name, t.region_oficial_ley345
  FOR JSON PATH
),
version_no = version_no + 1,
updated_at = GETDATE()
WHERE asset_key = 'indicadores_basicos';
```

Este patrón es replicable para cualquier activo flat.
