/**
 * regenerate_delivery.js — Canonical → dataset_assets (Delivery Layer)
 *
 * Demonstrates the full pipeline:
 *   canonical fact_statistic → JSON → UPDATE dataset_assets
 *
 * Regenerates:
 *   ✅ national_basic
 *   ✅ indicadores_basicos
 *   ✅ hogares_resumen
 *   ✅ tic
 *   ✅ condicion_vida
 *   ✅ pyramids
 *   ✅ educacion
 *   ✅ educacion_nivel
 *   ✅ economia_empleo
 *   ✅ salud_establecimientos
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
    WHERE t.territory_code = '00' AND f.breakdown_id IS NULL
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
    if (natMapping[row.indicator_code]) natObj[natMapping[row.indicator_code]] = parseFloat(row.numeric_value);
  }
  natObj.pais = "República Dominicana";
  if (natObj.personas_por_hogar_promedio) natObj.personas_por_hogar_promedio = Math.round(natObj.personas_por_hogar_promedio * 10) / 10;
  await upsertAsset(conn, 'national_basic', JSON.stringify(natObj, null, 2));

  // ========================================================================
  // 2. Regenerate 'indicadores_basicos'
  // ========================================================================
  console.log("🔄 Regenerating indicadores_basicos...");
  const [indRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, t.territory_name AS municipio, p.territory_name AS provincia, t.region_oficial_ley345 AS region, i.indicator_code, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_territory p ON t.parent_territory_id = p.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_domain d ON i.domain_id = d.domain_id
    WHERE t.territory_type = 'municipio' AND d.domain_code = 'demography' AND f.breakdown_id IS NULL
  `);
  const indMap = {};
  for (const row of indRows) {
    if (!indMap[row.adm2_code]) indMap[row.adm2_code] = { adm2_code: row.adm2_code, municipio: row.municipio, provincia: row.provincia, region: row.region };
    const rKey = natMapping[row.indicator_code] || row.indicator_code.replace('dem_', '');
    if (rKey === 'pop_var_abs') indMap[row.adm2_code]['variacion_abs'] = parseFloat(row.numeric_value);
    else if (rKey === 'pop_var_pct') indMap[row.adm2_code]['variacion_pct'] = parseFloat(row.numeric_value);
    else if (rKey === 'viv_total') indMap[row.adm2_code]['viviendas_total'] = parseFloat(row.numeric_value);
    else if (rKey === 'viv_ocup') indMap[row.adm2_code]['viviendas_ocupadas'] = parseFloat(row.numeric_value);
    else if (rKey === 'viv_desocup') indMap[row.adm2_code]['viviendas_desocupadas'] = parseFloat(row.numeric_value);
    else if (rKey === 'poblacion_total_2010') indMap[row.adm2_code]['poblacion_2010'] = parseFloat(row.numeric_value);
    else if (natMapping[row.indicator_code]) indMap[row.adm2_code][natMapping[row.indicator_code]] = parseFloat(row.numeric_value);
  }
  await upsertAsset(conn, 'indicadores_basicos', JSON.stringify(Object.values(indMap), null, 4));

  // ========================================================================
  // 3. Regenerate 'hogares_resumen'
  // ========================================================================
  console.log("🔄 Regenerating hogares_resumen...");
  const [hogRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, p.territory_name AS provincia, t.territory_name AS municipio, i.indicator_code, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_territory p ON t.parent_territory_id = p.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_domain d ON i.domain_id = d.domain_id
    WHERE t.territory_type = 'municipio' AND d.domain_code = 'household' AND f.breakdown_id IS NULL
  `);
  const hogMap = {};
  for (const row of hogRows) {
    if (!hogMap[row.adm2_code]) hogMap[row.adm2_code] = { adm2_code: row.adm2_code, provincia: row.provincia, municipio: row.municipio };
    if (row.indicator_code === 'hog_total') hogMap[row.adm2_code]['hogares_total'] = parseFloat(row.numeric_value);
    if (row.indicator_code === 'hog_pop') hogMap[row.adm2_code]['poblacion_en_hogares'] = parseFloat(row.numeric_value);
    if (row.indicator_code === 'hog_size_avg') hogMap[row.adm2_code]['personas_por_hogar'] = parseFloat(row.numeric_value);
  }
  await upsertAsset(conn, 'hogares_resumen', JSON.stringify(Object.values(hogMap), null, 2));

  // ========================================================================
  // 4. Regenerate 'tic'
  // ========================================================================
  console.log("🔄 Regenerating tic...");
  const [ticRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, i.indicator_code, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_domain d ON i.domain_id = d.domain_id
    WHERE t.territory_type = 'municipio' AND d.domain_code = 'tic' AND f.breakdown_id IS NULL
  `);
  const ticMap = {};
  for (const row of ticRows) {
    if (!ticMap[row.adm2_code]) ticMap[row.adm2_code] = { adm2_code: row.adm2_code, internet: {}, cellular: {}, computer: {} };
    const parts = row.indicator_code.split('_'); // tic_internet_used
    const med = parts[1]; // internet
    const metric = parts[2] === 'rate' ? 'rate_used' : parts[2]; // used / total / rate_used
    if (ticMap[row.adm2_code][med]) ticMap[row.adm2_code][med][metric] = parseFloat(row.numeric_value);
  }
  await upsertAsset(conn, 'tic', JSON.stringify(Object.values(ticMap), null, 2));

  // ========================================================================
  // 5. Regenerate 'condicion_vida' (Breakdowns)
  // ========================================================================
  console.log("🔄 Regenerating condicion_vida...");
  const [cvRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, i.indicator_code, b.code as cat_code, b.label as cat_label, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    LEFT JOIN dim_breakdown b ON f.breakdown_id = b.breakdown_id
    WHERE i.indicator_code LIKE 'cv_%' AND t.territory_type = 'municipio'
  `);
  const cvMap = {};
  for(const r of cvRows) {
      if(!cvMap[r.adm2_code]) cvMap[r.adm2_code] = { adm2_code: r.adm2_code, servicios: {} };
      const srvKey = r.indicator_code.replace('cv_', '');
      if(!cvMap[r.adm2_code].servicios[srvKey]) cvMap[r.adm2_code].servicios[srvKey] = { total: 0, categorias: {} };
      
      if(!r.cat_code) {
          cvMap[r.adm2_code].servicios[srvKey].total = parseFloat(r.numeric_value);
      } else {
          cvMap[r.adm2_code].servicios[srvKey].categorias[r.cat_code] = parseFloat(r.numeric_value);
      }
  }
  await upsertAsset(conn, 'condicion_vida', JSON.stringify(Object.values(cvMap), null, 2));

  // ========================================================================
  // 6. Regenerate 'pyramids' (Breakdowns)
  // ========================================================================
  console.log("🔄 Regenerating pyramids...");
  const [pyRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, b.code as param_code, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_breakdown b ON f.breakdown_id = b.breakdown_id
    WHERE i.indicator_code = 'dem_pyramid'
  `);
  const pyMap = {};
  for(const r of pyRows) { // param_code = male_15-19
      const tc = r.adm2_code;
      if(!pyMap[tc]) pyMap[tc] = { age_groups: {} };
      const [sex, agegroup] = r.param_code.split('_', 2);
      const agOrig = r.param_code.substring(sex.length + 1).replace(/_/g, ' '); // 15-19
      if(!pyMap[tc].age_groups[agOrig]) pyMap[tc].age_groups[agOrig] = { age_group: agOrig, male: 0, female: 0 };
      pyMap[tc].age_groups[agOrig][sex] = parseFloat(r.numeric_value);
  }
  // Convert dict to list
  const pyOutput = {};
  for(const [tc, data] of Object.entries(pyMap)) {
      pyOutput[tc] = { age_groups: Object.values(data.age_groups) };
  }
  await upsertAsset(conn, 'pyramids', JSON.stringify(pyOutput, null, 2));

  // ========================================================================
  // 7. Regenerate 'educacion'
  // ========================================================================
  console.log("🔄 Regenerating educacion...");
  const [eduRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, i.indicator_code, b.code as level, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_breakdown b ON f.breakdown_id = b.breakdown_id
    WHERE i.indicator_code LIKE 'edu_efficiency_%'
  `);
  const eduMap = {};
  for(const r of eduRows) {
      const tc = r.adm2_code;
      if(!eduMap[tc]) eduMap[tc] = { adm2_code: tc, anuario: { eficiencia: {} } };
      if(!eduMap[tc].anuario.eficiencia[r.level]) eduMap[tc].anuario.eficiencia[r.level] = {};
      const stat = r.indicator_code.replace('edu_efficiency_', ''); // abandono, promocion, reprobacion
      eduMap[tc].anuario.eficiencia[r.level][stat] = parseFloat(r.numeric_value);
  }
  await upsertAsset(conn, 'educacion', JSON.stringify(Object.values(eduMap), null, 2));

  // ========================================================================
  // 8. Regenerate 'educacion_nivel'
  // ========================================================================
  console.log("🔄 Regenerating educacion_nivel...");
  const [eduNivRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, b.code as param, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    JOIN dim_breakdown b ON f.breakdown_id = b.breakdown_id
    WHERE i.indicator_code = 'edu_pop_level'
  `);
  const eduNivMap = {};
  for(const r of eduNivRows) {
      if(!eduNivMap[r.adm2_code]) eduNivMap[r.adm2_code] = { adm2_code: r.adm2_code, nivel: {} };
      // param looks like "secundaria_h" or "primaria_urbano_m"
      const lvParts = r.param.split('_');
      const levelCode = lvParts[0];
      const metric = r.param.substring(levelCode.length + 1); // h, m, urbano_total
      if(!eduNivMap[r.adm2_code].nivel[levelCode]) eduNivMap[r.adm2_code].nivel[levelCode] = {};
      eduNivMap[r.adm2_code].nivel[levelCode][metric] = parseFloat(r.numeric_value);
  }
  await upsertAsset(conn, 'educacion_nivel', JSON.stringify(Object.values(eduNivMap), null, 2));

  // ========================================================================
  // 9. Regenerate 'economia_empleo'
  // ========================================================================
  console.log("🔄 Regenerating economia_empleo...");
  const [ecoRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, i.indicator_code, b.code as cat_code, b.category as cat_type, b.label as cat_label, f.numeric_value
    FROM fact_statistic f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_indicator i ON f.indicator_id = i.indicator_id
    LEFT JOIN dim_breakdown b ON f.breakdown_id = b.breakdown_id
    WHERE i.indicator_code LIKE 'eco_%'
  `);
  const ecoMap = {};
  for(const r of ecoRows) {
      if(!ecoMap[r.adm2_code]) ecoMap[r.adm2_code] = { adm2_code: r.adm2_code, dee_2024: { employment_size_bands: {}, sectors: {} } };
      const metric = r.indicator_code.replace('eco_', ''); // establishments, employees, avg_employees
      const tDee = ecoMap[r.adm2_code].dee_2024;
      if(!r.cat_code) {
          tDee[`total_${metric}`] = parseFloat(r.numeric_value);
          if (metric === 'avg_employees') tDee.avg_employees_per_establishment = parseFloat(r.numeric_value);
      } else {
            if(r.cat_type === 'eco_size_band') {
                if(!tDee.employment_size_bands[r.cat_code]) tDee.employment_size_bands[r.cat_code] = { size_band: r.cat_code, label: r.cat_label };
                tDee.employment_size_bands[r.cat_code][metric] = parseFloat(r.numeric_value);
            } else if (r.cat_type === 'eco_ciiu_section') {
                if(!tDee.sectors[r.cat_code]) tDee.sectors[r.cat_code] = { ciiu_section: r.cat_code, label: r.cat_label };
                tDee.sectors[r.cat_code][metric] = parseFloat(r.numeric_value);
            }
      }
  }
  // Convert maps to arrays
  for(const m of Object.values(ecoMap)) {
      m.dee_2024.employment_size_bands = Object.values(m.dee_2024.employment_size_bands);
      m.dee_2024.sectors = Object.values(m.dee_2024.sectors);
  }
  await upsertAsset(conn, 'economia_empleo', JSON.stringify(Object.values(ecoMap), null, 2));

  // ========================================================================
  // 10. Regenerate 'salud_establecimientos' (Entities)
  // ========================================================================
  console.log("🔄 Regenerating salud_establecimientos...");
  const [facRows] = await conn.execute(`
    SELECT t.territory_code AS adm2_code, f.external_id, f.name, f.latitude, f.longitude, f.admin_region, ty.type_name
    FROM dim_facility f
    JOIN dim_territory t ON f.territory_id = t.territory_id
    JOIN dim_facility_type ty ON f.type_id = ty.type_id
  `);
  const facMap = {};
  for(const r of facRows) {
      if(!facMap[r.adm2_code]) facMap[r.adm2_code] = { adm2_code: r.adm2_code, centros: [] };
      facMap[r.adm2_code].centros.push({
          id_centro: r.external_id,
          nombre: r.name,
          latitud: parseFloat(r.latitude),
          longitud: parseFloat(r.longitude),
          regional_salud: r.admin_region,
          tipo_centro: r.type_name
      });
  }
  await upsertAsset(conn, 'salud_establecimientos', JSON.stringify(facMap, null, 2));

  console.log("\n🏁 Delivery regeneration complete.");
  await conn.end();
}

async function upsertAsset(conn, assetKey, jsonContent) {
  const hash = sha256(jsonContent);
  const [rows] = await conn.execute(`SELECT id, content_hash, version_no FROM dataset_assets WHERE asset_key = ? AND is_active = 1`, [assetKey]);
  if (rows.length > 0) {
    const row = rows[0];
    if (row.content_hash && row.content_hash.trim() === hash) {
      console.log(`  ⏭  ${assetKey} — unchanged (hash match)`);
      return;
    }
    await conn.execute(`UPDATE dataset_assets SET json_content = ?, content_hash = ?, source_name = 'canonical_regeneration', version_no = ?, updated_at = NOW() WHERE asset_key = ? AND is_active = 1`, [jsonContent, hash, row.version_no + 1, assetKey]);
  } else {
    await conn.execute(`INSERT INTO dataset_assets (asset_key, version_no, json_content, content_hash, source_name, is_active) VALUES (?, 1, ?, ?, 'canonical_regeneration', 1)`, [assetKey, jsonContent, hash]);
  }
}

main().catch(err => {
  console.error("💥 Regeneration failed:", err);
  process.exit(1);
});
