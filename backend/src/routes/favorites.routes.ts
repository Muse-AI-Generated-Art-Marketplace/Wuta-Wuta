import { Router } from 'express';
import {
  // Favorites
  getFavorites,
  addFavorite,
  removeFavorite,
  // Collections
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addArtworkToCollection,
  removeArtworkFromCollection,
} from '../controllers/favorites.controller';

const router = Router();

// ============ FAVORITES ============

/**
 * @route  GET /api/favorites
 * @desc   Get user's favorites
 * @access Protected
 */
router.get('/', getFavorites);

/**
 * @route  POST /api/favorites/:artworkId
 * @desc   Add artwork to favorites
 * @access Protected
 */
router.post('/:artworkId', addFavorite);

/**
 * @route  DELETE /api/favorites/:artworkId
 * @desc   Remove artwork from favorites
 * @access Protected
 */
router.delete('/:artworkId', removeFavorite);

// ============ COLLECTIONS ============

/**
 * @route  GET /api/collections
 * @desc   Get user's collections
 * @access Protected
 */
router.get('/collections', getCollections);

/**
 * @route  GET /api/collections/:id
 * @desc   Get single collection with artworks
 * @access Protected
 */
router.get('/collections/:id', getCollection);

/**
 * @route  POST /api/collections
 * @desc   Create a new collection
 * @access Protected
 */
router.post('/collections', createCollection);

/**
 * @route  PUT /api/collections/:id
 * @desc   Update collection details
 * @access Protected
 */
router.put('/collections/:id', updateCollection);

/**
 * @route  DELETE /api/collections/:id
 * @desc   Delete a collection
 * @access Protected
 */
router.delete('/collections/:id', deleteCollection);

/**
 * @route  POST /api/collections/:id/artworks/:artworkId
 * @desc   Add artwork to collection
 * @access Protected
 */
router.post('/collections/:id/artworks/:artworkId', addArtworkToCollection);

/**
 * @route  DELETE /api/collections/:id/artworks/:artworkId
 * @desc   Remove artwork from collection
 * @access Protected
 */
router.delete('/collections/:id/artworks/:artworkId', removeArtworkFromCollection);

export default router;