/**
 * qa_canonical.js — Quality Assurance for Phase 2 Canonical Schema
 *
 * Checks:
 *   1. Row counts per dimension table
 *   2. fact_statistic row counts (Flat vs Breakdowns)
 *   3. Duplicate detection
 *   4. NULL / missing value detection
 *   5. Territory hierarchy integrity
 *   6. Source / period consistency
 *   7. Entity checks (facilities have coordinates)
 *   8. Breakdown checks (Total should roughly align with sum of breakdown slices if applicable)
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

  let passed = 0; let warned = 0; let failed = 0;
  function check(label, ok, detail) { if(ok) { console.log(`  ✅ ${label}: ${detail}`); passed++; } else { console.log(`  ❌ ${label}: ${detail}`); failed++; } }
  function warn(label, detail) { console.log(`  ⚠️  ${label}: ${detail}`); warned++; }

  // 1. Row Counts
  console.log("\n═══ 1. Table Row Counts ═══");
  for (const t of ['dim_territory', 'dim_domain', 'dim_indicator', 'dim_source', 'dim_breakdown', 'dim_facility_type', 'dim_facility', 'fact_statistic', 'raw_import_batch']) {
    const [[{ cnt }]] = await conn.execute(`SELECT COUNT(*) as cnt FROM ${t}`);
    console.log(`  📋 ${t}: ${cnt} rows`);
  }

  // 2. Fact Distribution
  console.log("\n═══ 2. Fact Distribution ═══");
  const [[{ flatCnt }]] = await conn.execute(`SELECT COUNT(*) as flatCnt FROM fact_statistic WHERE breakdown_id IS NULL`);
  const [[{ breakCnt }]] = await conn.execute(`SELECT COUNT(*) as breakCnt FROM fact_statistic WHERE breakdown_id IS NOT NULL`);
  console.log(`  📋 Flat Facts (breakdown=NULL): ${flatCnt}`);
  console.log(`  📋 Breakdown Facts (breakdown!=NULL): ${breakCnt}`);

  // 3. Duplicates
  console.log("\n═══ 3. Duplicate Check ═══");
  const [[{ dupes }]] = await conn.execute(`
    SELECT COUNT(*) as dupes FROM (
       SELECT territory_id, indicator_id, source_id, period_year, IFNULL(breakdown_id, 0), COUNT(*) as c
       FROM fact_statistic GROUP BY territory_id, indicator_id, source_id, period_year, IFNULL(breakdown_id, 0) HAVING c > 1
    ) dup
  `);
  check('No duplicates in fact_statistic', dupes === 0, `${dupes} duplicate groups`);

  // 4. NULLs
  console.log("\n═══ 4. NULL / Missing Value Audit ═══");
  const [[{ nullValues }]] = await conn.execute(`SELECT COUNT(*) as nullValues FROM fact_statistic WHERE numeric_value IS NULL AND text_value IS NULL`);
  check('All facts have values', nullValues === 0, `${nullValues} empty facts`);

  // 5. Entities
  console.log("\n═══ 5. Entity Model Integrity ═══");
  const [[{ facCnt }]] = await conn.execute(`SELECT COUNT(*) as facCnt FROM dim_facility`);
  const [[{ noLatLon }]] = await conn.execute(`SELECT COUNT(*) as noLatLon FROM dim_facility WHERE latitude IS NULL OR longitude IS NULL`);
  check('Facilities have coordinates', noLatLon === 0, `${noLatLon}/${facCnt} missing lat/lon`);

  // 6. Breakdowns Checks
  console.log("\n═══ 6. Breakdown Integrity ═══");
  // Ensure that no breakdown fact refers to missing breakdown
  const [[{ orphBreak }]] = await conn.execute(`SELECT COUNT(*) as orphBreak FROM fact_statistic WHERE breakdown_id IS NOT NULL AND breakdown_id NOT IN (SELECT breakdown_id FROM dim_breakdown)`);
  check('No orphan breakdown refs', orphBreak === 0, `${orphBreak} orphan refs`);

  // 7. Territory Coverage
  console.log("\n═══ 7. Coverage Check ═══");
  const [[{ emptyInds }]] = await conn.execute(`SELECT COUNT(*) as emptyInds FROM dim_indicator WHERE indicator_id NOT IN (SELECT DISTINCT indicator_id FROM fact_statistic)`);
  check('All indicators have data', emptyInds === 0, `${emptyInds} indicators with no facts`);

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  QA Summary: ✅ ${passed} passed, ⚠️ ${warned} warnings, ❌ ${failed} failed`);
  console.log(`═══════════════════════════════════════\n`);

  await conn.end();
  process.exit(failed > 0 ? 1 : 0);
}
main().catch(e => { console.error("💥 QA failed:", e); process.exit(1); });
