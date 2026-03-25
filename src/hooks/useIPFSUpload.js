/**
 * useIPFSUpload.js
 * Issue #6 — Secure Metadata Storage via IPFS/Pinata
 *
 * React hook that exposes the full upload pipeline with loading/error state
 * so any component can pin artwork + metadata with minimal boilerplate.
 */

import { useState, useCallback } from "react";
import { uploadArtworkToIPFS, verifyCIDPinned } from "../services/ipfsService";

/**
 * @typedef {object} UploadResult
 * @property {string} imageCID     - IPFS CID of the optimized artwork image.
 * @property {string} thumbnailCID - IPFS CID of the generated thumbnail image.
 * @property {string} metadataCID  - IPFS CID of the pinned metadata JSON.
 * @property {string} tokenURI     - ipfs://<metadataCID> — pass this to the smart contract.
 */

/**
 * useIPFSUpload
 *
 * Usage:
 *   const { upload, uploading, result, error, verified } = useIPFSUpload();
 *   await upload(file, artworkInfo);
 */
export function useIPFSUpload() {
  const [uploading, setUploading]   = useState(false);
  const [result, setResult]         = useState(/** @type {UploadResult|null} */ null);
  const [error, setError]           = useState(/** @type {string|null} */ null);
  const [verified, setVerified]     = useState(/** @type {boolean|null} */ null);
  const [step, setStep]             = useState("");   // human-readable progress

  /**
   * upload
   * @param {File}   artworkFile  - The AI-generated artwork file (image).
   * @param {object} artworkInfo  - Artwork details (see buildNFTMetadata params).
   * @returns {Promise<UploadResult>}
   */
  const upload = useCallback(async (artworkFile, artworkInfo) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setVerified(null);

    try {
      setStep("Processing & Pinning artwork (Optimized + Thumbnail)…");
      const uploadResult = await uploadArtworkToIPFS(artworkFile, artworkInfo);

      setStep("Verifying pin on Pinata…");
      const isPinned = await verifyCIDPinned(uploadResult.metadataCID);
      setVerified(isPinned);

      setResult(uploadResult);
      setStep("Complete");
      return uploadResult;
    } catch (err) {
      const message = err?.response?.data?.error?.details || err.message || "Upload failed.";
      setError(message);
      setStep("Error");
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, result, error, verified, step };
}