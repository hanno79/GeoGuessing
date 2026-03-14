import { useEffect, useRef, useState, useCallback } from 'react';
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
  /** Initial CSS blur in pixels – fades to 0 during animation. 0 = no blur. */
  blurStart?: number;
  /** Whether to show the centre reticle overlay. */
  showReticle?: boolean;
}

export default function ZoomImageryMap({ latitude, longitude, startZoom, endZoom, durationSec, running, onProgress, blurStart = 0, showReticle = true }: Props) {
  const [tileError, setTileError] = useState(false);
  const errorCount = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleProgress = useCallback((p: number) => {
    onProgress(p);
    if (blurStart > 0 && wrapperRef.current) {
      const blur = blurStart * (1 - p);
      wrapperRef.current.style.filter = blur > 0.5 ? `blur(${blur}px)` : '';
    }
  }, [onProgress, blurStart]);

  function handleTileError() {
    errorCount.current += 1;
    if (errorCount.current >= 3) setTileError(true);
  }

  return (
    <>
      <div ref={wrapperRef} style={{ height: '100%', width: '100%', filter: blurStart > 0 ? `blur(${blurStart}px)` : undefined }}>
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
            onProgress={handleProgress}
          />
        </MapContainer>
      </div>

      {showReticle && <div className="map-reticle" aria-hidden="true" />}

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
