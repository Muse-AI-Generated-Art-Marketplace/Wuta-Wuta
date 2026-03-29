import { useState, useRef } from "react";
import { useTransactionNotificationStore } from "../store/transactionNotificationStore";

// ─── Inline styles via a style tag injected into the component ────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

  :root {
    --bg: #0b0c10;
    --surface: #13141a;
    --surface2: #1c1e27;
    --border: #2a2d3a;
    --accent: #c8f135;
    --accent2: #7b61ff;
    --text: #eef0f7;
    --muted: #6b6f85;
    --error: #ff5f5f;
    --success: #4ade80;
    --radius: 14px;
  }

  .minter-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .minter-root {
    font-family: 'Syne', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    color: var(--text);
  }

  .minter-card {
    width: 100%;
    max-width: 780px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 0 80px 0 rgba(200,241,53,0.05), 0 32px 64px rgba(0,0,0,0.6);
  }

  /* ── Header ── */
  .minter-header {
    padding: 32px 40px 24px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(135deg, #13141a 0%, #161822 100%);
    position: relative;
    overflow: hidden;
  }
  .minter-header::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(200,241,53,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .minter-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 6px;
  }
  .minter-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text);
  }
  .minter-subtitle {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
    font-weight: 400;
  }

  /* ── Stepper track ── */
  .stepper-track {
    display: flex;
    align-items: center;
    padding: 28px 40px 0;
    gap: 0;
  }
  .step-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: default;
    flex: 0 0 auto;
  }
  .step-bubble {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Mono', monospace;
    color: var(--muted);
    background: var(--surface2);
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
  }
  .step-bubble.active {
    border-color: var(--accent);
    color: var(--bg);
    background: var(--accent);
    box-shadow: 0 0 20px rgba(200,241,53,0.4);
  }
  .step-bubble.done {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--bg);
  }
  .step-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
    transition: color 0.3s;
  }
  .step-label.active { color: var(--accent); }
  .step-label.done { color: var(--text); }

  .step-connector {
    flex: 1;
    height: 2px;
    background: var(--border);
    margin: 0 6px;
    margin-bottom: 22px;
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }
  .step-connector-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.5s ease;
    border-radius: 2px;
  }

  /* ── Body ── */
  .minter-body {
    padding: 32px 40px;
    min-height: 340px;
  }

  .step-panel { animation: fadeSlide 0.35s ease both; }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .panel-heading {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .panel-desc {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 28px;
  }

  /* ── Form controls ── */
  .field-group { margin-bottom: 20px; }
  .field-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .field-input, .field-textarea, .field-select {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
  }
  .field-input:focus, .field-textarea:focus, .field-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,241,53,0.12);
  }
  .field-input.error, .field-textarea.error, .field-select.error {
    border-color: var(--error);
  }
  .field-textarea { resize: vertical; min-height: 90px; }
  .field-error {
    font-size: 11px;
    color: var(--error);
    margin-top: 5px;
    font-family: 'DM Mono', monospace;
  }
  .field-hint {
    font-size: 11px;
    color: var(--muted);
    margin-top: 5px;
    font-family: 'DM Mono', monospace;
  }

  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width:520px){ .field-row { grid-template-columns: 1fr; } }

  /* ── Upload zone ── */
  .upload-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 40px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: var(--surface2);
    position: relative;
    overflow: hidden;
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--accent);
    background: rgba(200,241,53,0.04);
  }
  .upload-zone.has-file {
    border-style: solid;
    border-color: var(--accent2);
    background: rgba(123,97,255,0.06);
  }
  .upload-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .upload-label { font-size: 14px; font-weight: 600; }
  .upload-sublabel { font-size: 12px; color: var(--muted); text-align: center; }
  .upload-preview {
    width: 100%;
    max-height: 180px;
    object-fit: contain;
    border-radius: 8px;
    margin-top: 8px;
  }

  /* ── AI Model chips ── */
  .model-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
    margin-top: 4px;
  }
  .model-chip {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface2);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .model-chip:hover { border-color: var(--accent2); background: rgba(123,97,255,0.08); }
  .model-chip.selected { border-color: var(--accent); background: rgba(200,241,53,0.08); }
  .model-chip-icon { font-size: 20px; }
  .model-chip-name { font-size: 12px; font-weight: 700; }
  .model-chip-tag {
    font-size: 10px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
  }

  /* ── Toggle row ── */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 12px;
  }
  .toggle-info { flex: 1; }
  .toggle-title { font-size: 13px; font-weight: 600; }
  .toggle-desc { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: 'DM Mono', monospace; }
  .toggle-switch {
    width: 42px; height: 24px;
    background: var(--border);
    border-radius: 99px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
    margin-left: 16px;
    border: none;
    outline: none;
  }
  .toggle-switch.on { background: var(--accent); }
  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: var(--bg);
    transition: transform 0.2s;
  }
  .toggle-switch.on::after { transform: translateX(18px); }

  /* ── Review card ── */
  .review-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 12px;
  }
  .review-section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 12px;
    font-family: 'DM Mono', monospace;
  }
  .review-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
  }
  .review-row:last-child { border-bottom: none; }
  .review-key { font-size: 12px; color: var(--muted); font-family: 'DM Mono', monospace; }
  .review-val { font-size: 12px; font-weight: 600; text-align: right; }

  .fee-breakdown {
    background: rgba(200,241,53,0.04);
    border: 1px solid rgba(200,241,53,0.2);
    border-radius: var(--radius);
    padding: 16px 20px;
    margin-bottom: 16px;
  }
  .fee-total { font-size: 18px; font-weight: 800; color: var(--accent); }
  .fee-label { font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; }

  /* ── Success screen ── */
  .success-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 20px 0;
    text-align: center;
    animation: fadeSlide 0.4s ease both;
  }
  .success-ring {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(74,222,128,0.1);
    border: 2px solid var(--success);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes popIn {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  .success-title { font-size: 22px; font-weight: 800; }
  .success-sub { font-size: 13px; color: var(--muted); max-width: 360px; }
  .tx-hash {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 14px;
    color: var(--accent2);
    letter-spacing: 0.05em;
    word-break: break-all;
    text-align: center;
  }

  /* ── Footer / nav ── */
  .minter-footer {
    padding: 20px 40px 28px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: 10px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.2s;
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .btn-ghost:hover { border-color: var(--text); color: var(--text); }
  .btn-primary {
    background: var(--accent);
    color: var(--bg);
  }
  .btn-primary:hover { background: #d8ff45; box-shadow: 0 0 24px rgba(200,241,53,0.35); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
  .btn-danger {
    background: transparent;
    border: 1px solid var(--error);
    color: var(--error);
  }

  .progress-bar-wrap {
    flex: 1;
    height: 3px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
    margin: 0 8px;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 99px;
    transition: width 0.4s ease;
  }
  .step-counter {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
  }
`;

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Artwork" },
  { id: 2, label: "Details" },
  { id: 3, label: "Config" },
  { id: 4, label: "Review" },
];

const AI_MODELS = [
  { id: "stable-diffusion", name: "Stable Diffusion", tag: "open-source", icon: "🎨" },
  { id: "dall-e", name: "DALL·E 3", tag: "openai", icon: "⚡" },
  { id: "midjourney", name: "Midjourney", tag: "discord", icon: "🌌" },
  { id: "firefly", name: "Adobe Firefly", tag: "adobe", icon: "🔥" },
];

const CATEGORIES = [
  "Abstract", "Portrait", "Landscape", "Digital Surrealism",
  "Generative Art", "Pixel Art", "Concept Art", "Photography",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function validate(step, data) {
  const errors = {};
  if (step === 1) {
    if (!data.file) errors.file = "Please upload your artwork file.";
    if (!data.aiModel) errors.aiModel = "Select the AI model used.";
  }
  if (step === 2) {
    if (!data.title.trim()) errors.title = "Title is required.";
    if (data.title.trim().length > 80) errors.title = "Max 80 characters.";
    if (!data.description.trim()) errors.description = "Description is required.";
    if (!data.category) errors.category = "Pick a category.";
  }
  if (step === 3) {
    const r = parseFloat(data.royalty);
    if (isNaN(r) || r < 0 || r > 25) errors.royalty = "Royalty must be 0–25%.";
    const p = parseFloat(data.price);
    if (isNaN(p) || p <= 0) errors.price = "Enter a valid price in ETH.";
  }
  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ArtMintingStepper() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [minting, setMinting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const [data, setData] = useState({
    file: null,
    preview: null,
    aiModel: "",
    title: "",
    description: "",
    category: "",
    tags: "",
    royalty: "10",
    price: "",
    allowEvolution: true,
    communityEditions: false,
    explicitContent: false,
  });

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  // File handling
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => set("preview", e.target.result);
    reader.readAsDataURL(file);
    set("file", file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Navigation
  const next = () => {
    const errs = validate(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (step < STEPS.length) setStep(s => s + 1);
    else handleMint();
  };

  const back = () => { setErrors({}); setStep(s => s - 1); };

  const [mintProgress, setMintProgress] = useState(0);
  const { addTransaction, updateTransactionStatus, STATUS } = useTransactionNotificationStore();

  const handleMint = async () => {
    setMinting(true);
    const txId = `mint-${Date.now()}`;
    addTransaction({
      id: txId,
      type: 'NFT Minting',
      details: { title: data.title }
    });

    try {
      // Step 1: Prepare
      setMintProgress(10);
      await new Promise(r => setTimeout(r, 800));
      
      // Step 2: Upload
      setMintProgress(33);
      await new Promise(r => setTimeout(r, 1200));
      
      // Step 3: Sign & Submit
      setMintProgress(66);
      await new Promise(r => setTimeout(r, 1500));
      
      // Step 4: Finalize
      setMintProgress(100);
      await new Promise(r => setTimeout(r, 500));

      updateTransactionStatus(txId, STATUS.CONFIRMED);
      setMinting(false);
      setSubmitted(true);
    } catch (error) {
      updateTransactionStatus(txId, STATUS.FAILED, { error: error.message });
      setErrors({ mint: error.message });
      setMinting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSubmitted(false);
    setErrors({});
    setData({
      file: null, preview: null, aiModel: "", title: "", description: "",
      category: "", tags: "", royalty: "10", price: "",
      allowEvolution: true, communityEditions: false, explicitContent: false,
    });
  };

  const connectorFill = (idx) => {
    if (step > idx + 1) return "100%";
    if (step === idx + 1) return "50%";
    return "0%";
  };

  const fakeHash = "0x3f9a1c...b72e4d88f0c1";
  const gasFee = "0.0018";
  const platformFee = "0.025";

  // ── Render panels ──
  const renderPanel = () => {
    if (minting) return (
      <div className="success-screen">
         <div className="success-ring" style={{ border: '2px solid var(--accent)', background: 'transparent' }}>
           <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
         </div>
         <div className="success-title">Minting in progress...</div>
         <div className="success-sub">
           Finalizing your artwork on the Stellar network. This usually takes a few seconds.
         </div>
         <div className="progress-bar-wrap" style={{ width: '100%', maxWidth: 300, height: 6, marginTop: 20 }}>
            <div className="progress-bar-fill" style={{ width: `${mintProgress}%`, height: '100%', transition: 'width 0.5s ease' }} />
         </div>
         <div style={{ fontFamily: 'DM Mono', fontSize: 12, marginTop: 10, color: 'var(--accent)' }}>
           {Math.round(mintProgress)}% Complete
         </div>
      </div>
    );

    if (submitted) return (
      <div className="success-screen">
        <div className="success-ring">✓</div>
        <div className="success-title">NFT Minted Successfully!</div>
        <div className="success-sub">
          Your artwork <strong>"{data.title}"</strong> has been minted as an NFT on the Muse marketplace.
        </div>
        <div className="tx-hash">TX: {fakeHash}</div>
        <div style={{ display:"flex", gap:10, marginTop:8, flexWrap:"wrap", justifyContent:"center" }}>
          <button data-testid="mint-button" className="btn btn-primary" onClick={reset}>Mint Another</button>
          <button className="btn btn-ghost">View on Marketplace</button>
        </div>
      </div>
    );

    if (step === 1) return (
      <div className="step-panel" key="s1">
        <div className="panel-heading">Upload Your AI Artwork</div>
        <div className="panel-desc">Upload the image file and specify which AI model was used to create it.</div>

        <div className="field-group">
          <label className="field-label">Artwork File *</label>
          <div
            className={`upload-zone${dragging ? " drag-over" : ""}${data.file ? " has-file" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display:"none" }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {data.preview ? (
              <>
                <img src={data.preview} className="upload-preview" alt="preview" />
                <div className="upload-sublabel">{data.file?.name} · Click to replace</div>
              </>
            ) : (
              <>
                <div className="upload-icon">🖼️</div>
                <div className="upload-label">Drop your artwork here</div>
                <div className="upload-sublabel">PNG, JPG, GIF, WEBP, SVG · Max 50MB</div>
              </>
            )}
          </div>
          {errors.file && <div className="field-error">{errors.file}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">AI Model Used *</label>
          <div className="model-grid">
            {AI_MODELS.map(m => (
              <div
                key={m.id}
                className={`model-chip${data.aiModel === m.id ? " selected" : ""}`}
                onClick={() => set("aiModel", m.id)}
              >
                <span className="model-chip-icon">{m.icon}</span>
                <div>
                  <div className="model-chip-name">{m.name}</div>
                  <div className="model-chip-tag">{m.tag}</div>
                </div>
              </div>
            ))}
          </div>
          {errors.aiModel && <div className="field-error" style={{marginTop:8}}>{errors.aiModel}</div>}
        </div>
      </div>
    );

    if (step === 2) return (
      <div className="step-panel" key="s2">
        <div className="panel-heading">Artwork Details</div>
        <div className="panel-desc">Describe your work so collectors can find and appreciate it.</div>

        <div className="field-group">
          <label className="field-label">Title *</label>
          <input
            className={`field-input${errors.title ? " error" : ""}`}
            placeholder="e.g. Neon Genesis #01"
            value={data.title}
            onChange={e => set("title", e.target.value)}
            maxLength={80}
          />
          {errors.title ? <div className="field-error">{errors.title}</div>
            : <div className="field-hint">{data.title.length}/80 characters</div>}
        </div>

        <div className="field-group">
          <label className="field-label">Description *</label>
          <textarea
            className={`field-textarea${errors.description ? " error" : ""}`}
            placeholder="Tell the story of this artwork — your process, the AI prompts used, what inspired you..."
            value={data.description}
            onChange={e => set("description", e.target.value)}
          />
          {errors.description && <div className="field-error">{errors.description}</div>}
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Category *</label>
            <select
              className={`field-select${errors.category ? " error" : ""}`}
              value={data.category}
              onChange={e => set("category", e.target.value)}
            >
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <div className="field-error">{errors.category}</div>}
          </div>
          <div className="field-group">
            <label className="field-label">Tags</label>
            <input
              className="field-input"
              placeholder="ai, surreal, neon (comma-sep)"
              value={data.tags}
              onChange={e => set("tags", e.target.value)}
            />
            <div className="field-hint">Optional — helps discoverability</div>
          </div>
        </div>
      </div>
    );

    if (step === 3) return (
      <div className="step-panel" key="s3">
        <div className="panel-heading">Mint Configuration</div>
        <div className="panel-desc">Set your pricing, royalties and collaboration permissions.</div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label">List Price (ETH) *</label>
            <input
              className={`field-input${errors.price ? " error" : ""}`}
              type="number"
              step="0.001"
              min="0"
              placeholder="0.000"
              value={data.price}
              onChange={e => set("price", e.target.value)}
            />
            {errors.price && <div className="field-error">{errors.price}</div>}
          </div>
          <div className="field-group">
            <label className="field-label">Royalty % *</label>
            <input
              className={`field-input${errors.royalty ? " error" : ""}`}
              type="number"
              min="0"
              max="25"
              step="0.5"
              placeholder="10"
              value={data.royalty}
              onChange={e => set("royalty", e.target.value)}
            />
            {errors.royalty
              ? <div className="field-error">{errors.royalty}</div>
              : <div className="field-hint">Max 25% · You earn this on resales</div>}
          </div>
        </div>

        <div style={{marginTop:4}}>
          {[
            { key:"allowEvolution", title:"Allow Artwork Evolution", desc:"Community members can submit derivative works tied to this NFT" },
            { key:"communityEditions", title:"Community Editions", desc:"Enable limited community remix editions with shared royalties" },
            { key:"explicitContent", title:"Mark as Explicit / 18+", desc:"Flag this piece as containing mature content" },
          ].map(item => (
            <div className="toggle-row" key={item.key}>
              <div className="toggle-info">
                <div className="toggle-title">{item.title}</div>
                <div className="toggle-desc">{item.desc}</div>
              </div>
              <button
                className={`toggle-switch${data[item.key] ? " on" : ""}`}
                onClick={() => set(item.key, !data[item.key])}
                aria-label={item.title}
                type="button"
              />
            </div>
          ))}
        </div>
      </div>
    );

    if (step === 4) return (
      <div className="step-panel" key="s4">
        <div className="panel-heading">Review & Mint</div>
        <div className="panel-desc">Double-check everything before committing to the blockchain.</div>

        <div className="review-card">
          <div className="review-section-title">Artwork</div>
          {[
            ["File", data.file?.name ?? "—"],
            ["AI Model", AI_MODELS.find(m=>m.id===data.aiModel)?.name ?? "—"],
            ["Title", data.title || "—"],
            ["Category", data.category || "—"],
            ["Tags", data.tags || "—"],
          ].map(([k,v]) => (
            <div className="review-row" key={k}>
              <span className="review-key">{k}</span>
              <span className="review-val">{v}</span>
            </div>
          ))}
        </div>

        <div className="review-card">
          <div className="review-section-title">Mint Config</div>
          {[
            ["List Price", `${data.price} ETH`],
            ["Royalty", `${data.royalty}%`],
            ["Allow Evolution", data.allowEvolution ? "Yes" : "No"],
            ["Community Editions", data.communityEditions ? "Enabled" : "Disabled"],
          ].map(([k,v]) => (
            <div className="review-row" key={k}>
              <span className="review-key">{k}</span>
              <span className="review-val">{v}</span>
            </div>
          ))}
        </div>

        <div className="fee-breakdown">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div className="fee-label">Estimated Gas Fee</div>
              <div className="fee-total">{gasFee} ETH</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="fee-label">Platform Fee (2.5%)</div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--muted)"}}>{platformFee} ETH</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
            ⚠ Gas fees fluctuate. Final amount confirmed at wallet signing.
          </div>
        </div>
      </div>
    );
  };

  const isLastStep = step === STEPS.length;
  const progressPct = submitted ? 100 : ((step - 1) / STEPS.length) * 100;

  return (
    <>
      <style>{STYLES}</style>
      <div className="minter-root">
        <div className="minter-card">

          {/* Header */}
          <div className="minter-header">
            <div className="minter-eyebrow">Muse Platform · NFT Minting</div>
            <div className="minter-title">Turn Your AI Art into a Blockchain Asset</div>
            <div className="minter-subtitle">
              Mint, set royalties, and list your AI-human collaborative work on the decentralized marketplace.
            </div>
          </div>

          {/* Stepper Track */}
          {!submitted && (
            <div className="stepper-track">
              {STEPS.map((s, idx) => (
                <>
                  <div className="step-node" key={s.id}>
                    <div className={`step-bubble${step === s.id ? " active" : step > s.id ? " done" : ""}`}>
                      {step > s.id ? "✓" : s.id}
                    </div>
                    <span className={`step-label${step === s.id ? " active" : step > s.id ? " done" : ""}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="step-connector" key={`conn-${idx}`}>
                      <div className="step-connector-fill" style={{ width: connectorFill(idx) }} />
                    </div>
                  )}
                </>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="minter-body">
            {renderPanel()}
          </div>

          {/* Footer */}
          {!submitted && (
            <div className="minter-footer">
              {step > 1
                ? <button className="btn btn-ghost" onClick={back}>← Back</button>
                : <span />
              }
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="step-counter">{step} / {STEPS.length}</span>
              <button
                className="btn btn-primary"
                onClick={next}
                disabled={minting}
              >
                {minting ? "Minting…" : isLastStep ? "🚀 Mint NFT" : "Continue →"}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
