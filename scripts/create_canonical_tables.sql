-- =====================================================================
-- Dashboard Territorial - Phase 2: Canonical Schema
-- Motor: MariaDB (compatible con SQL Server con ajustes mínimos)
-- Versión: 2.0 — Canonical Completion Package
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RAW / STAGING LAYER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_import_batch (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_name VARCHAR(255) NOT NULL,
    source_filename VARCHAR(255) NOT NULL,
    import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PROCESSING',
    records_total INT DEFAULT 0,
    records_processed INT DEFAULT 0,
    records_skipped INT DEFAULT 0,
    records_errors INT DEFAULT 0,
    notes TEXT
);

-- ---------------------------------------------------------------------
-- 2. DIMENSION TABLES
-- ---------------------------------------------------------------------

-- Territorio (jerarquía recursiva: nacional > región > provincia > municipio)
CREATE TABLE IF NOT EXISTS dim_territory (
    territory_id INT AUTO_INCREMENT PRIMARY KEY,
    territory_code VARCHAR(50) NOT NULL UNIQUE,
    territory_name VARCHAR(100) NOT NULL,
    territory_type VARCHAR(50) NOT NULL,
    parent_territory_id INT NULL,
    region_oficial_ley345 VARCHAR(100) NULL,
    FOREIGN KEY (parent_territory_id) REFERENCES dim_territory(territory_id)
);

-- Dominios temáticos
CREATE TABLE IF NOT EXISTS dim_domain (
    domain_id INT AUTO_INCREMENT PRIMARY KEY,
    domain_code VARCHAR(50) NOT NULL UNIQUE,
    domain_name VARCHAR(100) NOT NULL
);

-- Indicadores
CREATE TABLE IF NOT EXISTS dim_indicator (
    indicator_id INT AUTO_INCREMENT PRIMARY KEY,
    indicator_code VARCHAR(100) NOT NULL UNIQUE,
    indicator_name VARCHAR(255) NOT NULL,
    domain_id INT NOT NULL,
    unit VARCHAR(50) NULL,
    data_type VARCHAR(50) DEFAULT 'numeric',
    aggregation_method VARCHAR(50) NULL,
    display_hints VARCHAR(255) NULL,
    FOREIGN KEY (domain_id) REFERENCES dim_domain(domain_id)
);

-- Fuentes
CREATE TABLE IF NOT EXISTS dim_source (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    institution VARCHAR(100) NULL,
    source_type VARCHAR(100) NULL,
    source_ref VARCHAR(255) NULL,
    reference_year INT NULL,
    update_date DATETIME NULL,
    notes TEXT NULL
);

-- ---------------------------------------------------------------------
-- 3. FACT TABLE (con UNIQUE CONSTRAINT para upsert seguro)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_statistic (
    fact_id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    indicator_id INT NOT NULL,
    source_id INT NOT NULL,
    batch_id INT NULL,
    period_year INT NULL,
    numeric_value DECIMAL(18, 4) NULL,
    text_value VARCHAR(255) NULL,
    quality_flag VARCHAR(50) DEFAULT 'oficial',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fact (territory_id, indicator_id, source_id, period_year),
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (indicator_id) REFERENCES dim_indicator(indicator_id),
    FOREIGN KEY (source_id) REFERENCES dim_source(source_id),
    FOREIGN KEY (batch_id) REFERENCES raw_import_batch(batch_id)
);

CREATE INDEX idx_fact_territory ON fact_statistic(territory_id);
CREATE INDEX idx_fact_indicator ON fact_statistic(indicator_id);
CREATE INDEX idx_fact_period ON fact_statistic(period_year);

-- =====================================================================
-- EXTENSIBILIDAD: BREAKDOWN DIMENSIONS (futuro)
-- =====================================================================
-- Para datos anidados (educación por nivel, salud por tipo, economía
-- por sector CIIU), se añadirán:
--   dim_breakdown_type  (age_group, sex, facility_type, ciiu_section...)
--   fact_statistic_breakdown  (fact_id, breakdown_type_id, breakdown_value,
--                              numeric_value)
-- Esto NO se implementa ahora. Los datasets complejos se mantienen en
-- dataset_assets (Phase 1) hasta que se definan estas extensiones.
-- =====================================================================
