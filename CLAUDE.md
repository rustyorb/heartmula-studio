# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeartMuLa Studio is an AI music generation web UI built around the open-source HeartMuLa model. Users compose lyrics, pick style tags, queue generation jobs, and browse/play results — all through a browser.

## Development Commands

```bash
# Full-stack dev (backend + frontend in parallel)
make dev

# Backend only (hot reload on :8000)
make dev-backend

# Frontend only (Next.js dev on :3000)
make dev-frontend

# First-time setup
make setup-backend    # uv sync + alembic upgrade head
make setup-frontend   # pnpm install

# Database migrations
make migrate                          # Apply pending migrations
make new-migration msg="description"  # Generate new migration
```

**Backend** uses `uv` as package manager. Run backend commands with `cd backend && uv run <command>`.

**Frontend** uses `pnpm`. Run frontend commands with `cd frontend && pnpm <command>`. Available scripts: `dev`, `build`, `start`, `lint`.

## Architecture

### Backend (FastAPI + SQLite)

**Entrypoint:** `backend/app/main.py` — FastAPI app with async lifespan that initializes all services on `app.state`.

**Service layer** (`backend/app/services/`):
- `PipelineManager` — loads/unloads HeartMuLa model, runs generation and transcription inference
- `JobQueue` — SQLite-backed persistent queue; recovers stale jobs on restart
- `GenerationWorker` — single background `asyncio.Task` loop consuming jobs one at a time with GPU lock
- `EventBroadcaster` — fans out Server-Sent Events to all connected clients
- `GPUManager` — detects GPU hardware, monitors VRAM
- `StorageService` — file I/O for audio outputs and uploads
- `TranscriptionService` — wraps transcription pipeline

**Dependency injection** via `backend/app/dependencies.py` — services pulled from `request.app.state`, DB sessions from async generator.

**Database:** SQLite with WAL mode and foreign keys enabled. Three tables: `generation_jobs`, `tracks`, `user_settings`. All DB ops are async (aiosqlite + SQLAlchemy 2.0 async).

**Configuration** (`backend/app/config.py`): Pydantic `BaseSettings` with `HEARTMULA_` env prefix. Reads `.env` file. Key settings: `model_path`, `model_version`, `lazy_load`, `database_url`, generation defaults.

### Frontend (Next.js 15 + React 19 + TypeScript)

**State management:** Six independent Zustand stores in `frontend/src/stores/` — studio, queue, player, library, system, settings. Stores update reactively via SSE events, not polling.

**Real-time updates:** `SSEManager` (`frontend/src/lib/sse.ts`) maintains a persistent connection to `GET /api/events`. The `SSEProvider` component connects on mount. Event types include `job:progress`, `job:completed`, `model:ready`, `gpu:status`, etc.

**API client:** `frontend/src/lib/api.ts` wraps fetch calls. All `/api/*` requests are proxied to the backend via Next.js rewrites in `next.config.ts`.

**UI:** Tailwind CSS 4 + shadcn/ui components in `frontend/src/components/ui/`. Application components organized by feature: `studio/`, `queue/`, `library/`, `player/`, `transcription/`, `layout/`, `shared/`.

**Pages (App Router):** `/` (home), `/studio` (generation), `/library` (track browser), `/transcribe` (audio-to-text), `/settings`.

### Frontend ↔ Backend Communication

1. **HTTP:** Next.js rewrites proxy `/api/*` → `localhost:8000/api/*` and `/outputs/*` → backend static files
2. **SSE:** Single persistent `EventSource` connection for all real-time updates (job progress, GPU status, model loading)
3. No WebSockets or polling — SSE is the sole push mechanism

### Job Lifecycle

`POST /api/generation/generate` → job saved to SQLite (pending) → SSE `job:queued` → worker picks up → SSE `job:started` → progress hooks emit SSE `job:progress` → audio saved → track created → SSE `job:completed`

## Environment

- **Python:** 3.10–3.12 (PyTorch CUDA 12.8 index for GPU support)
- **Node:** 18+
- **Package managers:** `uv` (backend), `pnpm` (frontend)
- **Runtime data** in `backend/data/` (gitignored): `heartmula.db`, `outputs/`, `uploads/`
- **Model weights** in `backend/models/` (gitignored)
- Backend env var prefix: `HEARTMULA_` (e.g., `HEARTMULA_MODEL_PATH`)
- Frontend env var: `NEXT_PUBLIC_API_URL` (empty = use proxy, default)
