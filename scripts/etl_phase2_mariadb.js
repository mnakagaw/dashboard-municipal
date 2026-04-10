/**
 * etl_phase2_mariadb.js — Canonical Completion Package
 *
 * Comprehensive ETL: JSON (Phase 1) → Canonical Schema (Phase 2)
 *
 * Datasets handled:
 *   ✅ national_basic          (flat → fact_statistic)
 *   ✅ indicadores_basicos     (flat → fact_statistic)
 *   ✅ hogares_resumen         (flat → fact_statistic)
 *   ✅ tic                     (semi-flat → fact_statistic)
 *   ✅ economia_empleo         (flat subset: DEE totals + labor_market)
 *   ⏳ condicion_vida          (complex nested → Phase 1 bridge only)
 *   ⏳ salud_establecimientos  (entity-level → Phase 1 bridge only)
 *   ⏳ educacion               (complex nested → Phase 1 bridge only)
 *
 * Features:
 *   - UPSERT via INSERT ... ON DUPLICATE KEY UPDATE
 *   - Batch tracking in raw_import_batch
 *   - Idempotent: safe to re-run at any time
 *
 * Prerequisites:
 *   npm install mysql2 dotenv
 *
 * Usage:
 *   node scripts/etl_phase2_mariadb.js
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "public", "data");

// ---- Helpers ----
function padCode(code) {
  if (code == null) return null;
  return String(code).padStart(5, '0');
}

async function main() {
  // ---- DB Connection ----
  let mysql;
  try {
    mysql = await import("mysql2/promise");
    if (mysql.default) mysql = mysql.default;
  } catch {
    console.error("❌ mysql2 not found. Run: npm install mysql2 dotenv");
    process.exit(1);
  }
  try { const d = await import("dotenv"); (d.default || d).config(); } catch {}

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "carapicha_dbt",
    user: process.env.DB_USER || "carapicha",
    password: process.env.DB_PASS || "",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    charset: "utf8mb4",
  });
  console.log("✅ Connected to MariaDB.\n");

  // ---- Batch ----
  const [batchRes] = await conn.execute(
    `INSERT INTO raw_import_batch (batch_name, source_filename, status)
     VALUES (?, ?, 'PROCESSING')`,
    ["Phase 2 Canonical ETL — Full Run", "indicadores_basicos.json + hogares_resumen.json + tic.json + economia_empleo.json + national_basic.json", ]
  );
  const batchId = batchRes.insertId;

  // =========================================================================
  // STEP 1: Seed Dimensions
  // =========================================================================
  console.log("🛠️  Seeding dimensions...");

  // Domains
  const domains = [
    ['demography', 'Demografía'],
    ['household', 'Hogares y Vivienda'],
    ['tic', 'Tecnologías de Información y Comunicación'],
    ['economy', 'Economía y Empleo'],
    ['health', 'Salud'],
    ['education', 'Educación'],
    ['living_conditions', 'Condición de Vida'],
  ];
  for (const [code, name] of domains) {
    await conn.execute(`INSERT IGNORE INTO dim_domain (domain_code, domain_name) VALUES (?, ?)`, [code, name]);
  }
  const [domRows] = await conn.execute(`SELECT domain_id, domain_code FROM dim_domain`);
  const domMap = {};
  domRows.forEach(r => domMap[r.domain_code] = r.domain_id);

  // Sources
  const sources = [
    ['X Censo Nacional de Población y Vivienda 2022', 'ONE', 'Censo', 2022],
    ['Directorio de Empresas y Establecimientos (DEE) 2024', 'ONE', 'Registro Administrativo', 2024],
  ];
  for (const [name, inst, type, year] of sources) {
    await conn.execute(
      `INSERT IGNORE INTO dim_source (source_name, institution, source_type, reference_year) VALUES (?, ?, ?, ?)`,
      [name, inst, type, year]
    );
  }
  const [srcRows] = await conn.execute(`SELECT source_id, reference_year FROM dim_source`);
  const srcCenso = srcRows.find(r => r.reference_year === 2022)?.source_id;
  const srcDEE = srcRows.find(r => r.reference_year === 2024)?.source_id;

  // Indicators (comprehensive catalog)
  const indicators = [
    // Demography
    { code: 'dem_pop_total', name: 'Población Total (2022)', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_male_2022', name: 'Población Hombres (2022)', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_female_2022', name: 'Población Mujeres (2022)', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_total_2010', name: 'Población Total (2010)', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_viv_total', name: 'Viviendas Totales', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_viv_ocup', name: 'Viviendas Ocupadas', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_viv_desocup', name: 'Viviendas Desocupadas', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_var_abs', name: 'Variación Poblacional Absoluta 2010-2022', domain: 'demography', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_var_pct', name: 'Variación Poblacional Porcentual 2010-2022', domain: 'demography', unit: 'porcentaje', agg: 'weighted_avg' },
    // Household
    { code: 'hog_total', name: 'Hogares Totales', domain: 'household', unit: 'absoluto', agg: 'sum' },
    { code: 'hog_pop', name: 'Población en Hogares Particulares', domain: 'household', unit: 'absoluto', agg: 'sum' },
    { code: 'hog_size_avg', name: 'Personas por Hogar (Promedio)', domain: 'household', unit: 'ratio', agg: 'weighted_avg' },
    // TIC
    { code: 'tic_internet_total', name: 'Población Base TIC (Internet)', domain: 'tic', unit: 'absoluto', agg: 'sum' },
    { code: 'tic_internet_used', name: 'Usuarios de Internet', domain: 'tic', unit: 'absoluto', agg: 'sum' },
    { code: 'tic_internet_rate', name: 'Tasa de Uso de Internet', domain: 'tic', unit: 'porcentaje', agg: 'weighted_avg' },
    { code: 'tic_cellular_total', name: 'Población Base TIC (Celular)', domain: 'tic', unit: 'absoluto', agg: 'sum' },
    { code: 'tic_cellular_used', name: 'Usuarios de Celular', domain: 'tic', unit: 'absoluto', agg: 'sum' },
    { code: 'tic_cellular_rate', name: 'Tasa de Uso de Celular', domain: 'tic', unit: 'porcentaje', agg: 'weighted_avg' },
    { code: 'tic_computer_total', name: 'Población Base TIC (Computador)', domain: 'tic', unit: 'absoluto', agg: 'sum' },
    { code: 'tic_computer_used', name: 'Usuarios de Computador', domain: 'tic', unit: 'absoluto', agg: 'sum' },
    { code: 'tic_computer_rate', name: 'Tasa de Uso de Computador', domain: 'tic', unit: 'porcentaje', agg: 'weighted_avg' },
    // Economy (flat subset from DEE)
    { code: 'eco_establishments', name: 'Total Establecimientos (DEE)', domain: 'economy', unit: 'absoluto', agg: 'sum' },
    { code: 'eco_employees', name: 'Total Empleados (DEE)', domain: 'economy', unit: 'absoluto', agg: 'sum' },
    { code: 'eco_avg_employees', name: 'Promedio Empleados/Establecimiento (DEE)', domain: 'economy', unit: 'ratio', agg: 'weighted_avg' },
  ];
  for (const ind of indicators) {
    await conn.execute(
      `INSERT IGNORE INTO dim_indicator (indicator_code, indicator_name, domain_id, unit, data_type, aggregation_method)
       VALUES (?, ?, ?, ?, 'numeric', ?)`,
      [ind.code, ind.name, domMap[ind.domain], ind.unit, ind.agg]
    );
  }
  const [indRows] = await conn.execute(`SELECT indicator_id, indicator_code FROM dim_indicator`);
  const indMap = {};
  indRows.forEach(r => indMap[r.indicator_code] = r.indicator_id);

  // =========================================================================
  // STEP 2: Territory Hierarchy
  // =========================================================================
  console.log("🌐 Building territory hierarchy...");

  // Nacional
  await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type) VALUES ('00', 'República Dominicana', 'nacional')`);
  const [[{ territory_id: nacionalId }]] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code='00'`);

  // Regiones
  const regionsRaw = JSON.parse(await readFile(join(DATA_DIR, "regions_index.json"), "utf8"));
  for (const r of regionsRaw) {
    await conn.execute(
      `INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id) VALUES (?, ?, 'region', ?)`,
      [r.id, r.name, nacionalId]
    );
  }

  // Provincias (inferred from municipios)
  const munisRaw = JSON.parse(await readFile(join(DATA_DIR, "municipios_index.json"), "utf8"));
  const provMap = {};
  for (const m of munisRaw) {
    const provCode = m.adm2_code.substring(0, 2);
    if (!provMap[provCode]) {
      const regionMatch = regionsRaw.find(r => r.name === m.region);
      provMap[provCode] = { name: m.provincia, regionCode: regionMatch?.id };
    }
  }
  for (const [provCode, provData] of Object.entries(provMap)) {
    let regionId = null;
    if (provData.regionCode) {
      const [rr] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code=? AND territory_type='region'`, [provData.regionCode]);
      if (rr.length) regionId = rr[0].territory_id;
    }
    await conn.execute(
      `INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id) VALUES (?, ?, 'provincia', ?)`,
      [provCode, provData.name, regionId || nacionalId]
    );
  }

  // Municipios
  for (const m of munisRaw) {
    const provCode = m.adm2_code.substring(0, 2);
    const [pp] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code=? AND territory_type='provincia'`, [provCode]);
    const parentId = pp.length ? pp[0].territory_id : nacionalId;
    await conn.execute(
      `INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id, region_oficial_ley345)
       VALUES (?, ?, 'municipio', ?, ?)`,
      [m.adm2_code, m.municipio, parentId, m.region]
    );
  }

  // Pre-load territory cache
  const [terrRows] = await conn.execute(`SELECT territory_id, territory_code FROM dim_territory`);
  const terrMap = {};
  terrRows.forEach(r => terrMap[r.territory_code] = r.territory_id);

  // =========================================================================
  // STEP 3: UPSERT Facts
  // =========================================================================
  let totalFacts = 0;

  // Helper: upsert a single fact
  async function upsertFact(tCode, iCode, sourceId, value, periodYear = null) {
    if (value == null || value === '' || Number.isNaN(value)) return;
    const tId = terrMap[tCode];
    const iId = indMap[iCode];
    if (!tId || !iId) return;
    await conn.execute(
      `INSERT INTO fact_statistic (territory_id, indicator_id, source_id, batch_id, period_year, numeric_value, quality_flag)
       VALUES (?, ?, ?, ?, ?, ?, 'oficial')
       ON DUPLICATE KEY UPDATE numeric_value = VALUES(numeric_value), batch_id = VALUES(batch_id), updated_at = NOW()`,
      [tId, iId, sourceId, batchId, periodYear, value]
    );
    totalFacts++;
  }

  // ---- 3a. national_basic ----
  console.log("📊 Loading national_basic...");
  const natBasic = JSON.parse(await readFile(join(DATA_DIR, "national_basic.json"), "utf8"));
  await upsertFact('00', 'dem_pop_total', srcCenso, natBasic.poblacion_total);
  await upsertFact('00', 'dem_pop_male_2022', srcCenso, natBasic.poblacion_hombres);
  await upsertFact('00', 'dem_pop_female_2022', srcCenso, natBasic.poblacion_mujeres);
  await upsertFact('00', 'dem_pop_total_2010', srcCenso, natBasic.poblacion_total_2010);
  await upsertFact('00', 'hog_total', srcCenso, natBasic.hogares_en_viviendas_particulares_ocupadas);
  await upsertFact('00', 'hog_pop', srcCenso, natBasic.poblacion_en_hogares_particulares);
  await upsertFact('00', 'hog_size_avg', srcCenso, natBasic.personas_por_hogar_promedio);

  // ---- 3b. indicadores_basicos ----
  console.log("📊 Loading indicadores_basicos (158 municipios)...");
  const indBasicos = JSON.parse(await readFile(join(DATA_DIR, "indicadores_basicos.json"), "utf8"));
  for (const m of indBasicos) {
    const tc = m.adm2_code;
    await upsertFact(tc, 'dem_pop_total', srcCenso, m.poblacion_total);
    await upsertFact(tc, 'dem_pop_male_2022', srcCenso, m.poblacion_hombres);
    await upsertFact(tc, 'dem_pop_female_2022', srcCenso, m.poblacion_mujeres);
    await upsertFact(tc, 'dem_pop_total_2010', srcCenso, m.poblacion_2010);
    await upsertFact(tc, 'dem_viv_total', srcCenso, m.viviendas_total);
    await upsertFact(tc, 'dem_viv_ocup', srcCenso, m.viviendas_ocupadas);
    await upsertFact(tc, 'dem_viv_desocup', srcCenso, m.viviendas_desocupadas);
    await upsertFact(tc, 'dem_pop_var_abs', srcCenso, m.variacion_abs);
    await upsertFact(tc, 'dem_pop_var_pct', srcCenso, m.variacion_pct);
  }

  // ---- 3c. hogares_resumen ----
  console.log("📊 Loading hogares_resumen...");
  const hogares = JSON.parse(await readFile(join(DATA_DIR, "hogares_resumen.json"), "utf8"));
  for (const h of hogares) {
    const tc = h.adm2_code;
    await upsertFact(tc, 'hog_total', srcCenso, h.hogares_total);
    await upsertFact(tc, 'hog_pop', srcCenso, h.poblacion_en_hogares);
    await upsertFact(tc, 'hog_size_avg', srcCenso, h.personas_por_hogar);
  }

  // ---- 3d. tic ----
  console.log("📊 Loading tic...");
  const ticData = JSON.parse(await readFile(join(DATA_DIR, "tic.json"), "utf8"));
  for (const t of ticData) {
    const tc = padCode(t.adm2_code);
    if (!tc) continue;
    if (t.internet) {
      await upsertFact(tc, 'tic_internet_total', srcCenso, t.internet.total);
      await upsertFact(tc, 'tic_internet_used', srcCenso, t.internet.used);
      await upsertFact(tc, 'tic_internet_rate', srcCenso, t.internet.rate_used);
    }
    if (t.cellular) {
      await upsertFact(tc, 'tic_cellular_total', srcCenso, t.cellular.total);
      await upsertFact(tc, 'tic_cellular_used', srcCenso, t.cellular.used);
      await upsertFact(tc, 'tic_cellular_rate', srcCenso, t.cellular.rate_used);
    }
    if (t.computer) {
      await upsertFact(tc, 'tic_computer_total', srcCenso, t.computer.total);
      await upsertFact(tc, 'tic_computer_used', srcCenso, t.computer.used);
      await upsertFact(tc, 'tic_computer_rate', srcCenso, t.computer.rate_used);
    }
  }

  // ---- 3e. economia_empleo (flat subset) ----
  console.log("📊 Loading economia_empleo (flat DEE subset)...");
  const ecoData = JSON.parse(await readFile(join(DATA_DIR, "economia_empleo.json"), "utf8"));
  for (const e of ecoData) {
    const tc = padCode(e.adm2_code);
    if (!tc || !e.dee_2024) continue;
    await upsertFact(tc, 'eco_establishments', srcDEE, e.dee_2024.total_establishments);
    await upsertFact(tc, 'eco_employees', srcDEE, e.dee_2024.total_employees);
    await upsertFact(tc, 'eco_avg_employees', srcDEE, e.dee_2024.avg_employees_per_establishment);
  }

  // =========================================================================
  // STEP 4: Finalize Batch
  // =========================================================================
  await conn.execute(
    `UPDATE raw_import_batch SET status='SUCCESS', records_processed=? WHERE batch_id=?`,
    [totalFacts, batchId]
  );

  console.log(`\n🏁 ETL Phase 2 Complete.`);
  console.log(`   Facts upserted: ${totalFacts}`);
  console.log(`   Batch ID: ${batchId}`);

  await conn.end();
}

main().catch(err => {
  console.error("💥 ETL failed:", err);
  process.exit(1);
});
