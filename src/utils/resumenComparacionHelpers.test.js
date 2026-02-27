/**
 * resumenComparacionHelpers.test.js - Smoke tests para buildResumenComparacion
 */
import { describe, it, expect } from "vitest";
import { buildResumenComparacion } from "./resumenComparacionHelpers";

describe("buildResumenComparacion", () => {
    const emptyParams = {
        selectedMunicipio: null,
        indicadores: null,
        condVida: null,
        econ: null,
        educ: [],
        educNivel: [],
        tic: null,
        hogaresResumenData: [],
        poblacionUrbanaRuralData: [],
        educacionData: [],
        saludEstablecimientosData: {},
        hogaresResumenLocal: null,
        poblacionUrbanaRuralLocal: null,
        saludLocal: null,
        condicionVidaProvinciaData: [],
        ticProvinciaData: [],
        educacionNivelProvinciaData: [],
        economiaEmpleoProvinciaData: [],
        indicadoresBasicosData: [],
        hogaresResumenProvinciaData: [],
        poblacionUrbanaRuralProvinciaData: [],
        educacionProvinciaData: [],
        saludEstablecimientosProvinciaData: [],
        nationalBasic: null,
        nationalCondVida: null,
        nationalEcon: null,
        nationalTic: null,
        nationalEducNivel: null,
        nationalHogares: null,
        nationalSalud: null,
        nationalEducOferta: null,
        educacionOfertaMunicipalData: [],
    };

    it("returns an array when called with empty data", () => {
        const result = buildResumenComparacion(emptyParams);
        expect(Array.isArray(result)).toBe(true);
    });

    it("returns an array when called with minimal municipio data", () => {
        const params = {
            ...emptyParams,
            selectedMunicipio: {
                adm2_code: "00101",
                municipio: "Test Municipio",
                provincia: "Test Provincia",
            },
            indicadores: {
                poblacion_total: 50000,
                poblacion_2010: 40000,
                poblacion_hombres: 24000,
                poblacion_mujeres: 26000,
            },
        };
        const result = buildResumenComparacion(params);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it("each row has a group field", () => {
        const params = {
            ...emptyParams,
            selectedMunicipio: {
                adm2_code: "00101",
                municipio: "Test",
                provincia: "Prov",
            },
            indicadores: {
                poblacion_total: 1000,
                poblacion_hombres: 500,
                poblacion_mujeres: 500,
            },
        };
        const result = buildResumenComparacion(params);
        for (const row of result) {
            expect(row).toHaveProperty("group");
        }
    });
});
