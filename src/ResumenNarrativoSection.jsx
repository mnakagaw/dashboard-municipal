import React, { useEffect, useState } from "react";

export default function ResumenNarrativoSection({ selectedMunicipio, narrative }) {
  if (!selectedMunicipio) return null;

  return (
    <div
      className="
        bg-white p-5 mt-6 rounded-xl shadow-sm border border-slate-200
      "
    >
      <h2 className="text-xl font-semibold text-slate-800 mb-3">
        Resumen Narrativo del Municipio
      </h2>

      <div className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
        {narrative || "Generando resumen narrativo…"}
      </div>
    </div>
  );
}
