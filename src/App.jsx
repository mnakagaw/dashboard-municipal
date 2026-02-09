/**
 * App.jsx - Componente Principal de la Aplicación
 * 
 * Este es el componente raíz del dashboard municipal.
 * Coordina todos los demás componentes y maneja el estado global.
 * 
 * Estructura del Dashboard:
 * ┌─────────────────────────────────────────────┐
 * │  Header (título, botón imprimir)            │
 * ├─────────────────────────────────────────────┤
 * │  TopSelectionAndMap (selector + mapa)       │
 * ├─────────────────────────────────────────────┤
 * │  PyramidsRow (pirámides 2022 vs 2010)       │
 * ├─────────────────────────────────────────────┤
 * │  DemografiaHogaresSection                   │
 * ├─────────────────────────────────────────────┤
 * │  CondicionVidaSection (agua, luz, TIC)      │
 * ├─────────────────────────────────────────────┤
 * │  EducacionDashboard                         │
 * ├─────────────────────────────────────────────┤
 * │  EconomyEmployment (DEE 2024)               │
 * ├─────────────────────────────────────────────┤
 * │  SaludSection                               │
 * ├─────────────────────────────────────────────┤
 * │  ResumenComparacionSection                  │
 * ├─────────────────────────────────────────────┤
 * │  ResumenNarrativoSection (IA opcional)      │
 * └─────────────────────────────────────────────┘
 * 
 * Estados principales:
 * - selectedProvince: Provincia seleccionada actualmente
 * - selectionKey: Código ADM2 del municipio/provincia seleccionado
 * 
 * Hook personalizado:
 * - useMunicipioData: Carga todos los datos del municipio seleccionado
 */

import React, { useEffect, useState } from "react";
import useMunicipioData from "./hooks/useMunicipioData";

// Componentes de sección del dashboard
import TopSelectionAndMap from "./components/TopSelectionAndMap";
import PyramidsRow from "./components/PyramidsRow";
import DemografiaHogaresSection from "./components/DemografiaHogaresSection";
import CondicionVidaSection from "./components/CondicionVidaSection";
import EducacionDashboard from "./components/EducacionDashboard";
import SaludSection from "./components/SaludSection";
import ResumenComparacionSection from "./components/ResumenComparacionSection";
import ResumenNarrativoSection from "./components/ResumenNarrativoSection";
import { EconomyEmployment } from "./components/charts";
import { buildResumenComparacion } from "./utils/resumenComparacionHelpers";

export default function App() {
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectionKey, setSelectionKey] = useState(null);

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
    educacionNivel,

    // Datos nacionales para comparación
    nationalTic,
    nationalEducNivel,
    nationalEducOferta,
    nationalHogares,
    nationalSalud,

    // Comparison datasets
    hogaresResumenData,
    hogaresResumenProvinciaData,
    poblacionUrbanaRuralData,
    poblacionUrbanaRuralProvinciaData,
    educacionData,
    educacionProvinciaData,
    saludEstablecimientosData,
    saludEstablecimientosProvinciaData,

    // Add exposed province data for simple retrieval
    condicionVidaProvinciaData,
    ticProvinciaData,
    educacionNivelProvinciaData,
    economiaEmpleoProvinciaData,
    indicadoresBasicosData,
    educacionOfertaMunicipalData,
  } = data;

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

          {/* Imprimir */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] text-slate-400 md:text-xs text-right">
              Fuente: ONE, Censo 2022, DEE 2024, Anuario Estadístico 2024.
            </div>
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

        <PyramidsRow
          indicadores={indicadores}
          nationalBasic={nationalBasic}
          pyramid={pyramid}
          pyramid2010={pyramid2010}
        />

        <DemografiaHogaresSection
          hogaresResumen={hogaresResumen}
          poblacionUrbanaRural={poblacionUrbanaRural}
          hogaresTamanoRecords={hogaresTamanoRecords}
          isProvinceSelection={isProvinceSelection}
        />

        <CondicionVidaSection
          condicionVida={condicionVida}
          condicionVidaRaw={condicionVidaRaw}
          nationalCondicionVida={nationalCondicionVida}
          tic={tic}
        />

        <div className="page-break"></div>

        <EducacionDashboard
          records={educacionRecords}
          selectedMunicipio={selectedMunicipio}
          isProvinceSelection={isProvinceSelection}
          educacionNivel={educacionNivel}
        />

        <div className="page-break"></div>

        <EconomyEmployment
          econ={econ}
          nationalEcon={nationalEcon}
          indicators={indicadores}
          nationalPopulation={nationalBasic?.poblacion_total}
        />

        <div className="page-break"></div>

        {/* <div className="page-break"></div> */}

        {/* <div className="page-break"></div> */}

        {/* Generate Comparison Rows */}
        {(() => {
          const resumenComparacionRows = buildResumenComparacion({
            selectedMunicipio,
            indicadores,
            condVida: condicionVida,
            econ,
            educ: educacionRecords,
            educNivel: educacionNivel,
            tic,

            hogaresResumenData,
            poblacionUrbanaRuralData,
            educacionData,
            saludEstablecimientosData,

            condicionVidaProvinciaData,
            ticProvinciaData,
            educacionNivelProvinciaData,
            economiaEmpleoProvinciaData,
            indicadoresBasicosData,
            hogaresResumenProvinciaData,
            poblacionUrbanaRuralProvinciaData,
            educacionProvinciaData,
            saludEstablecimientosProvinciaData,

            nationalBasic,
            nationalCondVida: nationalCondicionVida,
            nationalEcon,
            nationalTic,
            nationalEducNivel,
            nationalHogares,
            nationalSalud,
            nationalEducOferta,
            educacionOfertaMunicipalData,
          });

          return (
            <>
              <SaludSection
                selectedAdm2={selectedAdm2}
                selectedMunicipio={selectedMunicipio}
                saludEstablecimientos={saludEstablecimientos}
                isProvinceSelection={isProvinceSelection}
              />

              {/*<div className="page-break"></div>*/}

              <ResumenComparacionSection
                selectedMunicipio={selectedMunicipio}
                rows={resumenComparacionRows}
              />

              <div className="page-break"></div>

              <ResumenNarrativoSection
                municipio={selectedMunicipio?.municipio}
                indicators={indicadores}
                condVida={condicionVida}
                econ={econ}
                educ={educacionRecords}
                tic={tic}
                salud={saludEstablecimientos}
                nationalBasic={nationalBasic}
                nationalCondVida={nationalCondicionVida}
                nationalEcon={nationalEcon}
                nationalTic={nationalTic}
                nationalEducNivel={nationalEducNivel}
                nationalEducOferta={nationalEducOferta}
                nationalHogares={nationalHogares}
                nationalSalud={nationalSalud}
                educNivel={educacionNivel}
                resumenComparacion={resumenComparacionRows}
              />
            </>
          );
        })()}
      </main>
    </div>
  );
}
