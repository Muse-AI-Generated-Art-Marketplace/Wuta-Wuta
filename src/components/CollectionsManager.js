import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Lock, 
  Globe, 
  Plus,
  X,
  Check,
  Image
} from 'lucide-react';
import useFavoritesStore from '../store/favoritesStore';

/**
 * CollectionsManager - UI for managing user collections
 * 
 * Features:
 * - View all collections
 * - Create new collections
 * - Edit collection details
 * - Delete collections
 * - Toggle public/private visibility
 * - Add artworks to collections
 */
const CollectionsManager = ({ 
  onClose, 
  onSelectCollection,
  mode = 'manage' // 'manage' | 'select'
}) => {
  const { 
    collections, 
    collectionsLoading,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection
  } = useFavoritesStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollection, setNewCollection] = useState({ name: '', description: '', isPublic: true });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.name.trim()) return;

    setActionLoading('creating');
    await createCollection(newCollection);
    setNewCollection({ name: '', description: '', isPublic: true });
    setShowCreateForm(false);
    setActionLoading(null);
  };

  const handleUpdateCollection = async (collectionId, data) => {
    setActionLoading(`updating-${collectionId}`);
    await updateCollection(collectionId, data);
    setEditingCollection(null);
    setActionLoading(null);
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    
    setActionLoading(`deleting-${collectionId}`);
    await deleteCollection(collectionId);
    setActionLoading(null);
  };

  const handleToggleVisibility = async (collection) => {
    await updateCollection(collection.id, { isPublic: !collection.isPublic });
  };

  if (collectionsLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">My Collections</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Create new collection button/form */}
        {showCreateForm ? (
          <form onSubmit={handleCreateCollection} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Collection Name</label>
              <input
                type="text"
                value={newCollection.name}
                onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                placeholder="My Favorite Artworks"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={100}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
              <textarea
                value={newCollection.description}
                onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                placeholder="A collection description..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newCollection.isPublic}
                onChange={(e) => setNewCollection({ ...newCollection, isPublic: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-600">Make this collection public</label>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={actionLoading === 'creating' || !newCollection.name.trim()}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setNewCollection({ name: '', description: '', isPublic: true }); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <FolderPlus className="w-5 h-5" />
            <span className="text-sm font-medium">Create New Collection</span>
          </button>
        )}

        {/* Collections list */}
        {collections.length === 0 && !showCreateForm ? (
          <div className="text-center py-8 text-gray-400">
            <FolderPlus className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No collections yet</p>
            <p className="text-xs mt-1">Create a collection to organize your favorite artworks</p>
          </div>
        ) : (
          collections.map((collection) => (
            <div 
              key={collection.id}
              className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              {editingCollection === collection.id ? (
                // Edit mode
                <EditCollectionForm 
                  collection={collection}
                  onSave={(data) => handleUpdateCollection(collection.id, data)}
                  onCancel={() => setEditingCollection(null)}
                  isLoading={actionLoading === `updating-${collection.id}`}
                />
              ) : (
                // Display mode
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => mode === 'select' && onSelectCollection(collection)}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{collection.name}</h3>
                      {collection.isPublic ? (
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                    {collection.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{collection.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {collection.artworkCount || 0} artwork{collection.artworkCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  {mode === 'manage' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCollection(collection.id)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit collection"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(collection)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title={collection.isPublic ? 'Make private' : 'Make public'}
                      >
                        {collection.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection.id)}
                        disabled={actionLoading === `deleting-${collection.id}`}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * EditCollectionForm - Inline form for editing collection details
 */
const EditCollectionForm = ({ collection, onSave, onCancel, isLoading }) => {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-2 py-1 border border-gray-200 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/**
 * AddToCollectionModal - Modal to select which collection to add an artwork to
 */
export const AddToCollectionModal = ({ artwork, onClose }) => {
  const { collections, fetchCollections, addToCollection } = useFavoritesStore();
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleAdd = async () => {
    if (!selectedCollection) return;
    
    setIsAdding(true);
    const success = await addToCollection(selectedCollection.id, artwork.id);
    setIsAdding(false);
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Add to Collection</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Artwork preview */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              {artwork?.imageUrl && (
                <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{artwork?.title}</p>
              <p className="text-xs text-gray-500">Select a collection to add this artwork to</p>
            </div>
          </div>
        </div>

        {/* Collections list */}
        <div className="p-4 max-h-60 overflow-y-auto space-y-2">
          {collections.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No collections yet. Create one first!</p>
          ) : (
            collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  selectedCollection?.id === collection.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Image className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 text-sm">{collection.name}</p>
                  <p className="text-xs text-gray-500">{collection.artworkCount || 0} artworks</p>
                </div>
                {selectedCollection?.id === collection.id && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedCollection || isAdding}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionsManager;