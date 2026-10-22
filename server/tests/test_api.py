from fastapi.testclient import TestClient

from server.app.main import app

client = TestClient(app)


def test_health_reports_api():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "veocraft-api"


def test_engine_is_not_configured_without_runtime(monkeypatch):
    monkeypatch.delenv("VEOCRAFT_WAN_REPO_DIR", raising=False)
    monkeypatch.delenv("VEOCRAFT_MODEL_DIR", raising=False)
    response = client.get("/api/engine")
    assert response.status_code == 200
    assert response.json()["configured"] is False
    assert response.json()["status"] == "not_configured"


def test_generate_reports_missing_runtime(monkeypatch):
    monkeypatch.delenv("VEOCRAFT_WAN_REPO_DIR", raising=False)
    monkeypatch.delenv("VEOCRAFT_MODEL_DIR", raising=False)
    response = client.post("/api/generate", json={"prompt": "Sunrise over the Nile"})
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "WAN_RUNTIME_MISSING"


def test_generation_request_validation():
    response = client.post("/api/generate", json={"prompt": "", "duration_seconds": 60})
    assert response.status_code == 422


def test_unsupported_resolution_is_rejected_before_queue(monkeypatch, tmp_path):
    repo = tmp_path / "wan"
    repo.mkdir()
    (repo / "generate.py").write_text("# placeholder")
    model = tmp_path / "model"
    model.mkdir()
    monkeypatch.setenv("VEOCRAFT_WAN_REPO_DIR", str(repo))
    monkeypatch.setenv("VEOCRAFT_MODEL_DIR", str(model))
    response = client.post("/api/generate", json={"prompt": "Test", "resolution": "1080p"})
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "UNSUPPORTED_RESOLUTION"


def test_video_endpoint_never_returns_missing_output():
    response = client.get("/api/jobs/00000000000000000000000000000000/video")
    assert response.status_code == 404


def test_image_upload_rejects_non_images():
    response = client.post(
        "/api/upload-image",
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 415
