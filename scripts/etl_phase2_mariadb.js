/**
 * etl_phase2_mariadb.js — Canonical Completion Package
 *
 * Comprehensive ETL: JSON (Phase 1) → Canonical Schema (Phase 2)
 *
 * Datasets handled:
 *   ✅ national_basic
 *   ✅ indicadores_basicos
 *   ✅ hogares_resumen
 *   ✅ tic
 *   ✅ economia_empleo (flat + breakdown)
 *   ✅ condicion_vida (breakdown)
 *   ✅ pyramids (breakdown)
 *   ✅ educacion (breakdown)
 *   ✅ educacion_nivel (breakdown)
 *   ✅ salud_establecimientos (entity)
 *
 * Features:
 *   - UPSERT via INSERT ... ON DUPLICATE KEY UPDATE
 *   - Batch tracking in raw_import_batch
 *   - Breakdown dimension dynamic insertion
 *   - Entity dimension dynamic insertion
 *   - Idempotent: safe to re-run at any time
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "public", "data");

function padCode(code) {
  if (code == null) return null;
  return String(code).padStart(5, '0');
}

// Convert snake_case or slug to Title Case
function formatLabel(str) {
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function main() {
  let mysql;
  try {
    mysql = await import("mysql2/promise");
    if (mysql.default) mysql = mysql.default;
  } catch {
    console.error("❌ mysql2 not found.");
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

  const [batchRes] = await conn.execute(
    `INSERT INTO raw_import_batch (batch_name, source_filename, status) VALUES (?, ?, 'PROCESSING')`,
    ["Phase 2 Canonical ETL — Full Run", "All Major Datasets"]
  );
  const batchId = batchRes.insertId;

  // =========================================================================
  // STEP 1: Dimensions (Domains, Sources, Indicators)
  // =========================================================================
  console.log("🛠️  Seeding Domains, Sources and Indicators...");
  const domains = [
    ['demography', 'Demografía'], ['household', 'Hogares y Vivienda'], 
    ['tic', 'TIC'], ['economy', 'Economía y Empleo'], 
    ['health', 'Salud'], ['education', 'Educación'], 
    ['living_conditions', 'Condición de Vida']
  ];
  for (const [c, n] of domains) await conn.execute(`INSERT IGNORE INTO dim_domain (domain_code, domain_name) VALUES (?, ?)`, [c, n]);
  const [domRows] = await conn.execute(`SELECT domain_id, domain_code FROM dim_domain`);
  const domMap = Object.fromEntries(domRows.map(r => [r.domain_code, r.domain_id]));

  const sources = [
    ['X Censo Nacional de Población y Vivienda 2022', 'ONE', 'Censo', 2022],
    ['Directorio de Empresas y Establecimientos (DEE) 2024', 'ONE', 'Registro Administrativo', 2024],
    ['Ministerio de Educación (MINERD)', 'MINERD', 'Registro Administrativo', 2022],
    ['Servicio Nacional de Salud (SNS)', 'SNS', 'Registro Administrativo', 2022],
  ];
  for (const [n, i, t, y] of sources) await conn.execute(`INSERT IGNORE INTO dim_source (source_name, institution, source_type, reference_year) VALUES (?, ?, ?, ?)`, [n, i, t, y]);
  const [srcRows] = await conn.execute(`SELECT source_id, reference_year, institution FROM dim_source`);
  const srcCenso = srcRows.find(r => r.institution === 'ONE' && r.reference_year === 2022)?.source_id;
  const srcDEE = srcRows.find(r => r.institution === 'ONE' && r.reference_year === 2024)?.source_id;
  const srcMinerd = srcRows.find(r => r.institution === 'MINERD')?.source_id;
  const srcSNS = srcRows.find(r => r.institution === 'SNS')?.source_id;

  const indicators = [
    { code: 'dem_pop_total', name: 'Población Total (2022)', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_male_2022', name: 'Población Hombres (2022)', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_female_2022', name: 'Población Mujeres (2022)', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_total_2010', name: 'Población Total (2010)', domain: 'demography', agg: 'sum' },
    { code: 'dem_viv_total', name: 'Viviendas Totales', domain: 'demography', agg: 'sum' },
    { code: 'dem_viv_ocup', name: 'Viviendas Ocupadas', domain: 'demography', agg: 'sum' },
    { code: 'dem_viv_desocup', name: 'Viviendas Desocupadas', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_var_abs', name: 'Variación Poblacional Absoluta 2010-2022', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_var_pct', name: 'Variación Poblacional Porcentual 2010-2022', domain: 'demography', agg: 'weighted_avg' },
    { code: 'hog_total', name: 'Hogares Totales', domain: 'household', agg: 'sum' },
    { code: 'hog_pop', name: 'Población en Hogares Particulares', domain: 'household', agg: 'sum' },
    { code: 'hog_size_avg', name: 'Personas por Hogar (Promedio)', domain: 'household', agg: 'weighted_avg' },
    { code: 'tic_internet_total', name: 'Pob. Base TIC (Internet)', domain: 'tic', agg: 'sum' },
    { code: 'tic_internet_used', name: 'Usuarios Internet', domain: 'tic', agg: 'sum' },
    { code: 'tic_internet_rate', name: 'Tasa Internet', domain: 'tic', agg: 'weighted_avg' },
    { code: 'tic_cellular_total', name: 'Pob. Base TIC (Celular)', domain: 'tic', agg: 'sum' },
    { code: 'tic_cellular_used', name: 'Usuarios Celular', domain: 'tic', agg: 'sum' },
    { code: 'tic_cellular_rate', name: 'Tasa Celular', domain: 'tic', agg: 'weighted_avg' },
    { code: 'tic_computer_total', name: 'Pob. Base TIC (Comp)', domain: 'tic', agg: 'sum' },
    { code: 'tic_computer_used', name: 'Usuarios Comp', domain: 'tic', agg: 'sum' },
    { code: 'tic_computer_rate', name: 'Tasa Comp', domain: 'tic', agg: 'weighted_avg' },
    { code: 'eco_establishments', name: 'Total Establecimientos', domain: 'economy', agg: 'sum' },
    { code: 'eco_employees', name: 'Total Empleados', domain: 'economy', agg: 'sum' },
    { code: 'eco_avg_employees', name: 'Promedio Emp/Est', domain: 'economy', agg: 'weighted_avg' },
    // NUEVOS INDICADORES BREAKDOWN
    { code: 'cv_cocina_vivienda', name: 'Cocina de Vivienda', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_servicios_sanitarios', name: 'Servicios Sanitarios', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_agua_uso_domestico', name: 'Agua de Uso Doméstico', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_agua_para_beber', name: 'Agua para Beber', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_combustible_cocinar', name: 'Combustible para Cocinar', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_alumbrado', name: 'Alumbrado', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_eliminacion_basura', name: 'Eliminación de Basura', domain: 'living_conditions', agg: 'sum' },
    { code: 'dem_pyramid', name: 'Pirámide Poblacional', domain: 'demography', agg: 'sum' },
    { code: 'edu_efficiency_dropout', name: 'Educación - Abandono', domain: 'education', agg: 'weighted_avg' },
    { code: 'edu_efficiency_promotion', name: 'Educación - Promoción', domain: 'education', agg: 'weighted_avg' },
    { code: 'edu_efficiency_reprobation', name: 'Educación - Reprobación', domain: 'education', agg: 'weighted_avg' },
    { code: 'edu_pop_level', name: 'Población por Nivel Educativo', domain: 'education', agg: 'sum' }
  ];
  for (const ind of indicators) {
    await conn.execute(`INSERT IGNORE INTO dim_indicator (indicator_code, indicator_name, domain_id, aggregation_method) VALUES (?, ?, ?, ?)`, 
      [ind.code, ind.name, domMap[ind.domain], ind.agg]);
  }
  const [indRows] = await conn.execute(`SELECT indicator_id, indicator_code FROM dim_indicator`);
  const indMap = Object.fromEntries(indRows.map(r => [r.indicator_code, r.indicator_id]));

  // =========================================================================
  // STEP 2: Territory Hierarchy
  // =========================================================================
  console.log("🌐 Building territory hierarchy...");
  await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type) VALUES ('00', 'República Dominicana', 'nacional')`);
  const [[{ territory_id: nacionalId }]] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code='00'`);
  
  const regionsRaw = JSON.parse(await readFile(join(DATA_DIR, "regions_index.json"), "utf8"));
  for (const r of regionsRaw) await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id) VALUES (?, ?, 'region', ?)`, [r.id, r.name, nacionalId]);

  const munisRaw = JSON.parse(await readFile(join(DATA_DIR, "municipios_index.json"), "utf8"));
  const provMap = {};
  for (const m of munisRaw) {
    const provCode = m.adm2_code.substring(0, 2);
    if (!provMap[provCode]) provMap[provCode] = { name: m.provincia, regionCode: regionsRaw.find(r => r.name === m.region)?.id };
  }
  for (const [pCode, pData] of Object.entries(provMap)) {
    let regionId = null;
    if (pData.regionCode) {
      const [rr] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code=? AND territory_type='region'`, [pData.regionCode]);
      if (rr.length) regionId = rr[0].territory_id;
    }
    await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id) VALUES (?, ?, 'provincia', ?)`, [pCode, pData.name, regionId || nacionalId]);
  }
  for (const m of munisRaw) {
    const provCode = m.adm2_code.substring(0, 2);
    const [pp] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code=? AND territory_type='provincia'`, [provCode]);
    await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id, region_oficial_ley345) VALUES (?, ?, 'municipio', ?, ?)`, [m.adm2_code, m.municipio, pp.length ? pp[0].territory_id : nacionalId, m.region]);
  }
  const [terrRows] = await conn.execute(`SELECT territory_id, territory_code FROM dim_territory`);
  const terrMap = Object.fromEntries(terrRows.map(r => [r.territory_code, r.territory_id]));

  // =========================================================================
  // STEP 3: Breakdown Manager
  // =========================================================================
  console.log("🔖 Initializing Breakdown Manager...");
  const breakMap = {};
  async function getBreakdownId(category, code, label) {
    if(!category || !code) return null;
    const key = `${category}:${code}`;
    if (breakMap[key]) return breakMap[key];
    await conn.execute(`INSERT IGNORE INTO dim_breakdown (category, code, label) VALUES (?, ?, ?)`, [category, code, label]);
    const [[row]] = await conn.execute(`SELECT breakdown_id FROM dim_breakdown WHERE category=? AND code=?`, [category, code]);
    breakMap[key] = row.breakdown_id;
    return breakMap[key];
  }

  let totalFacts = 0;
  async function upsertFact(tCode, iCode, sourceId, value, periodYear = 0, breakdownId = -1) {
    if (value == null || value === '' || Number.isNaN(value)) return;
    const pYear = periodYear || 0;
    const tId = terrMap[tCode];
    const iId = indMap[iCode];
    if (!tId || !iId) return;
    await conn.execute(
      `INSERT INTO fact_statistic (territory_id, indicator_id, source_id, batch_id, period_year, breakdown_id, numeric_value, quality_flag)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'oficial')
       ON DUPLICATE KEY UPDATE numeric_value = VALUES(numeric_value), batch_id = VALUES(batch_id), updated_at = NOW()`,
      [tId, iId, sourceId, batchId, pYear, breakdownId, value]
    );
    totalFacts++;
  }

  // =========================================================================
  // STEP 4: UPSERT Facts (FLAT)
  // =========================================================================
  console.log("📊 Loading flat datasets (national, basicos, hogares, tic)...");
  
  const natBasic = JSON.parse(await readFile(join(DATA_DIR, "national_basic.json"), "utf8"));
  await upsertFact('00', 'dem_pop_total', srcCenso, natBasic.poblacion_total);
  await upsertFact('00', 'dem_pop_male_2022', srcCenso, natBasic.poblacion_hombres);
  await upsertFact('00', 'dem_pop_female_2022', srcCenso, natBasic.poblacion_mujeres);
  await upsertFact('00', 'dem_pop_total_2010', srcCenso, natBasic.poblacion_total_2010);
  await upsertFact('00', 'hog_total', srcCenso, natBasic.hogares_en_viviendas_particulares_ocupadas);
  await upsertFact('00', 'hog_pop', srcCenso, natBasic.poblacion_en_hogares_particulares);
  await upsertFact('00', 'hog_size_avg', srcCenso, natBasic.personas_por_hogar_promedio);

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

  const hogares = JSON.parse(await readFile(join(DATA_DIR, "hogares_resumen.json"), "utf8"));
  for (const h of hogares) {
    await upsertFact(h.adm2_code, 'hog_total', srcCenso, h.hogares_total);
    await upsertFact(h.adm2_code, 'hog_pop', srcCenso, h.poblacion_en_hogares);
    await upsertFact(h.adm2_code, 'hog_size_avg', srcCenso, h.personas_por_hogar);
  }

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

  // =========================================================================
  // STEP 5: UPSERT Facts (BREAKDOWNS)
  // =========================================================================

  // ---- 5a. condicion_vida ----
  console.log("🧩 Loading condicion_vida (Breakdowns)...");
  const cvData = JSON.parse(await readFile(join(DATA_DIR, "condicion_vida.json"), "utf8"));
  for (const doc of cvData) {
    const tc = padCode(doc.adm2_code);
    if (!tc || !doc.servicios) continue;
    // Map service keys to indicator codes
    const srvMap = {
      cocina_vivienda: 'cv_cocina_vivienda', servicios_sanitarios: 'cv_servicios_sanitarios',
      agua_uso_domestico: 'cv_agua_uso_domestico', agua_para_beber: 'cv_agua_para_beber',
      combustible_cocinar: 'cv_combustible_cocinar', alumbrado: 'cv_alumbrado', eliminacion_basura: 'cv_eliminacion_basura'
    };
    for (const [srvKey, srvData] of Object.entries(doc.servicios)) {
      const ind = srvMap[srvKey];
      if (!ind) continue;
      // Flat total
      await upsertFact(tc, ind, srcCenso, srvData.total);
      // Breakdowns
      for (const [catName, catVal] of Object.entries(srvData.categorias || {})) {
        const bId = await getBreakdownId(`cv_${srvKey}`, catName, formatLabel(catName));
        await upsertFact(tc, ind, srcCenso, catVal, null, bId);
      }
    }
  }

  // ---- 5b. pyramids (dem_pyramid) ----
  console.log("🧩 Loading pyramids (Breakdowns)...");
  const pyData = JSON.parse(await readFile(join(DATA_DIR, "pyramids.json"), "utf8"));
  for (const [tcRaw, data] of Object.entries(pyData)) {
    const tc = padCode(tcRaw);
    if (!tc || !data.age_groups) continue;
    for (const row of data.age_groups) {
      if (!row.age_group) continue;
      const ageCode = String(row.age_group).replace(/\s+/g, '_');
      const bMaleId = await getBreakdownId('pyramid_sex_age', `male_${ageCode}`, `Hombre ${row.age_group}`);
      const bFemaleId = await getBreakdownId('pyramid_sex_age', `female_${ageCode}`, `Mujer ${row.age_group}`);
      await upsertFact(tc, 'dem_pyramid', srcCenso, row.male, null, bMaleId);
      await upsertFact(tc, 'dem_pyramid', srcCenso, row.female, null, bFemaleId);
    }
  }

  // ---- 5c. economia_empleo (Sectors & Sizes) ----
  console.log("🧩 Loading economia_empleo (Flat totals + Breakdowns)...");
  const ecoData = JSON.parse(await readFile(join(DATA_DIR, "economia_empleo.json"), "utf8"));
  for (const e of ecoData) {
    const tc = padCode(e.adm2_code);
    if (!tc || !e.dee_2024) continue;
    // Flat
    await upsertFact(tc, 'eco_establishments', srcDEE, e.dee_2024.total_establishments);
    await upsertFact(tc, 'eco_employees', srcDEE, e.dee_2024.total_employees);
    await upsertFact(tc, 'eco_avg_employees', srcDEE, e.dee_2024.avg_employees_per_establishment);
    // Breakdowns: Size Bands
    if (e.dee_2024.employment_size_bands) {
      for (const sb of e.dee_2024.employment_size_bands) {
        const bId = await getBreakdownId('eco_size_band', sb.size_band, sb.label);
        await upsertFact(tc, 'eco_establishments', srcDEE, sb.establishments, null, bId);
        await upsertFact(tc, 'eco_employees', srcDEE, sb.employees, null, bId);
      }
    }
    // Breakdowns: Sectors
    if (e.dee_2024.sectors) {
      for (const sc of e.dee_2024.sectors) {
        const bId = await getBreakdownId('eco_ciiu_section', sc.ciiu_section, sc.label);
        await upsertFact(tc, 'eco_establishments', srcDEE, sc.establishments, null, bId);
        await upsertFact(tc, 'eco_employees', srcDEE, sc.employees, null, bId);
      }
    }
  }

  // ---- 5d. educacion (Anuario Efficiency) ----
  console.log("🧩 Loading educacion (Breakdowns)...");
  const eduData = JSON.parse(await readFile(join(DATA_DIR, "educacion.json"), "utf8"));
  for (const ed of eduData) {
    const tc = padCode(ed.adm2_code);
    if (!tc || !ed.anuario || !ed.anuario.eficiencia) continue;
    for (const [level, mats] of Object.entries(ed.anuario.eficiencia)) {
      const bId = await getBreakdownId('edu_level', level, formatLabel(level));
      await upsertFact(tc, 'edu_efficiency_dropout', srcMinerd, mats.abandono, null, bId);
      await upsertFact(tc, 'edu_efficiency_promotion', srcMinerd, mats.promocion, null, bId);
      await upsertFact(tc, 'edu_efficiency_reprobation', srcMinerd, mats.reprobacion, null, bId);
    }
  }

  // ---- 5e. educacion_nivel (Population by Level/Zone/Sex) ----
  console.log("🧩 Loading educacion_nivel (Breakdowns)...");
  const eduNivData = JSON.parse(await readFile(join(DATA_DIR, "educacion_nivel.json"), "utf8"));
  for (const en of eduNivData) {
    const tc = padCode(en.adm2_code);
    if (!tc || !en.nivel) continue;
    for (const [level, vals] of Object.entries(en.nivel)) {
      const bIdTot = await getBreakdownId('edu_pop_level_zone_sex', `${level}_total`, `${formatLabel(level)} Total`);
      const bIdH = await getBreakdownId('edu_pop_level_zone_sex', `${level}_h`, `${formatLabel(level)} Hombres`);
      const bIdM = await getBreakdownId('edu_pop_level_zone_sex', `${level}_m`, `${formatLabel(level)} Mujeres`);
      const bIdUrbT = await getBreakdownId('edu_pop_level_zone_sex', `${level}_urbano_total`, `${formatLabel(level)} Urbano Total`);
      const bIdUrbH = await getBreakdownId('edu_pop_level_zone_sex', `${level}_urbano_h`, `${formatLabel(level)} Urbano Hombres`);
      const bIdUrbM = await getBreakdownId('edu_pop_level_zone_sex', `${level}_urbano_m`, `${formatLabel(level)} Urbano Mujeres`);
      const bIdRurT = await getBreakdownId('edu_pop_level_zone_sex', `${level}_rural_total`, `${formatLabel(level)} Rural Total`);
      const bIdRurH = await getBreakdownId('edu_pop_level_zone_sex', `${level}_rural_h`, `${formatLabel(level)} Rural Hombres`);
      const bIdRurM = await getBreakdownId('edu_pop_level_zone_sex', `${level}_rural_m`, `${formatLabel(level)} Rural Mujeres`);

      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.total, null, bIdTot);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.h, null, bIdH);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.m, null, bIdM);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.urbano_total, null, bIdUrbT);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.urbano_h, null, bIdUrbH);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.urbano_m, null, bIdUrbM);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.rural_total, null, bIdRurT);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.rural_h, null, bIdRurH);
      await upsertFact(tc, 'edu_pop_level', srcCenso, vals.rural_m, null, bIdRurM);
    }
  }

  // =========================================================================
  // STEP 6: ENTITIES (salud_establecimientos)
  // =========================================================================
  console.log("🏥 Loading salud_establecimientos (Entities)...");
  const facMap = {}; 
  async function getFacilityTypeId(tName) {
    if (!tName) return null;
    if (facMap[tName]) return facMap[tName];
    await conn.execute(`INSERT IGNORE INTO dim_facility_type (type_name) VALUES (?)`, [tName]);
    const [[row]] = await conn.execute(`SELECT type_id FROM dim_facility_type WHERE type_name=?`, [tName]);
    facMap[tName] = row.type_id;
    return row.type_id;
  }

  const saludData = JSON.parse(await readFile(join(DATA_DIR, "salud_establecimientos.json"), "utf8"));
  let facilityCount = 0;
  for (const [tcRaw, sData] of Object.entries(saludData)) {
    const tc = padCode(tcRaw);
    const tId = terrMap[tc];
    if (!tId || !sData.centros) continue;
    
    // We do delete-insert for facilities of this territory to avoid duplicate clutter if ids changed
    await conn.execute(`DELETE FROM dim_facility WHERE territory_id=?`, [tId]);

    for (const c of sData.centros) {
        const typeId = await getFacilityTypeId(c.tipo_centro);
        await conn.execute(
            `INSERT INTO dim_facility (territory_id, type_id, external_id, name, latitude, longitude, admin_region)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tId, typeId, c.id_centro, c.nombre, c.latitud, c.longitud, c.regional_salud]
        );
        facilityCount++;
    }
  }

  // =========================================================================
  // STEP 7: Finalize Batch
  // =========================================================================
  await conn.execute(
    `UPDATE raw_import_batch SET status='SUCCESS', records_processed=?, notes=? WHERE batch_id=?`,
    [totalFacts, `Entities processed: ${facilityCount}`, batchId]
  );

  console.log(`\n🏁 ETL Phase 2 Complete.`);
  console.log(`   Facts upserted: ${totalFacts}`);
  console.log(`   Facilities added: ${facilityCount}`);
  console.log(`   Batch ID: ${batchId}`);

  await conn.end();
}

main().catch(err => {
  console.error("💥 ETL failed:", err);
  process.exit(1);
});
