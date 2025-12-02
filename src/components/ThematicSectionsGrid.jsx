// src/components/ThematicSectionsGrid.jsx
import React from "react";
import { ThematicListCard } from "./charts";

export default function ThematicSectionsGrid({
  viviendaRecords,
  seguridadRecords,
  registroCivilRecords,
  saludRecords,
  telecomRecords,
  pobrezaRecords,
  eleccionesRecords,
  tic,
  nationalThematic,
}) {
  // ------------------------------
  // TIC 用レコードを組み立てる
  // ------------------------------
  const ticRecords = tic
    ? [
      tic.internet && tic.internet.rate_used != null && {
        indicator: "uso_internet_3_meses",
        value: tic.internet.rate_used * 100,
      },
      tic.cellular && tic.cellular.rate_used != null && {
        indicator: "uso_telefono_celular",
        value: tic.cellular.rate_used * 100,
      },
      tic.computer && tic.computer.rate_used != null && {
        indicator: "uso_computadora",
        value: tic.computer.rate_used * 100,
      },
    ].filter(Boolean)
    : [];

  return (
    <div
      className="
        grid gap-4 
        md:grid-cols-2 xl:grid-cols-3 
        print-grid print-grid-3 no-break
      "
    >
      <ThematicListCard
        title="Vivienda y servicios básicos"
        fuente="Fuente: ONE, Censo 2022 y otras fuentes sectoriales."
        records={viviendaRecords}
        nationalIndicators={nationalThematic.vivienda}
      />

      <ThematicListCard
        title="Seguridad ciudadana"
        fuente="Fuente: Policía Nacional u otras fuentes de seguridad."
        records={seguridadRecords}
        nationalIndicators={nationalThematic.seguridad}
      />

      <ThematicListCard
        title="Registro civil (nacimientos, defunciones)"
        fuente="Fuente: JCE / Registro Civil."
        records={registroCivilRecords}
        nationalIndicators={nationalThematic.registro_civil}
      />

      <ThematicListCard
        title="Salud"
        fuente="Fuente: MSP, ONE y otras fuentes oficiales."
        records={saludRecords}
        nationalIndicators={nationalThematic.salud}
      />

      <ThematicListCard
        title="Telecomunicaciones"
        fuente="Fuente: INDOTEL u otras fuentes de telecomunicaciones."
        records={telecomRecords}
        nationalIndicators={nationalThematic.telecom}
      />

      <ThematicListCard
        title="Pobreza e inclusión social"
        fuente="Fuente: SIUBEN, ONE."
        records={pobrezaRecords}
        nationalIndicators={nationalThematic.pobreza}
      />

      <ThematicListCard
        title="Elecciones y participación"
        fuente="Fuente: JCE / registros electorales."
        records={eleccionesRecords}
        nationalIndicators={nationalThematic.elecciones}
      />

      {/* ★ TIC セクション */}
      <ThematicListCard
        title="Tecnologías de Información y Comunicación (TIC)"
        fuente="Fuente: Censo 2022, Cuadros 4–6 (TIC)."
        records={ticRecords}
        nationalIndicators={nationalThematic.tic || undefined}
      />
    </div>
  );
}
