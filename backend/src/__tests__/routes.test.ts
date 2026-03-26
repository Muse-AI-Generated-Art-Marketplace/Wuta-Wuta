import { beforeAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app';

let app: any;

beforeAll(() => {
  app = createApp();
});

describe('API Routes', () => {
  describe('GET /api/health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
      });
    });
  });

  describe('Auth Routes', () => {
    it('should return 200 for nonce generation with valid wallet', async () => {
      const res = await request(app)
        .post('/api/auth/nonce')
        .send({ walletAddress: '0x1234567890123456789012345678901234567890' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nonce).toBeDefined();
    });

    it('should return 422 for invalid wallet address', async () => {
      const res = await request(app)
        .post('/api/auth/nonce')
        .send({ walletAddress: 'invalid-wallet' });
      
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ValidationError');
    });
  });

  describe('Art Routes', () => {
    it('should return 200 for listing artworks', async () => {
      const res = await request(app).get('/api/art');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.artworks)).toBe(true);
    });
  });

  describe('Blockchain Routes', () => {
    it('should return 200 for network status', async () => {
      const res = await request(app).get('/api/blockchain/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.evm).toBeDefined();
      expect(res.body.data.stellar).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/not-a-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NotFound');
    });
  });
});
