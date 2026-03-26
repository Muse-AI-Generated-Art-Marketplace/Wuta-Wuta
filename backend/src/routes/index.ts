import { Router } from 'express';
import authRoutes from './auth.routes';
import artRoutes from './art.routes';
import blockchainRoutes from './blockchain.routes';

const router = Router();

/**
 * Health check — available without version prefix for uptime monitors.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ── Domain routes ──────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/art', artRoutes);
router.use('/blockchain', blockchainRoutes);

export default router;
