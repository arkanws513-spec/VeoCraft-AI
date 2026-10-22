import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "")).replace(/\/$/, "");

function App() {
  const [language, setLanguage] = useState("ar");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [ratio, setRatio] = useState("9:16");
  const [duration, setDuration] = useState("5");
  const [quality, setQuality] = useState("720p");
  const [imageName, setImageName] = useState("");
  const [imageToken, setImageToken] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");
  const [engineState, setEngineState] = useState("checking");
  const isArabic = language === "ar";
  const engineStatusText = engineState === "ready"
    ? (isArabic ? "المحرك مُهيّأ محليًا" : "Local runtime configured")
    : engineState === "checking"
      ? (isArabic ? "جارٍ فحص اتصال المحرك..." : "Checking engine connection...")
      : (isArabic ? "خادم التوليد غير مربوط بعد" : "Generation API is not connected yet");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    let active = true;
    if (!API_BASE) { setEngineState("missing"); return () => { active = false; }; }
    fetch(API_BASE + "/api/engine")
      .then(response => response.ok ? response.json() : Promise.reject(new Error("API unavailable")))
      .then(data => { if (active) setEngineState(data.configured ? "ready" : "missing"); })
      .catch(() => { if (active) setEngineState("offline"); });
    return () => { active = false; };
  }, []);

  const copy = isArabic ? {
    workspace: "مساحة العمل", create: "إنشاء فيديو", library: "مكتبتي", models: "محركات التوليد",
    settings: "الإعدادات", badge: "استوديو إبداعي مفتوح المصدر", title: "حوّل فكرتك إلى مشهد",
    subtitle: "اكتب وصفًا واضحًا، واضبط شكل الفيديو، وجهّز مشروعك للتوليد بمحركات مفتوحة الأوزان.",
    textMode: "نص إلى فيديو", imageMode: "صورة إلى فيديو", prompt: "وصف المشهد",
    placeholder: "مثال: مدينة مستقبلية في القاهرة وقت الغروب، حركة كاميرا سينمائية ناعمة، إضاءة ذهبية وتفاصيل واقعية...",
    hint: "كلما كان الوصف أدق، كان توجيه النموذج أوضح.", upload: "أضف صورة مرجعية",
    uploadHint: "PNG أو JPG أو WebP حتى 12 ميجابايت — تُرفع إلى خادم التوليد المحلي", ratio: "أبعاد الفيديو",
    duration: "المدة", quality: "الدقة المستهدفة", generate: "إنشاء الفيديو",
    preview: "معاينة الفيديو", previewSub: "ستظهر النتيجة هنا بعد اكتمال التوليد الفعلي",
    waiting: "بانتظار وصفك", waitingSub: "ابدأ بكتابة فكرة المشهد في المربع المجاور",
    status: "حالة المشروع", statusText: "واجهة متصلة بمحرك محلي عند توفره", runtime: "محرك التوليد",
    runtimeText: "لم يتم ربط نموذج بعد", cost: "التكلفة المستهدفة", costText: "مجاني قدر الإمكان",
    note: "شفافية مهمة", noteText: "يتطلب التوليد اتصال API محليًا بنموذج Wan2.2 وأوزانه وGPU مناسب. لن نعرض فيديو وهميًا؛ سيظهر الناتج بعد إنشاء ملف MP4 حقيقي.",
    sample: "جرّب فكرة", samplePrompt: "لقطة سينمائية لطائرة ورقية تحلّق فوق نهر النيل عند الشروق، انعكاسات ذهبية على الماء، حركة كاميرا بطيئة وواقعية.",
    engineTag: "OPEN-WEIGHTS FIRST", project: "مشروع جديد", mobile: "جاهز للويب — تصميم متجاوب للموبايل"
  } : {
    workspace: "Workspace", create: "Create video", library: "My library", models: "Generation engines",
    settings: "Settings", badge: "Open-source creative studio", title: "Turn an idea into a scene",
    subtitle: "Describe your scene, choose a format, and prepare your project for open-weight video models.",
    textMode: "Text to video", imageMode: "Image to video", prompt: "Scene prompt",
    placeholder: "Example: A futuristic city in Cairo at sunset, smooth cinematic camera movement, golden light and realistic details...",
    hint: "Specific prompts give the model clearer direction.", upload: "Add a reference image",
    uploadHint: "PNG, JPG, or WebP up to 12 MB — uploaded to your local generation API", ratio: "Aspect ratio",
    duration: "Duration", quality: "Target resolution", generate: "Generate video",
    preview: "Video preview", previewSub: "Your result will appear here after real generation completes",
    waiting: "Waiting for your prompt", waitingSub: "Describe a scene to get your project ready",
    status: "Project status", statusText: "Studio connected to a local runtime when available", runtime: "Generation engine",
    runtimeText: "No model connected yet", cost: "Cost target", costText: "Free where possible",
    note: "Transparency note", noteText: "Generation requires a local API connected to Wan2.2 weights and a suitable GPU. No fake video is shown; a result appears only after a real MP4 is created.",
    sample: "Try an idea", samplePrompt: "A cinematic shot of a kite flying over the Nile at sunrise, golden reflections on the water, slow realistic camera movement.",
    engineTag: "OPEN-WEIGHTS FIRST", project: "New project", mobile: "Web-ready — responsive mobile layout"
  };

  async function submit(e) {
    e.preventDefault();
    if (!prompt.trim()) {
      setNotice(isArabic ? "اكتب وصف المشهد أولًا." : "Please enter a scene prompt first.");
      return;
    }
    if (mode === "image" && !imageToken) {
      setNotice(isArabic ? "ارفع صورة مرجعية وانتظر اكتمال رفعها أولًا." : "Upload a reference image and wait for the upload to finish first.");
      return;
    }
    if (!API_BASE) {
      setNotice(isArabic
        ? "واجهة التطبيق منشورة، لكن خادم التوليد لم يُنشر أو يُربط بعد. يلزم تشغيل API على خادم يدعم النموذج ثم ضبط VITE_API_BASE_URL."
        : "The studio UI is published, but the generation API is not deployed or connected yet. Host the model API and set VITE_API_BASE_URL.");
      return;
    }
    setBusy(true);
    setGeneratedVideo("");
    setGenerationStatus(isArabic ? "جارٍ إرسال الطلب..." : "Submitting request...");
    setNotice("");
    try {
      const response = await fetch(API_BASE + "/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(), mode, aspect_ratio: ratio,
          duration_seconds: Number(duration), resolution: quality,
          image_reference: mode === "image" ? imageToken : null
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail?.message || data?.detail || (isArabic ? "تعذر بدء التوليد." : "Could not start generation."));
      const jobId = data.id;
      for (let attempt = 0; attempt < 720; attempt++) {
        const statusResponse = await fetch(API_BASE + "/api/jobs/" + encodeURIComponent(jobId));
        const statusData = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(statusData?.detail?.message || "Job status unavailable");
        setGenerationStatus(statusData.message || statusData.status);
        if (statusData.status === "completed" && statusData.video_url) {
          setGeneratedVideo(API_BASE + statusData.video_url);
          setNotice(isArabic ? "اكتمل التوليد وتم التحقق من وجود ملف الفيديو." : "Generation completed and the video file was verified.");
          setBusy(false);
          return;
        }
        if (statusData.status === "failed") throw new Error(statusData.message || "Generation failed");
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
      throw new Error(isArabic ? "انتهت مهلة انتظار الحالة. تحقق من الخادم." : "Status polling timed out. Check the server.");
    } catch (error) {
      setNotice((isArabic ? "لم يكتمل التوليد: " : "Generation failed: ") + (error?.message || "Unknown error"));
      setGenerationStatus(isArabic ? "فشل" : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadReference(file) {
    setImageName(file?.name || "");
    setImageToken("");
    setNotice("");
    if (!file) return;
    if (!API_BASE) {
      setNotice(isArabic ? "خادم رفع الصور غير مربوط بعد." : "The image-upload API is not connected yet.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(API_BASE + "/api/upload-image", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail?.message || "Image upload failed");
      setImageToken(data.image_reference);
      setNotice(isArabic ? "تم رفع الصورة المرجعية بنجاح." : "Reference image uploaded successfully.");
    } catch (error) {
      setImageName("");
      setNotice((isArabic ? "فشل رفع الصورة: " : "Image upload failed: ") + (error?.message || "Unknown error"));
    }
  }

  return (
    <div className={isArabic ? "app" : "app english"} dir={isArabic ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="VeoCraft AI home">
          <span className="brand-mark"><span>V</span><i /></span>
          <span className="brand-name">VeoCraft <b>AI</b><small>CREATIVE LAB</small></span>
        </a>
        <button className="new-project" onClick={() => {setPrompt(""); setNotice(""); setGeneratedVideo(""); setGenerationStatus(""); setImageToken(""); setImageName("");}}>
          <span>＋</span> {copy.project}
        </button>
        <div className="nav-label">{copy.workspace}</div>
        <nav>
          <a className="nav-item active" href="#create"><span>✦</span>{copy.create}</a>
          <a className="nav-item" href="#library" onClick={e => {e.preventDefault();setNotice(isArabic ? "المكتبة ستُفعّل عند إضافة حفظ المشاريع." : "Library will be enabled when project saving is added.");}}><span>▧</span>{copy.library}</a>
          <a className="nav-item" href="#models" onClick={e => {e.preventDefault();setNotice(isArabic ? "نراجع النماذج والترخيص ومتطلبات التشغيل قبل ربط أي محرك." : "Models, licenses and hardware requirements are being reviewed before connecting an engine.");}}><span>◈</span>{copy.models}</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="engine-card"><div className="engine-orb">✳</div><div><strong>{copy.engineTag}</strong><small>{engineStatusText}</small></div><span className="status-dot" /></div>
          <a className="nav-item muted" href="#settings" onClick={e => {e.preventDefault();setNotice(isArabic ? "الإعدادات ستُضاف لاحقًا." : "Settings will be added later.");}}><span>⚙</span>{copy.settings}</a>
          <div className="profile"><div className="avatar">VC</div><div><strong>VeoCraft Studio</strong><small>{copy.mobile}</small></div><span className="more">•••</span></div>
        </div>
      </aside>

      <main className="main" id="create">
        <header className="topbar">
          <div className="breadcrumbs"><span>VeoCraft AI</span><i>/</i><strong>{copy.create}</strong></div>
          <div className="top-actions"><span className="save-state"><i /> {isArabic ? "محلي · غير محفوظ" : "Local · Not saved"}</span><button className="lang-btn" onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>{language === "ar" ? "EN" : "عربي"} ⇄</button><div className="top-avatar">VC</div></div>
        </header>

        <section className="hero">
          <div className="hero-copy"><div className="eyebrow"><span className="spark">✦</span>{copy.badge}</div><h1>{copy.title}<span>.</span></h1><p>{copy.subtitle}</p></div>
          <div className="hero-art" aria-hidden="true"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-core">✳</div><span className="art-star star-one">✦</span><span className="art-star star-two">✧</span><span className="art-dot dot-one" /><span className="art-dot dot-two" /></div>
        </section>

        <div className="studio-grid">
          <form className="panel prompt-panel" onSubmit={submit}>
            <div className="panel-heading"><div><span className="step">01</span><h2>{isArabic ? "صِف رؤيتك" : "Describe your vision"}</h2></div><span className="optional">{isArabic ? "ابدأ من فكرتك" : "Start with an idea"}</span></div>
            <div className="mode-switch">
              <button type="button" className={mode === "text" ? "mode active" : "mode"} onClick={() => {setMode("text");setNotice("");setImageToken("");setImageName("");}}><span>✧</span>{copy.textMode}</button>
              <button type="button" className={mode === "image" ? "mode active" : "mode"} onClick={() => {setMode("image");setNotice("");setImageToken("");setImageName("");}}><span>▧</span>{copy.imageMode}</button>
            </div>
            {mode === "image" && <label className="upload-box"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => uploadReference(e.target.files?.[0])} /><span className="upload-icon">＋</span><strong>{imageName || copy.upload}</strong><small>{copy.uploadHint}</small></label>}
            <label className="field-label" htmlFor="prompt">{copy.prompt}<span className="required">●</span></label>
            <textarea id="prompt" value={prompt} onChange={e => {setPrompt(e.target.value);setNotice("");}} placeholder={copy.placeholder} maxLength={2000} rows={6} />
            <div className="textarea-footer"><span>{copy.hint}</span><span>{prompt.length}/2000</span></div>
            <button type="button" className="sample-btn" onClick={() => {setPrompt(copy.samplePrompt);setNotice("");}}>✦ {copy.sample}</button>
            <div className="section-divider" />
            <div className="panel-heading compact"><div><span className="step">02</span><h2>{isArabic ? "إعدادات الفيديو" : "Video settings"}</h2></div></div>
            <div className="settings-grid">
              <label className="setting"><span>{copy.ratio}</span><select value={ratio} onChange={e => setRatio(e.target.value)}><option>9:16</option><option>16:9</option></select><small>{ratio === "9:16" ? (isArabic ? "عمودي · Shorts / Reels" : "Portrait · Shorts / Reels") : ratio === "16:9" ? (isArabic ? "أفقي · YouTube" : "Landscape · YouTube") : (isArabic ? "تنسيق متعدد الاستخدامات" : "Flexible format")}</small></label>
              <label className="setting"><span>{copy.duration}</span><select value={duration} onChange={e => setDuration(e.target.value)}><option value="5">5 {isArabic ? "ثوانٍ" : "seconds"}</option><option value="8">8 {isArabic ? "ثوانٍ" : "seconds"}</option><option value="10">10 {isArabic ? "ثوانٍ" : "seconds"}</option><option value="15">15 {isArabic ? "ثانية" : "seconds"}</option></select><small>{isArabic ? "المدة الفعلية تعتمد على النموذج" : "Actual duration depends on the model"}</small></label>
              <label className="setting full"><span>{copy.quality}</span><select value={quality} onChange={e => setQuality(e.target.value)}><option>720p</option></select><small>{isArabic ? "خيارات الدقة ستتحدد حسب قدرة محرك التوليد." : "Available resolution will depend on the generation engine."}</small></label>
            </div>
            <button className="generate-btn" type="submit" disabled={busy}><span>✦</span>{busy ? (isArabic ? "جارٍ التوليد..." : "Generating...") : copy.generate}<b>{busy ? "…" : "↗"}</b></button>
            {notice && <div className="notice" role="status"><span>ⓘ</span><p>{notice}</p></div>}
          </form>

          <section className="panel preview-panel">
            <div className="panel-heading"><div><span className="step">03</span><h2>{copy.preview}</h2></div><span className="preview-pill"><i /> {isArabic ? "معاينة" : "Preview"}</span></div>
            <div className={"preview-stage ratio-" + ratio.replace(":","x")}>
              {generatedVideo ? <video className="generated-video" controls playsInline src={generatedVideo} /> : <><div className="preview-grid" /><div className="preview-glow glow-a" /><div className="preview-glow glow-b" />
              <div className="preview-placeholder"><div className="play-symbol"><span>▶</span></div><strong>{copy.waiting}</strong><p>{copy.waitingSub}</p><div className="preview-lines"><i /><i /><i /></div></div>
              <div className="stage-corner top-left" /><div className="stage-corner top-right" /><div className="stage-corner bottom-left" /><div className="stage-corner bottom-right" />
              <span className="stage-ratio">{ratio}</span></>}
            </div>
            <p className="preview-caption">{generatedVideo ? (isArabic ? "الفيديو جاهز للتشغيل والتنزيل من مشغل الفيديو." : "Your generated video is ready to play and download from the player.") : (generationStatus || copy.previewSub)}</p>
            {generatedVideo && <a className="download-video" href={generatedVideo} download="veocraft-video.mp4">{isArabic ? "تنزيل الفيديو MP4 ↓" : "Download MP4 ↓"}</a>}
            <div className="preview-meta"><div><span>{isArabic ? "النمط" : "Mode"}</span><strong>{mode === "text" ? copy.textMode : copy.imageMode}</strong></div><div><span>{isArabic ? "المدة" : "Duration"}</span><strong>{duration}s</strong></div><div><span>{isArabic ? "الدقة" : "Resolution"}</span><strong>{quality}</strong></div></div>
            <div className="transparency"><div className="transparency-icon">✓</div><div><strong>{copy.note}</strong><p>{copy.noteText}</p></div></div>
          </section>
        </div>

        <section className="status-strip"><div className="status-item"><span className="status-icon">◌</span><div><small>{copy.status}</small><strong>{copy.statusText}</strong></div></div><div className="status-item"><span className="status-icon">✳</span><div><small>{copy.runtime}</small><strong>{engineStatusText}</strong></div></div><div className="status-item"><span className="status-icon">◇</span><div><small>{copy.cost}</small><strong>{copy.costText}</strong></div></div><div className="version">V 0.2.0 <span>•</span> LOCAL INFERENCE</div></section>
        <footer>VeoCraft AI <span>·</span> {isArabic ? "مصنوع لبناء أدوات إبداعية مفتوحة" : "Built for open creative tools"}</footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
