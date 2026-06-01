# SsmartTv

IPTV / TV streaming platform. The repo is split into two apps:

```
SsmartTv/
├── TvFrontend/    # React 19 + Vite SPA (UI, HLS player, i18n uz/ru)
├── TvBackend/     # FastAPI: auth, channels/movies API, HLS proxy
├── docker-compose.yml   # PostgreSQL + Redis (dev infra)
└── docs/          # CORS / deploy / Russia1 guides
```

## Stack

**Frontend:** React 19, Vite, React Router, Zustand, i18next, hls.js, Tailwind, axios.

**Backend:** FastAPI · async SQLAlchemy 2.0 + asyncpg · Alembic (migrations) ·
PostgreSQL · Redis (sessions) · Argon2 (`argon2-cffi`, password hashing) · httpx (HLS proxy).

Auth uses **opaque session ids stored in Redis** behind an HttpOnly cookie
(`ssmart_session`). The HLS CORS proxy (formerly the Node `proxy-server.cjs`)
is now part of the FastAPI backend under `/api/stream/{slug}` + `/api/segment`.

## Quick start

### 1. Infra (PostgreSQL + Redis)

```bash
docker compose up -d      # or: podman-compose up -d
```

### 2. Backend (port 8000)

```bash
cd TvBackend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                # adjust if needed
alembic upgrade head                # create tables
python -m app.seed                  # load Russian channels + movies
python -m app.import_m3u data/uzbek-channels.m3u   # import Uzbek TV channels
uvicorn app.main:app --reload --port 8000
```

Health check: <http://localhost:8000/health> · API docs: <http://localhost:8000/docs>

### 3. Frontend (port 5173)

```bash
cd TvFrontend
npm install
cp .env.example .env                 # VITE_API_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:5173>.

## API overview

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | email + password (Argon2), sets session cookie |
| POST | `/api/auth/login` | sets session cookie |
| POST | `/api/auth/logout` | clears session (Redis + cookie) |
| GET  | `/api/auth/me` | current user from session |
| GET  | `/api/channels` | `?category=`, `?q=`, `?live_only=` |
| GET  | `/api/channels/{slug}` | single channel (live → `stream_url`) |
| POST/PUT/DELETE | `/api/channels` | admin only |
| GET  | `/api/movies` | `?kind=hero\|featured\|premiere\|cinema\|movie\|series` |
| GET  | `/api/stream/{slug}` | proxied HLS manifest |
| GET  | `/api/segment?url=...` | proxied HLS segment |
# SsmartTV-
# SsmartTV-
# SsmartTV-
# SsmartTV-
