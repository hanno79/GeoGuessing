import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { LatLng } from '../types';

const MAP_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Custom colored markers
function makeIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;color:#fff;font-weight:700;
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const guessIcon  = makeIcon('#f0b429', '?');
const targetIcon = makeIcon('#3fb950', '✓');

// Click handler: only active when interactive
function ClickHandler({
  interactive,
  onGuess,
}: {
  interactive: boolean;
  onGuess: (ll: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      if (!interactive) return;
      onGuess({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

// Animate to a position
function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [map, lat, lng, zoom]);
  return null;
}

interface Props {
  guess: LatLng | null;
  target: LatLng | null;       // shown only in result phase
  interactive: boolean;
  showResult: boolean;
  onGuess: (ll: LatLng) => void;
}

export default function GuessMap({ guess, target, interactive, showResult, onGuess }: Props) {
  const [tileError, setTileError] = useState(false);
  const errorCount = useRef(0);

  function handleTileError() {
    errorCount.current += 1;
    if (errorCount.current >= 3) setTileError(true);
  }

  const polyLine =
    showResult && guess && target
      ? ([
          [guess.latitude, guess.longitude],
          [target.latitude, target.longitude],
        ] as [number, number][])
      : null;

  return (
    <>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', cursor: interactive ? 'crosshair' : 'grab' }}
        aria-label={interactive ? 'Klick auf die Karte um deinen Tipp zu setzen' : 'Ergebniskarte'}
      >
        <TileLayer
          url={MAP_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{ tileerror: handleTileError }}
        />

        <ClickHandler interactive={interactive} onGuess={onGuess} />

        {guess && (
          <Marker
            position={[guess.latitude, guess.longitude]}
            icon={guessIcon}
            aria-label="Dein Tipp"
          />
        )}

        {showResult && target && (
          <Marker
            position={[target.latitude, target.longitude]}
            icon={targetIcon}
            aria-label="Tatsächlicher Ort"
          />
        )}

        {polyLine && (
          <Polyline
            positions={polyLine}
            pathOptions={{ color: '#388bfd', weight: 2.5, dashArray: '6 4', opacity: 0.85 }}
          />
        )}

        {showResult && target && (
          <FlyTo lat={target.latitude} lng={target.longitude} zoom={3} />
        )}
      </MapContainer>

      {tileError && (
        <div className="map-tile-error" role="alert">
          ⚠️ Kartenkacheln nicht verfügbar.
        </div>
      )}
    </>
  );
}
