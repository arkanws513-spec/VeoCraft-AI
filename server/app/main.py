"""VeoCraft API with an optional local Wan2.2 TI2V-5B runtime.

Generation is enabled only when the official Wan checkout and model weights are
present on the same machine. Jobs are never marked complete without a real MP4.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import threading
import uuid
from pathlib import Path
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError

app = FastAPI(title="VeoCraft AI API", version="0.2.0")
ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("VEOCRAFT_DATA_DIR", str(ROOT / "runtime_data"))).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
OUTPUT_DIR = DATA_DIR / "outputs"
for directory in (UPLOAD_DIR, OUTPUT_DIR):
    directory.mkdir(parents=True, exist_ok=True)

JOBS: dict[str, dict] = {}
JOBS_LOCK = threading.Lock()
GENERATION_LOCK = threading.Lock()
IMAGE_TYPES = {".png", ".jpg", ".jpeg", ".webp"}
MAX_IMAGE_BYTES = 12 * 1024 * 1024

allowed_origins = [
    item.strip()
    for item in os.getenv("VEOCRAFT_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if item.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class GenerationRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    mode: Literal["text", "image"] = "text"
    aspect_ratio: Literal["9:16", "16:9", "1:1", "4:3"] = "9:16"
    duration_seconds: int = Field(default=5, ge=5, le=15)
    resolution: Literal["480p", "720p", "1080p"] = "720p"
    image_reference: str | None = Field(default=None, max_length=80)


def _runtime() -> tuple[Path, Path]:
    repo = Path(os.getenv("VEOCRAFT_WAN_REPO_DIR", "")).expanduser().resolve()
    model = Path(os.getenv("VEOCRAFT_MODEL_DIR", "")).expanduser().resolve()
    if not os.getenv("VEOCRAFT_WAN_REPO_DIR") or not (repo / "generate.py").is_file():
        raise HTTPException(503, detail={"code": "WAN_RUNTIME_MISSING", "message": "Set VEOCRAFT_WAN_REPO_DIR to an official Wan2.2 checkout containing generate.py."})
    if not os.getenv("VEOCRAFT_MODEL_DIR") or not model.is_dir() or not any(model.iterdir()):
        raise HTTPException(503, detail={"code": "MODEL_WEIGHTS_MISSING", "message": "Set VEOCRAFT_MODEL_DIR to the downloaded Wan2.2-TI2V-5B weights directory."})
    return repo, model


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "veocraft-api", "version": "0.2.0"}


@app.get("/api/engine")
def engine_status() -> dict[str, str | bool]:
    repo_value = os.getenv("VEOCRAFT_WAN_REPO_DIR", "")
    model_value = os.getenv("VEOCRAFT_MODEL_DIR", "")
    repo_ok = bool(repo_value and (Path(repo_value).expanduser() / "generate.py").is_file())
    model_ok = bool(model_value and Path(model_value).expanduser().is_dir() and any(Path(model_value).expanduser().iterdir()))
    configured = repo_ok and model_ok
    return {
        "configured": configured,
        "engine": "wan2.2-ti2v-5b" if configured else "none",
        "status": "ready" if configured else "not_configured",
        "wan_checkout_present": repo_ok,
        "model_directory_present": model_ok,
        "message": "Local Wan2.2 runtime paths are present; GPU and model inference still need a real smoke test." if configured else "Configure VEOCRAFT_WAN_REPO_DIR and VEOCRAFT_MODEL_DIR on a GPU host.",
    }


@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)) -> dict[str, str]:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in IMAGE_TYPES or file.content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(415, detail={"code": "UNSUPPORTED_IMAGE", "message": "Upload a PNG, JPEG, or WebP image."})
    token = uuid.uuid4().hex
    destination = UPLOAD_DIR / f"{token}{suffix}"
    size = 0
    try:
        with destination.open("wb") as target:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    raise HTTPException(413, detail={"code": "IMAGE_TOO_LARGE", "message": "Image limit is 12 MB."})
                target.write(chunk)
        try:
            with Image.open(destination) as image:
                if image.width * image.height > 40_000_000:
                    raise HTTPException(413, detail={"code": "IMAGE_DIMENSIONS_TOO_LARGE", "message": "Image dimensions exceed the 40-megapixel limit."})
                image.verify()
        except HTTPException:
            raise
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise HTTPException(415, detail={"code": "INVALID_IMAGE", "message": "The uploaded file is not a valid supported image."}) from exc
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    return {"image_reference": token, "filename": Path(file.filename or "image").name}


def _run_generation(job_id: str, request: GenerationRequest) -> None:
    with JOBS_LOCK:
        JOBS[job_id]["status"] = "running"
        JOBS[job_id]["message"] = "Starting local Wan2.2 inference"
    output = OUTPUT_DIR / f"{job_id}.mp4"
    try:
        if not GENERATION_LOCK.acquire(blocking=False):
            raise RuntimeError("Another generation is already running. Try again when it finishes.")
        try:
            repo, model = _runtime()
            if request.resolution != "720p":
                raise RuntimeError("Wan2.2 TI2V-5B integration currently supports 720p only.")
            sizes = {"9:16": "704*1280", "16:9": "1280*704"}
            if request.aspect_ratio not in sizes:
                raise RuntimeError("Wan2.2 TI2V-5B currently supports 9:16 and 16:9 output only.")
            image_path = None
            if request.mode == "image":
                token = request.image_reference or ""
                if not re.fullmatch(r"[0-9a-f]{32}", token):
                    raise RuntimeError("Upload a reference image before generating.")
                matches = list(UPLOAD_DIR.glob(token + ".*"))
                if len(matches) != 1 or matches[0].suffix.lower() not in IMAGE_TYPES:
                    raise RuntimeError("Reference image expired or was not found. Upload it again.")
                image_path = matches[0]
            elif request.image_reference:
                raise RuntimeError("Remove the reference image or choose image-to-video mode.")
            frames = 4 * round(request.duration_seconds * 24 / 4) + 1
            command = [
                os.getenv("VEOCRAFT_PYTHON", sys.executable),
                str(repo / "generate.py"),
                "--task", "ti2v-5B",
                "--size", sizes[request.aspect_ratio],
                "--ckpt_dir", str(model),
                "--offload_model", "True",
                "--convert_model_dtype",
                "--t5_cpu",
                "--frame_num", str(frames),
                "--prompt", request.prompt,
                "--save_file", str(output),
            ]
            if image_path:
                command.extend(["--image", str(image_path)])
            completed = subprocess.run(
                command, cwd=str(repo), capture_output=True, text=True,
                timeout=int(os.getenv("VEOCRAFT_GENERATION_TIMEOUT_SECONDS", "7200")),
                check=False,
            )
            if completed.returncode != 0:
                details = (completed.stderr or completed.stdout or "Wan2.2 process failed")[-3000:]
                raise RuntimeError(details)
            if not output.is_file() or output.stat().st_size < 1024:
                raise RuntimeError("Wan2.2 exited without producing a valid output file.")
            with JOBS_LOCK:
                JOBS[job_id].update(status="completed", message="Video generated", video_url=f"/api/jobs/{job_id}/video")
        finally:
            GENERATION_LOCK.release()
    except subprocess.TimeoutExpired:
        output.unlink(missing_ok=True)
        with JOBS_LOCK:
            JOBS[job_id].update(status="failed", message="Generation timed out. Check GPU memory and model setup.")
    except Exception as exc:
        output.unlink(missing_ok=True)
        with JOBS_LOCK:
            JOBS[job_id].update(status="failed", message=str(exc)[:3000])


@app.post("/api/generate", status_code=202)
def generate(request: GenerationRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    _runtime()
    if request.resolution != "720p":
        raise HTTPException(422, detail={"code": "UNSUPPORTED_RESOLUTION", "message": "The configured Wan2.2 TI2V-5B path supports 720p only."})
    if request.aspect_ratio not in {"9:16", "16:9"}:
        raise HTTPException(422, detail={"code": "UNSUPPORTED_ASPECT_RATIO", "message": "The configured Wan2.2 TI2V-5B path supports 9:16 and 16:9 only."})
    if request.mode == "image" and not request.image_reference:
        raise HTTPException(422, detail={"code": "IMAGE_REQUIRED", "message": "Upload a reference image first."})
    if request.mode == "text" and request.image_reference:
        raise HTTPException(422, detail={"code": "UNEXPECTED_IMAGE", "message": "Choose image-to-video mode to use a reference image."})
    job_id = uuid.uuid4().hex
    with JOBS_LOCK:
        JOBS[job_id] = {"id": job_id, "status": "queued", "message": "Waiting for local GPU", "video_url": None}
    background_tasks.add_task(_run_generation, job_id, request)
    return {"id": job_id, "status": "queued", "status_url": f"/api/jobs/{job_id}", "video_url": ""}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str) -> dict:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            raise HTTPException(404, detail={"code": "JOB_NOT_FOUND", "message": "Job not found. Jobs are stored in memory and reset when the API restarts."})
        return dict(job)


@app.get("/api/jobs/{job_id}/video")
def job_video(job_id: str) -> FileResponse:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job or job.get("status") != "completed":
            raise HTTPException(404, detail={"code": "VIDEO_NOT_READY", "message": "No completed video exists for this job."})
    path = (OUTPUT_DIR / f"{job_id}.mp4").resolve()
    if path.parent != OUTPUT_DIR or not path.is_file() or path.stat().st_size < 1024:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Output file was not found."})
    return FileResponse(path, media_type="video/mp4", filename=f"veocraft-{job_id}.mp4")
