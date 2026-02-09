// src/hooks/useMunicipioData.js
import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function normalizeAdm2(code) {
  if (!code) return null;
  const c = String(code).trim();
  return c.padStart(5, "0");
}

function buildLongMap(longData) {
  const map = new Map();
  for (const row of longData || []) {
    const key = normalizeAdm2(row.adm2_code);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function buildProvinceMap(data) {
  const map = new Map();
  for (const row of data || []) {
    if (!row.provincia) continue;
    // Normalize key? Maybe just use the string as is.
    const key = row.provincia;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Condición de Vida → Percent Builder
// ---------------------------------------------------------------------------
function buildCondicionVidaParsed(raw) {
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

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------
export default function useMunicipioData(selectedProvince, selectionKey) {
  const [loaded, setLoaded] = useState(false);

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

  // ★ New: Education Offer (Municipal) for weighted averages
  const [educacionOfertaMunicipalData, setEducacionOfertaMunicipalData] = useState([]);

  // TIC データ
  const [ticData, setTicData] = useState([]);

  // Condición de Vida
  const [condicionVidaData, setCondicionVidaData] = useState([]);
  const [nationalCondicionVida, setNationalCondicionVida] = useState(null);

  // National datasets
  const [nationalBasic, setNationalBasic] = useState([]);
  const [nationalEcon, setNationalEcon] = useState([]);

  // 上のほうの state 群に追加
  const [saludEstablecimientosData, setSaludEstablecimientosData] = useState({});

  // ★ 新規
  const [nationalTic, setNationalTic] = useState(null);
  const [nationalEducNivel, setNationalEducNivel] = useState(null);
  const [nationalEducOferta, setNationalEducOferta] = useState(null);
  const [nationalHogares, setNationalHogares] = useState(null);
  const [nationalSalud, setNationalSalud] = useState(null);



  // ---------------------------------------------------------------------------
  // Load JSON  ★ national_* も含めた版
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function loadAll() {
      const load = async (path) => {
        // console.log("[LOAD]", path);
        try {
          const res = await fetch(path);

          if (!res.ok) {
            console.error("[FAILED]", path, "HTTP", res.status);
            throw new Error(`HTTP ${res.status}`);
          }

          const json = await res.json();
          // console.log("[OK]", path);
          return json;
        } catch (err) {
          // console.error("[ERROR] JSON invalid:", path, err.message);
          throw err;
        }
      };

      try {
        // ---- Municipales / seccionales ----
        setMunicipiosIndexData(
          await load(`${import.meta.env.BASE_URL}data/municipios_index.json`)
        );
        setIndicadoresBasicosData(
          await load(`${import.meta.env.BASE_URL}data/indicadores_basicos.json`)
        );
        setPyramidsData(
          await load(`${import.meta.env.BASE_URL}data/pyramids.json`)
        );
        setEconomiaEmpleoData(
          await load(`${import.meta.env.BASE_URL}data/economia_empleo.json`)
        );
        // vivienda removed
        setEducacionData(
          await load(`${import.meta.env.BASE_URL}data/educacion.json`)
        );
        // seguridad removed
        setEducacionNivelData(
          await load(`${import.meta.env.BASE_URL}data/educacion_nivel.json`)
        );
        // registro_civil removed
        // salud removed (only salud_establecimientos kept)
        // telecom removed
        // pobreza removed
        // trabajo removed
        // elecciones removed

        setPyramid2010Data(
          await load(`${import.meta.env.BASE_URL}data/edad_sexo_2010.json`)
        );
        setAdm2Map2010(
          await load(`${import.meta.env.BASE_URL}data/adm2_map_2010.json`)
        );

        setHogaresResumenData(
          await load(`${import.meta.env.BASE_URL}data/hogares_resumen.json`)
        );
        setHogaresTamanoData(
          await load(`${import.meta.env.BASE_URL}data/tamano_hogar.json`)
        );
        setPoblacionUrbanaRuralData(
          await load(
            `${import.meta.env.BASE_URL}data/poblacion_urbana_rural.json`
          )
        );

        // TIC municipal
        setTicData(await load(`${import.meta.env.BASE_URL}data/tic.json`));

        // Salud: establecimientos por municipio (ADM2)
        setSaludEstablecimientosData(
          await load(
            `${import.meta.env.BASE_URL}data/salud_establecimientos.json`
          )
        );

        // Condición de vida (municipal)
        setCondicionVidaData(
          await load(`${import.meta.env.BASE_URL}data/condicion_vida.json`)
        );

        // ★ Load Education Offer (Municipal)
        setEducacionOfertaMunicipalData(
          await load(`${import.meta.env.BASE_URL}data/educacion_oferta_municipal.json`)
        );

        // ---- Provincia Level Data ----
        // vivienda_provincia removed
        setEducacionProvinciaData(await load(`${import.meta.env.BASE_URL}data/educacion_provincia.json`));
        // seguridad_provincia removed
        // registro_civil_provincia removed
        // salud_provincia removed
        // telecom_provincia removed
        // pobreza_provincia removed
        // trabajo_provincia removed
        // elecciones_provincia removed
        setHogaresResumenProvinciaData(await load(`${import.meta.env.BASE_URL}data/hogares_resumen_provincia.json`));
        setHogaresTamanoProvinciaData(await load(`${import.meta.env.BASE_URL}data/tamano_hogar_provincia.json`));
        setPoblacionUrbanaRuralProvinciaData(await load(`${import.meta.env.BASE_URL}data/poblacion_urbana_rural_provincia.json`));
        setTicProvinciaData(await load(`${import.meta.env.BASE_URL}data/tic_provincia.json`));
        setCondicionVidaProvinciaData(await load(`${import.meta.env.BASE_URL}data/condicion_vida_provincia.json`));
        setSaludEstablecimientosProvinciaData(await load(`${import.meta.env.BASE_URL}data/salud_establecimientos_provincia.json`));
        setEconomiaEmpleoProvinciaData(await load(`${import.meta.env.BASE_URL}data/economia_empleo_provincia.json`));
        setEducacionNivelProvinciaData(await load(`${import.meta.env.BASE_URL}data/educacion_nivel_provincia.json`));
        setPyramidsProvinciaData(await load(`${import.meta.env.BASE_URL}data/pyramids_provincia.json`));
        setPyramid2010ProvinciaData(await load(`${import.meta.env.BASE_URL}data/edad_sexo_2010_provincia.json`));

        // ---- National (básicos / economía / temáticos) ----
        setNationalBasic(
          await load(`${import.meta.env.BASE_URL}data/national_basic.json`)
        );
        setNationalEcon(
          await load(
            `${import.meta.env.BASE_URL}data/national_economia_empleo.json`
          )
        );
        // national_thematic removed

        // National TIC
        setNationalTic(
          await load(`${import.meta.env.BASE_URL}data/national_tic.json`)
        );

        // National educación (niveles e infraestructura/oferta)
        setNationalEducNivel(
          await load(
            `${import.meta.env.BASE_URL}data/national_educacion_nivel.json`
          )
        );
        setNationalEducOferta(
          await load(
            `${import.meta.env.BASE_URL}data/national_educacion_oferta.json`
          )
        );

        // National hogares (estructura, tamaño, urbano/rural 等)
        setNationalHogares(
          await load(`${import.meta.env.BASE_URL}data/national_hogares.json`)
        );

        // National salud (establecimientos por tipo / nivel)
        setNationalSalud(
          await load(
            `${import.meta.env.BASE_URL}data/national_salud_establecimientos.json`
          )
        );

        // ---- National Condición de Vida （形式を municipal 用に合わせてラップ）----
        const nationalRaw = await load(
          `${import.meta.env.BASE_URL}data/national_condicion_vida.json`
        );

        const nationalWrapped = {
          servicios: {
            servicios_sanitarios: nationalRaw.servicios_sanitarios,
            agua_uso_domestico: nationalRaw.agua_uso_domestico,
            agua_para_beber: nationalRaw.agua_para_beber,
            combustible_cocinar: nationalRaw.combustible_cocinar,
            alumbrado: nationalRaw.alumbrado,
            eliminacion_basura: nationalRaw.eliminacion_basura,
          },
        };

        setNationalCondicionVida(buildCondicionVidaParsed(nationalWrapped));

        setLoaded(true);
      } catch (err) {
        console.error("🔥 loadAll() 中断！壊れている JSON:", err.message);
      }
    }

    loadAll();
  }, []);


  // ---------------------------------------------------------------------------
  // Index
  // ---------------------------------------------------------------------------
  const municipiosIndex = useMemo(() => {
    return [...municipiosIndexData].sort((a, b) => {
      if (a.provincia === b.provincia) {
        return a.municipio.localeCompare(b.municipio, "es-DO");
      }
      return a.provincia.localeCompare(b.provincia, "es-DO");
    });
  }, [municipiosIndexData]);

  const provincias = useMemo(() => {
    const set = new Set(municipiosIndex.map((m) => m.provincia));
    return [...set].sort((a, b) => a.localeCompare(b, "es-DO"));
  }, [municipiosIndex]);

  // ---------------------------------------------------------------------------
  // Selection logic
  // ---------------------------------------------------------------------------
  const isProvinceSelection = useMemo(
    () => selectionKey && selectionKey.startsWith("prov:"),
    [selectionKey]
  );

  const selectedAdm2 = !isProvinceSelection ? selectionKey : null;
  const selectedProvinceScope = isProvinceSelection
    ? selectionKey.replace("prov:", "")
    : selectedProvince;

  const selectedAdm2Norm = normalizeAdm2(selectedAdm2);

  // Selected Municipio object
  const selectedMunicipio = useMemo(() => {
    if (selectedAdm2) {
      return municipiosIndex.find((m) => m.adm2_code === selectedAdm2) || null;
    }
    if (isProvinceSelection && selectedProvinceScope) {
      return {
        adm2_code: null,
        municipio: `Provincia de ${selectedProvinceScope}`,
        provincia: selectedProvinceScope,
        region:
          municipiosIndex.find((m) => m.provincia === selectedProvinceScope)
            ?.region || "",
      };
    }
    return null;
  }, [municipiosIndex, selectedAdm2, isProvinceSelection, selectedProvinceScope]);

  // ---------------------------------------------------------------------------
  // Maps
  // ---------------------------------------------------------------------------
  const indicadoresMap = useMemo(() => {
    const m = new Map();
    for (const r of indicadoresBasicosData) {
      m.set(normalizeAdm2(r.adm2_code), r);
    }
    return m;
  }, [indicadoresBasicosData]);

  const econMap = useMemo(() => {
    const m = new Map();
    for (const r of economiaEmpleoData) {
      m.set(normalizeAdm2(r.adm2_code), r);
    }
    return m;
  }, [economiaEmpleoData]);

  const pyramidMap = useMemo(() => pyramidsData || {}, [pyramidsData]);

  const pyramid2010Map = useMemo(() => {
    const m = new Map();
    for (const r of pyramid2010Data) {
      const key = normalizeAdm2(r.adm2_code);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push({
        age_group: r.age_group,
        male: r.male,
        female: r.female,
      });
    }
    return m;
  }, [pyramid2010Data]);

  const educacionMap = useMemo(() => buildLongMap(educacionData), [educacionData]);
  // saludMap removed

  // Is saludMap used? Yes, in return object. But wait, App.jsx uses saludEstablecimientosData directly via prop.
  // Let's check usage of saludRecords.
  // App.jsx passes `salud={saludEstablecimientos}` to ResumenNarrativoSection.
  // App.jsx passes `saludEstablecimientos={saludEstablecimientos}` to SaludSection.
  // `saludRecords` (from `saludMap`) seems unused or redundant if `saludEstablecimientos` is the main one.
  // Actually, `salud.json` was removed. `salud_establecimientos.json` is kept.
  // `saludMap` was built from `saludData`. `saludData` is removed.
  // So `saludMap` should be removed.

  const educacionNivelMap = useMemo(
    () => buildLongMap(educacionNivelData),
    [educacionNivelData]
  );

  const hogaresResumenMap = useMemo(
    () => buildLongMap(hogaresResumenData),
    [hogaresResumenData]
  );
  const hogaresTamanoMap = useMemo(
    () => buildLongMap(hogaresTamanoData),
    [hogaresTamanoData]
  );
  const poblacionUrbanaRuralMap = useMemo(
    () => buildLongMap(poblacionUrbanaRuralData),
    [poblacionUrbanaRuralData]
  );

  // Province Maps
  const educacionProvinciaMap = useMemo(() => buildProvinceMap(educacionProvinciaData), [educacionProvinciaData]);
  const hogaresResumenProvinciaMap = useMemo(() => buildProvinceMap(hogaresResumenProvinciaData), [hogaresResumenProvinciaData]);
  const hogaresTamanoProvinciaMap = useMemo(() => buildProvinceMap(hogaresTamanoProvinciaData), [hogaresTamanoProvinciaData]);
  const poblacionUrbanaRuralProvinciaMap = useMemo(() => buildProvinceMap(poblacionUrbanaRuralProvinciaData), [poblacionUrbanaRuralProvinciaData]);
  const ticProvinciaMap = useMemo(() => buildProvinceMap(ticProvinciaData), [ticProvinciaData]);
  const saludEstablecimientosProvinciaMap = useMemo(() => buildProvinceMap(saludEstablecimientosProvinciaData), [saludEstablecimientosProvinciaData]);
  const economiaEmpleoProvinciaMap = useMemo(() => buildProvinceMap(economiaEmpleoProvinciaData), [economiaEmpleoProvinciaData]);
  const educacionNivelProvinciaMap = useMemo(() => buildProvinceMap(educacionNivelProvinciaData), [educacionNivelProvinciaData]);
  const pyramidsProvinciaMap = useMemo(() => buildProvinceMap(pyramidsProvinciaData), [pyramidsProvinciaData]);
  const pyramid2010ProvinciaMap = useMemo(() => buildProvinceMap(pyramid2010ProvinciaData), [pyramid2010ProvinciaData]);

  // ---------------------------------------------------------------------------
  // Indicators
  // ---------------------------------------------------------------------------
  const indicadores = useMemo(() => {
    if (selectedAdm2) {
      return indicadoresMap.get(normalizeAdm2(selectedAdm2)) || null;
    }

    if (isProvinceSelection && selectedProvinceScope) {
      const rows = indicadoresBasicosData.filter(
        (r) => r.provincia === selectedProvinceScope
      );
      if (!rows.length) return null;

      const sum = (field) => rows.reduce((a, r) => a + (r[field] ?? 0), 0);

      return {
        adm2_code: null,
        municipio: `Provincia de ${selectedProvinceScope}`,
        provincia: selectedProvinceScope,
        poblacion_total: sum("poblacion_total"),
        poblacion_hombres: sum("poblacion_hombres"),
        poblacion_mujeres: sum("poblacion_mujeres"),
      };
    }

    return null;
  }, [
    selectedAdm2,
    isProvinceSelection,
    selectedProvinceScope,
    indicadoresBasicosData,
    indicadoresMap,
  ]);

  // ---------------------------------------------------------------------------
  // Other datasets
  // ---------------------------------------------------------------------------
  const econ = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = economiaEmpleoProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (selectedAdm2) {
      return econMap.get(normalizeAdm2(selectedAdm2)) || null;
    }
    return null;
  }, [econMap, selectedAdm2, isProvinceSelection, selectedProvinceScope, economiaEmpleoProvinciaMap]);

  const pyramid = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = pyramidsProvinciaMap.get(selectedProvinceScope) || [];
      // rows[0] should contain { age_groups: [...] }
      return rows[0]?.age_groups || [];
    }
    if (selectedAdm2) {
      const entry = pyramidMap[selectedAdm2];
      return entry?.age_groups || [];
    }
    return [];
  }, [pyramidMap, pyramidsProvinciaMap, selectedAdm2, isProvinceSelection, selectedProvinceScope]);

  // 2010 Pyramid
  const selectedAdm22010 = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return null;
    const code2010 = adm2Map2010[selectedAdm2Norm];
    return code2010 ? normalizeAdm2(code2010) : null;
  }, [selectedAdm2Norm, isProvinceSelection, adm2Map2010]);

  const pyramid2010 = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = pyramid2010ProvinciaMap.get(selectedProvinceScope) || [];
      // rows is array of { age_group, male, female }
      return rows;
    }
    if (!selectedAdm22010) return [];
    return pyramid2010Map.get(selectedAdm22010) || [];
  }, [selectedAdm22010, isProvinceSelection, selectedProvinceScope, pyramid2010Map, pyramid2010ProvinciaMap]);

  const educacionNivel = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      return educacionNivelProvinciaMap.get(selectedProvinceScope) || [];
    }
    if (!selectedAdm2Norm) return [];
    return educacionNivelMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, educacionNivelMap, educacionNivelProvinciaMap]);

  // ---------------------------------------------------------------------------
  // Records by ADM2
  // ---------------------------------------------------------------------------
  const educacionRecords = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      return educacionProvinciaMap.get(selectedProvinceScope) || [];
    }
    if (!selectedAdm2Norm) return [];
    return educacionMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, educacionMap, educacionProvinciaMap]);

  const hogaresResumen = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = hogaresResumenProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (!selectedAdm2Norm) return null;
    const rows = hogaresResumenMap.get(selectedAdm2Norm) || [];
    return rows[0] || null;
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, hogaresResumenMap, hogaresResumenProvinciaMap]);

  const hogaresTamanoRecords = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      return hogaresTamanoProvinciaMap.get(selectedProvinceScope) || [];
    }
    if (!selectedAdm2Norm) return [];
    return hogaresTamanoMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, hogaresTamanoMap, hogaresTamanoProvinciaMap]);

  const poblacionUrbanaRural = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = poblacionUrbanaRuralProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (!selectedAdm2Norm) return null;
    const rows = poblacionUrbanaRuralMap.get(selectedAdm2Norm) || [];
    return rows[0] || null;
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, poblacionUrbanaRuralMap, poblacionUrbanaRuralProvinciaMap]);

  // ---------------------------------------------------------------------------
  // TIC Map & Record（raw のまま）※ rate_used を Section 側で % にする
  // ---------------------------------------------------------------------------
  const ticMap = useMemo(() => {
    const m = new Map();
    for (const r of ticData || []) {
      const key = normalizeAdm2(r.adm2_code);
      if (!key) continue;
      m.set(key, r);
    }
    return m;
  }, [ticData]);

  const tic = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = ticProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (!selectedAdm2Norm) return null;
    return ticMap.get(selectedAdm2Norm) || null;
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, ticMap, ticProvinciaMap]);

  // ---------------------------------------------------------------------------
  // Condición de Vida（municipio）
  // ---------------------------------------------------------------------------
  const condicionVidaRaw = useMemo(() => {
    if (isProvinceSelection && selectedProvinceScope) {
      return condicionVidaProvinciaData.find(c => c.provincia === selectedProvinceScope) || null;
    }
    if (!selectedAdm2Norm) return null;
    return (
      condicionVidaData.find(
        (c) => String(c.adm2_code).padStart(5, "0") === selectedAdm2Norm
      ) || null
    );
  }, [condicionVidaData, condicionVidaProvinciaData, selectedAdm2Norm, isProvinceSelection, selectedProvinceScope]);

  const condicionVida = useMemo(() => {
    return buildCondicionVidaParsed(condicionVidaRaw);
  }, [condicionVidaRaw]);

  // ---------------------------------------------------------------------------
  // Options for selects
  // ---------------------------------------------------------------------------
  const municipioOptions = useMemo(() => {
    if (!selectedProvince) return [];
    const opts = municipiosIndex
      .filter((m) => m.provincia === selectedProvince)
      .map((m) => ({
        value: m.adm2_code,
        label: m.municipio,
      }));

    opts.push({
      value: `prov:${selectedProvince}`,
      label: `${selectedProvince} (provincia completa)`,
    });

    return opts;
  }, [municipiosIndex, selectedProvince]);

  const provinciaOptions = useMemo(() => {
    return provincias.map((p) => ({ value: p, label: p }));
  }, [provincias]);


  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    loaded,

    municipiosIndex,
    provincias,
    municipioOptions,
    provinciaOptions,

    isProvinceSelection,
    selectedAdm2,
    selectedProvinceScope,
    selectedMunicipio,

    indicadores,
    econ,
    pyramid,
    pyramid2010,

    educacionRecords,
    educacionNivel,

    hogaresResumen,
    hogaresTamanoRecords,
    poblacionUrbanaRural,

    nationalBasic,
    nationalEcon,

    educacionNivel: (isProvinceSelection && selectedProvinceScope)
      ? (educacionNivelProvinciaMap.get(selectedProvinceScope) || [])
      : (educacionNivelMap.get(selectedAdm2Norm) || []),

    tic,
    condicionVida,
    condicionVidaRaw,
    nationalCondicionVida,
    saludEstablecimientos: isProvinceSelection && selectedProvinceScope
      ? (saludEstablecimientosProvinciaMap.get(selectedProvinceScope) || [])[0] || null
      : saludEstablecimientosData,

    saludEstablecimientosProvincia: saludEstablecimientosProvinciaData, // Expose this for now

    // Exposed for comparison table
    hogaresResumenData,
    hogaresResumenProvinciaData,
    poblacionUrbanaRuralData,
    poblacionUrbanaRuralProvinciaData,
    nationalHogares,
    educacionData,
    educacionProvinciaData,
    saludEstablecimientosData,
    saludEstablecimientosProvinciaData,
    nationalSalud,
    nationalBasic,
    nationalEcon,
    nationalTic,
    nationalEducNivel,
    nationalEducOferta,

    condicionVidaProvinciaData,
    ticProvinciaData,
    educacionNivelProvinciaData,
    economiaEmpleoProvinciaData,
    indicadoresBasicosData,
    educacionOfertaMunicipalData,
  };
}
