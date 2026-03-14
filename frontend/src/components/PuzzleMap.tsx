import { useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject, Feature, Geometry } from 'geojson';

const MAP_URL_NO_LABELS =
  'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

/** Region → initial map center and zoom */
const REGION_VIEW: Record<string, { center: [number, number]; zoom: number }> = {
  Europa:  { center: [50, 15],   zoom: 4 },
  Asien:   { center: [35, 80],   zoom: 3 },
  Afrika:  { center: [5, 20],    zoom: 3 },
  Amerika: { center: [10, -80],  zoom: 3 },
  Ozeanien: { center: [-15, 150], zoom: 4 },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const HIDDEN_STYLE: L.PathOptions = {
  fillColor: '#f0f0f0',
  fillOpacity: 0.6,
  color: '#ccc',
  weight: 1,
  opacity: 0.5,
};

const PLACED_STYLE: L.PathOptions = {
  fillColor: '#3fb950',
  fillOpacity: 0.6,
  color: '#2ea043',
  weight: 2,
  opacity: 0.9,
};

const WRONG_FLASH_STYLE: L.PathOptions = {
  fillColor: '#f85149',
  fillOpacity: 0.5,
  color: '#da3633',
  weight: 2,
  opacity: 0.9,
};

const TARGET_FLASH_STYLE: L.PathOptions = {
  fillColor: '#f0b429',
  fillOpacity: 0.6,
  color: '#d4a017',
  weight: 2,
  opacity: 0.9,
};

function FitRegion({ region }: { region: string }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    const view = REGION_VIEW[region];
    if (view) {
      map.setView(view.center, view.zoom);
      fitted.current = true;
    }
  }, [map, region]);
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface PuzzleMapProps {
  region: string;
  geoData: GeoJsonObject | null;
  placedCountries: Set<string>;
  interactive: boolean;
  onCountryClick: (countryCode: string) => void;
  wrongCountryCode: string | null;
  showTargetCountryCode: string | null;
}

export default function PuzzleMap({
  region,
  geoData,
  placedCountries,
  interactive,
  onCountryClick,
  wrongCountryCode,
  showTargetCountryCode,
}: PuzzleMapProps) {
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const view = REGION_VIEW[region] || REGION_VIEW.Europa;

  // Update styles when placedCountries, wrongCountryCode, or showTargetCountryCode changes
  useEffect(() => {
    const layer = geoLayerRef.current;
    if (!layer) return;

    layer.eachLayer((l: L.Layer) => {
      const geoLayer = l as L.GeoJSON & { feature?: Feature<Geometry> };
      const code = geoLayer.feature?.properties?.countryCode;
      if (!code) return;

      if (code === wrongCountryCode) {
        (l as L.Path).setStyle(WRONG_FLASH_STYLE);
      } else if (code === showTargetCountryCode && !placedCountries.has(code)) {
        (l as L.Path).setStyle(TARGET_FLASH_STYLE);
      } else if (placedCountries.has(code)) {
        (l as L.Path).setStyle(PLACED_STYLE);
      } else {
        (l as L.Path).setStyle(HIDDEN_STYLE);
      }
    });
  }, [placedCountries, wrongCountryCode, showTargetCountryCode]);

  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const code = feature.properties?.countryCode;
      if (!code) return;

      layer.on('click', () => {
        if (interactive) {
          onCountryClick(code);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const style = useCallback(
    (feature?: Feature) => {
      const code = feature?.properties?.countryCode;
      if (code && placedCountries.has(code)) return PLACED_STYLE;
      return HIDDEN_STYLE;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <MapContainer
      center={view.center}
      zoom={view.zoom}
      style={{ height: '100%', width: '100%', cursor: interactive ? 'crosshair' : 'grab' }}
      aria-label="Puzzle-Karte"
      minZoom={2}
      maxZoom={8}
    >
      <TileLayer
        url={MAP_URL_NO_LABELS}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
      />

      <FitRegion region={region} />

      {geoData && (
        <GeoJSON
          key={region}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
          ref={(ref) => { geoLayerRef.current = ref as L.GeoJSON | null; }}
        />
      )}
    </MapContainer>
  );
}
