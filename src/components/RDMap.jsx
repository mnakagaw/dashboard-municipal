import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function buildPathFromRings(rings, project) {
  return (rings || [])
    .map((ring) => {
      if (!ring?.length) return "";
      const [firstLon, firstLat] = ring[0];
      const [firstX, firstY] = project(firstLon, firstLat);
      const commands = [`M ${firstX} ${firstY}`];
      for (let i = 1; i < ring.length; i += 1) {
        const [lon, lat] = ring[i];
        const [x, y] = project(lon, lat);
        commands.push(`L ${x} ${y}`);
      }
      commands.push("Z");
      return commands.join(" ");
    })
    .join(" ");
}

function PrintStaticAdm2Map({ geojson, selectedAdm2, selectedProvince }) {
  const width = 1000;
  const height = 500;

  const { features, project } = useMemo(() => {
    const feats = geojson?.features || [];
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    const scanCoords = (coords) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        const lon = coords[0];
        const lat = coords[1];
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        return;
      }
      for (const c of coords) scanCoords(c);
    };

    for (const f of feats) scanCoords(f?.geometry?.coordinates);

    const lonSpan = maxLon - minLon || 1;
    const latSpan = maxLat - minLat || 1;
    const pad = 8;
    const drawableW = width - pad * 2;
    const drawableH = height - pad * 2;

    // Keep isotropic scale so the map is not vertically squashed in print.
    const scale = Math.min(drawableW / lonSpan, drawableH / latSpan);
    const usedW = lonSpan * scale;
    const usedH = latSpan * scale;
    const offsetX = pad + (drawableW - usedW) / 2;
    const offsetY = pad + (drawableH - usedH) / 2;

    const p = (lon, lat) => {
      const x = offsetX + (lon - minLon) * scale;
      const y = offsetY + (maxLat - lat) * scale;
      return [x.toFixed(2), y.toFixed(2)];
    };

    return { features: feats, project: p };
  }, [geojson]);

  return (
    <div className="print-static-map h-full w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="0" y="0" width={width} height={height} fill="#e5e7eb" />
        {features.map((feature, index) => {
          const geom = feature?.geometry;
          const props = feature?.properties || {};
          const isSelected =
            (selectedAdm2 && props.adm2_code === selectedAdm2) ||
            (!selectedAdm2 &&
              selectedProvince &&
              props.provincia === selectedProvince);
          const stroke = isSelected ? "#b91c1c" : "#64748b";
          const fill = isSelected ? "#fecaca" : "#f1f5f9";
          const strokeWidth = isSelected ? 2.2 : 1.1;

          if (!geom) return null;

          if (geom.type === "Polygon") {
            const d = buildPathFromRings(geom.coordinates, project);
            if (!d) return null;
            return (
              <path
                key={`poly-${index}`}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            );
          }

          if (geom.type === "MultiPolygon") {
            return (
              <g key={`mpoly-${index}`}>
                {(geom.coordinates || []).map((poly, i) => {
                  const d = buildPathFromRings(poly, project);
                  if (!d) return null;
                  return (
                    <path
                      key={`mp-${index}-${i}`}
                      d={d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </g>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
}

export function RDMap({ selectedAdm2, selectedProvince, onSelectMunicipio }) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const mod = await import("../data/adm2.json");
        setGeojson(mod.default);
      } catch (e) {
        console.error("Error cargando GeoJSON", e);
      }
    }
    load();
  }, []);

  const styleFeature = (feature) => {
    const isSelected =
      (selectedAdm2 && feature.properties.adm2_code === selectedAdm2) ||
      (!selectedAdm2 &&
        selectedProvince &&
        feature.properties.provincia === selectedProvince);

    return {
      color: isSelected ? "#b91c1c" : "#64748b",
      weight: isSelected ? 2 : 1,
      fillColor: isSelected ? "#fecaca" : "#e2e8f0",
      fillOpacity: isSelected ? 0.9 : 0.6,
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onSelectMunicipio) {
          onSelectMunicipio(
            feature.properties.adm2_code,
            feature.properties.provincia
          );
        }
      },
    });
    if (feature.properties.municipio) {
      layer.bindTooltip(feature.properties.municipio, { direction: "center" });
    }
  };

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 print-map-wrapper">
      <div className="print-map-live h-full w-full">
        <MapContainer
          center={[18.9, -70.2]}
          zoom={7}
          zoomSnap={1}
          zoomDelta={1}
          wheelPxPerZoomLevel={60}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution="&copy; OSM"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geojson && (
            <GeoJSON data={geojson} style={styleFeature} onEachFeature={onEachFeature} />
          )}
        </MapContainer>
      </div>

      {geojson && (
        <PrintStaticAdm2Map
          geojson={geojson}
          selectedAdm2={selectedAdm2}
          selectedProvince={selectedProvince}
        />
      )}
    </div>
  );
}
