---
title: VeoCraft Wan2.2
emoji: 🎬
colorFrom: purple
colorTo: blue
sdk: gradio
sdk_version: 5.29.0
app_file: app.py
pinned: false
---

# VeoCraft Wan2.2 — ZeroGPU prototype

A free-tier prototype for official Wan2.2 TI2V-5B text-to-video and image-to-video generation.

## Important limitations

- Hugging Face ZeroGPU is quota-limited on free accounts (currently 5 minutes of GPU time per day); this is a prototype, not production capacity.
- Model weights are large and are downloaded when the Space starts. Startup time and available disk space can be limiting.
- Wan2.2 TI2V-5B requires substantial memory and can take longer than the free daily GPU quota for a single generation. A successful generation is not guaranteed on the free tier.
- Do not expose this demo as a public production API: it has no user authentication, queue isolation, or persistent job management.
- This Space is not created or deployed automatically by this directory. Create a Gradio Space and copy these files into its repository.

Model: `Wan-AI/Wan2.2-TI2V-5B` (Apache-2.0 model card). Runtime: official `Wan-Video/Wan2.2` repository.
