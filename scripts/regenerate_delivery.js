/**
 * regenerate_delivery.js — Canonical → dataset_assets (Delivery Layer)
 *
 * Demonstrates the full pipeline:
 *   canonical fact_statistic → pivot → JSON → UPDATE dataset_assets
 *
 * Regenerates:
 *   ✅ national_basic
 *   ✅ indicadores_basicos
 *   ✅ hogares_resumen
 *
 * This script proves that dataset_assets can be treated as a
 * "delivery artifact" fully regenerable from canonical tables.
 *
 * Usage:
 *   node scripts/regenerate_delivery.js
 */

import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

function sha256(s) { return createHash("sha256").update(s, "utf8").digest("hex"); }

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
  console.log("✅ Connected.\n");

  // ========================================================================
  // 1. Regenerate 'national_basic'
  // ========================================================================
  console.log("🔄 Regenerating national_basic...");
  const [natRows] = await conn.execute(`
    SELECT i.indicator_code, f.numeric_value
    FROM fact_statistic f
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_territory t ON f.territory_id = t.territory_id
    WHERE t.territory_code = '00'
  `);
  const natObj = {};
  const natMapping = {
    'dem_pop_total': 'poblacion_total',
    'dem_pop_male_2022': 'poblacion_hombres',
    'dem_pop_female_2022': 'poblacion_mujeres',
    'dem_pop_total_2010': 'poblacion_total_2010',
    'hog_total': 'hogares_en_viviendas_particulares_ocupadas',
    'hog_pop': 'poblacion_en_hogares_particulares',
    'hog_size_avg': 'personas_por_hogar_promedio',
  };
  for (const row of natRows) {
    const jsonKey = natMapping[row.indicator_code];
    if (jsonKey) natObj[jsonKey] = parseFloat(row.numeric_value);
  }
  natObj.pais = "República Dominicana";
  // Determine sensible decimal treatment
  if (natObj.personas_por_hogar_promedio) {
    natObj.personas_por_hogar_promedio = Math.round(natObj.personas_por_hogar_promedio * 10) / 10;
  }
  const natJson = JSON.stringify(natObj, null, 2);
  await upsertAsset(conn, 'national_basic', natJson);
  console.log(`  ✅ national_basic regenerated (${natJson.length} bytes)`);

  // ========================================================================
  // 2. Regenerate 'indicadores_basicos'
  // ========================================================================
  console.log("🔄 Regenerating indicadores_basicos...");
  const [indRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code,
           t.territory_name AS municipio,
           p.territory_name AS provincia,
           t.region_oficial_ley345 AS region,
           i.indicator_code,
           f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_territory p ON t.parent_territory_id = p.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_domain d ON i.domain_id = d.domain_id
    WHERE t.territory_type = 'municipio'
      AND d.domain_code = 'demography'
    ORDER BY t.territory_code, i.indicator_code
  `);
  const muniMap = {};
  const indMapping = {
    'dem_pop_total': 'poblacion_total',
    'dem_pop_male_2022': 'poblacion_hombres',
    'dem_pop_female_2022': 'poblacion_mujeres',
    'dem_pop_total_2010': 'poblacion_2010',
    'dem_viv_total': 'viviendas_total',
    'dem_viv_ocup': 'viviendas_ocupadas',
    'dem_viv_desocup': 'viviendas_desocupadas',
    'dem_pop_var_abs': 'variacion_abs',
    'dem_pop_var_pct': 'variacion_pct',
  };
  for (const row of indRows) {
    if (!muniMap[row.adm2_code]) {
      muniMap[row.adm2_code] = {
        adm2_code: row.adm2_code,
        municipio: row.municipio,
        provincia: row.provincia,
        region: row.region,
      };
    }
    const jsonKey = indMapping[row.indicator_code];
    if (jsonKey) {
      muniMap[row.adm2_code][jsonKey] = parseFloat(row.numeric_value);
    }
  }
  const indArray = Object.values(muniMap);
  const indJson = JSON.stringify(indArray, null, 4);
  await upsertAsset(conn, 'indicadores_basicos', indJson);
  console.log(`  ✅ indicadores_basicos regenerated (${indArray.length} records, ${indJson.length} bytes)`);

  // ========================================================================
  // 3. Regenerate 'hogares_resumen'
  // ========================================================================
  console.log("🔄 Regenerating hogares_resumen...");
  const [hogRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code,
           p.territory_name AS provincia,
           t.territory_name AS municipio,
           i.indicator_code,
           f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_territory p ON t.parent_territory_id = p.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_domain d ON i.domain_id = d.domain_id
    WHERE t.territory_type = 'municipio'
      AND d.domain_code = 'household'
    ORDER BY t.territory_code, i.indicator_code
  `);
  const hogMap = {};
  const hogMapping = {
    'hog_total': 'hogares_total',
    'hog_pop': 'poblacion_en_hogares',
    'hog_size_avg': 'personas_por_hogar',
  };
  for (const row of hogRows) {
    if (!hogMap[row.adm2_code]) {
      hogMap[row.adm2_code] = {
        adm2_code: row.adm2_code,
        provincia: row.provincia,
        municipio: row.municipio,
      };
    }
    const jsonKey = hogMapping[row.indicator_code];
    if (jsonKey) hogMap[row.adm2_code][jsonKey] = parseFloat(row.numeric_value);
  }
  const hogArray = Object.values(hogMap);
  const hogJson = JSON.stringify(hogArray, null, 2);
  await upsertAsset(conn, 'hogares_resumen', hogJson);
  console.log(`  ✅ hogares_resumen regenerated (${hogArray.length} records, ${hogJson.length} bytes)`);

  console.log("\n🏁 Delivery regeneration complete.");
  await conn.end();
}

async function upsertAsset(conn, assetKey, jsonContent) {
  const hash = sha256(jsonContent);
  const [rows] = await conn.execute(
    `SELECT id, content_hash, version_no FROM dataset_assets WHERE asset_key = ? AND is_active = 1`,
    [assetKey]
  );
  if (rows.length > 0) {
    const row = rows[0];
    if (row.content_hash && row.content_hash.trim() === hash) {
      console.log(`  ⏭  ${assetKey} — unchanged (hash match)`);
      return;
    }
    await conn.execute(
      `UPDATE dataset_assets SET json_content = ?, content_hash = ?, source_name = ?,
              version_no = ?, updated_at = NOW()
       WHERE asset_key = ? AND is_active = 1`,
      [jsonContent, hash, 'canonical_regeneration', row.version_no + 1, assetKey]
    );
  } else {
    await conn.execute(
      `INSERT INTO dataset_assets (asset_key, version_no, json_content, content_hash, source_name, is_active)
       VALUES (?, 1, ?, ?, 'canonical_regeneration', 1)`,
      [assetKey, jsonContent, hash]
    );
  }
}

main().catch(err => {
  console.error("💥 Regeneration failed:", err);
  process.exit(1);
});
