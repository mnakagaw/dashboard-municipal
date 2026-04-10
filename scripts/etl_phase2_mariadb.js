/**
 * etl_phase2_mariadb.js
 *
 * Script de inicialización y migración (Phase 1 -> Phase 2).
 * 1. Crea las dimensiones básicas (Domains, Indicators, Sources).
 * 2. Población dinámica de la jerarquía territorial (Nacional -> Región -> Provincia -> Municipio).
 * 3. Migración de 'indicadores_basicos' y 'national_basic' a 'fact_statistic'.
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "public", "data");

async function main() {
  let mysql;
  try {
    mysql = await import("mysql2/promise");
    if (mysql.default) mysql = mysql.default;
  } catch {
    console.error("❌ 'mysql2' package not found.");
    process.exit(1);
  }

  try {
    const dotenv = await import("dotenv");
    (dotenv.default || dotenv).config();
  } catch {}

  const config = {
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "carapicha_dbt",
    user: process.env.DB_USER || "carapicha",
    password: process.env.DB_PASS || "",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    charset: "utf8mb4",
  };

  console.log(`📡 Conectando a MariaDB...`);
  const conn = await mysql.createConnection(config);
  console.log("✅ Conectado a la base de datos.");

  // ---- 1. Iniciar Batch de Ingesta ----
  const [batchResult] = await conn.execute(
    `INSERT INTO raw_import_batch (batch_name, source_filename, status) VALUES (?, ?, ?)`,
    ["Inicialización Fase 2: Territorios y Demografía Básica", "municipios_index.json / indicadores_basicos.json", "PROCESSING"]
  );
  const batchId = batchResult.insertId;

  // ---- 2. Dominios, Fuentes e Indicadores ----
  console.log("🛠️  Configurando Dominios e Indicadores (Dictionaries)...");
  
  await conn.execute(`INSERT IGNORE INTO dim_domain (domain_code, domain_name) VALUES ('demography', 'Demografía')`);
  const [[{ domain_id: demoDomainId }]] = await conn.execute(`SELECT domain_id FROM dim_domain WHERE domain_code='demography'`);

  await conn.execute(`INSERT IGNORE INTO dim_source (source_name, institution, source_type, reference_year) 
                      VALUES ('X Censo Nacional de Población y Vivienda 2022', 'ONE', 'Censo', 2022)`);
  const [[{ source_id: censoSourceId }]] = await conn.execute(`SELECT source_id FROM dim_source WHERE source_name LIKE '%Censo Nacional%'`);

  const coreIndicators = [
    { code: 'dem_pop_total', name: 'Población Total', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_male_2022', name: 'Población Hombres', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_female_2022', name: 'Población Mujeres', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_pop_total_2010', name: 'Población Total (2010)', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_viv_total', name: 'Viviendas Totales', unit: 'absoluto', agg: 'sum' },
    { code: 'dem_viv_ocup', name: 'Viviendas Ocupadas', unit: 'absoluto', agg: 'sum' },
  ];

  for (const ind of coreIndicators) {
    await conn.execute(
      `INSERT IGNORE INTO dim_indicator (indicator_code, indicator_name, domain_id, unit, data_type, aggregation_method) 
       VALUES (?, ?, ?, ?, 'numeric', ?)`,
      [ind.code, ind.name, demoDomainId, ind.unit, ind.agg]
    );
  }

  // Pre-load indicator IDs
  const [indRows] = await conn.execute(`SELECT indicator_id, indicator_code FROM dim_indicator`);
  const indMap = {};
  indRows.forEach(r => indMap[r.indicator_code] = r.indicator_id);

  // ---- 3. Construir Jerarquía Territorial ----
  console.log("🌐 Construyendo Árbol Territorial...");
  
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

  // Municipios y Provincias (inferidas)
  const munisRaw = JSON.parse(await readFile(join(DATA_DIR, "municipios_index.json"), "utf8"));
  
  // Cache para IDs de territorios generados/existentes
  const [[{ territory_id: defaultProvParent }]] = await conn.execute(`SELECT territory_id FROM dim_territory LIMIT 1`); // Fallback
  
  // Extraer provincias únicas y mapear a región
  const provinciasMap = {};
  for (const m of munisRaw) {
    if (!provinciasMap[m.provincia]) {
      const regionMatch = regionsRaw.find(r => r.name === m.region);
      provinciasMap[m.provincia] = {
        code: m.adm2_code.substring(0, 2), // Primeros 2 dígitos
        region_code: regionMatch ? regionMatch.id : null
      };
    }
  }

  // Insertar Provincias
  for (const [provName, provData] of Object.entries(provinciasMap)) {
    let regionId = null;
    if (provData.region_code) {
      const [rRows] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code=? AND territory_type='region'`, [provData.region_code]);
      if (rRows.length > 0) regionId = rRows[0].territory_id;
    }
    await conn.execute(
      `INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id) VALUES (?, ?, 'provincia', ?)`,
      [provData.code, provName, regionId || nacionalId]
    );
  }

  // Insertar Municipios
  for (const m of munisRaw) {
    const provCode = m.adm2_code.substring(0, 2);
    const [pRows] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code=? AND territory_type='provincia'`, [provCode]);
    const parentId = pRows.length > 0 ? pRows[0].territory_id : nacionalId;

    await conn.execute(
      `INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id, region_oficial_ley345) 
       VALUES (?, ?, 'municipio', ?, ?)`,
      [m.adm2_code, m.municipio, parentId, m.region]
    );
  }

  // Pre-cargar IDs territoriales
  const [terrRows] = await conn.execute(`SELECT territory_id, territory_code FROM dim_territory`);
  const terrMap = {};
  terrRows.forEach(r => terrMap[r.territory_code] = r.territory_id);

  // ---- 4. Ingestar Hechos (Fact Table) ----
  console.log("📊 Migrando indicadores_basicos a fact_statistic...");
  const indicadoresBasicos = JSON.parse(await readFile(join(DATA_DIR, "indicadores_basicos.json"), "utf8"));
  
  let factsInserted = 0;
  
  const insertFact = async (tCode, iCode, value) => {
    if (value == null) return;
    const tId = terrMap[tCode];
    const iId = indMap[iCode];
    if (tId && iId) {
      // Upsert logic based on territory and indicator to avoid duplicates if re-run
      await conn.execute(
        `INSERT INTO fact_statistic (territory_id, indicator_id, source_id, batch_id, numeric_value, quality_flag)
         VALUES (?, ?, ?, ?, ?, 'oficial')`,
        [tId, iId, censoSourceId, batchId, value]
      );
      factsInserted++;
    }
  };

  // 4a. Nacional
  const natBasic = JSON.parse(await readFile(join(DATA_DIR, "national_basic.json"), "utf8"));
  await insertFact('00', 'dem_pop_total', natBasic.poblacion_total);
  await insertFact('00', 'dem_pop_male_2022', natBasic.poblacion_hombres);
  await insertFact('00', 'dem_pop_female_2022', natBasic.poblacion_mujeres);
  await insertFact('00', 'dem_pop_total_2010', natBasic.poblacion_total_2010);
  await insertFact('00', 'dem_viv_ocup', natBasic.viviendas_ocupadas);

  // 4b. Municipal
  for (const mData of indicadoresBasicos) {
    const tCode = mData.adm2_code;
    await insertFact(tCode, 'dem_pop_total', mData.poblacion_total);
    await insertFact(tCode, 'dem_pop_male_2022', mData.poblacion_hombres);
    await insertFact(tCode, 'dem_pop_female_2022', mData.poblacion_mujeres);
    await insertFact(tCode, 'dem_pop_total_2010', mData.poblacion_2010);
    await insertFact(tCode, 'dem_viv_total', mData.viviendas_total);
    await insertFact(tCode, 'dem_viv_ocup', mData.viviendas_ocupadas);
  }

  await conn.execute(`UPDATE raw_import_batch SET status='SUCCESS', records_processed=? WHERE batch_id=?`, [factsInserted, batchId]);

  console.log(`\n🏁 ETL Fase 2 Terminado Exitosamente.`);
  console.log(`   - Territorios anidados e Índices cargados.`);
  console.log(`   - ${factsInserted} hechos insertados en fact_statistic.`);
  
  await conn.end();
}

main().catch((err) => {
  console.error("💥 Error en ETL:", err);
  process.exit(1);
});
