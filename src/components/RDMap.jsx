import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ selectedAdm2, selectedProvince, selectedRegion, geojson }) {
  const map = useMap();

function PrintStaticAdm2Map({ geojson, selectedAdm2, selectedProvince }) {
  const width = 1000;
  const height = 500;

  const { features, project } = useMemo(() => {
    const feats = geojson?.features || [];
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

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
          selectedRegion={selectedRegion}
          geojson={geojson}
        />
      )}
    </div>
  );
}
