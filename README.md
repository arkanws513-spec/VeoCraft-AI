# VeoCraft AI

An open-weights-first video creation app for web and Android.

## Project goals
- Text-to-video and image-to-video workflows.
- Optional generated audio / voice-over and subtitles.
- Vertical (9:16), landscape (16:9), and square exports.
- Arabic and English interface.
- Keep costs near zero: no paid inference API is required by the product design.
- Be honest about model readiness: the UI must never report a video as generated until a real inference job has completed.

## Current status
This repository is the initial application foundation. The generation engine is **not connected yet**. Model choice, license compatibility, hardware requirements, and a reproducible inference test must be verified before enabling generation. Do not upload model weights to Git.

## Planned architecture
- `web/`: responsive web app and installable PWA.
- `server/`: job API and inference adapter (planned).
- `docs/`: model evaluation, deployment notes, and cost controls.

## Development
The initial UI is static and runs without API keys. A real model runtime will be added only after it passes a documented smoke test on available hardware.

## License
The app source license will be selected after reviewing the licenses of integrated models and dependencies. Model weights may have separate terms; check each model's official license before use.
