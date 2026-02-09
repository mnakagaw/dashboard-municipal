// src/utils/educationHelpers.js

/**
 * Calculates education level percentages from a level object containing counts.
 * 
 * @param {Object} nivel - Object with keys: ninguno, preprimaria, primaria, secundaria, superior
 *                         Each key should be an object with a 'total' property (or be the count itself if structure varies, 
 *                         but based on JSONs it's usually { total: number }).
 * @returns {Object|null} - { ninguno: number, secundaria_superior: number } (percentages) or null if invalid.
 */
export function computeNivelPct(nivel) {
    if (!nivel) return null;

    // Helper to safely get total from a level node (handle { total: X } or null)
    const getVal = (node) => node?.total ?? 0;

    const n = getVal(nivel.ninguno);
    const pre = getVal(nivel.preprimaria);
    const pri = getVal(nivel.primaria) || getVal(nivel.primaria_basica);
    const sec = getVal(nivel.secundaria) || getVal(nivel.secundaria_media);
    const sup = getVal(nivel.superior) || getVal(nivel.universitaria_superior);
    const post = getVal(nivel.postgrado);

    const total = n + pre + pri + sec + sup + post;

    if (total === 0) return null;

    const toPct = (val) => (val * 100) / total;

    return {
        ninguno: toPct(n),
        secundaria_superior: toPct(sec + sup + post),
    };
}
