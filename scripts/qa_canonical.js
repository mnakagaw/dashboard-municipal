/**
 * qa_canonical.js — Quality Assurance for Phase 2 Canonical Schema
 *
 * Checks:
 *   1. Row counts per dimension table
 *   2. fact_statistic row count and domain distribution
 *   3. Duplicate detection (if UNIQUE constraint somehow bypassed)
 *   4. NULL / missing value detection
 *   5. Territory hierarchy integrity (orphan check)
 *   6. Source / period consistency
 *   7. Expected territory counts (158 municipios, 32 provincias, 10 regiones)
 *
 * Usage:
 *   node scripts/qa_canonical.js
 */

import { fileURLToPath } from "node:url";

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

  let passed = 0;
  let warned = 0;
  let failed = 0;

  function check(label, ok, detail) {
    if (ok) {
      console.log(`  ✅ ${label}: ${detail}`);
      passed++;
    } else {
      console.log(`  ❌ ${label}: ${detail}`);
      failed++;
    }
  }
  function warn(label, detail) {
    console.log(`  ⚠️  ${label}: ${detail}`);
    warned++;
  }

  // ---- 1. Row Counts ----
  console.log("\n═══ 1. Dimension Table Row Counts ═══");
  const tables = ['dim_territory', 'dim_domain', 'dim_indicator', 'dim_source', 'fact_statistic', 'raw_import_batch'];
  for (const t of tables) {
    const [[{ cnt }]] = await conn.execute(`SELECT COUNT(*) as cnt FROM ${t}`);
    console.log(`  📋 ${t}: ${cnt} rows`);
  }

  // ---- 2. Territory Hierarchy ----
  console.log("\n═══ 2. Territory Hierarchy ═══");
  const [[{ municipios }]] = await conn.execute(`SELECT COUNT(*) as municipios FROM dim_territory WHERE territory_type='municipio'`);
  const [[{ provincias }]] = await conn.execute(`SELECT COUNT(*) as provincias FROM dim_territory WHERE territory_type='provincia'`);
  const [[{ regiones }]] = await conn.execute(`SELECT COUNT(*) as regiones FROM dim_territory WHERE territory_type='region'`);
  const [[{ nacional }]] = await conn.execute(`SELECT COUNT(*) as nacional FROM dim_territory WHERE territory_type='nacional'`);
  check('Municipios', municipios === 158, `${municipios} (expected 158)`);
  check('Provincias', provincias === 32, `${provincias} (expected 32)`);
  check('Regiones', regiones === 10, `${regiones} (expected 10)`);
  check('Nacional', nacional === 1, `${nacional} (expected 1)`);

  // Orphan check
  const [[{ orphans }]] = await conn.execute(
    `SELECT COUNT(*) as orphans FROM dim_territory t
     WHERE t.parent_territory_id IS NOT NULL
       AND NOT EXISTS(SELECT 1 FROM dim_territory p WHERE p.territory_id = t.parent_territory_id)`
  );
  check('No orphan territories', orphans === 0, `${orphans} orphans found`);

  // ---- 3. fact_statistic Distribution ----
  console.log("\n═══ 3. Fact Distribution by Domain ═══");
  const [domDist] = await conn.execute(
    `SELECT d.domain_name, COUNT(*) as cnt
     FROM fact_statistic f
     JOIN dim_indicator i ON f.indicator_id = i.indicator_id
     JOIN dim_domain d ON i.domain_id = d.domain_id
     GROUP BY d.domain_name ORDER BY cnt DESC`
  );
  for (const row of domDist) {
    console.log(`  📊 ${row.domain_name}: ${row.cnt} facts`);
  }

  // ---- 4. Duplicate Detection ----
  console.log("\n═══ 4. Duplicate Check ═══");
  const [[{ dupes }]] = await conn.execute(
    `SELECT COUNT(*) as dupes FROM (
       SELECT territory_id, indicator_id, source_id, period_year, COUNT(*) as c
       FROM fact_statistic
       GROUP BY territory_id, indicator_id, source_id, period_year
       HAVING c > 1
     ) dup`
  );
  check('No duplicates in fact_statistic', dupes === 0, `${dupes} duplicate groups`);

  // ---- 5. NULL Value Detection ----
  console.log("\n═══ 5. NULL / Missing Value Audit ═══");
  const [[{ nullValues }]] = await conn.execute(
    `SELECT COUNT(*) as nullValues FROM fact_statistic WHERE numeric_value IS NULL AND text_value IS NULL`
  );
  if (nullValues > 0) {
    warn('Facts with no value', `${nullValues} facts have NULL numeric_value AND NULL text_value`);
  } else {
    check('All facts have values', true, `0 empty facts`);
  }

  // Indicators with no facts
  const [emptyInds] = await conn.execute(
    `SELECT i.indicator_code FROM dim_indicator i
     LEFT JOIN fact_statistic f ON i.indicator_id = f.indicator_id
     WHERE f.fact_id IS NULL`
  );
  if (emptyInds.length > 0) {
    warn('Indicators with 0 facts', emptyInds.map(r => r.indicator_code).join(', '));
  } else {
    check('All indicators have facts', true, 'OK');
  }

  // ---- 6. Source / Period Consistency ----
  console.log("\n═══ 6. Source & Period Consistency ═══");
  const [srcDist] = await conn.execute(
    `SELECT s.source_name, s.reference_year, COUNT(*) as cnt
     FROM fact_statistic f JOIN dim_source s ON f.source_id = s.source_id
     GROUP BY s.source_name, s.reference_year`
  );
  for (const row of srcDist) {
    console.log(`  📋 ${row.source_name} (${row.reference_year}): ${row.cnt} facts`);
  }

  // ---- 7. Coverage Check ----
  console.log("\n═══ 7. Coverage: Municipios per Indicator ═══");
  const [coverage] = await conn.execute(
    `SELECT i.indicator_code, COUNT(DISTINCT f.territory_id) as terr_count
     FROM fact_statistic f
     JOIN dim_indicator i ON f.indicator_id = i.indicator_id
     JOIN dim_territory t ON f.territory_id = t.territory_id
     WHERE t.territory_type = 'municipio'
     GROUP BY i.indicator_code
     ORDER BY i.indicator_code`
  );
  for (const row of coverage) {
    const star = row.terr_count < 155 ? ' ⚠️' : '';
    console.log(`  📋 ${row.indicator_code}: ${row.terr_count} municipios${star}`);
  }

  // ---- Summary ----
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  QA Summary: ✅ ${passed} passed, ⚠️ ${warned} warnings, ❌ ${failed} failed`);
  console.log(`═══════════════════════════════════════\n`);

  await conn.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("💥 QA failed:", err);
  process.exit(1);
});
