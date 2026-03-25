/**
 * ipfsService.js
 * Issue #6 — Secure Metadata Storage via IPFS/Pinata
 *
 * Handles pinning AI-generated art files and their metadata to IPFS
 * via the Pinata API so content is permanent and tamper-proof.
 *
 * All CIDs returned are content-addressed — any tampering breaks the hash.
 */

import axios from "axios";

// ─── Config ──────────────────────────────────────────────────────────────────

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

const pinataHeaders = () => {
  const jwt = process.env.REACT_APP_PINATA_JWT;
  if (!jwt) throw new Error("REACT_APP_PINATA_JWT is not set in environment variables.");
  return {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };
};

// ─── 1. Pin a File (image / artwork) to IPFS ─────────────────────────────────

/**
 * Uploads a raw file (Blob/File) to IPFS via Pinata.
 *
 * @param {File|Blob} file       - The artwork file to pin.
 * @param {string}    artworkId  - Unique ID used for Pinata metadata label.
 * @returns {Promise<string>}    - IPFS CID of the pinned file.
 */
export async function pinFileToIPFS(file, artworkId) {
  const formData = new FormData();
  formData.append("file", file);

  // Pinata metadata stored alongside the pin (not on-chain, just for management)
  const pinataMetadata = JSON.stringify({
    name: `muse-artwork-${artworkId}`,
    keyvalues: {
      project: "Wuta-Wuta",
      type: "artwork",
      artworkId,
    },
  });
  formData.append("pinataMetadata", pinataMetadata);

  // Pin options — wrap with directory so the file keeps its name
  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", pinataOptions);

  const jwt = process.env.REACT_APP_PINATA_JWT;
  if (!jwt) throw new Error("REACT_APP_PINATA_JWT is not set in environment variables.");

  const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
    maxBodyLength: Infinity,
    headers: {
      Authorization: `Bearer ${jwt}`,
      // Let axios set multipart/form-data boundary automatically
    },
  });

  const cid = response.data.IpfsHash;
  console.log(`[IPFS] Artwork pinned — CID: ${cid}`);
  return cid;
}

// ─── 2. Pin JSON Metadata to IPFS ────────────────────────────────────────────

/**
 * Pins an ERC-721-compatible metadata JSON object to IPFS.
 *
 * @param {object} metadata   - NFT metadata (name, description, image CID, attributes…)
 * @param {string} artworkId  - Unique ID for the Pinata label.
 * @returns {Promise<string>} - IPFS CID of the metadata JSON.
 */
export async function pinMetadataToIPFS(metadata, artworkId) {
  const body = {
    pinataContent: metadata,
    pinataMetadata: {
      name: `muse-metadata-${artworkId}`,
      keyvalues: {
        project: "Wuta-Wuta",
        type: "metadata",
        artworkId,
      },
    },
    pinataOptions: { cidVersion: 1 },
  };

  const response = await axios.post(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, body, {
    headers: pinataHeaders(),
  });

  const cid = response.data.IpfsHash;
  console.log(`[IPFS] Metadata pinned — CID: ${cid}`);
  return cid;
}

// ─── 3. Build ERC-721 Metadata Object ────────────────────────────────────────

/**
 * Constructs the standard NFT metadata object from artwork details.
 *
 * @param {object} params
 * @param {string} params.name            - Artwork title.
 * @param {string} params.description     - Artwork description.
 * @param {string} params.imageCID        - IPFS CID of the artwork image.
 * @param {string} params.artistAddress   - Ethereum address of the human artist.
 * @param {string} params.aiModel         - AI model used (e.g. "Stable Diffusion v2").
 * @param {string[]} params.collaborators - Additional collaborator addresses.
 * @param {object[]} [params.attributes]  - Extra ERC-721 attribute array.
 * @returns {object}                      - ERC-721 metadata JSON.
 */
export function buildNFTMetadata({
  name,
  description,
  imageCID,
  artistAddress,
  aiModel,
  collaborators = [],
  attributes = [],
}) {
  return {
    name,
    description,
    image: `ipfs://${imageCID}`,
    external_url: `${PINATA_GATEWAY}/${imageCID}`,
    artist: artistAddress,
    ai_model: aiModel,
    collaborators,
    created_at: new Date().toISOString(),
    attributes: [
      { trait_type: "AI Model", value: aiModel },
      { trait_type: "Artist", value: artistAddress },
      { trait_type: "Collaboration Type", value: "AI-Human" },
      ...attributes,
    ],
  };
}

// ─── 4. Full Upload Pipeline ──────────────────────────────────────────────────

/**
 * End-to-end upload: pins the artwork file, builds metadata, pins metadata.
 *
 * @param {File|Blob} artworkFile - The raw artwork image file.
 * @param {object}    artworkInfo - Fields for buildNFTMetadata (minus imageCID).
 * @returns {Promise<{imageCID: string, metadataCID: string, tokenURI: string}>}
 */
export async function uploadArtworkToIPFS(artworkFile, artworkInfo) {
  const formData = new FormData();
  formData.append('artwork', artworkFile);
  
  // Append all metadata info to formData
  Object.keys(artworkInfo).forEach(key => {
    formData.append(key, artworkInfo[key]);
  });

  try {
    const response = await axios.post('/api/upload/artwork', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data; // { imageCID, thumbnailCID, metadataCID, tokenURI, success }
  } catch (err) {
    console.error('[Upload Pipeline] Backend upload failed:', err);
    throw new Error('Failed to process and upload artwork via backend: ' + (err.response?.data?.message || err.message));
  }
}

// ─── 5. Verify a Pin is Still Live ───────────────────────────────────────────

/**
 * Checks whether a CID is currently pinned on Pinata.
 *
 * @param {string} cid - IPFS CID to verify.
 * @returns {Promise<boolean>}
 */
export async function verifyCIDPinned(cid) {
  const response = await axios.get(`${PINATA_API_URL}/pinning/pinList`, {
    headers: pinataHeaders(),
    params: { hashContains: cid, status: "pinned" },
  });
  return response.data.count > 0;
}

// ─── 6. Retrieve Metadata from IPFS ──────────────────────────────────────────

/**
 * Fetches and parses the NFT metadata JSON from IPFS via the configured gateway.
 *
 * @param {string} metadataCID - IPFS CID of the metadata JSON.
 * @returns {Promise<object>}  - Parsed metadata object.
 */
export async function fetchMetadataFromIPFS(metadataCID) {
  const url = `${PINATA_GATEWAY}/${metadataCID}`;
  const response = await axios.get(url);
  return response.data;
}

// ─── 7. Unpin (cleanup) ───────────────────────────────────────────────────────

/**
 * Removes a pin from Pinata (use with caution — content may become unavailable).
 *
 * @param {string} cid - IPFS CID to unpin.
 */
export async function unpinFromIPFS(cid) {
  await axios.delete(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
    headers: pinataHeaders(),
  });
  console.log(`[IPFS] Unpinned CID: ${cid}`);
}