import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  listArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  placeBid,
  CreateArtSchema,
  PlaceBidSchema,
} from '../controllers/art.controller';

const router = Router();

/**
 * @route  GET /api/art
 * @desc   List artworks (paginated, sortable)
 * @query  page, limit, sort
 * @access Public
 */
router.get('/', listArtworks);

/**
 * @route  GET /api/art/:id
 * @desc   Get single artwork by ID
 * @access Public
 */
router.get('/:id', getArtwork);

/**
 * @route  POST /api/art
 * @desc   Create a new artwork listing
 * @access Protected
 */
router.post('/', validate(CreateArtSchema), createArtwork);

/**
 * @route  PUT /api/art/:id
 * @desc   Update an artwork listing
 * @access Protected (owner only)
 */
router.put('/:id', updateArtwork);

/**
 * @route  DELETE /api/art/:id
 * @desc   Remove an artwork from the marketplace
 * @access Protected (owner only)
 */
router.delete('/:id', deleteArtwork);

/**
 * @route  POST /api/art/:id/bid
 * @desc   Place a bid on an artwork
 * @access Protected
 */
router.post('/:id/bid', validate(PlaceBidSchema), placeBid);

export default router;
