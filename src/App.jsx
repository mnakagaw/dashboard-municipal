// ===============================
// App.jsx — Versión Final Corregida
// ===============================

import React, { useEffect, useState } from "react";
import useMunicipioData from "./hooks/useMunicipioData";

import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { RDMap } from "./components/RDMap";

import {
  BasicIndicators,
  PopulationPyramid,
  PopulationPyramid2010,
  EconomyEmployment,
} from "./components/charts";

import TopSelectionAndMap from "./components/TopSelectionAndMap";
import PyramidsRow from "./components/PyramidsRow";
import DemografiaHogaresSection from "./components/DemografiaHogaresSection";
import CondicionVidaSection from "./components/CondicionVidaSection";
import EducacionDashboard from "./components/EducacionDashboard";
import SaludSection from "./components/SaludSection";

export default function App() {
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectionKey, setSelectionKey] = useState(null);

  // ★ Narrativa
  const [narrativa, setNarrativa] = useState("");
  const [loadingNarrativa, setLoadingNarrativa] = useState(false);

  const data = useMunicipioData(selectedProvince, selectionKey);

  const {
    municipiosIndex,
    provincias,
    municipioOptions,
    provinciaOptions,
    isProvinceSelection,
    selectedAdm2,
    selectedProvinceScope,
    selectedMunicipio,

    pyramid,
    pyramid2010,
    indicadores,
    econ,

    hogaresResumen,
    hogaresTamanoRecords,
    poblacionUrbanaRural,

    nationalBasic,
    nationalEcon,

    tic,
    condicionVida,
    condicionVidaRaw,
    nationalCondicionVida,

    saludEstablecimientos,
    educacionRecords,
  } = data;

  // ============================
  //  初回の自治体選択
  // ============================
  useEffect(() => {
    if (!selectedProvince && provincias.length) {
      const prov = provincias[0];
      setSelectedProvince(prov);
      const first = municipiosIndex.find((m) => m.provincia === prov);
      if (first) setSelectionKey(first.adm2_code);
    }
  }, [provincias, municipiosIndex, selectedProvince]);

  const handleMapSelect = (adm2, provFromMap) => {
    setSelectionKey(adm2);
    if (provFromMap) setSelectedProvince(provFromMap);
  };

  // ============================
  //  GPT 用プロンプト生成
  // ============================
  function buildPrompt() {
    return `
Eres un analista experto en planificación territorial.
Genera un “Resumen Narrativo del Municipio” con estilo técnico-narrativo,
claro, profesional y parecido al ejemplo de Azua.

Municipio: ${selectedMunicipio?.municipio}

Incorpora estos datos cuando sea útil, sin inventar valores:

Demografía:
- Población total: ${indicadores?.poblacion_total}
- Variación vs 2010 (si aplica): ${indicadores?.variacion_2010 ?? ""}%
- Personas por hogar: ${hogaresResumen?.personas_por_hogar ?? ""}

Condición de vida:
${JSON.stringify(condicionVida, null, 2)}

Economía:
${JSON.stringify(econ, null, 2)}

Salud:
Centros de salud registrados: ${saludEstablecimientos ? Object.keys(saludEstablecimientos).length : 0
      }

Estructura esperada:
1. Panorama general del municipio
2. Tendencias demográficas y urbanas
3. Hogares y patrones territoriales
4. Servicios básicos — agua, saneamiento, residuos, electricidad, TIC
5. Economía y empleo
6. Oferta educativa
7. Salud
8. Implicaciones estratégicas para el Plan Municipal

Usa un tono profesional, claro y narrativo.
NO devuelvas encabezados con números, sino un texto fluido.
    `;
  }

  // ============================
  //  GPT 呼び出し
  // ============================
  async function generateNarrative() {
    if (!selectedMunicipio) return;

    setLoadingNarrativa(true);

    try {
      const res = await fetch("/api/generateNarrative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-5.1",
          messages: [{ role: "user", content: buildPrompt() }],
          temperature: 0.4,
        }),
      });

      const json = await res.json();
      const text = json.choices?.[0]?.message?.content || "";
      setNarrativa(text);
    } catch (e) {
      console.error("GPT narrativa error:", e);
    }

    setLoadingNarrativa(false);
  }

  // ============================
  //  RENDER
  // ============================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 flex flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center justify-between">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
              Diagnóstico Municipal
              {selectedMunicipio?.municipio
                ? ` – ${selectedMunicipio.municipio}`
                : ""}
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              Panel de diagnóstico municipal – población, salud, economía y
              empleo, educación
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] text-slate-400 md:text-xs text-right">
              Fuente: ONE, Censo 2022, DEE 2024, Anuario Estadístico 2024.
            </div>

            {/* Narrativa */}
            <button
              onClick={generateNarrative}
              className="hide-on-print text-xs md:text-sm px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              {loadingNarrativa ? "Generando…" : "📝 Resumen Narrativo"}
            </button>

            {/* Imprimir */}
            <button
              onClick={() => window.print()}
              className="hide-on-print text-xs md:text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              🖨️ Imprimir (exportar PDF)
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        id="dashboard-pdf"
        className="w-full mx-auto flex flex-col gap-4 md:gap-5 px-2 sm:px-4 py-4 md:py-6 md:max-w-6xl"
      >
        {/* 1: Información Básica + Mapa */}
        <TopSelectionAndMap
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          selectionKey={selectionKey}
          setSelectionKey={setSelectionKey}
          provinciaOptions={provinciaOptions}
          municipioOptions={municipioOptions}
          municipiosIndex={municipiosIndex}
          selectedMunicipio={selectedMunicipio}
          indicadores={indicadores}
          nationalBasic={nationalBasic}
          selectedAdm2={selectedAdm2}
          isProvinceSelection={isProvinceSelection}
          selectedProvinceScope={selectedProvinceScope}
          handleMapSelect={handleMapSelect}
        />

        {/* 2: Demografía */}
        <PyramidsRow
          indicadores={indicadores}
          nationalBasic={nationalBasic}
          pyramid={pyramid}
          pyramid2010={pyramid2010}
        />

        {/* 3: Hogares */}
        <DemografiaHogaresSection
          hogaresResumen={hogaresResumen}
          poblacionUrbanaRural={poblacionUrbanaRural}
          hogaresTamanoRecords={hogaresTamanoRecords}
        />

        {/* 4: Condición de Vida */}
        <CondicionVidaSection
          condicionVida={condicionVida}
          condicionVidaRaw={condicionVidaRaw}
          nationalCondicionVida={nationalCondicionVida}
          tic={tic}
        />

        <div className="page-break"></div>

        {/* 5: Educación */}
        <EducacionDashboard
          records={educacionRecords}
          selectedMunicipio={selectedMunicipio}
        />

        <div className="page-break"></div>

        {/* 6: Economía */}
        <EconomyEmployment
          econ={econ}
          nationalEcon={nationalEcon}
          indicators={indicadores}
          nationalPopulation={nationalBasic?.poblacion_total}
        />

        <div className="page-break"></div>

        {/* 7: Salud */}
        <SaludSection
          selectedAdm2={selectedAdm2}
          selectedMunicipio={selectedMunicipio}
          saludEstablecimientos={saludEstablecimientos}
        />

        {/* 8: Resumen Narrativo (GPT) */}
        {narrativa && (
          <Card className="mt-4 break-after-page">
            <CardHeader>
              <CardTitle>Resumen Narrativo del Municipio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line leading-relaxed text-slate-800">
                {narrativa}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
