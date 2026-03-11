import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { LatLng } from '../types';

const MAP_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const MAP_URL_NO_LABELS =
  'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

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

// Animated polyline that "grows" from point A to B
function AnimatedPolyline({
  from,
  to,
  duration = 1500,
  onComplete,
}: {
  from: [number, number];
  to: [number, number];
  duration?: number;
  onComplete?: () => void;
}) {
  const map = useMap();
  const polyRef = useRef<L.Polyline | null>(null);
  const done = useRef(false);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    done.current = false;
    const line = L.polyline([from, from], {
      color: '#388bfd',
      weight: 2.5,
      dashArray: '6 4',
      opacity: 0.85,
    }).addTo(map);
    polyRef.current = line;

    const startTime = performance.now();

    function animate(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const lat = from[0] + (to[0] - from[0]) * eased;
      const lng = from[1] + (to[1] - from[1]) * eased;
      line.setLatLngs([from, [lat, lng]]);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else if (!done.current) {
        done.current = true;
        completeRef.current?.();
      }
    }
    requestAnimationFrame(animate);

    return () => {
      map.removeLayer(line);
    };
  }, [map, from, to, duration]);

  return null;
}

interface Props {
  guess: LatLng | null;
  target: LatLng | null;       // shown only in result phase
  interactive: boolean;
  showResult: boolean;
  onGuess: (ll: LatLng) => void;
  hideLabels?: boolean;
}

export default function GuessMap({ guess, target, interactive, showResult, onGuess, hideLabels = false }: Props) {
  const [tileError, setTileError] = useState(false);
  const [lineAnimDone, setLineAnimDone] = useState(false);
  const errorCount = useRef(0);

  // Reset animation state when transitioning away from result
  useEffect(() => {
    if (!showResult) setLineAnimDone(false);
  }, [showResult]);

  function handleTileError() {
    errorCount.current += 1;
    if (errorCount.current >= 3) setTileError(true);
  }

  const handleLineComplete = useCallback(() => setLineAnimDone(true), []);

  const from: [number, number] | null =
    showResult && guess ? [guess.latitude, guess.longitude] : null;
  const to: [number, number] | null =
    showResult && target ? [target.latitude, target.longitude] : null;

  return (
    <>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', cursor: interactive ? 'crosshair' : 'grab' }}
        aria-label={interactive ? 'Klick auf die Karte um deinen Tipp zu setzen' : 'Ergebniskarte'}
      >
        <TileLayer
          url={hideLabels ? MAP_URL_NO_LABELS : MAP_URL}
          attribution={hideLabels
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
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

        {from && to && (
          <AnimatedPolyline
            from={from}
            to={to}
            duration={1500}
            onComplete={handleLineComplete}
          />
        )}

        {showResult && target && lineAnimDone && (
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
