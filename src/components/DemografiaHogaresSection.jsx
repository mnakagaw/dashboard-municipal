import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { HouseholdSizeChart } from "./charts";

export default function DemografiaHogaresSection({
  hogaresResumen,
  poblacionUrbanaRural,
  hogaresTamanoRecords,
  isProvinceSelection,
  isRegionSelection,
}) {
  const territoryLabel = isRegionSelection
    ? "esta región"
    : isProvinceSelection
      ? "esta provincia"
      : "este municipio";
  return (
    <div className="mt-4 w-full">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr),minmax(0,2fr)] print-hogares-grid">

        {/* 左カラム：カード群 */}
        <div className="grid gap-4 auto-rows-fr print-hogares-left min-w-0">

          {/* Card 1: Hogares totales */}
          <Card className="h-full print-card">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Hogares totales</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs md:text-sm">
              {hogaresResumen ? (
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {hogaresResumen.hogares_total?.toLocaleString("es-DO") ?? "—"}
                  </div>
                  {hogaresResumen.poblacion_en_hogares != null && (
                    <div className="mt-1 text-[11px] text-slate-600">
                      Población en hogares:{" "}
                      {hogaresResumen.poblacion_en_hogares.toLocaleString("es-DO")}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Aún no hay datos para {territoryLabel}.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Personas por hogar */}
          <Card className="h-full print-card">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Personas por hogar</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs md:text-sm">
              {hogaresResumen && hogaresResumen.personas_por_hogar != null ? (
                <div className="text-2xl font-semibold text-slate-900">
                  {hogaresResumen.personas_por_hogar.toLocaleString("es-DO", {
                    maximumFractionDigits: 2,
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Aún no hay datos para {territoryLabel}.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Población urbana / rural */}
          <Card className="h-full print-card">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Población urbana / rural</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs md:text-sm">
              {poblacionUrbanaRural ? (
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold">Urbana: </span>
                    {poblacionUrbanaRural.urbana?.toLocaleString("es-DO") ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Rural: </span>
                    {poblacionUrbanaRural.rural?.toLocaleString("es-DO") ?? "—"}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Aún no hay datos para {territoryLabel}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右カラム：グラフ */}
        <div className="print-hogares-right min-w-0">
          {hogaresTamanoRecords && hogaresTamanoRecords.length > 0 ? (
            <HouseholdSizeChart records={hogaresTamanoRecords} />
          ) : (
            <Card className="h-full print-card">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">
                  Tamaño de los hogares (1–10+)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs md:text-sm">
                <p className="text-[11px] text-slate-500">
                  Aún no hay datos para {territoryLabel}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}