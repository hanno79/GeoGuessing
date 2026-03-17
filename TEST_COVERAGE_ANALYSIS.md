# Test Coverage Analysis

## Current State

**The codebase has zero test files.** Jest v29 is installed as a backend dev dependency, but no tests have been written. The frontend has no test framework configured at all. The CI/CD pipeline (`deploy.yml`) deploys to Railway without running any tests.

---

## Priority 1 — Backend Unit Tests (High Impact, Low Effort)

These pure functions have no external dependencies and are the easiest wins.

### 1.1 `backend/src/utils/haversine.js` — `haversineDistance()`

| Test case | Why it matters |
|-----------|---------------|
| Known city pairs (e.g. Berlin→Paris ≈ 878 km) | Validates the core formula against reference values |
| Same point → 0 km | Edge case: zero distance |
| Antipodal points → ~20,015 km | Edge case: maximum possible distance |
| Equator crossing (positive to negative latitude) | Sign handling |
| Date-line crossing (e.g. 179° to -179°) | Longitude wrap-around |
| NaN / non-numeric inputs → 0 | Confirms the NaN guard works |

### 1.2 `backend/src/utils/validation.js` — `validateName()`

| Test case | Why it matters |
|-----------|---------------|
| Valid names: `"Alice"`, `"player-1"`, `"a_b"` | Happy path |
| Empty string / whitespace-only | Boundary: minimum length |
| 21-character string | Boundary: exceeds max length |
| Special characters: `"<script>"`, `"a b"`, `"a@b"` | Rejects invalid chars (XSS defense) |
| Non-string input (number, null, undefined) | Type guard |
| Leading/trailing whitespace is trimmed | Confirms trim behavior |

### 1.3 `backend/src/utils/validation.js` — `validateScorePayload()`

| Test case | Why it matters |
|-----------|---------------|
| Valid full payload | Happy path |
| Missing required fields | Catches all error paths |
| Invalid `difficulty` (e.g. `"Extreme"`) | Enum enforcement |
| Invalid `roundsCount` (e.g. `4`) | Only 3, 5, 7 allowed |
| `totalScore` as negative, float, or string | Integer + non-negative check |
| `avgDistanceKm` negative or string | Optional field validation |
| `gameMode` / `gameCategory` invalid values | Enum enforcement |
| Multiple errors at once | Confirms all errors are collected, not just the first |

### 1.4 `backend/src/utils/validation.js` — `validateCoordinates()`

| Test case | Why it matters |
|-----------|---------------|
| Valid coordinates: `{latitude: 52.52, longitude: 13.405}` | Happy path |
| Boundary values: lat ±90, lon ±180 | Inclusive boundary check |
| Out-of-range: lat 91, lon 181 | Rejection |
| `Infinity`, `-Infinity`, `NaN` | `isFinite` guard |
| `null`, `undefined`, non-object inputs | Null guard |

---

## Priority 2 — Backend Integration Tests (High Impact, Medium Effort)

These test the API routes with a real (in-memory or temp) SQLite database.

### 2.1 `POST /api/score`

| Test case | Why it matters |
|-----------|---------------|
| Valid submission → 201 + entry returned | Happy path |
| Invalid payload → 400 + error details | Validation integration |
| Duplicate submission → 409 | Duplicate detection logic |
| Missing fields → 400 | Partial payload handling |

### 2.2 `GET /api/leaderboard`

| Test case | Why it matters |
|-----------|---------------|
| No filters → returns all entries (up to limit) | Default behavior |
| Filter by difficulty, gameMode, gameCategory | Query parameter handling |
| `sort` and `order` parameters | SQL injection prevention via allowlist |
| Invalid `sort` column → falls back to `totalScore` | Allowlist fallback |
| `limit` capped at 200 | Prevents unbounded queries |

### 2.3 `GET /api/location` and `GET /api/city`

| Test case | Why it matters |
|-----------|---------------|
| Returns valid `{latitude, longitude}` | Response shape |
| Difficulty filtering for cities | Pool logic (`Easy` vs `Hard`) |
| `Easy` difficulty includes `country` field | Conditional field |
| Fallback when data file is missing/corrupt | Resilience |

### 2.4 `GET /api/health`

| Test case | Why it matters |
|-----------|---------------|
| Returns `{status: "ok"}` | Deployment health check works |

---

## Priority 3 — Frontend Unit Tests (Medium Impact, Medium Effort)

Requires adding Vitest (integrates natively with Vite) to the frontend.

### 3.1 `frontend/src/utils/scoreCalculator.ts`

| Function | Key test cases |
|----------|---------------|
| `calculateScore()` | 0 km → 5000, 2500 km → 2500, 5000+ km → 0 |
| `calculateTimeBonus()` | 0s → 1000, at window → 0, negative → 1000 |
| `formatTime()` | 65s → `"1:05"`, 0s → `"0:00"`, 3600s → `"60:00"` |
| `formatDistance()` | 0.5 km → `"500 m"`, 1234 km → `"1.234 km"` |
| `formatScore()` | 5000 → `"5.000"` (German locale) |

### 3.2 `frontend/src/utils/haversine.ts`

Same test cases as backend haversine — this is a duplicated implementation that should produce identical results.

### 3.3 `frontend/src/context/GameContext.tsx` — `gameReducer`

| Action | Key test cases |
|--------|---------------|
| `START_GAME` | Resets state, sets phase to `"playing"` |
| `SUBMIT_GUESS` | Appends round result, moves to `"result"` phase |
| `TIMEOUT` | Score = 0, `timedOut = true`, no player guess |
| `NEXT_ROUND` | Increments index; transitions to `"summary"` at final round |
| `END_GAME` | Sets phase to `"summary"` |
| `RESET` | Returns to initial state |

---

## Priority 4 — Cross-Cutting Concerns

### 4.1 Haversine consistency

The haversine formula is implemented twice (backend JS + frontend TS). A test should verify both produce identical results for the same inputs, or the duplication should be eliminated.

### 4.2 CI pipeline

`deploy.yml` should run `npm test` before deploying. Without this, tests provide no safety net in practice.

### 4.3 Coverage reporting

Add `--coverage` to the Jest config (backend) and Vitest config (frontend) with a minimum threshold (e.g. 80% for utilities, 60% overall) to prevent regression.

---

## Recommended Setup Steps

**Backend** (ready to go — Jest already installed):
```bash
mkdir -p backend/src/__tests__
# Write test files, then run:
cd backend && npm test
```

**Frontend** (needs Vitest):
```bash
cd frontend && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
# Add to vite.config.ts: test: { environment: 'jsdom' }
# Add to package.json scripts: "test": "vitest run"
```

**CI** — add a test step before deploy in `.github/workflows/deploy.yml`:
```yaml
- name: Run tests
  run: |
    cd backend && npm test
    cd ../frontend && npm test
```
