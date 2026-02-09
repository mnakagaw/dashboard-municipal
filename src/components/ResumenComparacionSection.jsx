import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export default function ResumenComparacionSection({
    selectedMunicipio,
    rows, // Now receiving pre-calculated rows
}) {

    // Don't render if no specific selection context or missing key data
    if (!selectedMunicipio || !rows) return null;

    const actualProvName = selectedMunicipio.provincia;
    // Mode check: if selectedMunicipio has no adm2_code, it's virtually a "Province Mode" selection
    const isProvinciaMode = !selectedMunicipio.adm2_code;

    return (
        <Card className="no-break print-card mt-6 border-slate-200 shadow-sm">
            <CardHeader className="py-3 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    📊 Resumen de Comparación
                </CardTitle>
                <p className="text-xs text-slate-500">
                    Comparativa de indicadores clave: Local vs. Provincial vs. Nacional
                </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="w-full overflow-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-700">
                            <tr className="border-b border-slate-200">
                                <th className="py-2 pl-4 text-left font-semibold w-1/3">Indicador</th>
                                {!isProvinciaMode && (
                                    <th className="py-2 text-right font-bold text-emerald-700 bg-emerald-50/30 px-2">
                                        {selectedMunicipio.municipio || "Municipio"}
                                    </th>
                                )}
                                <th className="py-2 text-right font-semibold text-blue-700 px-2">
                                    Prov. {actualProvName}
                                </th>
                                <th className="py-2 text-right text-slate-500 pr-4 px-2">
                                    País
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((section, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className="bg-slate-100/50">
                                        <td colSpan={isProvinciaMode ? 3 : 4} className="py-1.5 pl-4 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                                            {section.group}
                                        </td>
                                    </tr>
                                    {section.rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                            <td className="py-2 pl-4 text-slate-600">
                                                {row.label}
                                            </td>
                                            {!isProvinciaMode && (
                                                <td className="py-2 px-2 text-right font-medium text-slate-900 bg-emerald-50/10">
                                                    {row.fmt(row.municipio)}
                                                </td>
                                            )}
                                            <td className="py-2 px-2 text-right text-slate-700">
                                                {row.fmt(row.provincia)}
                                            </td>
                                            <td className="py-2 px-2 text-right text-slate-500 pr-4">
                                                {row.fmt(row.nacional)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
