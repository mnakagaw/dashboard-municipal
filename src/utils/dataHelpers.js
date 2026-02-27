/**
 * dataHelpers.js - Funciones utilitarias para procesamiento de datos
 *
 * Funciones puras extraídas de useMunicipioData.js para mejorar
 * la mantenibilidad, testabilidad y reutilización.
 */

// ---------------------------------------------------------------------------
// normalizeAdm2 - Normaliza código ADM2 a 5 dígitos con padding
// ---------------------------------------------------------------------------
export function normalizeAdm2(code) {
    if (!code) return null;
    const c = String(code).trim();
    return c.padStart(5, "0");
}

// ---------------------------------------------------------------------------
// buildLongMap - Construye un Map agrupado por adm2_code normalizado
// ---------------------------------------------------------------------------
export function buildLongMap(longData) {
    const map = new Map();
    for (const row of longData || []) {
        const key = normalizeAdm2(row.adm2_code);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
    }
    return map;
}

// ---------------------------------------------------------------------------
// buildProvinceMap - Construye un Map agrupado por nombre de provincia
// ---------------------------------------------------------------------------
export function buildProvinceMap(data) {
    const map = new Map();
    for (const row of data || []) {
        if (!row.provincia) continue;
        const key = row.provincia;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
    }
    return map;
}

// ---------------------------------------------------------------------------
// buildCondicionVidaParsed - Convierte datos brutos de condición de vida
// a porcentajes para cada categoría de servicio
// ---------------------------------------------------------------------------
export function buildCondicionVidaParsed(raw) {
    if (!raw || !raw.servicios) return null;

    const out = {};

    const convert = (total, categorias) => {
        const result = {};
        for (const [key, val] of Object.entries(categorias || {})) {
            result[key] = {
                abs: val,
                pct: total > 0 ? (val / total) * 100 : 0,
            };
        }
        return result;
    };

    const s = raw.servicios;

    // Sanitarios
    if (s.servicios_sanitarios) {
        const t = s.servicios_sanitarios.total;
        out.sanitarios = {
            total: t,
            categorias: convert(t, s.servicios_sanitarios.categorias),
        };
    }

    // Agua uso doméstico
    if (s.agua_uso_domestico) {
        const t = s.agua_uso_domestico.total;
        out.agua_domestico = {
            total: t,
            categorias: convert(t, s.agua_uso_domestico.categorias),
        };
    }

    // Agua para beber
    if (s.agua_para_beber) {
        const t = s.agua_para_beber.total;
        out.agua_beber = {
            total: t,
            categorias: convert(t, s.agua_para_beber.categorias),
        };
    }

    // Alumbrado
    if (s.alumbrado) {
        const t = s.alumbrado.total;
        out.alumbrado = {
            total: t,
            categorias: convert(t, s.alumbrado.categorias),
        };
    }

    // Combustible
    if (s.combustible_cocinar) {
        const t = s.combustible_cocinar.total;
        out.combustible = {
            total: t,
            categorias: convert(t, s.combustible_cocinar.categorias),
        };
    }

    // Basura
    if (s.eliminacion_basura) {
        const t = s.eliminacion_basura.total;
        out.basura = {
            total: t,
            categorias: convert(t, s.eliminacion_basura.categorias),
        };
    }

    return out;
}
