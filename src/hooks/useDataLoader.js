/**
 * useDataLoader.js - Hook de Carga de Datos
 *
 * Responsable de cargar todos los archivos JSON al iniciar la aplicación.
 * Separado de useMunicipioData para mejorar la mantenibilidad.
 *
 * Retorna un objeto con todos los datasets crudos (sin filtrar).
 */

import { useEffect, useState } from "react";
import { buildCondicionVidaParsed } from "../utils/dataHelpers";

export default function useDataLoader() {
    const [loaded, setLoaded] = useState(false);

    // Index
    const [regionsIndexData, setRegionsIndexData] = useState([]);

    // All datasets
    const [municipiosIndexData, setMunicipiosIndexData] = useState([]);
    const [indicadoresBasicosData, setIndicadoresBasicosData] = useState([]);
    const [pyramidsData, setPyramidsData] = useState([]);
    const [economiaEmpleoData, setEconomiaEmpleoData] = useState([]);
    const [educacionData, setEducacionData] = useState([]);
    const [educacionNivelData, setEducacionNivelData] = useState([]);

    const [pyramid2010Data, setPyramid2010Data] = useState([]);
    const [adm2Map2010, setAdm2Map2010] = useState({});

    const [hogaresResumenData, setHogaresResumenData] = useState([]);
    const [hogaresTamanoData, setHogaresTamanoData] = useState([]);
    const [poblacionUrbanaRuralData, setPoblacionUrbanaRuralData] = useState([]);

    // Province datasets
    const [educacionProvinciaData, setEducacionProvinciaData] = useState([]);
    const [hogaresResumenProvinciaData, setHogaresResumenProvinciaData] = useState([]);
    const [hogaresTamanoProvinciaData, setHogaresTamanoProvinciaData] = useState([]);
    const [poblacionUrbanaRuralProvinciaData, setPoblacionUrbanaRuralProvinciaData] = useState([]);
    const [ticProvinciaData, setTicProvinciaData] = useState([]);
    const [condicionVidaProvinciaData, setCondicionVidaProvinciaData] = useState([]);
    const [saludEstablecimientosProvinciaData, setSaludEstablecimientosProvinciaData] = useState([]);
    const [economiaEmpleoProvinciaData, setEconomiaEmpleoProvinciaData] = useState([]);
    const [educacionNivelProvinciaData, setEducacionNivelProvinciaData] = useState([]);
    const [pyramidsProvinciaData, setPyramidsProvinciaData] = useState([]);
    const [pyramid2010ProvinciaData, setPyramid2010ProvinciaData] = useState([]);

    // Datos de oferta educativa municipal (para promedios ponderados)
    const [educacionOfertaMunicipalData, setEducacionOfertaMunicipalData] = useState([]);

    // Datos de TIC (Tecnologías de Información y Comunicación)
    const [ticData, setTicData] = useState([]);

    // Condición de Vida
    const [condicionVidaData, setCondicionVidaData] = useState([]);
    const [nationalCondicionVida, setNationalCondicionVida] = useState(null);

    // National datasets
    const [nationalBasic, setNationalBasic] = useState([]);
    const [nationalEcon, setNationalEcon] = useState([]);

    // Datos de establecimientos de salud
    const [saludEstablecimientosData, setSaludEstablecimientosData] = useState({});

    // Datos nacionales adicionales para comparación
    const [nationalTic, setNationalTic] = useState(null);
    const [nationalEducNivel, setNationalEducNivel] = useState(null);
    const [nationalEducOferta, setNationalEducOferta] = useState(null);
    const [nationalHogares, setNationalHogares] = useState(null);
    const [nationalSalud, setNationalSalud] = useState(null);

    // ---------------------------------------------------------------------------
    // Cargar archivos JSON (incluye datos nacionales)
    // ---------------------------------------------------------------------------
    useEffect(() => {
        async function loadAll() {
            try {
                // ---- Municipales / seccionales ----
                const [
                    municipiosIndexData,
                    indicadoresBasicosData,
                    pyramidsData,
                    economiaEmpleoData,
                    educacionData,
                    educacionNivelData,
                    pyramid2010Data,
                    adm2Map2010,
                    hogaresResumenData,
                    hogaresTamanoData,
                    poblacionUrbanaRuralData,
                    ticData,
                    saludEstablecimientosData,
                    condicionVidaData,
                    educacionOfertaMunicipalData,
                    regionsIndexData,
                ] = await Promise.all([
                    import("../data/municipios_index.json").then((m) => m.default),
                    import("../data/indicadores_basicos.json").then((m) => m.default),
                    import("../data/pyramids.json").then((m) => m.default),
                    import("../data/economia_empleo.json").then((m) => m.default),
                    import("../data/educacion.json").then((m) => m.default),
                    import("../data/educacion_nivel.json").then((m) => m.default),
                    import("../data/edad_sexo_2010.json").then((m) => m.default),
                    import("../data/adm2_map_2010.json").then((m) => m.default),
                    import("../data/hogares_resumen.json").then((m) => m.default),
                    import("../data/tamano_hogar.json").then((m) => m.default),
                    import("../data/poblacion_urbana_rural.json").then((m) => m.default),
                    import("../data/tic.json").then((m) => m.default),
                    import("../data/salud_establecimientos.json").then((m) => m.default),
                    import("../data/condicion_vida.json").then((m) => m.default),
                    import("../data/educacion_oferta_municipal.json").then((m) => m.default),
                    import("../data/regions_index.json").then((m) => m.default),
                ]);

                setMunicipiosIndexData(municipiosIndexData);
                setIndicadoresBasicosData(indicadoresBasicosData);
                setPyramidsData(pyramidsData);
                setEconomiaEmpleoData(economiaEmpleoData);
                setEducacionData(educacionData);
                setEducacionNivelData(educacionNivelData);
                setPyramid2010Data(pyramid2010Data);
                setAdm2Map2010(adm2Map2010);
                setHogaresResumenData(hogaresResumenData);
                setHogaresTamanoData(hogaresTamanoData);
                setPoblacionUrbanaRuralData(poblacionUrbanaRuralData);
                setTicData(ticData);
                setSaludEstablecimientosData(saludEstablecimientosData);
                setCondicionVidaData(condicionVidaData);
                setEducacionOfertaMunicipalData(educacionOfertaMunicipalData);
                setRegionsIndexData(regionsIndexData);

                // ---- Provincia Level Data ----
                const [
                    educacionProvinciaData,
                    hogaresResumenProvinciaData,
                    hogaresTamanoProvinciaData,
                    poblacionUrbanaRuralProvinciaData,
                    ticProvinciaData,
                    condicionVidaProvinciaData,
                    saludEstablecimientosProvinciaData,
                    economiaEmpleoProvinciaData,
                    educacionNivelProvinciaData,
                    pyramidsProvinciaData,
                    pyramid2010ProvinciaData,
                ] = await Promise.all([
                    import("../data/educacion_provincia.json").then((m) => m.default),
                    import("../data/hogares_resumen_provincia.json").then((m) => m.default),
                    import("../data/tamano_hogar_provincia.json").then((m) => m.default),
                    import("../data/poblacion_urbana_rural_provincia.json").then((m) => m.default),
                    import("../data/tic_provincia.json").then((m) => m.default),
                    import("../data/condicion_vida_provincia.json").then((m) => m.default),
                    import("../data/salud_establecimientos_provincia.json").then((m) => m.default),
                    import("../data/economia_empleo_provincia.json").then((m) => m.default),
                    import("../data/educacion_nivel_provincia.json").then((m) => m.default),
                    import("../data/pyramids_provincia.json").then((m) => m.default),
                    import("../data/edad_sexo_2010_provincia.json").then((m) => m.default),
                ]);

                setEducacionProvinciaData(educacionProvinciaData);
                setHogaresResumenProvinciaData(hogaresResumenProvinciaData);
                setHogaresTamanoProvinciaData(hogaresTamanoProvinciaData);
                setPoblacionUrbanaRuralProvinciaData(poblacionUrbanaRuralProvinciaData);
                setTicProvinciaData(ticProvinciaData);
                setCondicionVidaProvinciaData(condicionVidaProvinciaData);
                setSaludEstablecimientosProvinciaData(saludEstablecimientosProvinciaData);
                setEconomiaEmpleoProvinciaData(economiaEmpleoProvinciaData);
                setEducacionNivelProvinciaData(educacionNivelProvinciaData);
                setPyramidsProvinciaData(pyramidsProvinciaData);
                setPyramid2010ProvinciaData(pyramid2010ProvinciaData);

                // ---- National ----
                const [
                    nationalBasic,
                    nationalEcon,
                    nationalTic,
                    nationalEducNivel,
                    nationalEducOferta,
                    nationalHogares,
                    nationalSalud,
                    nationalCondicionVidaRaw,
                ] = await Promise.all([
                    import("../data/national_basic.json").then((m) => m.default),
                    import("../data/national_economia_empleo.json").then((m) => m.default),
                    import("../data/national_tic.json").then((m) => m.default),
                    import("../data/national_educacion_nivel.json").then((m) => m.default),
                    import("../data/national_educacion_oferta.json").then((m) => m.default),
                    import("../data/national_hogares.json").then((m) => m.default),
                    import("../data/national_salud_establecimientos.json").then((m) => m.default),
                    import("../data/national_condicion_vida.json").then((m) => m.default),
                ]);

                setNationalBasic(nationalBasic);
                setNationalEcon(nationalEcon);
                setNationalTic(nationalTic);
                setNationalEducNivel(nationalEducNivel);
                setNationalEducOferta(nationalEducOferta);
                setNationalHogares(nationalHogares);
                setNationalSalud(nationalSalud);

                const nationalWrapped = {
                    servicios: {
                        servicios_sanitarios: nationalCondicionVidaRaw.servicios_sanitarios,
                        agua_uso_domestico: nationalCondicionVidaRaw.agua_uso_domestico,
                        agua_para_beber: nationalCondicionVidaRaw.agua_para_beber,
                        combustible_cocinar: nationalCondicionVidaRaw.combustible_cocinar,
                        alumbrado: nationalCondicionVidaRaw.alumbrado,
                        eliminacion_basura: nationalCondicionVidaRaw.eliminacion_basura,
                    },
                };
                setNationalCondicionVida(buildCondicionVidaParsed(nationalWrapped));

                setLoaded(true);
            } catch (err) {
                console.error("🔥 Data loading failed:", err);
            }
        }

        loadAll();
    }, []);

    return {
        loaded,
        regionsIndexData,
        municipiosIndexData,
        indicadoresBasicosData,
        pyramidsData,
        economiaEmpleoData,
        educacionData,
        educacionNivelData,
        pyramid2010Data,
        adm2Map2010,
        hogaresResumenData,
        hogaresTamanoData,
        poblacionUrbanaRuralData,
        educacionProvinciaData,
        hogaresResumenProvinciaData,
        hogaresTamanoProvinciaData,
        poblacionUrbanaRuralProvinciaData,
        ticProvinciaData,
        condicionVidaProvinciaData,
        saludEstablecimientosProvinciaData,
        economiaEmpleoProvinciaData,
        educacionNivelProvinciaData,
        pyramidsProvinciaData,
        pyramid2010ProvinciaData,
        educacionOfertaMunicipalData,
        ticData,
        condicionVidaData,
        nationalCondicionVida,
        nationalBasic,
        nationalEcon,
        saludEstablecimientosData,
        nationalTic,
        nationalEducNivel,
        nationalEducOferta,
        nationalHogares,
        nationalSalud,
    };
}
