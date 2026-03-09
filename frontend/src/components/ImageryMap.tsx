import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Difficulty } from '../types';
import { DIFFICULTY_ZOOM } from '../types';
import { haversineDistance } from '../utils/haversine';

const IMAGERY_URL =
  import.meta.env.VITE_LEFT_IMAGERY_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const MEDIUM_PAN_RADIUS_KM = 250;

/** Bearing in radians from point 1 → point 2 */
function bearingRad(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  return Math.atan2(
    Math.sin(Δλ) * Math.cos(φ2),
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  );
}

/** Geodetic destination point: start from (lat, lng), go `distKm` on `bearing` */
function destinationPoint(lat: number, lng: number, bearing: number, distKm: number) {
  const R = 6371;
  const δ = distKm / R;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearing)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );
  return { lat: (φ2 * 180) / Math.PI, lng: (λ2 * 180) / Math.PI };
}

/** Resets the view to the target location when props or resetTrigger change. */
function MapSetup({
  lat,
  lng,
  zoom,
  resetTrigger,
}: {
  lat: number;
  lng: number;
  zoom: number;
  resetTrigger: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: resetTrigger > 0 });
  }, [map, lat, lng, zoom, resetTrigger]);
  return null;
}

/**
 * Enforces a circular pan boundary of `maxKm` around the origin.
 * On `moveend`, if the center is outside the radius, it snaps back to the boundary.
 */
function PanConstraint({
  originLat,
  originLng,
  maxKm,
  onBounced,
}: {
  originLat: number;
  originLng: number;
  maxKm: number;
  onBounced: () => void;
}) {
  const map = useMap();
  const bouncing = useRef(false);

  useEffect(() => {
    const enforce = () => {
      if (bouncing.current) return;
      const { lat, lng } = map.getCenter();
      const dist = haversineDistance(originLat, originLng, lat, lng);
      if (dist > maxKm) {
        bouncing.current = true;
        const bearing = bearingRad(originLat, originLng, lat, lng);
        const clamped = destinationPoint(originLat, originLng, bearing, maxKm);
        map.setView([clamped.lat, clamped.lng], map.getZoom(), { animate: true });
        onBounced();
        setTimeout(() => {
          bouncing.current = false;
        }, 600);
      }
    };

    map.on('moveend', enforce);
    return () => {
      map.off('moveend', enforce);
    };
  }, [map, originLat, originLng, maxKm, onBounced]);

  return null;
}

/** Tracks whether the map has been panned away from the origin. */
function PanTracker({
  originLat,
  originLng,
  onPanned,
}: {
  originLat: number;
  originLng: number;
  onPanned: (hasPanned: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const check = () => {
      const { lat, lng } = map.getCenter();
      // Consider "panned" if moved more than ~1 km from origin
      const dist = haversineDistance(originLat, originLng, lat, lng);
      onPanned(dist > 1);
    };

    map.on('moveend', check);
    return () => {
      map.off('moveend', check);
    };
  }, [map, originLat, originLng, onPanned]);

  return null;
}

interface Props {
  latitude: number;
  longitude: number;
  difficulty: Difficulty;
}

export default function ImageryMap({ latitude, longitude, difficulty }: Props) {
  const zoom = DIFFICULTY_ZOOM[difficulty];
  const [tileError, setTileError] = useState(false);
  const [showLimitHint, setShowLimitHint] = useState(false);
  const [hasPanned, setHasPanned] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const errorCount = useRef(0);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canPan = difficulty !== 'Hard';
  const hasPanLimit = difficulty === 'Medium';

  // Reset panned state when a new location loads
  useEffect(() => {
    setHasPanned(false);
    setResetTrigger(0);
  }, [latitude, longitude]);

  // Clean up timer on unmount
  useEffect(
    () => () => {
      if (limitTimer.current) clearTimeout(limitTimer.current);
    },
    []
  );

  function handleTileError() {
    errorCount.current += 1;
    if (errorCount.current >= 3) setTileError(true);
  }

  const handleBounced = useCallback(() => {
    setShowLimitHint(true);
    if (limitTimer.current) clearTimeout(limitTimer.current);
    limitTimer.current = setTimeout(() => setShowLimitHint(false), 2500);
  }, []);

  const handlePanned = useCallback((panned: boolean) => {
    setHasPanned(panned);
  }, []);

  function handleReset() {
    setResetTrigger((n) => n + 1);
    setHasPanned(false);
    setShowLimitHint(false);
  }

  return (
    <>
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        zoomControl={false}
        dragging={canPan}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        style={{ height: '100%', width: '100%' }}
        aria-label="Satellitenbild des gesuchten Ortes"
      >
        <TileLayer
          url={IMAGERY_URL}
          attribution='Tiles &copy; <a href="https://www.esri.com">Esri</a>'
          eventHandlers={{ tileerror: handleTileError }}
          maxZoom={19}
        />
        <MapSetup lat={latitude} lng={longitude} zoom={zoom} resetTrigger={resetTrigger} />
        {canPan && <PanTracker originLat={latitude} originLng={longitude} onPanned={handlePanned} />}
        {hasPanLimit && (
          <PanConstraint
            originLat={latitude}
            originLng={longitude}
            maxKm={MEDIUM_PAN_RADIUS_KM}
            onBounced={handleBounced}
          />
        )}
      </MapContainer>

      {/* Centre reticle — always visible, fixed CSS overlay, not a Leaflet layer */}
      <div className="map-reticle" aria-hidden="true" />

      {tileError && (
        <div className="map-tile-error" role="alert">
          ⚠️ Kartenkacheln konnten nicht geladen werden.
          <br />
          Bitte Verbindung prüfen.
        </div>
      )}

      {/* Small pan-capability badge beneath the map label */}
      {canPan && (
        <div className="map-pan-hint" aria-hidden="true">
          {hasPanLimit ? `↕ ±${MEDIUM_PAN_RADIUS_KM} km` : '↕ Frei verschiebbar'}
        </div>
      )}

      {/* Reset button — only visible after the user has panned */}
      {canPan && hasPanned && (
        <button
          className="map-reset-btn"
          onClick={handleReset}
          title="Zur Ausgangsposition zurückspringen"
          aria-label="Zur Ausgangsposition zurückspringen"
          type="button"
        >
          ⌖
        </button>
      )}

      {/* Toast shown when the Medium radius limit is hit */}
      {showLimitHint && (
        <div className="map-pan-limit" role="status" aria-live="polite">
          🔒 Maximale Reichweite ({MEDIUM_PAN_RADIUS_KM} km) erreicht
        </div>
      )}
    </>
  );
}
