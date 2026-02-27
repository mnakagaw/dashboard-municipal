/**
 * SharedCharts.jsx - Componentes de Gráficos Compartidos
 *
 * Componentes genéricos reutilizables:
 * - ThematicListCard: Tarjeta genérica para listas temáticas
 * - formatIndicatorName: Función utilitaria para formatear nombres de indicadores
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

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

/* -------------------------------------------------------
   formatIndicatorName
--------------------------------------------------------- */
export function formatIndicatorName(key) {
    if (!key || typeof key !== "string") return "—";
    return key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
