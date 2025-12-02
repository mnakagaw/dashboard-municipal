import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ============================================================
   3 色テーマ（Educación のオレンジ系 UI に合わせた配色）
   ------------------------------------------------------------
   Abandono → オレンジ
   Promoción → グリーン
   Reprobación → レッド
============================================================ */
const CHART_COLORS = {
  abandono: "#f59e0b",   // orange
  promocion: "#22c55e", // green
  reprobacion: "#ef4444", // red
};

/* ============================================================
   Tooltip（Recharts 用）
============================================================ */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div
        style={{
          background: "white",
          padding: "6px 10px",
          borderRadius: "6px",
          border: "1px solid #ddd",
          fontSize: "12px",
        }}
      >
        <div><strong>{label}</strong></div>
        <div>
          {item.value}% (RD: {item.payload.rd})
        </div>
      </div>
    );
  }
  return null;
};

/* ============================================================
   カード（各指標ブロック）
============================================================ */
function StatCard({ label, v, rd }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">
        {v} <span className="text-xs text-slate-500">(RD: {rd})</span>
      </div>
    </div>
  );
}

/* ============================================================
   円グラフカード（Inicial / Primario / Secundario）
============================================================ */
function CycleChartCard({ title, data }) {
  const pieData = [
    { name: "Abandono", key: "abandono", value: data.abandono, rd: data.rd_abandono },
    { name: "Promoción", key: "promocion", value: data.promocion, rd: data.rd_promocion },
    { name: "Reprobación", key: "reprobacion", value: data.reprobacion, rd: data.rd_reprobacion },
  ];

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col items-center">
      <h3 className="text-lg font-bold text-orange-700 mb-3">{title}</h3>

      <div className="flex items-center gap-5 w-full">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                startAngle={90}     // ★追加
                endAngle={-270}     // ★追加
              >
                {pieData.map((d) => (
                  <Cell key={d.key} fill={CHART_COLORS[d.key]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* テキスト説明 */}
        <div className="text-sm space-y-1">
          {pieData.map((d) => (
            <div key={d.key} className="flex gap-2 items-center">
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  backgroundColor: CHART_COLORS[d.key],
                  borderRadius: "50%",
                }}
              />
              <span className="font-medium" style={{ color: CHART_COLORS[d.key] }}>
                {d.name}:
              </span>
              <span>
                {d.value}% <span className="text-slate-500 text-xs">(RD: {d.rd})</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   メインコンポーネント
============================================================ */
export default function EducacionDashboard({ records }) {
  const muni = records?.[0] || null;

  if (!muni) return <div>No hay datos disponibles.</div>;

  const infra = muni.anuario?.infraestructura || {};
  const efic = muni.anuario?.eficiencia || {};

  // RD national averages
  const RD = {
    inicial: { abandono: 1.4, promocion: 98.6, reprobacion: 0.0 },
    primario: { abandono: 2.6, promocion: 92.3, reprobacion: 5.1 },
    secundario: { abandono: 5.2, promocion: 88.8, reprobacion: 6.6 },
  };

  return (
    <div className="my-6 rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-orange-200 rounded-full flex items-center justify-center">
          <span className="text-2xl">🎓</span>
        </div>
        <h2 className="text-xl font-bold text-orange-700">
          Educación – contexto general
        </h2>
      </div>

      <h3 className="text-lg font-semibold">{muni.municipio}</h3>
      <div className="text-sm text-slate-600 mb-3">
        Provincia: {muni.provincia}
      </div>

      {/* Distrito Educativo */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="font-semibold text-slate-700">Distrito educativo</div>
        <div className="text-slate-900">{muni.anuario?.distrito_educativo}</div>
      </div>

      {/* Infraestructura */}
      <h3 className="font-semibold text-slate-700 mb-2">Infraestructura educativa</h3>
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Aulas por plantel" v={infra.aulas_por_plantel} rd={8.8} />
        <StatCard label="Secciones por centro" v={infra.secciones_por_centro} rd={9.8} />
        <StatCard label="Secciones por aula" v={infra.secciones_por_aula} rd={1.3} />
        <StatCard label="Docentes por centro" v={infra.docentes_por_centro} rd={16.5} />
        <StatCard label="Alumnos por centro" v={infra.alumnos_por_centro} rd={202.7} />
        <StatCard label="Alumnos por aula" v={infra.alumnos_por_aula} rd={27.2} />
        <StatCard label="Alumnos por sección" v={infra.alumnos_por_seccion} rd={20.0} />
        <StatCard label="Alumnos por docente" v={infra.alumnos_por_docente} rd={12.9} />
      </div>

      {/* Eficiencia con gráficos */}
      <h3 className="font-semibold text-slate-700 mt-6 mb-3">
        Eficiencia del sistema educativo
      </h3>

      <div className="grid md:grid-cols-3 gap-4">

        <CycleChartCard
          title="Inicial"
          data={{
            abandono: efic.inicial.abandono,
            promocion: efic.inicial.promocion,
            reprobacion: efic.inicial.reprobacion,
            rd_abandono: RD.inicial.abandono,
            rd_promocion: RD.inicial.promocion,
            rd_reprobacion: RD.inicial.reprobacion,
          }}
        />

        <CycleChartCard
          title="Primario"
          data={{
            abandono: efic.primario.abandono,
            promocion: efic.primario.promocion,
            reprobacion: efic.primario.reprobacion,
            rd_abandono: RD.primario.abandono,
            rd_promocion: RD.primario.promocion,
            rd_reprobacion: RD.primario.reprobacion,
          }}
        />

        <CycleChartCard
          title="Secundario"
          data={{
            abandono: efic.secundario.abandono,
            promocion: efic.secundario.promocion,
            reprobacion: efic.secundario.reprobacion,
            rd_abandono: RD.secundario.abandono,
            rd_promocion: RD.secundario.promocion,
            rd_reprobacion: RD.secundario.reprobacion,
          }}
        />
      </div>

      <p className="mt-4 text-[10px] text-slate-500">
        Fuente: MINERD, Anuario Estadístico Educativo y Censo 2022.
      </p>
    </div>
  );
}
