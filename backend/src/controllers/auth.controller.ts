import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ── Schemas ────────────────────────────────────────────────────────────────

export const NonceRequestSchema = z.object({
  walletAddress: z
    .string()
    .min(1, 'walletAddress is required')
    .regex(/^0x[a-fA-F0-9]{40}$|^G[A-Z2-7]{55}$/, 'Invalid wallet address format'),
});

export const VerifyRequestSchema = z.object({
  walletAddress: z.string().min(1),
  signature: z.string().min(1, 'signature is required'),
  nonce: z.string().min(1, 'nonce is required'),
});

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/nonce
 * Generate a nonce for the given wallet address.
 * The client signs this nonce to prove ownership.
 */
export const getNonce = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { walletAddress } = req.body as z.infer<typeof NonceRequestSchema>;

    // TODO: persist nonce in DB / Redis with TTL
    const nonce = `wuta-wuta-login-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    res.status(200).json({
      success: true,
      data: {
        walletAddress,
        nonce,
        expiresIn: 300, // seconds
        message: `Sign this nonce to authenticate: ${nonce}`,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify
 * Verify a signed nonce and return a JWT.
 */
export const verifySignature = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { walletAddress, signature, nonce } =
      req.body as z.infer<typeof VerifyRequestSchema>;

    // TODO: validate signature against nonce using ethers.js / stellar-sdk
    // TODO: issue a real JWT
    const token = `stub-jwt-${Buffer.from(walletAddress).toString('base64')}`;

    res.status(200).json({
      success: true,
      data: {
        token,
        walletAddress,
        nonce,
        signature,
        expiresIn: '7d',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Return the authenticated user from the JWT payload.
 */
export const getMe = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // TODO: decode JWT from Authorization header and return user
    res.status(200).json({
      success: true,
      data: {
        walletAddress: null,
        roles: [],
        message: 'JWT authentication not yet wired up — stub response',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Invalidate the user's session / token.
 */
export const logout = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // TODO: blacklist JWT in Redis or clear session
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};
