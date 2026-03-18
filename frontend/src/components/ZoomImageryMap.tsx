import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

const IMAGERY_URL =
  import.meta.env.VITE_LEFT_IMAGERY_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/** Smoothly animates the map zoom from startZoom to endZoom over durationSec seconds. */
function ZoomAnimator({
  lat,
  lng,
  startZoom,
  endZoom,
  durationSec,
  running,
  onProgress,
}: {
  lat: number;
  lng: number;
  startZoom: number;
  endZoom: number;
  durationSec: number;
  running: boolean;
  onProgress: (progress: number) => void;
}) {
  const map = useMap();
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    map.setView([lat, lng], startZoom, { animate: false });
    startTimeRef.current = Date.now();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, lat, lng]);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const t = Math.min(elapsed / durationSec, 1);
      const currentZoom = startZoom + (endZoom - startZoom) * t;

      map.setView([lat, lng], currentZoom, { animate: false });
      onProgress(t);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [map, lat, lng, startZoom, endZoom, durationSec, running, onProgress]);

  return null;
}

interface Props {
  latitude: number;
  longitude: number;
  startZoom: number;
  endZoom: number;
  durationSec: number;
  running: boolean;
  onProgress: (progress: number) => void;
}

export default function ZoomImageryMap({ latitude, longitude, startZoom, endZoom, durationSec, running, onProgress }: Props) {
  const [tileError, setTileError] = useState(false);
  const errorCount = useRef(0);

  function handleTileError() {
    errorCount.current += 1;
    if (errorCount.current >= 3) setTileError(true);
  }

  return (
    <>
      <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={startZoom}
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          style={{ height: '100%', width: '100%' }}
          aria-label="Zoom Satellitenbild"
        >
          <TileLayer
            url={IMAGERY_URL}
            attribution='Tiles &copy; <a href="https://www.esri.com">Esri</a>'
            eventHandlers={{ tileerror: handleTileError }}
            maxZoom={19}
          />
          <ZoomAnimator
            lat={latitude}
            lng={longitude}
            startZoom={startZoom}
            endZoom={endZoom}
            durationSec={durationSec}
            running={running}
            onProgress={onProgress}
          />
        </MapContainer>
      </div>

      <div className="map-reticle" aria-hidden="true" />

      {tileError && (
        <div className="map-tile-error" role="alert">
          Kartenkacheln konnten nicht geladen werden.
          <br />
          Bitte Verbindung prüfen.
        </div>
      )}
    </>
  );
}
