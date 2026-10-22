import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [language, setLanguage] = useState("ar");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [ratio, setRatio] = useState("9:16");
  const [duration, setDuration] = useState("5");
  const [quality, setQuality] = useState("720p");
  const [imageName, setImageName] = useState("");
  const [notice, setNotice] = useState("");
  const isArabic = language === "ar";

  const copy = isArabic ? {
    workspace: "مساحة العمل", create: "إنشاء فيديو", library: "مكتبتي", models: "محركات التوليد",
    settings: "الإعدادات", badge: "استوديو إبداعي مفتوح المصدر", title: "حوّل فكرتك إلى مشهد",
    subtitle: "اكتب وصفًا واضحًا، واضبط شكل الفيديو، وجهّز مشروعك للتوليد بمحركات مفتوحة الأوزان.",
    textMode: "نص إلى فيديو", imageMode: "صورة إلى فيديو", prompt: "وصف المشهد",
    placeholder: "مثال: مدينة مستقبلية في القاهرة وقت الغروب، حركة كاميرا سينمائية ناعمة، إضاءة ذهبية وتفاصيل واقعية...",
    hint: "كلما كان الوصف أدق، كان توجيه النموذج أوضح.", upload: "أضف صورة مرجعية",
    uploadHint: "PNG أو JPG — ستُستخدم كمرجع بصري عند ربط محرك التوليد", ratio: "أبعاد الفيديو",
    duration: "المدة", quality: "الدقة المستهدفة", generate: "تجهيز عملية التوليد",
    preview: "معاينة الفيديو", previewSub: "ستظهر النتيجة هنا بعد اكتمال التوليد الفعلي",
    waiting: "بانتظار وصفك", waitingSub: "ابدأ بكتابة فكرة المشهد في المربع المجاور",
    status: "حالة المشروع", statusText: "واجهة أولية قيد التطوير", runtime: "محرك التوليد",
    runtimeText: "لم يتم ربط نموذج بعد", cost: "التكلفة المستهدفة", costText: "مجاني قدر الإمكان",
    note: "شفافية مهمة", noteText: "هذه النسخة تجهّز واجهة المشروع فقط. لن نعرض فيديو وهميًا أو ندّعي نجاح التوليد قبل تشغيل نموذج حقيقي والتحقق من الناتج.",
    sample: "جرّب فكرة", samplePrompt: "لقطة سينمائية لطائرة ورقية تحلّق فوق نهر النيل عند الشروق، انعكاسات ذهبية على الماء، حركة كاميرا بطيئة وواقعية.",
    engineTag: "OPEN-WEIGHTS FIRST", project: "مشروع جديد", mobile: "جاهز للويب — تصميم متجاوب للموبايل"
  } : {
    workspace: "Workspace", create: "Create video", library: "My library", models: "Generation engines",
    settings: "Settings", badge: "Open-source creative studio", title: "Turn an idea into a scene",
    subtitle: "Describe your scene, choose a format, and prepare your project for open-weight video models.",
    textMode: "Text to video", imageMode: "Image to video", prompt: "Scene prompt",
    placeholder: "Example: A futuristic city in Cairo at sunset, smooth cinematic camera movement, golden light and realistic details...",
    hint: "Specific prompts give the model clearer direction.", upload: "Add a reference image",
    uploadHint: "PNG or JPG — used as a visual reference once a generation engine is connected", ratio: "Aspect ratio",
    duration: "Duration", quality: "Target resolution", generate: "Prepare generation",
    preview: "Video preview", previewSub: "Your result will appear here after real generation completes",
    waiting: "Waiting for your prompt", waitingSub: "Describe a scene to get your project ready",
    status: "Project status", statusText: "Early interface build", runtime: "Generation engine",
    runtimeText: "No model connected yet", cost: "Cost target", costText: "Free where possible",
    note: "Transparency note", noteText: "This build prepares the interface only. It will not show a fake video or claim generation succeeded before a real model has run and its output has been checked.",
    sample: "Try an idea", samplePrompt: "A cinematic shot of a kite flying over the Nile at sunrise, golden reflections on the water, slow realistic camera movement.",
    engineTag: "OPEN-WEIGHTS FIRST", project: "New project", mobile: "Web-ready — responsive mobile layout"
  };

  function submit(e) {
    e.preventDefault();
    if (!prompt.trim()) {
      setNotice(isArabic ? "اكتب وصف المشهد أولًا." : "Please enter a scene prompt first.");
      return;
    }
    setNotice(isArabic
      ? "تم تجهيز إعدادات المشروع محليًا. محرك التوليد الحقيقي لم يُربط بعد، لذلك لم يتم إنشاء فيديو."
      : "Project settings are prepared locally. The real generation engine is not connected yet, so no video has been generated.");
  }

  return (
    <div className={isArabic ? "app" : "app english"} dir={isArabic ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="VeoCraft AI home">
          <span className="brand-mark"><span>V</span><i /></span>
          <span className="brand-name">VeoCraft <b>AI</b><small>CREATIVE LAB</small></span>
        </a>
        <button className="new-project" onClick={() => {setPrompt(""); setNotice("");}}>
          <span>＋</span> {copy.project}
        </button>
        <div className="nav-label">{copy.workspace}</div>
        <nav>
          <a className="nav-item active" href="#create"><span>✦</span>{copy.create}</a>
          <a className="nav-item" href="#library" onClick={e => {e.preventDefault();setNotice(isArabic ? "المكتبة ستُفعّل عند إضافة حفظ المشاريع." : "Library will be enabled when project saving is added.");}}><span>▧</span>{copy.library}</a>
          <a className="nav-item" href="#models" onClick={e => {e.preventDefault();setNotice(isArabic ? "نراجع النماذج والترخيص ومتطلبات التشغيل قبل ربط أي محرك." : "Models, licenses and hardware requirements are being reviewed before connecting an engine.");}}><span>◈</span>{copy.models}</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="engine-card"><div className="engine-orb">✳</div><div><strong>{copy.engineTag}</strong><small>{copy.runtimeText}</small></div><span className="status-dot" /></div>
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
              <button type="button" className={mode === "text" ? "mode active" : "mode"} onClick={() => {setMode("text");setNotice("");}}><span>✧</span>{copy.textMode}</button>
              <button type="button" className={mode === "image" ? "mode active" : "mode"} onClick={() => {setMode("image");setNotice("");}}><span>▧</span>{copy.imageMode}</button>
            </div>
            {mode === "image" && <label className="upload-box"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setImageName(e.target.files?.[0]?.name || "")} /><span className="upload-icon">＋</span><strong>{imageName || copy.upload}</strong><small>{copy.uploadHint}</small></label>}
            <label className="field-label" htmlFor="prompt">{copy.prompt}<span className="required">●</span></label>
            <textarea id="prompt" value={prompt} onChange={e => {setPrompt(e.target.value);setNotice("");}} placeholder={copy.placeholder} maxLength={2000} rows={6} />
            <div className="textarea-footer"><span>{copy.hint}</span><span>{prompt.length}/2000</span></div>
            <button type="button" className="sample-btn" onClick={() => {setPrompt(copy.samplePrompt);setNotice("");}}>✦ {copy.sample}</button>
            <div className="section-divider" />
            <div className="panel-heading compact"><div><span className="step">02</span><h2>{isArabic ? "إعدادات الفيديو" : "Video settings"}</h2></div></div>
            <div className="settings-grid">
              <label className="setting"><span>{copy.ratio}</span><select value={ratio} onChange={e => setRatio(e.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option><option>4:3</option></select><small>{ratio === "9:16" ? (isArabic ? "عمودي · Shorts / Reels" : "Portrait · Shorts / Reels") : ratio === "16:9" ? (isArabic ? "أفقي · YouTube" : "Landscape · YouTube") : (isArabic ? "تنسيق متعدد الاستخدامات" : "Flexible format")}</small></label>
              <label className="setting"><span>{copy.duration}</span><select value={duration} onChange={e => setDuration(e.target.value)}><option value="5">5 {isArabic ? "ثوانٍ" : "seconds"}</option><option value="8">8 {isArabic ? "ثوانٍ" : "seconds"}</option><option value="10">10 {isArabic ? "ثوانٍ" : "seconds"}</option><option value="15">15 {isArabic ? "ثانية" : "seconds"}</option></select><small>{isArabic ? "المدة الفعلية تعتمد على النموذج" : "Actual duration depends on the model"}</small></label>
              <label className="setting full"><span>{copy.quality}</span><select value={quality} onChange={e => setQuality(e.target.value)}><option>480p</option><option>720p</option><option>1080p</option></select><small>{isArabic ? "خيارات الدقة ستتحدد حسب قدرة محرك التوليد." : "Available resolution will depend on the generation engine."}</small></label>
            </div>
            <button className="generate-btn" type="submit"><span>✦</span>{copy.generate}<b>↗</b></button>
            {notice && <div className="notice" role="status"><span>ⓘ</span><p>{notice}</p></div>}
          </form>

          <section className="panel preview-panel">
            <div className="panel-heading"><div><span className="step">03</span><h2>{copy.preview}</h2></div><span className="preview-pill"><i /> {isArabic ? "معاينة" : "Preview"}</span></div>
            <div className={"preview-stage ratio-" + ratio.replace(":","x")}>
              <div className="preview-grid" /><div className="preview-glow glow-a" /><div className="preview-glow glow-b" />
              <div className="preview-placeholder"><div className="play-symbol"><span>▶</span></div><strong>{copy.waiting}</strong><p>{copy.waitingSub}</p><div className="preview-lines"><i /><i /><i /></div></div>
              <div className="stage-corner top-left" /><div className="stage-corner top-right" /><div className="stage-corner bottom-left" /><div className="stage-corner bottom-right" />
              <span className="stage-ratio">{ratio}</span>
            </div>
            <p className="preview-caption">{copy.previewSub}</p>
            <div className="preview-meta"><div><span>{isArabic ? "النمط" : "Mode"}</span><strong>{mode === "text" ? copy.textMode : copy.imageMode}</strong></div><div><span>{isArabic ? "المدة" : "Duration"}</span><strong>{duration}s</strong></div><div><span>{isArabic ? "الدقة" : "Resolution"}</span><strong>{quality}</strong></div></div>
            <div className="transparency"><div className="transparency-icon">✓</div><div><strong>{copy.note}</strong><p>{copy.noteText}</p></div></div>
          </section>
        </div>

        <section className="status-strip"><div className="status-item"><span className="status-icon">◌</span><div><small>{copy.status}</small><strong>{copy.statusText}</strong></div></div><div className="status-item"><span className="status-icon">✳</span><div><small>{copy.runtime}</small><strong>{copy.runtimeText}</strong></div></div><div className="status-item"><span className="status-icon">◇</span><div><small>{copy.cost}</small><strong>{copy.costText}</strong></div></div><div className="version">V 0.1.0 <span>•</span> FOUNDATION</div></section>
        <footer>VeoCraft AI <span>·</span> {isArabic ? "مصنوع لبناء أدوات إبداعية مفتوحة" : "Built for open creative tools"}</footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
