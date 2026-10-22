from fastapi.testclient import TestClient

from server.app.main import app

client = TestClient(app)


def test_health_reports_api_only():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_engine_is_not_configured_by_default(monkeypatch):
    monkeypatch.delenv("VEOCRAFT_ENGINE", raising=False)
    monkeypatch.delenv("VEOCRAFT_MODEL_DIR", raising=False)
    response = client.get("/api/engine")
    assert response.status_code == 200
    assert response.json()["configured"] is False
    assert response.json()["status"] == "not_configured"


def test_generate_does_not_fake_a_video():
    response = client.post(
        "/api/generate",
        json={
            "prompt": "A quiet sunrise over the Nile",
            "mode": "text",
            "aspect_ratio": "9:16",
            "duration_seconds": 5,
            "resolution": "720p",
        },
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "ENGINE_NOT_CONFIGURED"
