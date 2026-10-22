"""VeoCraft API scaffold.

This service deliberately refuses generation until a real, verified model adapter is
installed. It never returns a fake video or marks a job as completed without output.
"""
from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="VeoCraft AI API",
    version="0.1.0",
    description="Video generation API scaffold; inference is disabled until configured.",
)

allowed_origins = [
    item.strip()
    for item in os.getenv("VEОCRAFT_ALLOWED_ORIGINS", os.getenv("VEОCRAFT_ALLOWED_ORIGINS", "http://localhost:5173")).split(",")
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
    duration_seconds: int = Field(default=5, ge=1, le=15)
    resolution: Literal["480p", "720p", "1080p"] = "720p"
    image_reference: str | None = Field(default=None, max_length=2048)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "veocraft-api", "version": "0.1.0"}


@app.get("/api/engine")
def engine_status() -> dict[str, str | bool]:
    configured = os.getenv("VEOCRAFT_ENGINE") == "wan22-ti2v-5b"
    model_path = os.getenv("VEOCRAFT_MODEL_DIR", "")
    return {
        "configured": bool(configured and model_path),
        "engine": "wan22-ti2v-5b" if configured and model_path else "none",
        "status": "ready" if configured and model_path else "not_configured",
        "message": (
            "Engine configuration detected; runtime validation is still required."
            if configured and model_path
            else "No inference engine is connected. Generation is disabled."
        ),
    }


@app.post("/api/generate")
def generate(request: GenerationRequest) -> dict[str, str]:
    # Do not fake job IDs, progress, or completed media. A real adapter must be
    # integrated and smoke-tested before this endpoint can accept generation.
    del request
    raise HTTPException(
        status_code=503,
        detail={
            "code": "ENGINE_NOT_CONFIGURED",
            "message": "Video generation is not available yet: no verified model runtime is connected.",
        },
    )
