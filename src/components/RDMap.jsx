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

    // If features are selected, we simply re-render (style updates),
    // but we DO NOT zoom in. The user wants to see the context of the whole country.

    // Always ensure we are at the default view if users haven't moved it themselves? 
    // Actually, simply doing nothing here preserves the user's current view.
    // If we want to FORCE the "Whole DR" view on every selection change, we could do:
    // map.setView([18.7, -70.16], 8); 
    // But usually "don't zoom" is enough.

    // However, if the user explicitly said "Set default to allow entering whole DR", 
    // maybe they want the initial view to be better?
    // Current MapContainer center is [17.7, -69.5], zoom 6.6.
    // The previous 'else' block set view to [18.7, -70.16], 8.
    // I will unify this to a good default and remove the zooming/panning on select.

    // Let's just remove the moving entirely for now to respect "don't zoom".
    // Or providing a "Reset View" button might be better later.
    // For now, removing the auto-zoom logic.

  }, [selectedAdm2, selectedProvince, geojson, map]);

  return null;
}

export function RDMap({ selectedAdm2, selectedProvince, onSelectMunicipio }) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Import from src/data to ensure it's bundled by Vite
        const mod = await import("../data/adm2.json");
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
        center={[19.0, -70.16]}
        zoom={7.5}
        zoomSnap={0.5}
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
          geojson={geojson}
        />
        {geojson && <GeoJSON data={geojson} style={styleFeature} onEachFeature={onEachFeature} />}
      </MapContainer>
    </div>
  );
}