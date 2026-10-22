#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root. Downloads multi-gigabyte model weights outside Git.
# Requires Python, git, and the Hugging Face CLI (hf).
MODEL_DIR="${VEOCRAFT_MODEL_DIR:-$HOME/models/Wan2.2-TI2V-5B}"
WAN_DIR="${VEOCRAFT_WAN_REPO_DIR:-$HOME/Wan2.2}"

if ! command -v hf >/dev/null 2>&1; then
  python -m pip install -U "huggingface_hub[cli]"
fi

if [ ! -f "$WAN_DIR/generate.py" ]; then
  git clone https://github.com/Wan-Video/Wan2.2.git "$WAN_DIR"
else
  echo "Using existing Wan checkout: $WAN_DIR"
fi

mkdir -p "$MODEL_DIR"
hf download Wan-AI/Wan2.2-TI2V-5B --local-dir "$MODEL_DIR"

cat <<EOF
Model download finished.
Set these environment variables before starting VeoCraft:
  VEOCRAFT_WAN_REPO_DIR=$WAN_DIR
  VEOCRAFT_MODEL_DIR=$MODEL_DIR

This script downloads weights only. It does not install CUDA/PyTorch or prove that
your GPU can run inference. Follow the official Wan2.2 installation instructions.
EOF
