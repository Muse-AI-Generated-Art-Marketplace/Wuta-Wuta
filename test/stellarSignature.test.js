const { Keypair } = require('@stellar/stellar-base');
const {
  buildMuseUploadChallenge,
  validateMuseUploadRequest,
} = require('../server/utils/museUploadAuth');
const { verifyEd25519Signature } = require('../server/utils/stellarSignature');

const TEST_SECRET = 'SC7NPGXHPYZEK6SFYJM3HEFY6PSHB4UUD6P4QXNCJIZB5M6IQJTMBSLI';

describe('Stellar ED25519 signature verification', () => {
  it('verifies a valid signed Muse upload challenge', () => {
    const keypair = Keypair.fromSecret(TEST_SECRET);
    const fileBuffer = Buffer.from('muse-image');
    const timestamp = new Date().toISOString();

    const challenge = buildMuseUploadChallenge({
      publicKey: keypair.publicKey(),
      artworkId: 'artwork-001',
      name: 'Dreamscape',
      description: 'A luminous skyline',
      aiModel: 'Stable Diffusion',
      mimeType: 'image/png',
      fileSha256: 'placeholder',
      fileSize: fileBuffer.length,
      timestamp,
      nonce: 'nonce-123',
    });

    const signature = keypair.sign(Buffer.from(challenge, 'utf8')).toString('base64');

    expect(verifyEd25519Signature({
      publicKey: keypair.publicKey(),
      message: challenge,
      signature,
    })).toBe(true);
  });

  it('rejects signatures when the file hash changes', () => {
    const keypair = Keypair.fromSecret(TEST_SECRET);
    const originalFile = Buffer.from('muse-image');
    const tamperedFile = Buffer.from('muse-image-tampered');
    const timestamp = new Date().toISOString();

    const challenge = buildMuseUploadChallenge({
      publicKey: keypair.publicKey(),
      artworkId: 'artwork-001',
      name: 'Dreamscape',
      description: 'A luminous skyline',
      aiModel: 'Stable Diffusion',
      mimeType: 'image/png',
      fileSha256: 'ignored-by-server-test',
      fileSize: originalFile.length,
      timestamp,
      nonce: 'nonce-123',
    });

    const signature = keypair.sign(Buffer.from(challenge, 'utf8')).toString('base64');

    expect(() => validateMuseUploadRequest({
      fields: {
        publicKey: keypair.publicKey(),
        artworkId: 'artwork-001',
        name: 'Dreamscape',
        description: 'A luminous skyline',
        aiModel: 'Stable Diffusion',
        timestamp,
        nonce: 'nonce-123',
        signature,
      },
      file: {
        buffer: tamperedFile,
        size: tamperedFile.length,
        mimetype: 'image/png',
      },
    })).toThrow(/invalid upload signature/i);
  });
});
