# VeoCraft API

This is a small FastAPI service scaffold. It does **not** generate videos yet.

## Run locally

From the repository root:

```bash
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r server/requirements.txt
uvicorn server.app.main:app --reload --host 127.0.0.1 --port 8000
```

Check:
- `GET /health` — API health only.
- `GET /api/engine` — whether an engine configuration is present.
- `POST /api/generate` — currently returns HTTP 503 with `ENGINE_NOT_CONFIGURED`.

The engine status endpoint is not a model smoke test. Actual generation must remain disabled until a real adapter is integrated and verified. Never return a fake video URL or a completed status without a real output file.

## Environment

- `VEOCRAFT_ALLOWED_ORIGINS`: comma-separated allowed frontend origins; defaults to `http://localhost:5173`.
- `VEOCRAFT_ENGINE`: reserved for a future, verified adapter identifier.
- `VEOCRAFT_MODEL_DIR`: reserved for a local model directory; model files must not be committed to Git.
