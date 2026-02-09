import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function MapUpdater({ selectedAdm2, selectedProvince, geojson }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;

    let features = [];

    if (selectedAdm2) {
      // Municipio selection
      features = geojson.features.filter(
        (f) => f.properties.adm2_code === selectedAdm2
      );
    } else if (selectedProvince) {
      // Province selection
      features = geojson.features.filter(
        (f) => f.properties.provincia === selectedProvince
      );
    }

    if (features.length > 0) {
      // Create a temporary GeoJSON layer to get bounds
      const layer = L.geoJSON(features);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
      }
    } else {
      // Reset to default view if no selection
      map.setView([18.7, -70.16], 8); // Adjusted to center DR better
    }
  }, [selectedAdm2, selectedProvince, geojson, map]);

  return null;
}

export function RDMap({ selectedAdm2, selectedProvince, onSelectMunicipio }) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Use dynamic import instead of fetch to ensure proper bundling and path resolution
        const mod = await import("../../public/data/adm2.geojson");
        const gj = mod.default;
        setGeojson(gj);
      } catch (e) {
        console.error("Error cargando GeoJSON", e);
      }
    }
    load();
  }, []);

  const styleFeature = (feature) => {
    const adm2 = feature.properties.adm2_code;
    const provincia = feature.properties.provincia;
    const isSelected =
      (selectedAdm2 && feature.properties.adm2_code === selectedAdm2) ||
      (!selectedAdm2 && selectedProvince && feature.properties.provincia === selectedProvince);

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
    /* ★重要: ここに "print-map-wrapper" クラスが必要です */
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 print-map-wrapper">
      <MapContainer
        /* ★修正: 高さを180pxまで縮めるため、ズームを 6.5 に下げる */
        center={[17.7, -69.5]}
        zoom={6.6}
        zoomSnap={0.1}
        zoomDelta={0.1}
        wheelPxPerZoomLevel={300}
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
          geojson={geojson}
        />
        {geojson && <GeoJSON data={geojson} style={styleFeature} onEachFeature={onEachFeature} />}
      </MapContainer>
    </div>
  );
}