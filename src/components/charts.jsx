/**
 * charts.jsx - Biblioteca de Gráficos y Visualizaciones
 * 
 * Este archivo contiene todos los componentes de gráficos utilizados en el dashboard.
 * Utiliza la biblioteca Recharts para crear visualizaciones interactivas.
 * 
 * Componentes incluidos:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ BasicIndicators      - Tarjeta con información básica del       │
 * │                        municipio (población, variación)         │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ PopulationPyramid    - Pirámide de población 2022               │
 * │ PopulationPyramid2010- Pirámide de población 2010               │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ GenderRatio          - Distribución por sexo (pie chart)        │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ HouseholdsTotalCard  - Total de hogares                         │
 * │ PersonsPerHouseholdCard - Personas por hogar                    │
 * │ UrbanRuralCard       - Población urbana vs rural                │
 * │ HouseholdSizeChart   - Tamaño de hogares (1-10+)                │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ EconomyEmployment    - Economía y empleo (DEE 2024)             │
 * │                        Incluye sectores CIIU, tamaño empresas   │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ ThematicListCard     - Tarjeta genérica para listas temáticas   │
 * └──────────────────────────────────────────────────────────────────┘
 * 
 * Bibliotecas utilizadas:
 * - Recharts: Gráficos (BarChart, PieChart, etc.)
 * - Lucide-react: Íconos (Users, Briefcase, Home, etc.)
 * 
 * Colores principales:
 * - BLUE (#1d4ed8): Hombres, indicadores primarios
 * - RED (#dc2626): Mujeres, alertas
 * - ECON_BAR (#fb7185): Gráficos de economía
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import {
  Users,
  BarChartBig,
  Home,
  Building2,
  BarChart3,
  Briefcase,
} from "lucide-react";

const BLUE = "#1d4ed8";
const RED = "#dc2626";
const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#6366f1", "#e11d48"];
const ECON_BAR = "#fb7185";
const ECON_ACCENT = "#be123c";

/* -------------------------------------------------------
   CustomBarLabel
--------------------------------------------------------- */
const CustomBarLabel = ({ x, y, width, height, value }) => {
  if (value == null) return null;
  if (height < 22) {
    return (
      <text x={x + width / 2} y={y - 5} textAnchor="middle" fill={ECON_BAR} fontSize={11} fontWeight={600}>
        {value.toLocaleString("es-DO")}
      </text>
    );
  }
  return (
    <text x={x + width / 2} y={y + 14} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight={700}>
      {value.toLocaleString("es-DO")}
    </text>
  );
};

/* -------------------------------------------------------
   BasicIndicators
--------------------------------------------------------- */
export function BasicIndicators({ indicators, national }) {
  if (!indicators) return null;
  const { poblacion_total, poblacion_2010, poblacion_hombres, poblacion_mujeres, municipio, provincia } = indicators;
  const natTotal = national?.poblacion_total ?? null;
  const natTotal2010 = national?.poblacion_total_2010 ?? null;
  const natH = national?.poblacion_hombres ?? null;
  const natM = national?.poblacion_mujeres ?? null;

  let variacion = null;
  if (poblacion_total != null && poblacion_2010 != null) {
    variacion = ((poblacion_total - poblacion_2010) / poblacion_2010) * 100;
  }
  const variacionColor = variacion == null ? "text-slate-400" : variacion >= 0 ? "text-green-600" : "text-red-600";
  const variacionText = variacion == null ? "" : `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`;

  let rdVariacion = null;
  if (natTotal != null && natTotal2010 != null) {
    rdVariacion = ((natTotal - natTotal2010) / natTotal2010) * 100;
  }
  const rdVariacionColor = rdVariacion == null ? "text-slate-400" : rdVariacion >= 0 ? "text-green-600" : "text-red-600";
  const rdVariacionText = rdVariacion == null ? "" : `${rdVariacion >= 0 ? "+" : ""}${rdVariacion.toFixed(1)}%`;

  return (
    <Card className="border-sky-100 bg-sky-50/70 print-basic-indicators">
      <CardHeader className="border-b border-sky-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-bold text-blue-600">Información básica</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs md:text-sm">
        <div className="font-semibold text-slate-800">{municipio}{provincia ? `, ${provincia}` : ""}</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-slate-500 md:text-xs">Población total</div>
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold md:text-lg">{(poblacion_total ?? 0).toLocaleString("es-DO")}</div>
              {variacion != null && <div className={`text-xs font-semibold ${variacionColor}`}>{variacionText}</div>}
            </div>
            {poblacion_2010 != null && <div className="text-[11px] text-slate-500">2010: {poblacion_2010.toLocaleString("es-DO")}</div>}
            {natTotal != null && (
              <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-2">
                RD (2022): {natTotal.toLocaleString("es-DO")}
                {rdVariacion != null && <span className={`text-[10px] font-semibold ${rdVariacionColor}`}>{rdVariacionText}</span>}
              </div>
            )}
            {natTotal2010 != null && <div className="text-[11px] text-slate-500">RD 2010: {natTotal2010.toLocaleString("es-DO")}</div>}
          </div>
          <div>
            <div className="text-[11px] text-slate-500 md:text-xs">Hombres / Mujeres</div>
            <div className="text-sm">H: {(poblacion_hombres ?? 0).toLocaleString("es-DO")} · M: {(poblacion_mujeres ?? 0).toLocaleString("es-DO")}</div>
            {(natH != null && natM != null) && (
              <div className="mt-0.5 text-[10px] text-slate-500">RD H: {natH.toLocaleString("es-DO")} · RD M: {natM.toLocaleString("es-DO")}</div>
            )}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">Fuente: ONE, Censo Nacional de Población y Vivienda 2022.</p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------
   PopulationPyramid
--------------------------------------------------------- */
export function PopulationPyramid({ pyramid }) {
  if (!pyramid || !pyramid.length) return null;
  const ordered = [...pyramid].reverse();
  const data = ordered.map((g) => ({ age_group: g.age_group, male: -(g.male ?? 0), female: g.female ?? 0 }));

  return (
    <Card className="border-sky-100 bg-sky-50/70 print-pyramid print-card flex flex-col">
      <CardHeader className="border-b border-sky-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600"><BarChartBig className="h-5 w-5" /></div>
          <CardTitle className="text-lg font-bold text-blue-600">Pirámide de población 2022</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="h-64 md:h-72 flex flex-col justify-between print-graph-content">
        <div className="w-full h-full print-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" stackOffset="sign">
              <XAxis type="number" tickFormatter={(v) => Math.abs(v).toLocaleString("es-DO")} />
              <YAxis dataKey="age_group" type="category" width={50} />
              <Tooltip />
              <Bar dataKey="male" stackId="stack" fill={BLUE} name="Hombres" />
              <Bar dataKey="female" stackId="stack" fill={RED} name="Mujeres" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[9px] text-slate-400 mt-0 pt-1 leading-tight mb-0">Fuente: ONE, Censo 2022 (Cuadro 2, Vol III).</p>
      </CardContent>
    </Card>
  );
}

export function PopulationPyramid2010({ pyramid }) {
  if (!pyramid || !pyramid.length) return null;
  const ordered = [...pyramid].reverse();
  const data = ordered.map((g) => ({ ...g, male: -Math.abs(g.male || 0), female: Math.abs(g.female || 0) }));

  return (
    <Card className="border-slate-200 bg-slate-50/80 print-pyramid print-card flex flex-col">
      <CardHeader className="border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-700"><BarChartBig className="h-4 w-4" /></div>
          <CardTitle className="text-sm font-semibold text-slate-900">Pirámide de población 2010</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="h-64 md:h-72 flex flex-col justify-between print-graph-content">
        <div className="w-full h-full print-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" stackOffset="sign">
              <XAxis type="number" tickFormatter={(v) => Math.abs(v).toLocaleString("es-DO")} />
              <YAxis dataKey="age_group" type="category" width={50} />
              <Tooltip />
              <Bar dataKey="male" stackId="stack" fill="#4b5563" name="Hombres" />
              <Bar dataKey="female" stackId="stack" fill="#9ca3af" name="Mujeres" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[9px] text-slate-400 mt-0 pt-1 leading-tight mb-0">Fuente: ONE, Censo 2010.</p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------
   GenderRatio
--------------------------------------------------------- */
export function GenderRatio({ indicators, national }) {
  if (!indicators) return null;
  const hombres = indicators.poblacion_hombres ?? 0;
  const mujeres = indicators.poblacion_mujeres ?? 0;
  const total = hombres + mujeres || 1;
  const data = [{ name: "Hombres", value: hombres }, { name: "Mujeres", value: mujeres }];
  const natH = national?.poblacion_hombres ?? 0;
  const natM = national?.poblacion_mujeres ?? 0;
  const natTotal = natH + natM || 1;

  return (
    <Card className="border-sky-100 bg-sky-50/70 print-gender-ratio print-card">
      <CardHeader className="border-b border-sky-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600"><Users className="h-5 w-5" /></div>
          <CardTitle className="text-lg font-bold text-blue-600">Composición por sexo 2022</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex h-auto flex-col justify-between gap-4 md:h-72 md:gap-2 print-gender-content">
        <div className="flex flex-col md:flex-row flex-1 items-center justify-between gap-4 gender-inner-content">
          <div className="h-64 w-full md:h-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} innerRadius={35} paddingAngle={3} startAngle={90} endAngle={-270}>
                  <Cell key="male" fill={BLUE} />
                  <Cell key="female" fill={RED} />
                </Pie>
                <Tooltip formatter={(val, name) => [`${((val / total) * 100).toFixed(1)}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 space-y-1 text-xs md:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Hombres</span>
              <span className="font-semibold">{((hombres / total) * 100 || 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Mujeres</span>
              <span className="font-semibold">{((mujeres / total) * 100 || 0).toFixed(1)}%</span>
            </div>
            <div className="mt-2 border-t border-slate-100 pt-1 text-[10px] text-slate-500">
              RD H: {((natH / natTotal) * 100 || 0).toFixed(1)}% · RD M: {((natM / natTotal) * 100 || 0).toFixed(1)}%
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-0 pt-1 leading-tight mb-0">Fuente: ONE, Censo 2022.</p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------
   Hogares Cards
--------------------------------------------------------- */
export function HouseholdsTotalCard({ resumen }) {
  if (!resumen) return null;
  const hogares = resumen.hogares_total ?? resumen.hogares ?? null;
  return (
    <Card className="border-sky-100 bg-sky-50/70 print-card print-stat-card">
      <CardHeader className="border-b border-sky-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><Home className="h-4 w-4" /></div>
          <CardTitle className="text-sm font-semibold text-sky-900">Hogares totales</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-xs md:text-sm">
        <div className="text-[11px] text-slate-500 md:text-xs">Hogares</div>
        <div className="text-base font-semibold md:text-lg">{hogares != null ? hogares.toLocaleString("es-DO") : "—"}</div>
      </CardContent>
    </Card>
  );
}

export function PersonsPerHouseholdCard({ resumen }) {
  if (!resumen) return null;
  const pph = resumen.personas_por_hogar ?? null;
  return (
    <Card className="border-sky-100 bg-sky-50/70 print-card print-stat-card">
      <CardHeader className="border-b border-sky-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><Users className="h-4 w-4" /></div>
          <CardTitle className="text-sm font-semibold text-sky-900">Personas por hogar</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-xs md:text-sm">
        <div className="text-[11px] text-slate-500 md:text-xs">Promedio</div>
        <div className="text-base font-semibold md:text-lg">{pph != null ? pph.toLocaleString("es-DO", { maximumFractionDigits: 2 }) : "—"}</div>
      </CardContent>
    </Card>
  );
}

export function UrbanRuralCard({ poblacion }) {
  if (!poblacion) return null;
  const { urbana = 0, rural = 0, total } = poblacion;
  const t = total ?? (urbana + rural);
  const uPct = (poblacion.urbana_pct ?? (urbana * 100) / t) || 0;
  const rPct = (poblacion.rural_pct ?? (rural * 100) / t) || 0;

  return (
    <Card className="border-sky-100 bg-sky-50/70 print-card print-stat-card">
      <CardHeader className="border-b border-sky-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><Building2 className="h-4 w-4" /></div>
          <CardTitle className="text-sm font-semibold text-sky-900">Población urbana / rural</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs md:text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Urbana</span>
          <span className="font-semibold">{urbana.toLocaleString("es-DO")} <span className="ml-1 text-[11px] text-slate-500">({uPct.toFixed(1)}%)</span></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Rural</span>
          <span className="font-semibold">{rural.toLocaleString("es-DO")} <span className="ml-1 text-[11px] text-slate-500">({rPct.toFixed(1)}%)</span></span>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------
   HouseholdSizeChart
--------------------------------------------------------- */
export function HouseholdSizeChart({ records }) {
  if (!records || !records.length) return null;
  const hasTotalZone = records.some((r) => String(r.zona || "").toLowerCase().includes("total"));
  const base = hasTotalZone ? records.filter((r) => String(r.zona || "").toLowerCase().includes("total")) : records;

  const grouped = {};
  for (const row of base) {
    const label = String(row.miembros || "").trim();
    if (!label) continue;
    const val = Number(row.hogares ?? 0);
    if (!grouped[label]) grouped[label] = 0;
    grouped[label] += isNaN(val) ? 0 : val;
  }
  const data = Object.entries(grouped)
    .map(([label, hogares]) => {
      const m = label.match(/\d+/);
      return { label, hogares, order: m ? parseInt(m[0], 10) : 999 };
    })
    .sort((a, b) => a.order - b.order);
  const BAR_COLOR = "#3B82F6";

  return (
    <Card className="border-sky-100 bg-sky-50/70 h-full flex flex-col">
      <CardHeader className="border-b border-sky-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><BarChart3 className="h-4 w-4" /></div>
          <CardTitle className="text-sm font-semibold text-sky-900">Tamaño de los hogares (1–10+)</CardTitle>
        </div>
      </CardHeader>
      {/* Contenido del gráfico para impresión */}
      <CardContent className="h-64 md:h-72 print-graph-content">
        <div className="w-full h-full print-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tickFormatter={(v) => v.toLocaleString("es-DO")} />
              <Tooltip formatter={(value) => [Number(value).toLocaleString("es-DO"), "Hogares"]} />
              <Bar dataKey="hogares" fill={BAR_COLOR} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="hogares" position="top" formatter={(v) => v.toLocaleString("es-DO")} style={{ fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------
   Economy y Empleo
--------------------------------------------------------- */
export function EconomyEmployment({
  econ,
  nationalEcon,
  indicators,
  nationalPopulation,
}) {
  if (!econ && !nationalEcon) {
    return (
      <Card className="border-rose-200 bg-rose-50/80 no-break print-card">
        <CardHeader className="border-b border-rose-100/70">
          <div className="flex items-center gap-3 print-flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm text-rose-700">
              <Briefcase className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold text-rose-900">
              Economía y empleo
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-rose-800">
            No hay datos de economía y empleo cargados para este municipio todavía.
          </p>
          <p className="mt-2 text-[10px] text-rose-700">
            Fuente: ONE, DEE 2024 y Censo 2022.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dee = econ?.dee_2024 ?? {};
  const lm = econ?.labor_market_2022 ?? {};
  const ndee = nationalEcon?.dee_2024 ?? {};

  const rawBands = dee.employment_size_bands?.filter(
    (b) => typeof b.establishments === "number" && b.establishments > 0
  ) ?? [];

  const totalEmployees = dee.total_employees ?? null;

  const sizeBands = rawBands.map((b) => {
    const employeesShare =
      typeof b.employees_share === "number"
        ? b.employees_share
        : totalEmployees && b.employees != null
          ? (b.employees ?? 0) / totalEmployees
          : null;
    const employeesCount =
      b.employees != null
        ? b.employees
        : totalEmployees && employeesShare != null
          ? totalEmployees * employeesShare
          : null;
    return {
      ...b,
      employees_share: employeesShare,
      employees_count: employeesCount,
    };
  });

  const sectorsRaw =
    dee.sectors?.filter(
      (s) => typeof s.establishments === "number" && s.establishments > 0
    ) ?? [];

  const sectors = sectorsRaw.map((s) => {
    const avgEmployees =
      s.establishments && s.employees != null
        ? s.employees / s.establishments
        : null;
    const share =
      typeof s.employees_share === "number"
        ? s.employees_share
        : totalEmployees
          ? (s.employees ?? 0) / totalEmployees
          : null;
    return { ...s, avgEmployees, employees_share: share };
  });

  const muniPop = indicators?.poblacion_total ?? null;
  const muniDensity =
    muniPop && dee.total_establishments != null
      ? dee.total_establishments / (muniPop / 1000)
      : null;
  const natPop = nationalPopulation ?? null;
  const natDensity =
    natPop && ndee.total_establishments != null
      ? ndee.total_establishments / (natPop / 1000)
      : null;
  const densityDiff =
    muniDensity != null && natDensity != null
      ? muniDensity - natDensity
      : null;
  const topSpec = dee.top_specialization ?? null;

  return (
    <Card className="border-rose-200 bg-rose-50/80 no-break print-card">
      <CardHeader className="border-b border-rose-100/70">
        <div className="flex items-center gap-3 print-flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm text-rose-900">
            <Briefcase className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-bold text-rose-900">
            Economía y empleo{" "}
            <span className="font-normal text-base">
              (DEE 2024 + Censo 2022 + Otras Fuentes)
            </span>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-xs md:text-sm">
        {/* 指標グリッド */}
        <div className="grid gap-4 md:grid-cols-4 print-grid print-grid-2">
          {[
            {
              label: "Total de establecimientos (DEE 2024)",
              muni: dee.total_establishments,
              nat: ndee.total_establishments,
            },
            {
              label: "Empleo total (DEE 2024)",
              muni: totalEmployees,
              nat: ndee.total_employees,
            },
            {
              label: "Tamaño promedio de establecimiento",
              muni: dee.avg_employees_per_establishment != null
                ? `${dee.avg_employees_per_establishment.toLocaleString("es-DO", { maximumFractionDigits: 1 })} personas`
                : null,
              nat: ndee.avg_employees_per_establishment != null
                ? `${ndee.avg_employees_per_establishment.toLocaleString("es-DO", { maximumFractionDigits: 1 })} personas`
                : null,
            },
            {
              label: "Establecimientos por 1,000 hab.",
              muni: muniDensity != null
                ? muniDensity.toLocaleString("es-DO", { maximumFractionDigits: 1 })
                : null,
              nat: natDensity != null
                ? natDensity.toLocaleString("es-DO", { maximumFractionDigits: 1 })
                : null,
              extra: muniPop != null ? `Población: ${muniPop.toLocaleString("es-DO")}` : null,
              diff: densityDiff,
            },
          ].map((item, idx) => (
            <div key={idx} className="no-break">
              <div className="text-[11px] text-slate-700">{item.label}</div>
              <div className="text-xl font-bold text-rose-900">{item.muni ?? "—"}</div>
              {item.nat != null && (
                <div className="mt-0.5 text-[10px] text-rose-800">
                  RD: {item.nat}
                  {item.diff != null && (
                    <span className="ml-1 text-[10px]">
                      ({item.diff >= 0 ? "+" : ""}
                      {item.diff.toLocaleString("es-DO", { maximumFractionDigits: 1 })})
                    </span>
                  )}
                </div>
              )}
              {item.extra && <div className="text-[10px] text-rose-800">{item.extra}</div>}
            </div>
          ))}
        </div>

        {/* 円グラフ & 棒グラフ */}
        <div className="grid gap-4 md:grid-cols-2 print-grid print-grid-2">
          <div className="no-break md:h-64">
            <div className="mb-1 text-[11px] font-semibold text-rose-900 md:text-xs">
              Distribución del empleo por tamaño de empresa
            </div>
            {sizeBands.length ? (
              <div className="flex flex-col md:flex-row gap-4 print-flex">
                <div className="w-full md:flex-1">
                  <div className="h-72 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sizeBands}
                          dataKey="employees_share"
                          nameKey="label"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {sizeBands.map((b, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="w-full md:w-44 space-y-1 text-[10px] md:text-xs overflow-y-auto max-h-full">
                  {sizeBands.map((b, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="mt-[5px] inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div>
                        <div className="font-semibold text-slate-800 leading-tight">{b.label}</div>
                        <div className="text-slate-600">
                          {b.employees_count?.toLocaleString("es-DO")}
                          <span className="ml-1 text-[10px] text-slate-500">({(b.employees_share * 100).toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-rose-800">Aún no hay datos de empleo por tamaño de empresa.</p>
            )}
          </div>

          <div className="h-64 md:h-[270px] no-break">
            <div className="mb-1 text-[11px] font-semibold text-rose-900 md:text-xs">
              Empresas por rango de empleo (DEE 2024)
            </div>
            {sizeBands.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeBands}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="establishments" fill={ECON_BAR}>
                    <LabelList content={<CustomBarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[11px] text-rose-800">Aún no hay datos de establecimientos por rango de empleo.</p>
            )}
          </div>
        </div>

        {/* CIIU セクター */}
        <div className="space-y-2 no-break">
          <div className="text-[11px] font-semibold text-rose-900 md:text-xs">
            Principales secciones CIIU (DEE 2024)
          </div>
          {sectors.length ? (
            <div className="grid gap-4 md:grid-cols-[1fr_1.7fr] print-grid print-grid-2">
              <div className="h-72 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectors}
                      dataKey="employees_share"
                      nameKey="label"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {sectors.map((s, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-[10px] md:text-xs">
                {sectors.map((s, idx) => (
                  <div key={idx} className="border-b border-rose-100 pb-1 last:border-b-0">
                    <div className="flex items-center gap-2 mb-0.5 print-flex">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-slate-800">{s.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700 print-flex">
                      <span>Est.: <span className="font-semibold">{s.establishments.toLocaleString("es-DO")}</span></span>
                      {s.employees != null && (
                        <span>
                          Emp.: <span className="font-semibold">{s.employees.toLocaleString("es-DO")}</span>
                          <span className="ml-1 text-[10px] text-slate-500">({(s.employees_share * 100).toFixed(1)}%)</span>
                        </span>
                      )}
                      {s.avgEmployees != null && (
                        <span>
                          Emp./est.: <span className="font-semibold">{s.avgEmployees.toLocaleString("es-DO", { maximumFractionDigits: 1 })}</span>
                        </span>
                      )}
                      {s.lq != null && (
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold ${s.lq >= 1.2 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-500"}`}>
                          LQ {s.lq.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {topSpec && topSpec.label && (
                  <div className="mt-1 text-[10px] text-rose-800">
                    Sector más especializado (LQ): <span className="font-semibold">{topSpec.label} {topSpec.lq != null && ` (LQ: ${topSpec.lq.toFixed(2)})`}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-rose-800">Aún no hay datos de estructura sectorial por secciones CIIU.</p>
          )}
        </div>
        <p className="mt-1 text-[10px] text-rose-700">Fuente: ONE, DEE 2024 y Censo Nacional de Población y Vivienda 2022.</p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------
   ThematicListCard
--------------------------------------------------------- */
export function ThematicListCard({
  title,
  fuente,
  records,
  nationalIndicators,
}) {
  if ((!records || !records.length) && !nationalIndicators) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 md:text-sm">Aún no hay datos disponibles para este municipio.</p>
          <p className="mt-2 text-[10px] text-slate-400">{fuente}</p>
        </CardContent>
      </Card>
    );
  }

  const normalized = (records || []).map((r, i) => ({
    indicator: r.indicator || r.label || `item_${i}`,
    value: r.value,
  }));

  const byIndicator = new Map();
  for (const row of normalized) {
    if (!byIndicator.has(row.indicator)) byIndicator.set(row.indicator, row.value);
  }

  const items = Array.from(byIndicator.entries()).slice(0, 8).map(([indicator, value]) => ({ indicator, value }));

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs md:text-sm">
        {items.length ? (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.indicator} className="flex items-center justify-between gap-2">
                <span className="text-slate-600">{formatIndicatorName(item.indicator)}</span>
                <span className="text-right">
                  <span className="font-semibold">
                    {typeof item.value === "number" ? item.value.toLocaleString("es-DO", { maximumFractionDigits: 2 }) : item.value}
                  </span>
                  {nationalIndicators && nationalIndicators[item.indicator] != null && (
                    <span className="ml-1 block text-[10px] text-slate-500">
                      RD: {typeof nationalIndicators[item.indicator] === "number" ? nationalIndicators[item.indicator].toLocaleString("es-DO", { maximumFractionDigits: 2 }) : nationalIndicators[item.indicator]}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Aún no hay datos municipales en esta temática.</p>
        )}
        <p className="mt-2 text-[10px] text-slate-400">{fuente}</p>
      </CardContent>
    </Card>
  );
}

function formatIndicatorName(key) {
  if (!key || typeof key !== "string") return "—";
  return key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}