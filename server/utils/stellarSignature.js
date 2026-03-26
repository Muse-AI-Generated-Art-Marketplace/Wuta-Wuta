const { Keypair, StrKey } = require('@stellar/stellar-base');

function parseSignature(signature) {
  if (Buffer.isBuffer(signature)) {
    return signature;
  }

  if (typeof signature !== 'string' || signature.trim().length === 0) {
    throw new Error('Signature is required');
  }

  const normalized = signature.trim();

  if (/^[0-9a-fA-F]+$/.test(normalized) && normalized.length % 2 === 0) {
    return Buffer.from(normalized, 'hex');
  }

  if (
    normalized.startsWith('0x') &&
    /^[0-9a-fA-F]+$/.test(normalized.slice(2)) &&
    normalized.length % 2 === 0
  ) {
    return Buffer.from(normalized.slice(2), 'hex');
  }

  return Buffer.from(normalized, 'base64');
}

function verifyEd25519Signature({ publicKey, message, signature }) {
  if (typeof publicKey !== 'string' || publicKey.trim().length === 0) {
    throw new Error('Public key is required');
  }

  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error('Invalid Stellar public key');
  }

  if (typeof message !== 'string' || message.length === 0) {
    throw new Error('Message is required');
  }

  const signatureBytes = parseSignature(signature);
  const messageBytes = Buffer.from(message, 'utf8');

  return Keypair.fromPublicKey(publicKey).verify(messageBytes, signatureBytes);
}

module.exports = {
  verifyEd25519Signature,
  parseSignature,
};
