import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { config } from '../config/env';

// ── Schemas ────────────────────────────────────────────────────────────────

export const MintNFTSchema = z.object({
  artistAddress: z.string().min(1, 'artistAddress required'),
  tokenURI: z.string().url('tokenURI must be a valid URI (e.g. ipfs://...)'),
  royaltyBps: z.number().min(0).max(10000).default(1000), // basis points, default 10%
  collaborators: z
    .array(
      z.object({
        address: z.string().min(1),
        share: z.number().min(0).max(100),
      })
    )
    .default([]),
});

export const StellarPaySchema = z.object({
  senderPublicKey: z.string().min(1),
  receiverPublicKey: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'amount must be a numeric string'),
  assetCode: z.enum(['XLM', 'USDC']).default('XLM'),
  memo: z.string().max(28).optional(),
});

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /api/blockchain/status
 * Return current network/contract status.
 */
export const getStatus = (req: Request, res: Response, next: NextFunction): void => {
  try {
    res.status(200).json({
      success: true,
      data: {
        evm: {
          network: 'hardhat-local', // TODO: read from ethers provider
          chainId: 31337,
          contractAddress: null,
          connected: false,
        },
        stellar: {
          horizonUrl: config.stellar.horizonUrl,
          contractId: config.stellar.contractId || null,
          network: 'testnet',
          connected: !!config.stellar.horizonUrl,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/blockchain/mint
 * Trigger an NFT mint on the EVM contract.
 */
export const mintNFT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const body = req.body as z.infer<typeof MintNFTSchema>;

    // TODO: call MuseNFT contract via ethers.js signer
    const txHash = `0x-stub-${Date.now().toString(16)}`;

    res.status(202).json({
      success: true,
      data: {
        txHash,
        status: 'submitted',
        artistAddress: body.artistAddress,
        tokenURI: body.tokenURI,
        royaltyBps: body.royaltyBps,
        collaborators: body.collaborators,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/blockchain/nft/:tokenId
 * Fetch on-chain NFT metadata.
 */
export const getNFT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { tokenId } = req.params;

    // TODO: call tokenURI(tokenId) on MuseNFT contract via ethers.js
    res.status(200).json({
      success: true,
      data: {
        tokenId,
        owner: null,
        tokenURI: null,
        royaltyBps: null,
        collaborators: [],
        message: 'On-chain data lookup not yet implemented — stub response',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/blockchain/transactions
 * List transactions for an address.
 */
export const listTransactions = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const address = req.query.address as string | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Query param `address` is required',
      });
      return;
    }

    // TODO: fetch from indexed DB / Horizon API
    res.status(200).json({
      success: true,
      data: {
        address,
        transactions: [],
        pagination: { page, limit, total: 0, pages: 0 },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/blockchain/stellar/pay
 * Initiate a Stellar payment.
 */
export const stellarPay = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const body = req.body as z.infer<typeof StellarPaySchema>;

    // TODO: build & submit XDR transaction via @stellar/stellar-sdk
    const opId = `stellar-op-${Date.now()}`;

    res.status(202).json({
      success: true,
      data: {
        operationId: opId,
        status: 'submitted',
        senderPublicKey: body.senderPublicKey,
        receiverPublicKey: body.receiverPublicKey,
        amount: body.amount,
        assetCode: body.assetCode,
        memo: body.memo ?? null,
        horizonUrl: config.stellar.horizonUrl,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};
