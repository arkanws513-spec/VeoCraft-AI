# VeoCraft local inference API

The FastAPI service is connected to the official Wan2.2 command-line inference entry point. It supports real text-to-video and image-to-video jobs only when the official code, model weights, Python dependencies, and suitable GPU are installed on the API machine.

## 1. Prepare Wan2.2

Follow the official [Wan2.2 repository instructions](https://github.com/Wan-Video/Wan2.2). Clone the repository and install its pinned/official requirements in a compatible Python environment. Download `Wan-AI/Wan2.2-TI2V-5B` weights to a local directory outside this project. For the official 720p path, the project documents a GPU with about 24 GB VRAM and these memory-saving flags: model offload, dtype conversion, and T5 on CPU.

Do not commit weights to Git.

## 2. Install VeoCraft API dependencies

Use the same Python environment that can import the Wan runtime:

```bash
python -m pip install -r server/requirements.txt
```

Set environment variables (Linux/macOS example):

```bash
export VEOCRAFT_WAN_REPO_DIR="$HOME/Wan2.2"
export VEOCRAFT_MODEL_DIR="$HOME/models/Wan2.2-TI2V-5B"
export VEOCRAFT_ALLOWED_ORIGINS="http://localhost:5173"
uvicorn server.app.main:app --host 0.0.0.0 --port 8000
```

PowerShell example:

```powershell
$env:VEOCRAFT_WAN_REPO_DIR = "$HOME\Wan2.2"
$env:VEOCRAFT_MODEL_DIR = "$HOME\models\Wan2.2-TI2V-5B"
$env:VEOCRAFT_ALLOWED_ORIGINS = "http://localhost:5173"
python -m uvicorn server.app.main:app --host 0.0.0.0 --port 8000
```

Optional variables:
- `VEOCRAFT_PYTHON`: explicit Python executable; defaults to the current API interpreter.
- `VEOCRAFT_DATA_DIR`: upload/output directory; defaults to `runtime_data/` in the project.
- `VEOCRAFT_GENERATION_TIMEOUT_SECONDS`: subprocess timeout; defaults to 7200.

## 3. API endpoints

- `GET /health` — service health.
- `GET /api/engine` — checks whether the Wan checkout and non-empty model directory are configured. It does not prove GPU inference works.
- `POST /api/upload-image` — multipart field `file`, accepts PNG/JPEG/WebP up to 12 MB, returns an opaque `image_reference`.
- `POST /api/generate` — JSON request, returns a queued job ID.
- `GET /api/jobs/{id}` — poll job status; `video_url` appears only after a real MP4 exists.
- `GET /api/jobs/{id}/video` — serves a completed MP4.

Example request:

```json
{
  "prompt": "A cinematic sunrise over the Nile, realistic water reflections, slow camera movement",
  "mode": "text",
  "aspect_ratio": "9:16",
  "duration_seconds": 5,
  "resolution": "720p",
  "image_reference": null
}
```

Current adapter limits: 720p, 9:16 or 16:9, requested duration 5–15 seconds. Model generation is computationally expensive; requests run on the API host and may take a long time.

## 4. Before public deployment

This is an initial single-process implementation. Job state is in memory and resets on restart. It does not yet include authentication, rate limiting, persistent jobs, queue recovery, per-user storage, or automatic cleanup. Keep it private/local until those controls and a real GPU smoke test are completed. Configure HTTPS and CORS for the exact frontend origin.
