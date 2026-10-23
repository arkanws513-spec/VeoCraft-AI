"""Hugging Face ZeroGPU prototype for official Wan2.2 TI2V-5B.

This is a best-effort demo scaffold, not a verified production deployment.
Free ZeroGPU quotas and long video-generation times can prevent a request from
finishing. The official CLI is invoked rather than a paid inference provider.
"""
from __future__ import annotations

import os
import subprocess
import sys
import threading
import uuid
from pathlib import Path

import gradio as gr
import spaces
from huggingface_hub import snapshot_download

WAN_REPO = Path(os.getenv("WAN_REPO_DIR", "/tmp/Wan2.2"))
MODEL_DIR = Path(os.getenv("WAN_MODEL_DIR", "/tmp/Wan2.2-TI2V-5B"))
OUTPUT_DIR = Path("/tmp/veocraft-output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PREPARE_LOCK = threading.Lock()
GENERATION_LOCK = threading.Lock()
_READY = False


def prepare_runtime() -> None:
    """Fetch official inference code and weights once per Space container."""
    global _READY
    if _READY:
        return
    with PREPARE_LOCK:
        if _READY:
            return
        if not (WAN_REPO / "generate.py").is_file():
            subprocess.run(
                ["git", "clone", "--depth", "1", "https://github.com/Wan-Video/Wan2.2.git", str(WAN_REPO)],
                check=True,
                timeout=600,
            )
        if not (MODEL_DIR / "config.json").is_file():
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            snapshot_download(
                repo_id="Wan-AI/Wan2.2-TI2V-5B",
                local_dir=str(MODEL_DIR),
                resume_download=True,
            )
        _READY = True


@spaces.GPU(duration=300)
def _generate_video_on_gpu(prompt: str, reference_image: str | None) -> str:
    output = OUTPUT_DIR / f"{uuid.uuid4().hex}.mp4"
        # Five-second baseline: 121 frames at 24 fps. Free ZeroGPU quota may
        # be insufficient; this is intentionally not advertised as guaranteed.
        command = [
            sys.executable, str(WAN_REPO / "generate.py"),
            "--task", "ti2v-5B",
            "--size", "704*1280",
            "--ckpt_dir", str(MODEL_DIR),
            "--offload_model", "True",
            "--convert_model_dtype",
            "--t5_cpu",
            "--frame_num", "121",
            "--prompt", prompt,
            "--save_file", str(output),
        ]
        if reference_image:
            command.extend(["--image", reference_image])
        env = os.environ.copy()
        env.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")
        result = subprocess.run(
            command,
            cwd=str(WAN_REPO),
            env=env,
            capture_output=True,
            text=True,
            timeout=280,
            check=False,
        )
        if result.returncode != 0:
            details = (result.stderr or result.stdout or "Wan2.2 generation failed")[-2500:]
            raise gr.Error("تعذر التوليد على الاستضافة المجانية. قد تكون الحصة أو الذاكرة غير كافية.\n" + details)
        if not output.is_file() or output.stat().st_size < 1024:
            raise gr.Error("لم يُنتج المحرك ملف فيديو صالحًا.")
        with output.open("rb") as video:
            if b"ftyp" not in video.read(32):
                raise gr.Error("خرج المحرك ليس ملف MP4 صالحًا.")
        return str(output)
    except subprocess.TimeoutExpired as exc:
        raise gr.Error("انتهت مهلة التوليد؛ حصة ZeroGPU المجانية قد لا تكفي لهذا الطلب.") from exc


def generate_video(prompt: str, reference_image: str | None) -> str:
    prompt = (prompt or "").strip()
    if not prompt:
        raise gr.Error("اكتب وصفًا للفيديو أولًا / Enter a video prompt first.")
    if not GENERATION_LOCK.acquire(blocking=False):
        raise gr.Error("هناك عملية توليد أخرى قيد التنفيذ. حاول لاحقًا.")
    try:
        # Downloading code/weights happens before the GPU allocation so that
        # network transfer does not consume the small ZeroGPU execution quota.
        prepare_runtime()
        return _generate_video_on_gpu(prompt, reference_image)
    except subprocess.CalledProcessError as exc:
        raise gr.Error(f"تعذر تجهيز محرك Wan2.2: {exc}") from exc
    finally:
        GENERATION_LOCK.release()


with gr.Blocks(title="VeoCraft AI · Wan2.2") as demo:
    gr.Markdown(
        "# VeoCraft AI · Wan2.2\n"
        "نموذج تجريبي مجاني محدود الحصة — ليس استضافة إنتاجية.\n\n"
        "Free ZeroGPU prototype. The model is downloaded from its official Hugging Face repository."
    )
    prompt = gr.Textbox(
        label="وصف الفيديو / Video prompt",
        placeholder="A cinematic shot of a tiny boat crossing a misty lake at sunrise",
        lines=4,
        max_lines=8,
    )
    image = gr.Image(label="صورة مرجعية اختيارية / Optional reference image", type="filepath")
    run = gr.Button("إنشاء فيديو / Generate video", variant="primary")
    result = gr.Video(label="النتيجة / Result")
    run.click(generate_video, inputs=[prompt, image], outputs=[result], api_name="generate_video")
    gr.Markdown(
        "⚠️ الحصة المجانية الحالية لـ ZeroGPU محدودة (نحو 5 دقائق GPU يوميًا للحساب المجاني)، "
        "وقد لا تكفي لتوليد فيديو كامل. لا تضع أسرارًا أو بيانات شخصية في المطالبات."
    )

if __name__ == "__main__":
    demo.queue(max_size=1).launch()
