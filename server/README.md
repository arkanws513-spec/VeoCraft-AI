# VeoCraft API

This is a FastAPI service scaffold. The API health check works, but it does **not** generate videos yet.

## Run locally

From the repository root:

```bash
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r server/requirements.txt
uvicorn server.app.main:app --reload --host 127.0.0.1 --port 8000
```

## API

- `GET /health` — API health only.
- `GET /api/engine` — reports `not_configured` until a verified inference adapter is connected.
- `POST /api/generate` — currently returns HTTP 503 with `ENGINE_NOT_CONFIGURED`; it never returns a fake video URL.

The API tests check health, engine state, request validation, and that generation fails honestly while the runtime is absent. They do not prove that a model can generate a video.

## Environment

- `VEOCRAFT_ALLOWED_ORIGINS`: comma-separated allowed frontend origins; defaults to `http://localhost:5173`.
- `VEOCRAFT_ENGINE`: reserved for a future verified adapter identifier.
- `VEOCRAFT_MODEL_DIR`: reserved for local model files; weights must not be committed to Git.

## First model candidate

Wan2.2 TI2V-5B is the first candidate for a real local smoke test because the official project supports both text-to-video and image-to-video. The official 720p example requires a GPU with about 24 GB VRAM and memory-saving flags. This is not a promise of free cloud hosting. See the [official Wan2.2 repository](https://github.com/Wan-Video/Wan2.2).

Before enabling generation, a real short clip must be produced and verified on the target runtime. Record the exact model revision, hardware, runtime, memory use, and output file. If no suitable GPU is available, keep generation disabled rather than silently using a paid API.
