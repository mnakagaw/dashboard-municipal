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
  const [viviendaData, setViviendaData] = useState([]);
  const [educacionData, setEducacionData] = useState([]);
  const [educacionNivel, setEducacionNivel] = useState([]);
  const [seguridadData, setSeguridadData] = useState([]);
  const [registroCivilData, setRegistroCivilData] = useState([]);
  const [saludData, setSaludData] = useState([]);
  const [telecomData, setTelecomData] = useState([]);
  const [pobrezaData, setPobrezaData] = useState([]);
  const [trabajoData, setTrabajoData] = useState([]);
  const [eleccionesData, setEleccionesData] = useState([]);

  const [pyramid2010Data, setPyramid2010Data] = useState([]);
  const [adm2Map2010, setAdm2Map2010] = useState({});

  const [hogaresResumenData, setHogaresResumenData] = useState([]);
  const [hogaresTamanoData, setHogaresTamanoData] = useState([]);
  const [poblacionUrbanaRuralData, setPoblacionUrbanaRuralData] = useState([]);

  // TIC データ
  const [ticData, setTicData] = useState([]);

  // Condición de Vida
  const [condicionVidaData, setCondicionVidaData] = useState([]);
  const [nationalCondicionVida, setNationalCondicionVida] = useState(null);

  // National datasets
  const [nationalBasic, setNationalBasic] = useState([]);
  const [nationalEcon, setNationalEcon] = useState([]);
  const [nationalThematic, setNationalThematic] = useState([]);

  // 上のほうの state 群に追加
const [saludEstablecimientosData, setSaludEstablecimientosData] = useState({});



  // ---------------------------------------------------------------------------
  // Load JSON
  // ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Load JSON  ★ デバッグログ付き版
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
      //  console.log("[OK]", path);
        return json;

      } catch (err) {
      //  console.error("[ERROR] JSON invalid:", path, err.message);
        throw err;
      }
    };

    try {
      setMunicipiosIndexData(await load(`${import.meta.env.BASE_URL}data/municipios_index.json`));
      setIndicadoresBasicosData(await load(`${import.meta.env.BASE_URL}data/indicadores_basicos.json`));
      setPyramidsData(await load(`${import.meta.env.BASE_URL}data/pyramids.json`));
      setEconomiaEmpleoData(await load(`${import.meta.env.BASE_URL}data/economia_empleo.json`));
      setViviendaData(await load(`${import.meta.env.BASE_URL}data/vivienda.json`));
      setEducacionData(await load(`${import.meta.env.BASE_URL}data/educacion.json`));
      setSeguridadData(await load(`${import.meta.env.BASE_URL}data/seguridad.json`));
      setEducacionNivel(await load(`${import.meta.env.BASE_URL}data/educacion_nivel.json`));
      setRegistroCivilData(await load(`${import.meta.env.BASE_URL}data/registro_civil.json`));
      setSaludData(await load(`${import.meta.env.BASE_URL}data/salud.json`));
      setTelecomData(await load(`${import.meta.env.BASE_URL}data/telecom.json`));
      setPobrezaData(await load(`${import.meta.env.BASE_URL}data/pobreza.json`));
      setTrabajoData(await load(`${import.meta.env.BASE_URL}data/trabajo.json`));
      setEleccionesData(await load(`${import.meta.env.BASE_URL}data/elecciones.json`));

      setPyramid2010Data(await load(`${import.meta.env.BASE_URL}data/edad_sexo_2010.json`));
      setAdm2Map2010(await load(`${import.meta.env.BASE_URL}data/adm2_map_2010.json`));

      setHogaresResumenData(await load(`${import.meta.env.BASE_URL}data/hogares_resumen.json`));
      setHogaresTamanoData(await load(`${import.meta.env.BASE_URL}data/tamano_hogar.json`));
      setPoblacionUrbanaRuralData(await load(`${import.meta.env.BASE_URL}data/poblacion_urbana_rural.json`));

      // TIC
      setTicData(await load(`${import.meta.env.BASE_URL}data/tic.json`));

      // ★ Salud Establecimientos ADM2
      setSaludEstablecimientosData(await load(`${import.meta.env.BASE_URL}data/salud_establecimientos.json`));

      // Condición de vida (municipio)
      setCondicionVidaData(await load(`${import.meta.env.BASE_URL}data/condicion_vida.json`));

      // National
      setNationalBasic(await load(`${import.meta.env.BASE_URL}data/national_basic.json`));
      setNationalEcon(await load(`${import.meta.env.BASE_URL}data/national_economia_empleo.json`));
      setNationalThematic(await load(`${import.meta.env.BASE_URL}data/national_thematic.json`));

      // National Condición De Vida
      const nationalRaw = await load(`${import.meta.env.BASE_URL}data/national_condicion_vida.json`);

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

  const viviendaMap = useMemo(() => buildLongMap(viviendaData), [viviendaData]);
  const educacionMap = useMemo(() => buildLongMap(educacionData), [educacionData]);
  const seguridadMap = useMemo(() => buildLongMap(seguridadData), [seguridadData]);
  const registroCivilMap = useMemo(
    () => buildLongMap(registroCivilData),
    [registroCivilData]
  );
  const saludMap = useMemo(() => buildLongMap(saludData), [saludData]);
  const telecomMap = useMemo(() => buildLongMap(telecomData), [telecomData]);
  const pobrezaMap = useMemo(() => buildLongMap(pobrezaData), [pobrezaData]);
  const trabajoMap = useMemo(() => buildLongMap(trabajoData), [trabajoData]);
  const eleccionesMap = useMemo(
    () => buildLongMap(eleccionesData),
    [eleccionesData]
  );

  const educacionNivelMap = useMemo(
    () => buildLongMap(educacionNivel),
    [educacionNivel]
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
    if (selectedAdm2) {
      return econMap.get(normalizeAdm2(selectedAdm2)) || null;
    }
    return null;
  }, [econMap, selectedAdm2]);

  const pyramid = useMemo(() => {
    if (selectedAdm2) {
      const entry = pyramidMap[selectedAdm2];
      return entry?.age_groups || [];
    }
    return [];
  }, [pyramidMap, selectedAdm2]);

  // 2010 Pyramid
  const selectedAdm22010 = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return null;
    const code2010 = adm2Map2010[selectedAdm2Norm];
    return code2010 ? normalizeAdm2(code2010) : null;
  }, [selectedAdm2Norm, isProvinceSelection, adm2Map2010]);

  const pyramid2010 = useMemo(() => {
    if (!selectedAdm22010 || isProvinceSelection) return [];
    return pyramid2010Map.get(selectedAdm22010) || [];
  }, [selectedAdm22010, isProvinceSelection, pyramid2010Map]);

  // ---------------------------------------------------------------------------
  // Records by ADM2
  // ---------------------------------------------------------------------------
  const viviendaRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return viviendaMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, viviendaMap]);

  const educacionRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return educacionMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, educacionMap]);

  const seguridadRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return seguridadMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, seguridadMap]);

  const registroCivilRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return registroCivilMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, registroCivilMap]);

  const saludRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return saludMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, saludMap]);

  const telecomRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return telecomMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, telecomMap]);

  const pobrezaRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return pobrezaMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, pobrezaMap]);

  const trabajoRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return trabajoMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, trabajoMap]);

  const hogaresResumen = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return null;
    const rows = hogaresResumenMap.get(selectedAdm2Norm) || [];
    return rows[0] || null;
  }, [selectedAdm2Norm, isProvinceSelection, hogaresResumenMap]);

  const hogaresTamanoRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return hogaresTamanoMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, hogaresTamanoMap]);

  const poblacionUrbanaRural = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return null;
    const rows = poblacionUrbanaRuralMap.get(selectedAdm2Norm) || [];
    return rows[0] || null;
  }, [selectedAdm2Norm, isProvinceSelection, poblacionUrbanaRuralMap]);

  const eleccionesRecords = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return [];
    return eleccionesMap.get(selectedAdm2Norm) || [];
  }, [selectedAdm2Norm, isProvinceSelection, eleccionesMap]);

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
    if (!selectedAdm2Norm || isProvinceSelection) return null;
    return ticMap.get(selectedAdm2Norm) || null;
  }, [selectedAdm2Norm, isProvinceSelection, ticMap]);

  // ---------------------------------------------------------------------------
  // Condición de Vida（municipio）
  // ---------------------------------------------------------------------------
  /*
  useEffect(() => {
    if (!condicionVidaData || !condicionVidaData.length) return;
    console.log("=== DEBUG: condicion_vida.json sample ===");
    console.log(condicionVidaData[0]);
  }, [condicionVidaData]);

  useEffect(() => {
    if (!selectedAdm2Norm) return;
    const raw = condicionVidaData.find(
      (c) => String(c.adm2_code).padStart(5, "0") === selectedAdm2Norm
    );
    console.log("=== DEBUG: condicionVidaRaw ===", selectedAdm2Norm, raw);
  }, [selectedAdm2Norm, condicionVidaData]);
*/
  const condicionVidaRaw = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection) return null;
    return (
      condicionVidaData.find(
        (c) => String(c.adm2_code).padStart(5, "0") === selectedAdm2Norm
      ) || null
    );
  }, [condicionVidaData, selectedAdm2Norm, isProvinceSelection]);

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

    viviendaRecords,
    educacionRecords,
    seguridadRecords,
    registroCivilRecords,
    saludRecords,
    telecomRecords,
    pobrezaRecords,
    trabajoRecords,
    eleccionesRecords,

    hogaresResumen,
    hogaresTamanoRecords,
    poblacionUrbanaRural,

    nationalBasic,
    nationalEcon,
    nationalThematic,

    educacionNivel: educacionNivelMap.get(selectedAdm2Norm) || [],

    // ↓↓↓ ここから今回の主役 ↓↓↓
    tic,                     // raw TIC 行（internet / cellular / computer を含む）
    condicionVida,           // municipio の % 付きデータ
    condicionVidaRaw,        // municipio の元データ
    nationalCondicionVida,   // national の % 付きデータ（municipio と同構造）
      // ★ Salud Establecimientos ADM2 (今回必要)
    saludEstablecimientos: saludEstablecimientosData,
  };
}
