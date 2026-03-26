import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  getStatus,
  mintNFT,
  getNFT,
  listTransactions,
  stellarPay,
  MintNFTSchema,
  StellarPaySchema,
} from '../controllers/blockchain.controller';

const router = Router();

/**
 * @route  GET /api/blockchain/status
 * @desc   Current EVM & Stellar network / contract status
 * @access Public
 */
router.get('/status', getStatus);

/**
 * @route  POST /api/blockchain/mint
 * @desc   Trigger an NFT mint on the EVM contract
 * @access Protected
 */
router.post('/mint', validate(MintNFTSchema), mintNFT);

/**
 * @route  GET /api/blockchain/nft/:tokenId
 * @desc   Fetch on-chain NFT metadata for a given tokenId
 * @access Public
 */
router.get('/nft/:tokenId', getNFT);

/**
 * @route  GET /api/blockchain/transactions
 * @desc   List on-chain transactions for an address
 * @query  address (required), page, limit
 * @access Protected
 */
router.get('/transactions', listTransactions);

/**
 * @route  POST /api/blockchain/stellar/pay
 * @desc   Initiate a Stellar payment (XLM or USDC)
 * @access Protected
 */
router.post('/stellar/pay', validate(StellarPaySchema), stellarPay);

export default router;
