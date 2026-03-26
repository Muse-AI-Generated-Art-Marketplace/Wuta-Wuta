const crypto = require('crypto');
const { verifyEd25519Signature } = require('./stellarSignature');

const SIGNING_WINDOW_MS = 5 * 60 * 1000;

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function buildMuseUploadChallenge({
  publicKey,
  artworkId,
  name,
  description,
  aiModel,
  mimeType,
  fileSha256,
  fileSize,
  timestamp,
  nonce,
}) {
  return [
    'Muse upload authorization',
    `publicKey:${publicKey}`,
    `artworkId:${artworkId}`,
    `name:${name}`,
    `description:${description}`,
    `aiModel:${aiModel}`,
    `mimeType:${mimeType}`,
    `fileSha256:${fileSha256}`,
    `fileSize:${fileSize}`,
    `timestamp:${timestamp}`,
    `nonce:${nonce}`,
  ].join('\n');
}

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function normalizeUploadFields(input = {}) {
  return {
    publicKey: String(input.publicKey || '').trim(),
    artworkId: String(input.artworkId || '').trim(),
    name: String(input.name || '').trim(),
    description: String(input.description || '').trim(),
    aiModel: String(input.aiModel || '').trim(),
    timestamp: String(input.timestamp || '').trim(),
    nonce: String(input.nonce || '').trim(),
    signature: String(input.signature || '').trim(),
  };
}

function validateMuseUploadRequest({ fields, file }) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new Error('Artwork file is required');
  }

  const normalized = normalizeUploadFields(fields);
  const requiredFields = ['publicKey', 'artworkId', 'name', 'description', 'aiModel', 'timestamp', 'nonce', 'signature'];
  const missingField = requiredFields.find((field) => !normalized[field]);

  if (missingField) {
    throw new Error(`Missing required field: ${missingField}`);
  }

  const timestampMs = Date.parse(normalized.timestamp);
  if (Number.isNaN(timestampMs)) {
    throw new Error('Invalid timestamp');
  }

  if (Math.abs(Date.now() - timestampMs) > SIGNING_WINDOW_MS) {
    throw new Error('Expired upload signature');
  }

  const challenge = buildMuseUploadChallenge({
    publicKey: normalized.publicKey,
    artworkId: normalized.artworkId,
    name: normalized.name,
    description: normalized.description,
    aiModel: normalized.aiModel,
    mimeType: file.mimetype || 'application/octet-stream',
    fileSha256: hashBuffer(file.buffer),
    fileSize: file.size,
    timestamp: normalized.timestamp,
    nonce: normalized.nonce,
  });

  const verified = verifyEd25519Signature({
    publicKey: normalized.publicKey,
    message: challenge,
    signature: normalized.signature,
  });

  if (!verified) {
    throw new Error('Invalid upload signature');
  }

  return {
    challenge,
    fields: normalized,
    fileSha256: hashBuffer(file.buffer),
  };
}

module.exports = {
  SIGNING_WINDOW_MS,
  stableStringify,
  buildMuseUploadChallenge,
  hashBuffer,
  normalizeUploadFields,
  validateMuseUploadRequest,
};
