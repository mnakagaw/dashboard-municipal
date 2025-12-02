import React, { useEffect, useState } from "react";
import useMunicipioData from "./hooks/useMunicipioData";

import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Select } from "./components/ui/select";
import { RDMap } from "./components/RDMap";

import {
  BasicIndicators,
  PopulationPyramid,
  PopulationPyramid2010,
  GenderRatio,
  EconomyEmployment,
  ThematicListCard,
  HouseholdsTotalCard,
  PersonsPerHouseholdCard,
  UrbanRuralCard,
  HouseholdSizeChart,
} from "./components/charts";

import PdfExportButton from "./components/PdfExportButton";
import EducacionDashboard from "./components/EducacionDashboard";

import TopSelectionAndMap from "./components/TopSelectionAndMap";
import PyramidsRow from "./components/PyramidsRow";
import DemografiaHogaresSection from "./components/DemografiaHogaresSection";
import ThematicSectionsGrid from "./components/ThematicSectionsGrid";
import CondicionVidaSection from "./components/CondicionVidaSection";

export default function App() {
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectionKey, setSelectionKey] = useState(null);

  // ✔ useMunicipioData は1回だけ呼ぶ
  const data = useMunicipioData(selectedProvince, selectionKey);

  const {
    loaded,
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

    // ★ 新規追加
    tic,
    condicionVida,
    condicionVidaRaw,
    nationalCondicionVida,
  } = data;

  // ⭐ 初期表示：最初の県と最初のMunicipioを選ぶ
  useEffect(() => {
    if (!selectedProvince && provincias.length) {
      const prov = provincias[0];
      setSelectedProvince(prov);

      const firstMunicipio = municipiosIndex.find(
        (m) => m.provincia === prov
      );

      if (firstMunicipio) {
        setSelectionKey(firstMunicipio.adm2_code);
      }
    }
  }, [provincias, municipiosIndex, selectedProvince]);

  const handleMapSelect = (adm2, provinciaFromMap) => {
    setSelectionKey(adm2);
    if (provinciaFromMap) {
      setSelectedProvince(provinciaFromMap);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex justify-end">
            <PdfExportButton
              municipio={selectedMunicipio}
              indicadores={indicadores}
              pyramid={pyramid}
              econ={econ}
              thematic={{
                vivienda: viviendaRecords,
                educacion: educacionRecords,
                seguridad: seguridadRecords,
                registroCivil: registroCivilRecords,
                telecom: telecomRecords,
                salud: saludRecords,
                pobreza: pobrezaRecords,
                trabajo: trabajoRecords,
                elecciones: eleccionesRecords,
                tic: tic,
              }}
              nationalBasic={nationalBasic}
              nationalEcon={nationalEcon}
              nationalThematic={nationalThematic}
              selectedId={selectedMunicipio?.adm2_code || null}
            />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
              Diagnostico Municipal
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              Panel de diagnóstico municipal – población, economía y empleo
            </p>
          </div>
          <div className="text-[10px] text-slate-400 md:text-xs">
            Fuente: ONE, Censo 2022, DEE 2024 y otras fuentes oficiales
          </div>
        </div>
      </header>

      <main
        id="dashboard-pdf"
        className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:gap-5 md:py-6"
      >
        <div className="mb-2 text-center">
          <h2 className="text-base font-semibold text-slate-900 md:text-xl">
            Diagnóstico municipal:{" "}
            {selectedMunicipio?.municipio || "Seleccione un municipio"}
          </h2>
        </div>

        {/* Selección + Mapa */}
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

        {/* Pirámides */}
        <PyramidsRow
          indicadores={indicadores}
          nationalBasic={nationalBasic}
          pyramid={pyramid}
          pyramid2010={pyramid2010}
        />

        {/* Hogares */}
        <DemografiaHogaresSection
          hogaresResumen={hogaresResumen}
          poblacionUrbanaRural={poblacionUrbanaRural}
          hogaresTamanoRecords={hogaresTamanoRecords}
        />

        {/* ✔ Condición de vida + TIC */}
        <CondicionVidaSection
          condicionVida={condicionVida}
          condicionVidaRaw={condicionVidaRaw}
          nationalCondicionVida={nationalCondicionVida}
          tic={tic}
        />

        {/* Economía y empleo */}
        <div className="w-full">
          <EconomyEmployment
            econ={econ}
            nationalEcon={nationalEcon}
            indicators={indicadores}
            nationalPopulation={nationalBasic.poblacion_total}
          />
        </div>

        {/* Educación */}
        <EducacionDashboard
          records={educacionRecords}
          selectedMunicipio={selectedMunicipio}
        />

{/*
        <ThematicSectionsGrid
          viviendaRecords={viviendaRecords}
          seguridadRecords={seguridadRecords}
          registroCivilRecords={registroCivilRecords}
          saludRecords={saludRecords}
          telecomRecords={telecomRecords}
          pobrezaRecords={pobrezaRecords}
          eleccionesRecords={eleccionesRecords}
          nationalThematic={nationalThematic}
          tic={tic}
          condicionVida={condicionVida}
        />
*/}
      </main>
    </div>
  );
}
