/**
 * TopSelectionAndMap.jsx - Panel Superior con Selector y Mapa
 * 
 * Este componente muestra la sección superior del dashboard con:
 * - Selectores de provincia y municipio (columna izquierda)
 * - Indicadores básicos de población (columna izquierda)
 * - Mapa interactivo de República Dominicana (columna derecha)
 * 
 * Diseño responsivo:
 * - Móvil: Las columnas se apilan verticalmente
 * - Desktop (lg+): Las columnas se muestran lado a lado
 * - Impresión: Layout especial de 2 columnas (ver print.css)
 * 
 * Props principales:
 * - selectedProvince: Nombre de la provincia seleccionada
 * - selectionKey: Código ADM2 del municipio seleccionado
 * - handleMapSelect: Función que se ejecuta al hacer clic en el mapa
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Select } from "./ui/select";
import { RDMap } from "./RDMap";
import { BasicIndicators } from "./charts";

export default function TopSelectionAndMap({
  selectedProvince,
  setSelectedProvince,
  selectionKey,
  setSelectionKey,
  provinciaOptions,
  municipioOptions,
  municipiosIndex,
  selectedMunicipio,
  indicadores,
  nationalBasic,
  selectedAdm2,
  isProvinceSelection,
  selectedProvinceScope,
  handleMapSelect,
}) {
  return (
    /* Web: columnas verticales → horizontales en lg. Impresión: grid de 2 columnas */
    <div className="flex flex-col lg:flex-row gap-4 print-top-grid">

      {/* Columna izquierda: Información Básica + Selector */}
      <div className="lg:flex-[0.7] flex-1 space-y-3 print-info-basic">

        {/* Selector de provincia/municipio (oculto en impresión) */}
        <div className="hide-on-print">
          <Card className="max-w-md w-full">
            <CardHeader className="pb-2">
              <CardTitle>Seleccionar provincia y municipio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">

              {/* Provincia */}
              <div className="space-y-1 text-xs md:text-sm">
                <div className="text-[11px] text-slate-600 md:text-xs">
                  Provincia
                </div>
                <Select
                  value={selectedProvince}
                  onChange={(val) => {
                    setSelectedProvince(val);
                    const firstMunicipio = municipiosIndex.find(
                      (m) => m.provincia === val
                    );
                    setSelectionKey(
                      firstMunicipio ? firstMunicipio.adm2_code : null
                    );
                  }}
                  options={provinciaOptions}
                  placeholder="Seleccione una provincia"
                />
              </div>

              {/* Municipio */}
              <div className="space-y-1 text-xs md:text-sm">
                <div className="text-[11px] text-slate-600 md:text-xs">
                  Municipio / provincia completa
                </div>
                <Select
                  value={selectionKey}
                  onChange={(v) => setSelectionKey(v)}
                  options={municipioOptions}
                  placeholder="Seleccione un municipio"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Información básica */}
        <div className="print-info-basic-card">
          <BasicIndicators indicators={indicadores} national={nationalBasic} />
        </div>
      </div>

      {/* Right column: Map */}
      <div className="lg:flex-[1.3] flex-1 print-map-card">
        <Card className="w-full h-full">
          <CardHeader>
            <CardTitle>Mapa de municipios (ADM2)</CardTitle>
          </CardHeader>
          <CardContent>
            <RDMap
              selectedAdm2={selectedAdm2}
              selectedProvince={
                isProvinceSelection ? selectedProvinceScope : null
              }
              onSelectMunicipio={handleMapSelect}
            />
            <p className="mt-2 text-[10px] text-slate-400 md:text-xs">
              Fuente: ONE, división político-administrativa y cartografía oficial.
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}