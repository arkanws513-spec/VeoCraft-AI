#!/usr/bin/env python3
"""End-to-end smoke test for a configured local VeoCraft/Wan2.2 API."""
from __future__ import annotations

import os
import sys
import time
import shutil
import subprocess
from pathlib import Path

import httpx

base = os.getenv("VEOCRAFT_API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
prompt = os.getenv(
    "VEOCRAFT_SMOKE_PROMPT",
    "A cinematic sunrise over the Nile, realistic golden reflections, slow camera movement",
)
timeout_seconds = int(os.getenv("VEOCRAFT_SMOKE_TIMEOUT_SECONDS", "7200"))

with httpx.Client(timeout=60) as client:
    health = client.get(f"{base}/health")
    health.raise_for_status()
    engine = client.get(f"{base}/api/engine")
    engine.raise_for_status()
    engine_data = engine.json()
    if not engine_data.get("configured"):
        raise SystemExit(f"Runtime is not configured: {engine_data.get('message')}")

    response = client.post(
        f"{base}/api/generate",
        json={
            "prompt": prompt,
            "mode": "text",
            "aspect_ratio": "9:16",
            "duration_seconds": 5,
            "resolution": "720p",
            "image_reference": None,
        },
    )
    if response.status_code >= 400:
        raise SystemExit(f"Could not start generation ({response.status_code}): {response.text}")
    job_id = response.json()["id"]
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        status_response = client.get(f"{base}/api/jobs/{job_id}")
        status_response.raise_for_status()
        job = status_response.json()
        print(f"Job {job_id}: {job.get('status')} — {job.get('message')}", flush=True)
        if job.get("status") == "failed":
            raise SystemExit(f"Generation failed: {job.get('message')}")
        if job.get("status") == "completed" and job.get("video_url"):
            break
        time.sleep(3)
    else:
        raise SystemExit("Timed out waiting for a completed generation job.")

    video_response = client.get(f"{base}{job['video_url']}", timeout=300)
    video_response.raise_for_status()
    output = Path(os.getenv("VEOCRAFT_SMOKE_OUTPUT", "runtime_data/smoke-test.mp4"))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(video_response.content)

if output.stat().st_size < 1024 or b"ftyp" not in output.read_bytes()[:32]:
    raise SystemExit(f"Output is not a valid-looking MP4 container: {output}")
ffprobe = shutil.which("ffprobe")
if ffprobe:
    probe = subprocess.run(
        [ffprobe, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=codec_type", "-of", "default=noprint_wrappers=1:nokey=1",
         str(output)],
        capture_output=True, text=True, timeout=30, check=False,
    )
    if probe.returncode != 0 or "video" not in probe.stdout.split():
        raise SystemExit(f"ffprobe could not verify the generated video: {probe.stderr}")
print(f"PASS: generated and downloaded a real video file at {output} ({output.stat().st_size} bytes)")
