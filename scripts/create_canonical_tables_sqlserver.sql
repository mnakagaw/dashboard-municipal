-- =====================================================================
-- Dashboard Territorial - Phase 2: Canonical Schema
-- Motor: SQL Server (Transact-SQL)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RAW / STAGING LAYER
-- ---------------------------------------------------------------------
IF OBJECT_ID('raw_import_batch', 'U') IS NOT NULL DROP TABLE raw_import_batch;
CREATE TABLE raw_import_batch (
    batch_id INT IDENTITY(1,1) PRIMARY KEY,
    batch_name NVARCHAR(255) NOT NULL,          -- Ej: 'Carga Censo 2022 - Demografia'
    source_filename NVARCHAR(255) NOT NULL,     -- Ej: 'censo_2022_final.xlsx'
    import_date DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(50) DEFAULT 'PROCESSING',   -- 'PROCESSING', 'SUCCESS', 'FAILED'
    records_processed INT DEFAULT 0,
    notes NVARCHAR(MAX)
);

-- ---------------------------------------------------------------------
-- 2. CANONICAL LAYER (Tablas Dimensionales)
-- ---------------------------------------------------------------------

IF OBJECT_ID('fact_statistic', 'U') IS NOT NULL DROP TABLE fact_statistic;
IF OBJECT_ID('dim_source', 'U') IS NOT NULL DROP TABLE dim_source;
IF OBJECT_ID('dim_indicator', 'U') IS NOT NULL DROP TABLE dim_indicator;
IF OBJECT_ID('dim_domain', 'U') IS NOT NULL DROP TABLE dim_domain;
IF OBJECT_ID('dim_territory', 'U') IS NOT NULL DROP TABLE dim_territory;

CREATE TABLE dim_territory (
    territory_id INT IDENTITY(1,1) PRIMARY KEY,
    territory_code NVARCHAR(50) NOT NULL UNIQUE, 
    territory_name NVARCHAR(100) NOT NULL,
    territory_type NVARCHAR(50) NOT NULL,        -- 'municipio', 'provincia', 'region', 'nacional'
    parent_territory_id INT NULL,
    region_oficial_ley345 NVARCHAR(100) NULL,
    FOREIGN KEY (parent_territory_id) REFERENCES dim_territory(territory_id)
);

CREATE TABLE dim_domain (
    domain_id INT IDENTITY(1,1) PRIMARY KEY,
    domain_code NVARCHAR(50) NOT NULL UNIQUE,
    domain_name NVARCHAR(100) NOT NULL
);

CREATE TABLE dim_indicator (
    indicator_id INT IDENTITY(1,1) PRIMARY KEY,
    indicator_code NVARCHAR(100) NOT NULL UNIQUE, 
    indicator_name NVARCHAR(255) NOT NULL,
    domain_id INT NOT NULL,
    unit NVARCHAR(50) NULL,                       -- 'absoluto', 'porcentaje', 'tasa_por_10k'
    data_type NVARCHAR(50) NULL,                  -- 'numeric', 'text'
    aggregation_method NVARCHAR(50) NULL,         -- 'sum', 'avg', 'weighted_avg'
    display_hints NVARCHAR(255) NULL,
    FOREIGN KEY (domain_id) REFERENCES dim_domain(domain_id)
);

CREATE TABLE dim_source (
    source_id INT IDENTITY(1,1) PRIMARY KEY,
    source_name NVARCHAR(255) NOT NULL,
    institution NVARCHAR(100) NULL,
    source_type NVARCHAR(100) NULL,
    source_ref NVARCHAR(255) NULL,
    reference_year INT NULL,
    update_date DATETIME2 NULL,
    notes NVARCHAR(MAX) NULL
);

-- ---------------------------------------------------------------------
-- 3. CANONICAL LAYER (Tabla de Hechos Central)
-- ---------------------------------------------------------------------

CREATE TABLE fact_statistic (
    fact_id INT IDENTITY(1,1) PRIMARY KEY,
    territory_id INT NOT NULL,
    indicator_id INT NOT NULL,
    source_id INT NOT NULL,
    batch_id INT NULL,
    period_year INT NULL,
    numeric_value DECIMAL(18, 4) NULL,
    text_value NVARCHAR(255) NULL,
    quality_flag NVARCHAR(50) NULL,
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (indicator_id) REFERENCES dim_indicator(indicator_id),
    FOREIGN KEY (source_id) REFERENCES dim_source(source_id),
    FOREIGN KEY (batch_id) REFERENCES raw_import_batch(batch_id)
);

-- Índices de rendimiento
CREATE INDEX idx_fact_territory ON fact_statistic(territory_id);
CREATE INDEX idx_fact_indicator ON fact_statistic(indicator_id);
CREATE INDEX idx_fact_period ON fact_statistic(period_year);
