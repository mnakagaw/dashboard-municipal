/**
 * RDMap.jsx - Mapa Interactivo de República Dominicana
 *
 * Este componente renderiza un mapa interactivo usando Leaflet que muestra:
 * - Todos los municipios de República Dominicana (155)
 * - El municipio/provincia/región seleccionado resaltado en rojo
 * - Tooltips con el nombre del municipio al pasar el cursor
 *
 * La impresión se maneja por PrintMapSVG.jsx (componente aparte),
 * NO por este componente.
 */

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function RDMap({ selectedAdm2, selectedProvince, selectedRegion, onSelectMunicipio }) {
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

  const [regionsIndex, setRegionsIndex] = useState([]);
  useEffect(() => {
    import("../data/regions_index.json").then(m => setRegionsIndex(m.default));
  }, []);

  const styleFeature = (feature) => {
    const prov = feature.properties.provincia;
    const adm2 = feature.properties.adm2_code;

    let isSelected = false;

    if (selectedAdm2) {
      isSelected = adm2 === selectedAdm2;
    } else if (selectedProvince) {
      isSelected = prov === selectedProvince;
    } else if (selectedRegion) {
      if (selectedRegion === "nacional") {
        isSelected = true;
      } else {
        const regObj = regionsIndex.find(r => r.id === selectedRegion);
        if (regObj) {
          isSelected = regObj.provincias.includes(prov);
        }
      }
    }

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
      <MapContainer
        center={[18.9, -70.2]}
        zoom={7.2}
        zoomSnap={0.1}
        zoomDelta={0.5}
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
  );
}
