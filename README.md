# 🌍 GeoGuessing

Ein browserbasiertes Geo-Guessing-Spiel. Erkenne den Ort auf dem Satellitenbild und markiere ihn auf der Weltkarte!

## Schnellstart

### Backend
```bash
cd backend
cp .env.example .env
npm start          # Produktion
npm run dev        # Entwicklung (nodemon)
```

### Frontend
```bash
cd frontend
npm run dev        # http://localhost:5173
```

## Features
- 3 Schwierigkeitsgrade (Easy / Medium / Hard)
- 3, 5 oder 7 Runden konfigurierbar
- Countdown-Timer pro Runde
- Haversine-basierte Distanzberechnung
- Persistentes Leaderboard (SQLite)
- Responsives Layout

## API
| Endpoint | Beschreibung |
|---|---|
| `GET /api/location` | Zufälligen Standort abrufen |
| `GET /api/leaderboard` | Bestenliste abrufen |
| `POST /api/score` | Score speichern |
| `GET /api/health` | Health-Check |

## Umgebungsvariablen (backend/.env)
| Variable | Standard |
|---|---|
| `PORT` | `3001` |
| `MAP_TILE_URL` | OSM-Tiles |
| `LEFT_IMAGERY_URL` | ESRI World Imagery |
