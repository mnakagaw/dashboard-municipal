import React from "react";

/**
 * PrintLayout – PDF専用 安定版（テキスト＋表のみ）
 *
 * - タイトル: Diagnostico Municipal: {municipio}
 * - Region は出さない
 * - 画像・グラフなし（<img> も Recharts も使わない）
 * - Condición de vida / Servicios básicos は Web と同じカテゴリをすべて表形式で出力
 * - ページ数はブラウザ任せ（height 固定しない）ので、長くても勝手に複数ページに分割される
 */


const PrintLayout = React.forwardRef(
  (
    {
      municipio,
      indicadores,
      econ,
      // Condición de vida 関連
      condicionVida,
      nationalCondicionVida,
      tic,
      // 使うかもしれない他の全国値
      nationalBasic,
      nationalEcon,
      // 将来用の教育データ（今は「—」フォールバック）
      educacion,
    },
    ref
  ) => {
    if (!municipio || !indicadores) return <div ref={ref} />;

    const title = municipio.municipio || "Municipio sin nombre";
    const adm2 = municipio.adm2_code || "";

    const safe = (v) =>
      v === null || v === undefined || v === "" ? "—" : v;

    const format = (v, opt = {}) => {
      if (v === null || v === undefined || v === "") return "—";
      const n = Number(v);
      if (Number.isNaN(n)) return "—";
      return n.toLocaleString("es-DO", opt);
    };

    const today = new Date().toLocaleDateString("es-DO");

    // ---------- Condición de vida 用ラベル ----------

    const bloqueLabels = {
      sanitarios: "Servicios sanitarios",
      agua_domestico: "Agua para uso doméstico",
      agua_beber: "Agua para beber",
      alumbrado: "Alumbrado principal",
      combustible: "Combustible para cocinar",
      basura: "Eliminación de basura",
    };

    const catLabels = {
      inodoro: "Inodoro",
      letrina: "Letrina",
      no_tiene: "No tiene",
      sin_informacion: "Sin información",
      del_acueducto_dentro_de_la_vivienda: "Acueducto dentro de la vivienda",
      del_acueducto_en_el_patio_de_la_vivienda: "Acueducto en el patio",
      de_una_llave_publica: "Llave pública",
      de_una_llave_de_otra_vivienda: "Llave de otra vivienda",
      de_un_tubo_de_la_calle: "Tubo de la calle",
      manantial_rio_arroyo: "Manantial / río",
      pozo_tubular: "Pozo tubular",
      pozo_cavado: "Pozo cavado",
      lluvia: "Agua de lluvia",
      camion_tanque: "Camión tanque",
      camioncito_procesada: "Camioncito procesada",
      botellones: "Botellones",
      otro: "Otro",
      energia_eletrica_del_tendido_publico: "Electricidad red pública",
      lampara_de_gas_propano: "Lámpara gas propano",
      lampara_de_gas_kerosene: "Lámpara de kerosene",
      energia_electrica_de_planta_propia: "Planta eléctrica propia",
      paneles_solares: "Paneles solares",
      gas_propano: "Gas propano",
      carbon: "Carbón",
      lena: "Leña",
      electricidad: "Electricidad",
      no_cocina: "No cocina",
      la_recoge_el_ayuntamiento: "Recolección municipal",
      la_recoge_una_empresa_privada: "Empresa privada",
      la_queman: "La queman",
      la_tiran_en_el_patio_o_sola: "La tiran en patio",
      la_tiran_en_un_vertedero: "Vertedero",
      la_tiran_en_un_rio_o_canada: "Río / cañada",
      otros: "Otros",
    };

    const prettyCat = (key) => catLabels[key] || key.replace(/_/g, " ");

    // municipio キー → national キー 対応（構造は同じはず）
    const bloqueKeyMap = {
      sanitarios: "sanitarios",
      agua_domestico: "agua_domestico",
      agua_beber: "agua_beber",
      alumbrado: "alumbrado",
      combustible: "combustible",
      basura: "basura",
    };

    const getNationalPct = (bloqueKey, catKey) => {
      if (!nationalCondicionVida) return null;
      const natKey = bloqueKeyMap[bloqueKey];
      if (!natKey) return null;
      const block = nationalCondicionVida[natKey];
      const cat = block?.categorias?.[catKey];
      if (!cat || typeof cat.pct !== "number") return null;
      return cat.pct;
    };

    const renderCondicionBlock = (bloqueKey) => {
      if (!condicionVida) return null;
      const block = condicionVida[bloqueKey];
      if (!block) return null;

      const rows = Object.entries(block.categorias || {});

      return (
        <div key={bloqueKey} className="mb-4">
          <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-800">
            <span>{bloqueLabels[bloqueKey] || bloqueKey}</span>
            <span>
              Total: {format(block.total, { maximumFractionDigits: 0 })} hogares
              (100%)
            </span>
          </div>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1 text-left">
                  Categoría
                </th>
                <th className="border border-slate-300 px-2 py-1 text-right">
                  Hogares
                </th>
                <th className="border border-slate-300 px-2 py-1 text-right">
                  %
                </th>
                <th className="border border-slate-300 px-2 py-1 text-right">
                  RD (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([catKey, obj]) => {
                const natPct = getNationalPct(bloqueKey, catKey);
                return (
                  <tr key={catKey}>
                    <td className="border border-slate-300 px-2 py-0.5">
                      {prettyCat(catKey)}
                    </td>
                    <td className="border border-slate-300 px-2 py-0.5 text-right">
                      {format(obj.abs, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="border border-slate-300 px-2 py-0.5 text-right">
                      {typeof obj.pct === "number"
                        ? obj.pct.toFixed(1)
                        : "—"}
                    </td>
                    <td className="border border-slate-300 px-2 py-0.5 text-right">
                      {typeof natPct === "number"
                        ? natPct.toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    const renderTIC = () => {
      if (!tic) return null;

      const pct = (obj) =>
        obj && typeof obj.rate_used === "number"
          ? (obj.rate_used * 100).toFixed(1)
          : "—";

      return (
        <div className="mt-2">
          <div className="mb-1 text-[11px] font-semibold text-slate-800">
            TIC – acceso personal (5+ años)
          </div>
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              <tr>
                <td className="border border-slate-300 px-2 py-0.5">
                  Internet
                </td>
                <td className="border border-slate-300 px-2 py-0.5 text-right">
                  {pct(tic.internet)}%
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-0.5">
                  Smartphone
                </td>
                <td className="border border-slate-300 px-2 py-0.5 text-right">
                  {pct(tic.cellular)}%
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-0.5">
                  Computadora
                </td>
                <td className="border border-slate-300 px-2 py-0.5 text-right">
                  {pct(tic.computer)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className="print-root mx-auto w-[816px] bg-white px-8 py-8 text-[11px] text-slate-900"
      >
        {/* 1. Encabezado */}
        <header className="mb-6 flex justify-between gap-6">
          <div>
            <p className="text-[10px] text-slate-500">Exportar PDF diagnóstico</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Diagnostico Municipal:{" "}
              <span className="text-sky-700">{title}</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Tu municipio en cifras · Reporte municipal
            </p>
            <p className="text-[10px] text-slate-400">Generado el {today}</p>
          </div>
          <div className="text-right text-[11px] text-slate-700">
            <div className="font-semibold text-slate-900">{title}</div>
            <div>Provincia: {safe(municipio.provincia)}</div>
            {/* Regiónは表示しない */}
            <div>ADM2: {safe(adm2)}</div>
          </div>
        </header>

        {/* 2. Ficha básica */}
        <section className="mb-6">
          <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase text-slate-800">
            Ficha básica del municipio
          </h2>
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              <tr>
                <td className="w-1/3 border border-slate-300 px-2 py-1">
                  Población total (2022)
                </td>
                <td className="border border-slate-300 px-2 py-1 text-right">
                  {format(indicadores.poblacion_total, {
                    maximumFractionDigits: 0,
                  })}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1">
                  Densidad (hab/km²)
                </td>
                <td className="border border-slate-300 px-2 py-1 text-right">
                  {format(indicadores.densidad_poblacional, {
                    maximumFractionDigits: 1,
                  })}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1">
                  Superficie (km²)
                </td>
                <td className="border border-slate-300 px-2 py-1 text-right">
                  {format(indicadores.superficie_km2, {
                    maximumFractionDigits: 1,
                  })}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1">
                  Año referencia
                </td>
                <td className="border border-slate-300 px-2 py-1 text-right">
                  {safe(indicadores.anio_referencia)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. Demografía（簡易版） */}
        <section className="mb-6">
          <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase text-slate-800">
            Demografía y características sociales
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">% mujeres</td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(indicadores.pct_mujeres, {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">% hombres</td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(indicadores.pct_hombres, {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">
                    Índice de envejecimiento
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(indicadores.indice_envejecimiento, {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse text-[11px]">
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">
                    % nacidos en otro municipio
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(indicadores.pct_nacidos_otro_muni, {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">
                    % nacidos en el extranjero
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(indicadores.pct_nacidos_extranjero, {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">
                    Jóvenes embarazadas (12–19)
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(indicadores.pct_jovenes_embarazadas, {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Condición de vida / Servicios básicos */}
        <section className="mb-6">
          <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase text-slate-800">
            Condición de vida / Servicios básicos (Censo 2022 – Hogares)
          </h2>

          {condicionVida ? (
            <>
              {renderCondicionBlock("sanitarios")}
              {renderCondicionBlock("agua_domestico")}
              {renderCondicionBlock("agua_beber")}
              {renderCondicionBlock("alumbrado")}
              {renderCondicionBlock("combustible")}
              {renderCondicionBlock("basura")}
            </>
          ) : (
            <p className="text-[11px] italic text-slate-500">
              Aún no se han cargado los indicadores de condición de vida para
              este municipio.
            </p>
          )}

          {renderTIC()}
        </section>

        {/* 5. Economía y empleo */}
        <section className="mb-6">
          <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase text-slate-800">
            Economía y empleo (DEE 2024 + otras fuentes)
          </h2>

          {econ ? (
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">PET total</td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(econ.pet_total, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">PEA total</td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(econ.pea_total, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">
                    Tasa participación
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(econ.tasa_participacion, {
                      maximumFractionDigits: 1,
                    })}
                    %
                    {nationalEcon?.tasa_participacion != null && (
                      <span className="ml-2 text-[10px] text-slate-500">
                        RD:{" "}
                        {format(nationalEcon.tasa_participacion, {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">
                    Tasa ocupación
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(econ.tasa_ocupacion, {
                      maximumFractionDigits: 1,
                    })}
                    %
                    {nationalEcon?.tasa_ocupacion != null && (
                      <span className="ml-2 text-[10px] text-slate-500">
                        RD:{" "}
                        {format(nationalEcon.tasa_ocupacion, {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">
                    Tasa desempleo
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {format(econ.tasa_desempleo, {
                      maximumFractionDigits: 1,
                    })}
                    %
                    {nationalEcon?.tasa_desempleo != null && (
                      <span className="ml-2 text-[10px] text-slate-500">
                        RD:{" "}
                        {format(nationalEcon.tasa_desempleo, {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-[11px] italic text-slate-500">
              Aún no se han cargado los indicadores del mercado laboral para
              este municipio.
            </p>
          )}
        </section>

        {/* 6. Educación（今はダミー構造。あとでデータを差し込む） */}
        <section className="mb-6">
          <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase text-slate-800">
            Educación – contexto general
          </h2>
          <p className="text-[11px] text-slate-500">
            (ここに Educación の詳細テーブルを後で差し込み。今は「—」でプレースホルダ。)
          </p>
        </section>

        <footer className="mt-8 border-t border-slate-200 pt-2 text-center text-[10px] text-slate-500">
          © 2025 Tu Municipio en Cifras — Reporte generado automáticamente.
        </footer>
      </div>
    );
  }
);

export default PrintLayout;
