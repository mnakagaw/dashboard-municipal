/**
 * RDMap.jsx - Mapa Interactivo de República Dominicana
 * 
 * Este componente renderiza un mapa interactivo usando Leaflet que muestra:
 * - Todos los municipios de República Dominicana (158)
 * - El municipio seleccionado resaltado en rojo
 * - Tooltips con el nombre del municipio al pasar el cursor
 * 
 * Tecnologías utilizadas:
 * - Leaflet: Biblioteca de mapas interactivos
 * - react-leaflet: Wrapper de React para Leaflet
 * - OpenStreetMap: Proveedor de tiles del mapa base
 * 
 * Datos:
 * - GeoJSON de municipios (src/data/adm2.json)
 * 
 * Props:
 * - selectedAdm2: Código del municipio seleccionado (ej: "02001")
 * - selectedProvince: Nombre de la provincia (para selección provincial)
 * - onSelectMunicipio: Callback cuando el usuario hace clic en un municipio
 */

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function MapUpdater({ selectedAdm2, selectedProvince, selectedRegion, geojson }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;

    let features = [];

    if (selectedAdm2) {
      features = geojson.features.filter(
        (f) => f.properties.adm2_code === selectedAdm2
      );
    } else if (selectedProvince) {
      features = geojson.features.filter(
        (f) => f.properties.provincia === selectedProvince
      );
    } else if (selectedRegion) {
      // Note: Since we don't have region_id in adm2.json, 
      // we'd normally need a mapping. But the parent passes styling logic.
      // Zooming to region bounds could be added here if needed.
    }

  }, [selectedAdm2, selectedProvince, selectedRegion, geojson, map]);

  return null;
}

export function RDMap({ selectedAdm2, selectedProvince, selectedRegion, onSelectMunicipio }) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const mod = await import("../data/adm2.json");
        const gj = mod.default;
        setGeojson(gj);
      } catch (e) {
        console.error("Error cargando GeoJSON", e);
      }
    }
    load();
  }, []);

  // We need to know which provinces belong to which region for highlighting.
  // We can use a simple mapping or just check the data if available.
  // Since we have regions_index.json, we can use it.
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
        if (onSelectMunicipio) onSelectMunicipio(feature.properties.adm2_code, feature.properties.provincia);
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
          attribution='&copy; OSM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater
          selectedAdm2={selectedAdm2}
          selectedProvince={selectedProvince}
          selectedRegion={selectedRegion}
          geojson={geojson}
        />
        {geojson && <GeoJSON data={geojson} style={styleFeature} onEachFeature={onEachFeature} />}
      </MapContainer>
    </div>
  );
}