import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export default function TICSection({ tic }) {
  if (!tic) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tecnologías de Información y Comunicación</CardTitle>
        </CardHeader>
        <CardContent>No hay datos disponibles.</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Internet 使用者 */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Uso de Internet (3 meses prev.)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p><strong>Usuarios:</strong> {tic.used.toLocaleString()}</p>
          <p><strong>Población (5+):</strong> {tic.total.toLocaleString()}</p>
          <p><strong>Tasa de uso:</strong> {(tic.rate_used * 100).toFixed(1)}%</p>
        </CardContent>
      </Card>

      {/* 追加可能：dispositivos のデータ */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Dispositivos TIC</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>※ Cuadro5/6 に基づき後で拡張可能</p>
        </CardContent>
      </Card>

      {/* 追加可能：都市・農村の差 */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Brechas (Urbano / Rural)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>※ 次段階で実装予定</p>
        </CardContent>
      </Card>
    </div>
  );
}
