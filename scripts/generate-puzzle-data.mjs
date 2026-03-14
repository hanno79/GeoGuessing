/**
 * Generate GeoJSON data for puzzle mode from Natural Earth TopoJSON data.
 * Groups countries by puzzle region and outputs simplified GeoJSON per region.
 *
 * Usage: node scripts/generate-puzzle-data.mjs
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

// ISO alpha-2 → ISO numeric mapping (same as generate-country-paths.mjs)
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

// Puzzle regions → which continent values to include
const PUZZLE_REGIONS = {
  europa: ['Europa', 'Europa/Asien'],
  asien: ['Asien', 'Europa/Asien'],
  afrika: ['Afrika'],
  amerika: ['Nordamerika', 'Südamerika'],
  ozeanien: ['Ozeanien'],
};

/**
 * Simplify a coordinate array using Ramer-Douglas-Peucker algorithm.
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
 * Compute area of a ring for filtering.
 */
function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Simplify a GeoJSON geometry for puzzle use (keep geo coords, just reduce points).
 */
function simplifyGeometry(geometry, epsilon = 0.15) {
  if (geometry.type === 'Polygon') {
    const simplified = geometry.coordinates.map((ring) => {
      const s = rdpSimplify(ring, epsilon);
      return s.length >= 4 ? s : ring; // Keep ring valid (min 4 points for closed ring)
    });
    // Filter out tiny holes
    const outer = simplified[0];
    const outerArea = ringArea(outer);
    const holes = simplified.slice(1).filter((h) => ringArea(h) > outerArea * 0.01);
    return { type: 'Polygon', coordinates: [outer, ...holes] };
  }

  if (geometry.type === 'MultiPolygon') {
    // Compute areas, keep significant polygons
    const polysWithArea = geometry.coordinates.map((poly) => ({
      poly,
      area: ringArea(poly[0]),
    }));
    polysWithArea.sort((a, b) => b.area - a.area);
    const maxArea = polysWithArea[0].area;

    const keptPolys = polysWithArea
      .filter((p) => p.area > maxArea * 0.003)
      .map((p) => {
        const simplified = p.poly.map((ring) => {
          const s = rdpSimplify(ring, epsilon);
          return s.length >= 4 ? s : ring;
        });
        return simplified;
      });

    if (keptPolys.length === 1) {
      return { type: 'Polygon', coordinates: keptPolys[0] };
    }
    return { type: 'MultiPolygon', coordinates: keptPolys };
  }

  return geometry;
}

/**
 * Round coordinates to reduce JSON size.
 */
function roundCoords(geometry) {
  function roundRing(ring) {
    return ring.map(([lon, lat]) => [
      Math.round(lon * 100) / 100,
      Math.round(lat * 100) / 100,
    ]);
  }

  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates.map(roundRing),
    };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map((poly) => poly.map(roundRing)),
    };
  }
  return geometry;
}

function main() {
  console.log('Loading world-atlas 50m TopoJSON...');

  const topo = JSON.parse(
    readFileSync(join(__dirname, '..', 'node_modules', 'world-atlas', 'countries-50m.json'), 'utf8')
  );

  const geojson = topojson.feature(topo, topo.objects.countries);
  console.log(`Loaded ${geojson.features.length} features`);

  // Build feature lookup by numeric ID
  const featureById = new Map();
  for (const f of geojson.features) {
    if (!f.id) continue;
    const existing = featureById.get(f.id);
    if (!existing) {
      featureById.set(f.id, f);
    } else {
      const existingSize = existing.geometry.type === 'MultiPolygon'
        ? existing.geometry.coordinates.length : 1;
      const newSize = f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates.length : 1;
      if (newSize > existingSize) {
        featureById.set(f.id, f);
      }
    }
  }

  // Build country GeoJSON features with our metadata
  const countryFeatures = {};
  let totalFound = 0;

  for (const c of countriesJson) {
    const numericId = ALPHA2_TO_NUMERIC[c.countryCode];
    if (!numericId) {
      console.warn(`  No numeric ID for: ${c.countryCode}`);
      continue;
    }

    const feature = featureById.get(numericId);
    if (!feature) {
      console.warn(`  No feature for: ${c.countryCode} (${numericId})`);
      continue;
    }

    const simplified = simplifyGeometry(feature.geometry);
    const rounded = roundCoords(simplified);

    countryFeatures[c.countryCode] = {
      type: 'Feature',
      properties: {
        countryCode: c.countryCode,
        country: c.country,
        difficulty: c.difficulty,
      },
      geometry: rounded,
    };
    totalFound++;
  }

  console.log(`Generated GeoJSON for ${totalFound} countries`);

  // Generate per-region files
  for (const [region, continents] of Object.entries(PUZZLE_REGIONS)) {
    const regionCountries = countriesJson.filter((c) =>
      continents.includes(c.continent)
    );

    const features = regionCountries
      .map((c) => countryFeatures[c.countryCode])
      .filter(Boolean);

    const regionData = {
      type: 'FeatureCollection',
      features,
    };

    const outPath = join(__dirname, '..', 'backend', 'data', 'puzzle', `${region}.json`);
    const json = JSON.stringify(regionData);
    writeFileSync(outPath, json, 'utf8');

    const sizeKb = (Buffer.byteLength(json, 'utf8') / 1024).toFixed(1);
    console.log(`  ${region}: ${features.length} countries, ${sizeKb} KB`);
  }

  console.log('\nDone!');
}

main();
