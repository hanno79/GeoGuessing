/**
 * Generate accurate SVG country silhouette paths from Natural Earth TopoJSON data.
 *
 * Uses world-atlas npm package (Natural Earth 50m resolution).
 * Projects GeoJSON coordinates to SVG paths using Web Mercator projection,
 * then normalizes each country to fit a 0-100 viewBox.
 *
 * Usage: node scripts/generate-country-paths.mjs
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const topojson = require('topojson-client');

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load our countries list
const countriesJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'backend', 'data', 'countries.json'), 'utf8')
);
const NEEDED_CODES = new Set(countriesJson.map((c) => c.countryCode));

// ISO alpha-2 → ISO numeric mapping for our 126 countries
const ALPHA2_TO_NUMERIC = {
  jp: '392', fr: '250', us: '840', gb: '826', au: '036', eg: '818',
  ru: '643', cn: '156', br: '076', it: '380', de: '276', in: '356',
  tr: '792', th: '764', mx: '484', ar: '032', ae: '784', sg: '702',
  kr: '410', za: '710', es: '724', pt: '620', gr: '300', at: '040',
  nl: '528', ke: '404', ca: '124', pe: '604', se: '752', cz: '203',
  pl: '616', ie: '372', cu: '192', id: '360', co: '170', vn: '704',
  fi: '246', dk: '208', be: '056', iq: '368', cl: '152', ir: '364',
  et: '231', ng: '566', my: '458', ma: '504', ch: '756', no: '578',
  ve: '862', lb: '422', lk: '144', gh: '288', tz: '834', pk: '586',
  ec: '218', uy: '858', is: '352', ro: '642', hu: '348', bg: '100',
  ee: '233', lv: '428', sk: '703', hr: '191', qa: '634', om: '512',
  kh: '116', tw: '158', ph: '608', bd: '050', sn: '686', tn: '788',
  cr: '188', pa: '591', ua: '804', rs: '688', ge: '268', az: '031',
  nz: '554', jo: '400', dz: '012', am: '051', bo: '068', py: '600',
  kz: '398', uz: '860', mn: '496', np: '524', mm: '104', ug: '800',
  zm: '894', mz: '508', na: '516', mg: '450', tg: '768', pg: '598',
  nc: '540', gl: '304', bt: '064', tj: '762', kg: '417', er: '232',
  sa: '682', lt: '440', al: '008', mk: '807', md: '498', by: '112',
  la: '418', bh: '048', kw: '414', ly: '434', mw: '454', mu: '480',
  sc: '690', bj: '204', ne: '562', ml: '466', mr: '478', ao: '024',
  cd: '180', cg: '178', cm: '120', ga: '266', rw: '646', bi: '108',
};

/**
 * Ramer-Douglas-Peucker simplification.
 */
function rdpSimplify(points, epsilon) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const [x1, y1] = points[0];
  const [x2, y2] = points[points.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    let dist;
    if (lenSq === 0) {
      dist = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    } else {
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
      dist = Math.sqrt((px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2);
    }
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

/**
 * Compute shoelace area of a ring (projected coordinates).
 */
function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Compute bounding box of an array of [x, y] points.
 */
function computeBbox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Check if a ring's bounding box is close enough to the main landmass bbox.
 * This filters out far-flung overseas territories that distort the silhouette.
 */
function isNearMainland(ringBbox, mainBbox, maxExpansion = 0.5) {
  const mainW = mainBbox.maxX - mainBbox.minX;
  const mainH = mainBbox.maxY - mainBbox.minY;
  const margin = Math.max(mainW, mainH) * maxExpansion;

  return (
    ringBbox.minX < mainBbox.maxX + margin &&
    ringBbox.maxX > mainBbox.minX - margin &&
    ringBbox.minY < mainBbox.maxY + margin &&
    ringBbox.maxY > mainBbox.minY - margin
  );
}

/**
 * Convert latitude to Web Mercator Y value.
 * Clamps latitude to ±85.051129° to avoid infinity at the poles
 * (same limit Leaflet/OpenStreetMap uses).
 */
function mercatorY(lat) {
  const MAX_LAT = 85.051129;
  const clampedLat = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

/**
 * Convert GeoJSON geometry to an SVG path string, normalized to 0-100 viewBox.
 */
function geometryToSvgPath(geometry, epsilon = 0.5) {
  // Collect all rings as projected [x, y] with their source polygon info
  const allRings = [];

  function collectRings(geom) {
    if (geom.type === 'Polygon') {
      // Only take outer ring (index 0); skip holes (indices 1+)
      const projected = geom.coordinates[0].map(([lon, lat]) => [lon, -mercatorY(lat)]);
      allRings.push(projected);
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        // Only outer ring of each polygon
        const projected = polygon[0].map(([lon, lat]) => [lon, -mercatorY(lat)]);
        allRings.push(projected);
      }
    }
  }

  collectRings(geometry);
  if (allRings.length === 0) return null;

  // Compute areas for all rings
  const ringData = allRings.map((ring) => ({
    ring,
    area: ringArea(ring),
    bbox: computeBbox(ring),
  }));

  // Sort by area descending
  ringData.sort((a, b) => b.area - a.area);

  const maxArea = ringData[0].area;
  const mainBbox = ringData[0].bbox;

  // Filter: keep rings that are
  //   1) at least 0.5% of the largest ring's area, AND
  //   2) geographically close to the main landmass
  const AREA_THRESHOLD = 0.005;

  const keptRings = ringData.filter((rd) => {
    if (rd === ringData[0]) return true; // always keep the largest
    if (rd.area < maxArea * AREA_THRESHOLD) return false;
    return isNearMainland(rd.bbox, mainBbox);
  });

  // Compute bounding box from KEPT rings only
  const keptPoints = keptRings.flatMap((rd) => rd.ring);
  const { minX, minY, maxX, maxY } = computeBbox(keptPoints);

  const w = maxX - minX || 1;
  const h = maxY - minY || 1;

  // Normalize to fit within viewBox with padding, maintaining aspect ratio
  const PAD = 5;
  const viewSize = 100 - 2 * PAD;
  const scale = Math.min(viewSize / w, viewSize / h);
  const offsetX = PAD + (viewSize - w * scale) / 2;
  const offsetY = PAD + (viewSize - h * scale) / 2;

  function norm(x, y) {
    return [
      Math.round(((x - minX) * scale + offsetX) * 10) / 10,
      Math.round(((y - minY) * scale + offsetY) * 10) / 10,
    ];
  }

  const pathParts = [];

  for (const { ring } of keptRings) {
    const normalized = ring.map(([x, y]) => norm(x, y));
    const simplified = rdpSimplify(normalized, epsilon);
    if (simplified.length < 3) continue;

    const [sx, sy] = simplified[0];
    let d = `M${sx},${sy}`;
    for (let i = 1; i < simplified.length; i++) {
      d += `L${simplified[i][0]},${simplified[i][1]}`;
    }
    d += 'Z';
    pathParts.push(d);
  }

  return pathParts.join(' ');
}

function main() {
  console.log('Loading world-atlas 50m TopoJSON...');

  const topo = JSON.parse(
    readFileSync(join(__dirname, '..', 'node_modules', 'world-atlas', 'countries-50m.json'), 'utf8')
  );

  const geojson = topojson.feature(topo, topo.objects.countries);
  console.log(`Loaded ${geojson.features.length} features`);

  // Build lookup by numeric ID — prefer features with more geometry (avoid tiny territories)
  const featureById = new Map();
  for (const f of geojson.features) {
    if (!f.id) continue;
    const existing = featureById.get(f.id);
    if (!existing) {
      featureById.set(f.id, f);
    } else {
      // Keep the feature with more coordinates (larger landmass)
      const existingSize = existing.geometry.type === 'MultiPolygon'
        ? existing.geometry.coordinates.length : 1;
      const newSize = f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates.length : 1;
      if (newSize > existingSize) {
        featureById.set(f.id, f);
      }
    }
  }

  const results = {};
  const missing = [];

  for (const code of NEEDED_CODES) {
    const numericId = ALPHA2_TO_NUMERIC[code];
    if (!numericId) {
      missing.push(code);
      console.warn(`  ⚠ No numeric ID mapping for: ${code}`);
      continue;
    }

    const feature = featureById.get(numericId);
    if (!feature) {
      missing.push(code);
      console.warn(`  ⚠ No feature found for: ${code} (numeric: ${numericId})`);
      continue;
    }

    // Adjust simplification epsilon based on country size
    let epsilon = 0.4;

    // Small countries need more detail
    const smallCountries = new Set([
      'sg', 'bh', 'qa', 'lb', 'kw', 'mu', 'sc', 'bt', 'lv', 'ee',
      'sk', 'hr', 'al', 'mk', 'md', 'am', 'ge', 'az', 'rw', 'bi', 'tg', 'bj',
    ]);
    if (smallCountries.has(code)) {
      epsilon = 0.25;
    }

    // Very small countries — keep maximum detail
    const tinyCountries = new Set(['sg', 'bh', 'mu', 'sc']);
    if (tinyCountries.has(code)) {
      epsilon = 0.1;
    }

    const pathData = geometryToSvgPath(feature.geometry, epsilon);
    if (pathData) {
      results[code] = pathData;
      const country = countriesJson.find((c) => c.countryCode === code);
      console.log(`  ✓ ${code} (${country?.country || feature.properties.name}) — ${pathData.length} chars`);
    } else {
      missing.push(code);
      console.warn(`  ⚠ Empty path for: ${code}`);
    }
  }

  // Generate TypeScript file
  let ts = `/**\n * Country silhouette SVG paths generated from Natural Earth 50m data.\n * Auto-generated by scripts/generate-country-paths.mjs\n *\n * Source: Natural Earth (https://www.naturalearthdata.com/) — Public Domain\n * Package: world-atlas (https://github.com/topojson/world-atlas)\n */\n\n`;
  ts += 'const COUNTRY_PATHS: Record<string, string> = {\n';

  const sortedCodes = Object.keys(results).sort();
  for (const code of sortedCodes) {
    const country = countriesJson.find((c) => c.countryCode === code);
    ts += `  // ${country?.country || code}\n`;
    ts += `  ${code}: "${results[code]}",\n\n`;
  }

  ts += '};\n\nexport default COUNTRY_PATHS;\n';

  const outPath = join(__dirname, '..', 'frontend', 'src', 'data', 'countryPaths.ts');
  writeFileSync(outPath, ts, 'utf8');

  console.log(`\n✅ Generated ${sortedCodes.length} country paths → ${outPath}`);
  if (missing.length > 0) {
    console.log(`⚠ Missing: ${missing.join(', ')}`);
  }

  const sizeKb = (Buffer.byteLength(ts, 'utf8') / 1024).toFixed(1);
  console.log(`File size: ${sizeKb} KB`);
}

main();
