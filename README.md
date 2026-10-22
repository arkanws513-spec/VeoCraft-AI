# VeoCraft AI

Arabic/English video-generation studio with a local, open-weight inference path. The web UI talks to a FastAPI service; the service can invoke the official Wan2.2 TI2V-5B runtime on a machine where its code, weights, and suitable GPU are installed.

## Current functionality

- Arabic/English responsive studio UI.
- Text-to-video and image-to-video request flows.
- Image upload with file-size/type checks.
- Async job IDs, status polling, error reporting, and real MP4 playback/download.
- FastAPI health and engine-status endpoints.
- CI checks for frontend compilation and API tests.
- No paid inference API or API key is used by the app.

## Important runtime limits

The API integration is implemented, but a real generation has **not** been verified in this repository's CI environment. The app must not be considered production-ready until a GPU host has generated and played a real MP4. The initial adapter targets official Wan2.2 TI2V-5B, which supports 720p portrait/landscape generation; the official instructions cite about 24 GB of GPU VRAM for the memory-saving 720p path. Hosting GPU inference is not guaranteed to be free.

Current adapter support:
- 720p only.
- 9:16 and 16:9 only.
- 5–15 seconds requested duration.
- Local single-process API. Job state is in memory and resets if the API restarts; do not run multiple API workers with this initial job store.

## Quick start: frontend

```bash
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000` for the API. Set `VITE_API_BASE_URL` before building if the API is hosted elsewhere. For a phone on the same Wi-Fi, use the computer's LAN IP rather than `localhost`.

## Quick start: local model runtime

1. Install a compatible Python/PyTorch environment following the [official Wan2.2 instructions](https://github.com/Wan-Video/Wan2.2).
2. Download the official `Wan-AI/Wan2.2-TI2V-5B` weights outside this Git repository.
3. Install `server/requirements.txt` in the same Python environment used by the Wan runtime.
4. Set:
   - `VEOCRAFT_WAN_REPO_DIR`: path to the official Wan2.2 checkout containing `generate.py`.
   - `VEOCRAFT_MODEL_DIR`: path to the downloaded TI2V-5B checkpoint directory.
   - `VEOCRAFT_ALLOWED_ORIGINS`: comma-separated frontend origins.
5. Start the API:
   ```bash
   uvicorn server.app.main:app --host 0.0.0.0 --port 8000
   ```
6. Open `/api/engine` and check the reported paths, then generate a short clip and verify the resulting MP4 on the target GPU. The endpoint reports path readiness, not proof of successful inference.

See [server setup](server/README.md) and [model evaluation](docs/model-evaluation.md).

## Deployment

The frontend can be deployed as a static Vite site (e.g. Vercel) using `vercel.json`. The inference API must run separately on a machine that has the model weights and suitable GPU. A static frontend host is not a video-generation runtime. Configure `VITE_API_BASE_URL` to the public HTTPS API origin and configure that API's CORS allowlist accordingly.

## Security and operations

- Never commit model weights, user uploads, or generated videos.
- Use HTTPS and an explicit CORS allowlist for any public deployment.
- The initial API has no user authentication, quotas, persistent job database, or multi-worker job queue; do not expose it publicly without adding those controls.
- Jobs and uploaded media live under `runtime_data/` by default and should be treated as local temporary files.

## License

Application source and model weights may have separate licenses. Review the official model and dependency terms before redistribution or commercial deployment.
