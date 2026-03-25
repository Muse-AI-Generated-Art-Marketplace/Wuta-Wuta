/**
 * ArtworkUploader.jsx
 * Issue #6 — Secure Metadata Storage via IPFS/Pinata
 *
 * UI component: lets an artist pick an AI-generated artwork file,
 * fill in metadata, and pin everything to IPFS. Returns the tokenURI
 * that should be passed to the MuseNFT mint function.
 */

import React, { useState, useRef } from "react";
import { useIPFSUpload } from "../../hooks/useIPFSUpload";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateArtworkId() {
  return `muse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ArtworkUploader
 *
 * Props:
 *   onMintReady(tokenURI: string) — called when upload succeeds; parent
 *                                   can pass tokenURI straight to mint tx.
 */
export default function ArtworkUploader({ onMintReady }) {
  const fileRef = useRef(null);
  const [preview, setPreview]     = useState(null);
  const [file, setFile]           = useState(null);
  const [form, setForm]           = useState({
    name: "",
    description: "",
    artistAddress: "",
    aiModel: "Stable Diffusion",
  });

  const { upload, uploading, result, error, verified, step } = useIPFSUpload();

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleFileChange(e) {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return alert("Please select an artwork file.");

    const artworkInfo = {
      artworkId: generateArtworkId(),
      name: form.name,
      description: form.description,
      artistAddress: form.artistAddress,
      aiModel: form.aiModel,
    };

    try {
      const { tokenURI } = await upload(file, artworkInfo);
      if (onMintReady) onMintReady(tokenURI);
    } catch (_) {
      // error displayed by hook state
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="artwork-uploader">
      <h2>Upload Artwork to IPFS</h2>
      <p className="subtitle">
        Your file and metadata will be permanently pinned via Pinata — tamper-proof
        and content-addressed.
      </p>

      <form onSubmit={handleSubmit}>
        {/* File drop zone */}
        <div
          className="drop-zone"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Artwork preview" className="preview-img" />
          ) : (
            <span>Click or drag artwork here (PNG / JPG / GIF / SVG)</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {/* Metadata fields */}
        <label>
          Artwork Title *
          <input
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="e.g. Dreamscape #001"
            required
          />
        </label>

        <label>
          Description *
          <textarea
            name="description"
            value={form.description}
            onChange={handleFormChange}
            placeholder="Describe the artwork and the collaboration…"
            rows={3}
            required
          />
        </label>

        <label>
          Artist Wallet Address *
          <input
            name="artistAddress"
            value={form.artistAddress}
            onChange={handleFormChange}
            placeholder="0x…"
            pattern="^0x[a-fA-F0-9]{40}$"
            title="Enter a valid Ethereum address"
            required
          />
        </label>

        <label>
          AI Model Used
          <select name="aiModel" value={form.aiModel} onChange={handleFormChange}>
            <option>Stable Diffusion</option>
            <option>DALL-E 3</option>
            <option>Midjourney</option>
            <option>Adobe Firefly</option>
            <option>Other</option>
          </select>
        </label>

        <button type="submit" disabled={uploading}>
          {uploading ? `${step}` : "Pin to IPFS & Prepare Token URI"}
        </button>
      </form>

      {/* ── Status ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="status error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="status success">
          <h3>✅ Successfully Pinned to IPFS</h3>

          <table className="cid-table">
            <tbody>
              <tr>
                <th>Image CID</th>
                <td>
                  <code>{result.imageCID}</code>{" "}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${result.imageCID}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View ↗
                  </a>
                </td>
              </tr>
              <tr>
                <th>Thumbnail CID</th>
                <td>
                  <code>{result.thumbnailCID}</code>{" "}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${result.thumbnailCID}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View ↗
                  </a>
                </td>
              </tr>
              <tr>
                <th>Metadata CID</th>
                <td>
                  <code>{result.metadataCID}</code>{" "}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${result.metadataCID}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View ↗
                  </a>
                </td>
              </tr>
              <tr>
                <th>Token URI</th>
                <td>
                  <code>{result.tokenURI}</code>
                </td>
              </tr>
              <tr>
                <th>Pin Verified</th>
                <td>{verified ? "✅ Confirmed live on Pinata" : "⚠️ Could not verify"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .artwork-uploader { max-width: 640px; margin: 0 auto; font-family: sans-serif; }
        .subtitle { color: #666; margin-bottom: 1.5rem; }
        form { display: flex; flex-direction: column; gap: 1rem; }
        label { display: flex; flex-direction: column; gap: 0.25rem; font-weight: 600; font-size: 0.9rem; }
        input, textarea, select { padding: 0.6rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; }
        .drop-zone {
          border: 2px dashed #aaa; border-radius: 10px; padding: 2rem; text-align: center;
          cursor: pointer; color: #888; min-height: 160px; display: flex; align-items: center; justify-content: center;
        }
        .preview-img { max-height: 200px; border-radius: 8px; object-fit: contain; }
        button { padding: 0.75rem; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
        button:disabled { background: #888; cursor: not-allowed; }
        .status { margin-top: 1.5rem; padding: 1rem; border-radius: 8px; }
        .error { background: #fff0f0; border: 1px solid #f88; color: #c00; }
        .success { background: #f0fff4; border: 1px solid #6dcd8b; }
        .cid-table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.85rem; }
        .cid-table th { text-align: left; padding: 0.4rem 0.6rem; white-space: nowrap; color: #555; }
        .cid-table td { padding: 0.4rem 0.6rem; word-break: break-all; }
        .cid-table tr:nth-child(even) { background: #e8f5e9; }
        code { background: #eee; padding: 2px 4px; border-radius: 3px; font-size: 0.8rem; }
      `}</style>
    </div>
  );
}