import React from "react";

/**
 * PrintLayout
 *
 * Multi-page A4 layout inspired by the official "Tu Municipio en Cifras" PDFs.
 * This component is only used for printing/PDF export via react-to-print.
 *
 * Props:
 *  - municipio: { municipio, provincia, region, adm2_code? }
 *  - indicadores: basic indicators row for the municipality
 *  - pyramid: age pyramid array (same format as PopulationPyramid)
 *  - econ: economy/employment object
 *  - thematic: { vivienda, educacion, seguridad, registroCivil, telecom, salud, pobreza, trabajo, elecciones }
 *  - nationalBasic, nationalEcon, nationalThematic: national summary objects
 */
const PrintLayout = React.forwardRef(
  (
    {
      municipio,
      indicadores,
      pyramid,
      econ,
      thematic = {},
      nationalBasic,
      nationalEcon,
      nationalThematic,
    },
    ref
  ) => {
    if (!municipio || !indicadores) {
      return <div ref={ref} />;
    }

    const title = municipio.municipio || "Municipio sin nombre";
    const adm2 = municipio.adm2_code || "";

    const safe = (value, suffix = "") =>
      value === null || value === undefined || value === ""
        ? "—"
        : `${value}${suffix}`;

    const formatNumber = (value, options = {}) => {
      if (value === null || value === undefined || value === "") return "—";
      try {
        return Number(value).toLocaleString("es-DO", options);
      } catch {
        return String(value);
      }
    };

    const Page = ({ children }) => (
      <section className="print-page mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white px-10 py-8 text-[11px] text-slate-900">
        {children}
      </section>
    );

    const SectionCard = ({ title, subtitle, children }) => (
      <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-slate-200 pb-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-800">
            {title}
          </h3>
          {subtitle && (
            <span className="text-[9px] font-normal text-slate-400">
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-1.5">{children}</div>
      </div>
    );

    const IndicatorRow = ({ label, value, nationalValue, isPercent }) => (
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-0.5 last:border-b-0">
        <span className="text-[10px] text-slate-600">{label}</span>
        <div className="text-right text-[10px]">
          <span className="font-semibold text-slate-900">
            {safe(
              isPercent ? formatNumber(value, { maximumFractionDigits: 1 }) : value
            )}
            {isPercent ? "%" : ""}
          </span>
          {nationalValue !== undefined && (
            <span className="ml-1 text-[9px] text-slate-400">
              (RD: {safe(
                isPercent
                  ? formatNumber(nationalValue, { maximumFractionDigits: 1 })
                  : nationalValue
              )}
              {isPercent ? "%" : ""})
            </span>
          )}
        </div>
      </div>
    );

    const ThematicList = ({ items = [] }) => (
      <ul className="space-y-0.5">
        {items.map((it, idx) => (
          <li key={idx} className="flex justify-between text-[10px]">
            <span className="text-slate-600">{it.label}</span>
            <span className="font-semibold text-slate-900">
              {it.value}
              {it.national ? (
                <span className="ml-1 text-[9px] text-slate-400">
                  (RD: {it.national})
                </span>
              ) : null}
            </span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-[10px] italic text-slate-400">
            Sin datos para este municipio.
          </li>
        )}
      </ul>
    );

    const today = new Date().toLocaleDateString("es-DO");

    return (
      <div ref={ref} className="print-root bg-white">
        {/* PAGE 1: Demografía + Clima + Censo + Género */}
        <Page>
          {/* Header */}
          <header className="mb-4 flex items-start justify-between gap-4 border-b-2 border-sky-700 pb-3">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900">
                Tu municipio <span className="text-sky-700">en cifras</span>
              </h1>
              <p className="mt-1 text-[11px] text-slate-500">
                Diagnóstico municipal – resumen demográfico, social y económico.
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Generado automáticamente el {today}
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <div className="font-semibold text-slate-700">Municipio:</div>
              <div className="text-[12px] font-bold text-sky-800">
                {title}
              </div>
              {municipio.provincia && (
                <div>{`Provincia: ${municipio.provincia}`}</div>
              )}
              {municipio.region && <div>{`Región: ${municipio.region}`}</div>}
              {adm2 && <div>{`Código ADM2: ${adm2}`}</div>}
            </div>
          </header>

          {/* Top section: meta table + map placeholder */}
          <div className="mb-4 grid grid-cols-[1.2fr_1fr] gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Ficha básica del municipio
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <dt className="text-slate-500">Población total</dt>
                <dd className="font-semibold text-slate-900">
                  {formatNumber(indicadores.poblacion_total)}
                </dd>
                <dt className="text-slate-500">Densidad poblacional</dt>
                <dd className="font-semibold text-slate-900">
                  {safe(indicadores.densidad_poblacional, " hab/km²")}
                </dd>
                <dt className="text-slate-500">Superficie</dt>
                <dd className="font-semibold text-slate-900">
                  {safe(indicadores.superficie_km2, " km²")}
                </dd>
                <dt className="text-slate-500">Año de referencia</dt>
                <dd className="font-semibold text-slate-900">
                  {safe(indicadores.anio_referencia || indicadores.year)}
                </dd>
              </dl>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-center text-[10px] text-slate-500">
                {/* NOTE: Here we show a placeholder for the Leaflet map. In the
                    live dashboard you can replace this with a static snapshot
                    of the current map (e.g. using leaflet-image or a PNG). */}
                <div className="mb-1 text-[11px] font-semibold text-slate-700">
                  Mapa del municipio
                </div>
                <div className="h-32 rounded-lg border border-dashed border-slate-300 bg-slate-200/60" />
                <p className="mt-1 text-[9px] text-slate-500">
                  Vista general del municipio (sugerido: captura estática del
                  mapa de Leaflet).
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Demografía & Clima */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <SectionCard
              title="Demografía"
              subtitle="Fuente: Censo y proyecciones oficiales."
            >
              <IndicatorRow
                label="Población total"
                value={indicadores.poblacion_total}
                nationalValue={nationalBasic?.poblacion_total}
              />
              <IndicatorRow
                label="% mujeres"
                value={indicadores.pct_mujeres}
                nationalValue={nationalBasic?.pct_mujeres}
                isPercent
              />
              <IndicatorRow
                label="% hombres"
                value={indicadores.pct_hombres}
                nationalValue={nationalBasic?.pct_hombres}
                isPercent
              />
              <IndicatorRow
                label="Índice de envejecimiento"
                value={indicadores.indice_envejecimiento}
                nationalValue={nationalBasic?.indice_envejecimiento}
                isPercent
              />
            </SectionCard>

            <SectionCard title="Clima" subtitle="Fuente: ONAMET u otras fuentes.">
              <IndicatorRow
                label="Temperatura media máx."
                value={indicadores.temp_max}
              />
              <IndicatorRow
                label="Temperatura media mín."
                value={indicadores.temp_min}
              />
              <IndicatorRow
                label="Precipitación anual"
                value={indicadores.precipitacion_anual}
              />
            </SectionCard>
          </div>

          {/* Bottom: Indicadores censales y género */}
          <div className="grid grid-cols-2 gap-4">
            <SectionCard
              title="Indicadores censales"
              subtitle="Censo de población y vivienda."
            >
              <IndicatorRow
                label="% nacidos en otro municipio"
                value={indicadores.pct_nacidos_otro_muni}
                isPercent
              />
              <IndicatorRow
                label="% nacidos en el extranjero"
                value={indicadores.pct_nacidos_extranjero}
                isPercent
              />
              <IndicatorRow
                label="Crecimiento intercensal"
                value={indicadores.crecimiento_intercensal}
                isPercent
              />
            </SectionCard>

            <SectionCard title="Género">
              <IndicatorRow
                label="Jóvenes que han estado embarazadas (12-19 años)"
                value={indicadores.pct_jovenes_embarazadas}
                isPercent
              />
              <IndicatorRow
                label="Mujeres fallecidas en condiciones de violencia"
                value={indicadores.mujeres_fallecidas_violencia}
              />
            </SectionCard>
          </div>
        </Page>

        {/* PAGE 2: Vivienda, Educación, Telecom, Estadísticas vitales */}
        <Page>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Condiciones de vida, educación y tecnologías
          </h2>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <SectionCard
              title="Vivienda y servicios básicos"
              subtitle="Condiciones habitacionales."
            >
              <ThematicList items={thematic.vivienda || []} />
            </SectionCard>
            <SectionCard title="Educación">
              <ThematicList items={thematic.educacion || []} />
            </SectionCard>
            <SectionCard
              title="Tecnologías y comunicaciones"
              subtitle="Acceso a TIC."
            >
              <ThematicList items={thematic.telecom || []} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SectionCard
              title="Registro civil"
              subtitle="Nacimientos y defunciones."
            >
              <ThematicList items={thematic.registroCivil || []} />
            </SectionCard>
            <SectionCard title="Salud">
              <ThematicList items={thematic.salud || []} />
            </SectionCard>
          </div>
        </Page>

        {/* PAGE 3: Economía, trabajo, pobreza, seguridad, elecciones */}
        <Page>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Economía, empleo y seguridad ciudadana
          </h2>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <SectionCard
              title="Economía y empleo"
              subtitle="Estructura del mercado laboral."
            >
              <IndicatorRow
                label="Población en edad de trabajar"
                value={econ?.pet_total}
              />
              <IndicatorRow
                label="Población económicamente activa"
                value={econ?.pea_total}
              />
              <IndicatorRow
                label="Tasa global de participación"
                value={econ?.tasa_participacion}
                nationalValue={nationalEcon?.tasa_participacion}
                isPercent
              />
              <IndicatorRow
                label="Tasa de ocupación"
                value={econ?.tasa_ocupacion}
                nationalValue={nationalEcon?.tasa_ocupacion}
                isPercent
              />
              <IndicatorRow
                label="Tasa de desempleo"
                value={econ?.tasa_desempleo}
                nationalValue={nationalEcon?.tasa_desempleo}
                isPercent
              />
            </SectionCard>

            <SectionCard title="Pobreza y programas sociales">
              <ThematicList items={thematic.pobreza || []} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SectionCard title="Trabajo">
              <ThematicList items={thematic.trabajo || []} />
            </SectionCard>
            <SectionCard title="Seguridad ciudadana">
              <ThematicList items={thematic.seguridad || []} />
            </SectionCard>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <SectionCard title="Elecciones y participación">
              <ThematicList items={thematic.elecciones || []} />
            </SectionCard>
            <div className="flex flex-col justify-end text-[9px] text-slate-400">
              <p>
                Nota: Este reporte fue generado automáticamente a partir del
                tablero "Tu municipio en cifras". Los indicadores pueden estar
                sujetos a actualizaciones por parte de las instituciones
                proveedoras de datos.
              </p>
            </div>
          </div>
        </Page>
      </div>
    );
  }
);

export default PrintLayout;
