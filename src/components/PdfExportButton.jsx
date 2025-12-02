import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import PrintLayout from "./PrintLayout";

export default function PdfExportButton(props) {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Tu_municipio_en_cifras_${props.selectedId || ""}`,
  });

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        disabled={!props.municipio}
        className="rounded-lg bg-sky-600 px-4 py-2 text-white text-sm font-semibold shadow hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        Exportar PDF diagnóstico
      </button>

      {/* ★ DOM を完全に描画するが視覚的に透明にする方法（最安定） */}
      <div
        style={{
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: -1,
        }}
      >
        <div ref={printRef}>
          <PrintLayout {...props} />
        </div>
      </div>
    </>
  );
}
