import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import {
  getNonce,
  verifySignature,
  getMe,
  logout,
  NonceRequestSchema,
  VerifyRequestSchema,
} from '../controllers/auth.controller';

const router = Router();

/**
 * @route  POST /api/auth/nonce
 * @desc   Generate a sign-in nonce for a wallet address
 * @access Public
 */
router.post('/nonce', validate(NonceRequestSchema), getNonce);

/**
 * @route  POST /api/auth/verify
 * @desc   Verify wallet signature and return JWT
 * @access Public
 */
router.post('/verify', validate(VerifyRequestSchema), verifySignature);

/**
 * @route  GET /api/auth/me
 * @desc   Return current authenticated user
 * @access Protected (JWT required — TODO: attach auth middleware)
 */
router.get('/me', getMe);

/**
 * @route  POST /api/auth/logout
 * @desc   Invalidate user session / token
 * @access Protected
 */
router.post('/logout', logout);

export default router;
