jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

const request = require('supertest');
const app = require('../server/index');

describe('AI API Endpoints', () => {
  describe('POST /api/ai/generate', () => {
    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Valid prompt is required');
    });

    it('should return 400 for empty prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: '' })
        .expect(400);

      expect(response.body.error).toBe('Valid prompt is required');
    });

    it('should return 400 for too long prompt', async () => {
      const longPrompt = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: longPrompt })
        .expect(400);

      expect(response.body.error).toBe('Prompt too long (max 1000 characters)');
    });

    it('should return mock response when no API keys configured', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'A beautiful sunset' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toContain('A beautiful sunset');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
    });
  });

  describe('Muse upload authorization', () => {
    it('should build a deterministic upload challenge', async () => {
      const response = await request(app)
        .post('/api/muse/upload/challenge')
        .send({
          publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
          artworkId: 'artwork-123',
          name: 'Sunrise',
          description: 'Golden horizon',
          aiModel: 'Stable Diffusion',
          mimeType: 'image/png',
          fileSha256: 'abc123',
          fileSize: 128,
          timestamp: '2026-03-25T12:00:00.000Z',
          nonce: 'nonce-1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.challenge).toContain('Muse upload authorization');
      expect(response.body.challenge).toContain('artworkId:artwork-123');
      expect(response.body.challenge).toContain('fileSha256:abc123');
    });

    it('should reject upload requests with invalid signatures', async () => {
      const response = await request(app)
        .post('/api/muse/upload')
        .field('publicKey', 'GBRPYHIL2C73WPV4N5JHXI6QH4PCME4SOZPFAEIGLUJ4CDYFYKJFDYQ4')
        .field('artworkId', 'artwork-123')
        .field('name', 'Sunrise')
        .field('description', 'Golden horizon')
        .field('aiModel', 'Stable Diffusion')
        .field('timestamp', new Date().toISOString())
        .field('nonce', 'nonce-1')
        .field('signature', 'deadbeef')
        .attach('artwork', Buffer.from('fake-image-data'), {
          filename: 'art.png',
          contentType: 'image/png',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/signature|public key/i);
    });
  });
});
