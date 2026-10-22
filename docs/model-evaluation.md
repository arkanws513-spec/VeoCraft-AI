# Open-weight model evaluation

This document separates model capability from the cost of serving it. Model weights can be free to download while inference still requires substantial GPU memory and compute.

## Initial candidates

| Model | Strengths | License notes | Hardware / cost notes | Decision |
|---|---|---|---|---|
| Wan2.2 TI2V-5B | One model variant supports text-to-video and image-to-video; official repo documents 720p output | Official Wan2.2 repository states Apache 2.0 for the models | Official instructions describe a GPU with at least 24 GB VRAM for 720p with memory-saving options. This is not a free-hosting guarantee. | **First candidate for a reproducible local smoke test** |
| LTX-2.5 | Text/image/video input and synchronized audio-video generation; multiple aspect ratios | LTX-2.x Community License has specific restrictions and requires a separate paid agreement for entities at or above its stated revenue threshold. It also contains restrictions that require careful review for a video-generation product. | Model family includes a 22B transformer; runtime and memory requirements depend on pipeline and hardware. | Keep as a capability reference; do not integrate until license and hardware fit are confirmed. |

## Verified source references

- Wan2.2 official repository: https://github.com/Wan-Video/Wan2.2
- LTX-2 official inference repository: https://github.com/Lightricks/LTX-2
- LTX-2.5 license: https://github.com/rainstardev/LTX-2.5/blob/main/LICENSE.md

## Integration and verification status

The API now has a local adapter that invokes the official Wan2.2 `generate.py` entry point, accepts image uploads, queues jobs, polls job status, and serves a result only after an MP4 container is validated. The frontend calls those endpoints and offers video playback/download. This is code-level integration only: no real GPU generation has yet been executed or verified in this environment.

## Why production generation is not yet verified

1. The project currently has no guaranteed GPU host and no budget for paid inference.
2. We must first run a real short generation on available hardware and record the exact commands, model revision, runtime, peak memory, elapsed time, and output file.
3. We must confirm the precise model and dependency licenses before distributing the model or offering hosted generation.
4. No model weights should be committed to this repository. Download them into a local or dedicated model cache using `scripts/download_wan2_2_weights.sh` on Linux/macOS, then run `python scripts/smoke_test_api.py` after starting the configured API.

## Acceptance criteria before production use

- [ ] Model and code licenses reviewed for the intended deployment.
- [ ] A clean target GPU environment can install compatible, pinned inference dependencies.
- [ ] Run the smoke test and verify text-to-video produces a valid playable video file.
- [ ] Run an image-to-video smoke test and verify the resulting file.
- [x] API job lifecycle and output checks are implemented in code; real GPU behavior remains unverified.
- [ ] Cancellation, timeout, insufficient VRAM, and missing weights return explicit errors.
- [ ] Hosting plan is costed before any public deployment.

## Cost strategy

Develop the interface and API on ordinary CPU-only/free CI first. Run model inference only on hardware that is actually available; do not promise public generation from a static frontend or a CPU-only web host. If no suitable GPU is available, keep generation disabled rather than silently routing to a paid API.
