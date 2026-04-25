import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Schemas ────────────────────────────────────────────────────────────────

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  isPublic: z.boolean().default(true),
});

export const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  isPublic: z.boolean().optional(),
});

// Helper to get user ID from request (would come from auth middleware)
const getUserId = (req: Request): string | null => {
  // TODO: Extract from auth middleware (e.g., req.user.id)
  return req.headers['x-user-id'] as string || null;
};

// ============ FAVORITES CONTROLLERS ============

/**
 * GET /api/favorites
 * Get all favorites for the authenticated user
 */
export const getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        artAsset: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            price: true,
            creator: { select: { username: true, walletAddress: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: favorites.map(f => ({
        id: f.id,
        artwork: f.artAsset,
        favoritedAt: f.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/favorites/:artworkId
 * Add artwork to favorites
 */
export const addFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { artworkId } = req.params;

    // Check if artwork exists
    const artwork = await prisma.artAsset.findUnique({ where: { id: artworkId } });
    if (!artwork) {
      res.status(404).json({ success: false, error: 'Artwork not found' });
      return;
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: { userId_artAssetId: { userId, artAssetId: artworkId } },
    });

    if (existing) {
      res.status(200).json({ success: true, data: existing, message: 'Already favorited' });
      return;
    }

    const favorite = await prisma.favorite.create({
      data: { userId, artAssetId: artworkId },
      include: { artAsset: true },
    });

    res.status(201).json({ success: true, data: favorite });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/favorites/:artworkId
 * Remove artwork from favorites
 */
export const removeFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { artworkId } = req.params;

    await prisma.favorite.delete({
      where: { userId_artAssetId: { userId, artAssetId: artworkId } },
    });

    res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    // If not found, just return success
    if ((err as any).code === 'P2025') {
      res.status(200).json({ success: true, message: 'Not in favorites' });
      return;
    }
    next(err);
  }
};

// ============ COLLECTIONS CONTROLLERS ============

/**
 * GET /api/favorites/collections
 * Get all collections for the authenticated user
 */
export const getCollections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        _count: { select: { artworks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: collections.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        coverImage: c.coverImage,
        isPublic: c.isPublic,
        artworkCount: c._count.artworks,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/favorites/collections/:id
 * Get single collection with artworks
 */
export const getCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const collection = await prisma.collection.findFirst({
      where: { id, userId },
      include: {
        artworks: {
          include: {
            artAsset: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                price: true,
                creator: { select: { username: true, walletAddress: true } },
              },
            },
          },
        },
      },
    });

    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        isPublic: collection.isPublic,
        artworks: collection.artworks.map(a => ({
          id: a.artAsset.id,
          title: a.artAsset.title,
          imageUrl: a.artAsset.imageUrl,
          price: a.artAsset.price,
          creator: a.artAsset.creator,
          addedAt: a.addedAt,
        })),
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/favorites/collections
 * Create a new collection
 */
export const createCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const validation = CreateCollectionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: validation.error });
      return;
    }

    const { name, description, coverImage, isPublic } = validation.data;

    const collection = await prisma.collection.create({
      data: { name, description, coverImage, isPublic, userId },
    });

    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/favorites/collections/:id
 * Update collection details
 */
export const updateCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const validation = UpdateCollectionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: validation.error });
      return;
    }

    const collection = await prisma.collection.update({
      where: { id, userId },
      data: validation.data,
    });

    res.status(200).json({ success: true, data: collection });
  } catch (err) {
    if ((err as any).code === 'P2025') {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    next(err);
  }
};

/**
 * DELETE /api/favorites/collections/:id
 * Delete a collection
 */
export const deleteCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    await prisma.collection.delete({
      where: { id, userId },
    });

    res.status(200).json({ success: true, message: 'Collection deleted' });
  } catch (err) {
    if ((err as any).code === 'P2025') {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    next(err);
  }
};

/**
 * POST /api/favorites/collections/:id/artworks/:artworkId
 * Add artwork to collection
 */
export const addArtworkToCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: collectionId, artworkId } = req.params;

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }

    // Check if artwork exists
    const artwork = await prisma.artAsset.findUnique({ where: { id: artworkId } });
    if (!artwork) {
      res.status(404).json({ success: false, error: 'Artwork not found' });
      return;
    }

    // Check if already in collection
    const existing = await prisma.collectionArtwork.findUnique({
      where: { collectionId_artAssetId: { collectionId, artAssetId: artworkId } },
    });

    if (existing) {
      res.status(200).json({ success: true, message: 'Artwork already in collection' });
      return;
    }

    await prisma.collectionArtwork.create({
      data: { collectionId, artAssetId: artworkId },
    });

    res.status(201).json({ success: true, message: 'Artwork added to collection' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/favorites/collections/:id/artworks/:artworkId
 * Remove artwork from collection
 */
export const removeArtworkFromCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: collectionId, artworkId } = req.params;

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }

    await prisma.collectionArtwork.delete({
      where: { collectionId_artAssetId: { collectionId, artAssetId: artworkId } },
    });

    res.status(200).json({ success: true, message: 'Artwork removed from collection' });
  } catch (err) {
    if ((err as any).code === 'P2025') {
      res.status(200).json({ success: true, message: 'Artwork not in collection' });
      return;
    }
    next(err);
  }
};