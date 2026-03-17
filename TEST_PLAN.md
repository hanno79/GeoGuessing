# Test-Plan: GeoGuessing

Ziel: Testabdeckung schrittweise aufbauen und langfristig sicherstellen, dass neue Features durch Tests abgesichert sind.

---

## Status Quo

| Bereich | Framework | Tests vorhanden | Coverage |
|---------|-----------|-----------------|----------|
| Backend (Node/Express) | Jest 29 (installiert) | 2 Dateien (haversine, validation) | ~0 % gesamt |
| Frontend (React/Vite/TS) | Keines | Keine | 0 % |
| CI/CD | GitHub Actions | Keine Test-Stage | — |

---

## Phase 1 — Backend Unit-Tests (Quick Wins)

**Ziel:** Alle reinen Funktionen ohne Seiteneffekte testen.

### 1.1 Vorhandene Tests stabilisieren

- [x] `backend/src/utils/haversine.test.js` — 6 Tests
- [x] `backend/src/utils/validation.test.js` — 20+ Tests
- [x] `backend/jest.config.js` — Coverage-Konfiguration

**Aktion:** Tests ausführen, sicherstellen dass alle grün sind (`npm test`).

### 1.2 Fehlende Unit-Tests

| Datei | Testdatei | Was testen |
|-------|-----------|------------|
| `backend/src/utils/haversine.js` | `haversine.test.js` | Bereits vorhanden |
| `backend/src/utils/validation.js` | `validation.test.js` | Bereits vorhanden |

**Ergebnis Phase 1:** Alle pure Utility-Funktionen im Backend sind getestet.

---

## Phase 2 — Backend Integration-Tests (API-Routen)

**Ziel:** HTTP-Endpunkte mit `supertest` testen.

### 2.1 Setup

- `supertest` als devDependency installieren: `npm i -D supertest`
- Test-Helper für In-Memory-Datenbank erstellen

### 2.2 Test-Helper: `backend/src/__tests__/setup.js`

```js
// Vor dem Import von server.js die DB auf :memory: setzen
process.env.DATABASE_PATH = ':memory:';
const app = require('../server');
const { getDb } = require('../database/db');

// Nach jedem Test die Tabellen leeren
afterEach(() => {
  const db = getDb();
  db.exec('DELETE FROM leaderboard');
});

module.exports = { app };
```

### 2.3 Leaderboard-Routen

**Datei:** `backend/src/routes/__tests__/leaderboard.test.js`

| Test-Case | Methode | Endpoint | Erwartung |
|-----------|---------|----------|-----------|
| Score eintragen | POST | `/api/score` | 201 + Eintrag in DB |
| Ungültiger Payload | POST | `/api/score` | 400 + Fehlermeldung |
| Duplikat-Erkennung | POST | `/api/score` (2x gleich) | 409 Conflict |
| Leaderboard abrufen | GET | `/api/leaderboard` | 200 + Array |
| Filtern nach Difficulty | GET | `/api/leaderboard?difficulty=Easy` | Nur Easy-Einträge |
| Filtern nach gameMode | GET | `/api/leaderboard?gameMode=Classic` | Nur Classic |
| Sortierung | GET | `/api/leaderboard?sort=totalScore&order=desc` | Absteigend sortiert |
| Limit | GET | `/api/leaderboard?limit=5` | Max 5 Einträge |
| Ungültige Sort-Spalte | GET | `/api/leaderboard?sort=DROP_TABLE` | Ignoriert / Default |

### 2.4 Location-Routen

**Datei:** `backend/src/routes/__tests__/location.test.js`

| Test-Case | Methode | Endpoint | Erwartung |
|-----------|---------|----------|-----------|
| Zufällige Location | GET | `/api/location` | 200 + `{lat, lng}` |
| City ohne Filter | GET | `/api/city` | 200 + City-Objekt |
| City mit Difficulty | GET | `/api/city?difficulty=easy` | City mit `difficulty: "easy"` |
| City mit ungültiger Diff. | GET | `/api/city?difficulty=xxx` | Fallback oder 400 |
| Koordinaten-Validierung | GET | `/api/location` | lat/lng in gültigem Bereich |

### 2.5 Health-Endpunkt

| Test-Case | Methode | Endpoint | Erwartung |
|-----------|---------|----------|-----------|
| Health-Check | GET | `/api/health` | 200 + `{ status: 'ok' }` |

**Ergebnis Phase 2:** Alle API-Endpunkte sind durch Integration-Tests abgesichert.

---

## Phase 3 — Frontend Test-Setup (Vitest)

**Ziel:** Test-Framework für React/TypeScript einrichten.

### 3.1 Dependencies installieren

```bash
cd frontend
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 3.2 Vitest-Konfiguration

**Option A (empfohlen):** In `vite.config.ts` erweitern:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/vite-env.d.ts'],
    },
  },
  // ... bestehende config
});
```

### 3.3 Test-Setup-Datei

**Datei:** `frontend/src/test/setup.ts`

```ts
import '@testing-library/jest-dom';
```

### 3.4 Package.json Scripts erweitern

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Ergebnis Phase 3:** Frontend kann Tests ausführen.

---

## Phase 4 — Frontend Unit-Tests

**Ziel:** Alle reinen Utility-Funktionen und den Game-Reducer testen.

### 4.1 scoreCalculator

**Datei:** `frontend/src/utils/scoreCalculator.test.ts`

| Funktion | Test-Cases |
|----------|------------|
| `calculateScore(distanceKm)` | 0 km = Max-Score, sehr weit = 0, negativer Input |
| `calculateTimeBonus(elapsed, window)` | Innerhalb Fenster, außerhalb, Grenzwerte |
| `formatTime(totalSeconds)` | 0s, 90s → "1:30", 3600s → "60:00" |
| `formatDistance(km)` | 0 km, 0.5 km → Meter-Anzeige, 100 km |
| `formatScore(score)` | Formatierung mit Tausender-Trennzeichen |

### 4.2 haversine (Frontend-Version)

**Datei:** `frontend/src/utils/haversine.test.ts`

Gleiche Test-Cases wie Backend-Version (Berlin→Paris, Antipoden, etc.)

### 4.3 GameContext Reducer

**Datei:** `frontend/src/context/GameContext.test.ts`

| Action | Was testen |
|--------|------------|
| `START_GAME` | Initialer State wird korrekt gesetzt (difficulty, rounds, mode) |
| `SUBMIT_GUESS` | Score wird berechnet, Runde wird gespeichert |
| `TIMEOUT` | Runde wird mit 0 Punkten bewertet |
| `NEXT_ROUND` | currentRound wird inkrementiert |
| `END_GAME` | gameStatus wechselt zu 'finished' |
| `RESET` | State wird zurückgesetzt |
| Edge Cases | Doppeltes SUBMIT_GUESS, NEXT_ROUND nach letzter Runde |

**Ergebnis Phase 4:** Alle Frontend-Logik-Funktionen sind getestet.

---

## Phase 5 — CI/CD Integration

**Ziel:** Tests automatisch bei jedem Push/PR ausführen.

### 5.1 GitHub Actions Workflow

**Datei:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm test -- --coverage
      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage/lcov-report

  frontend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm test -- --coverage
      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: frontend/coverage
```

### 5.2 Deploy-Workflow anpassen

In `.github/workflows/deploy.yml` Tests als Voraussetzung einbauen:

```yaml
jobs:
  test:
    uses: ./.github/workflows/test.yml

  deploy:
    needs: test    # ← Deploy erst nach erfolgreichen Tests
    runs-on: ubuntu-latest
    steps:
      # ... bestehende Deploy-Steps
```

**Ergebnis Phase 5:** Kein Deploy ohne grüne Tests.

---

## Phase 6 — Erweiterte Tests (Langfristig)

### 6.1 Frontend Component-Tests

| Komponente | Was testen |
|------------|------------|
| `GameSetup` | Formular-Validierung, Schwierigkeitsgrad-Auswahl |
| `Map` | Marker-Platzierung, Zoom-Level je Difficulty |
| `ScoreBoard` | Anzeige der Ergebnisse nach Spielende |
| `Leaderboard` | API-Aufruf, Sortierung, Ladestate |

### 6.2 E2E-Tests (Optional)

- Framework: Playwright oder Cypress
- Happy-Path: Spiel starten → Runden spielen → Score eintragen → Leaderboard prüfen
- Erst sinnvoll wenn Unit- und Integration-Tests stabil sind

### 6.3 Coverage-Ziele

| Meilenstein | Backend | Frontend | Zeitrahmen |
|-------------|---------|----------|------------|
| Phase 1-2 abgeschlossen | ~60 % | 0 % | Sofort |
| Phase 3-4 abgeschlossen | ~60 % | ~40 % | +1 Woche |
| Phase 5 abgeschlossen | ~60 % | ~40 % | +1 Tag |
| Phase 6 laufend | ~80 % | ~60 % | Fortlaufend |
| Langfristziel | >80 % | >70 % | — |

---

## Umsetzungs-Reihenfolge (Empfehlung)

```
Phase 1  ██████████  ← Bereits begonnen (haversine + validation Tests)
Phase 2  ░░░░░░░░░░  ← Nächster Schritt (supertest + API-Tests)
Phase 3  ░░░░░░░░░░  ← Parallel zu Phase 2 möglich
Phase 4  ░░░░░░░░░░  ← Nach Phase 3
Phase 5  ░░░░░░░░░░  ← Nach Phase 2 + 4
Phase 6  ░░░░░░░░░░  ← Fortlaufend
```

**Empfehlung:** Phase 2 und 3 parallel umsetzen, da sie unabhängig voneinander sind.

---

## Konventionen

- Testdateien neben der Quelldatei: `foo.js` → `foo.test.js`
- Integration-Tests in `__tests__/`-Unterordnern
- Jede PR muss Tests für neue Logik enthalten (Review-Checkliste)
- Coverage darf nicht sinken (CI-Gate möglich via `coverageThreshold`)
