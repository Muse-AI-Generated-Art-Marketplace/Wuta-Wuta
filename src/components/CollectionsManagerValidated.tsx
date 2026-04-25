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
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import { 
  FormFieldWrapper, 
  ValidationMessage, 
  FormProgress, 
  AccessibleForm,
  ValidatedInput,
  ValidatedTextarea
} from './FormValidation';

/**
 * Enhanced CollectionsManager with comprehensive form validation
 * 
 * Features:
 * - Real-time validation for collection creation and editing
 * - Accessibility support with ARIA attributes
 * - Visual feedback and error handling
 * - Form progress tracking
 * - Custom validation rules
 */
const CollectionsManagerValidated = ({ 
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
  const [actionLoading, setActionLoading] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validation schema for collection creation/editing
  const collectionValidationSchema = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      custom: (value) => {
        if (!value || value.trim().length < 2) {
          return 'Collection name must be at least 2 characters long';
        }
        if (value.length > 50) {
          return 'Collection name must be no more than 50 characters';
        }
        // Check for duplicate names when editing
        if (editingCollection && value !== editingCollection.name) {
          const exists = collections.some(c => 
            c.name.toLowerCase() === value.toLowerCase() && c.id !== editingCollection.id
          );
          if (exists) {
            return 'A collection with this name already exists';
          }
        }
        // Check for duplicate names when creating
        if (!editingCollection) {
          const exists = collections.some(c => c.name.toLowerCase() === value.toLowerCase());
          if (exists) {
            return 'A collection with this name already exists';
          }
        }
        return null;
      }
    },
    description: {
      required: false,
      maxLength: 200,
      custom: (value) => {
        if (value && value.length > 200) {
          return 'Description must be no more than 200 characters';
        }
        return null;
      }
    }
  };

  // Initialize form validation
  const {
    values,
    updateField,
    handleBlur,
    validateForm,
    resetForm,
    getFieldProps,
    getFieldError,
    isFieldValid,
    isFieldDirty,
    isValid,
    isDirty,
    errors,
    touched,
  } = useFormValidation({
    schema: collectionValidationSchema,
    initialValues: {
      name: '',
      description: '',
      isPublic: true,
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    accessibility: {
      announceErrors: true,
      errorAnnouncementDelay: 1000,
    },
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  // Reset form when editing collection changes
  useEffect(() => {
    if (editingCollection) {
      updateField('name', editingCollection.name);
      updateField('description', editingCollection.description || '');
      updateField('isPublic', editingCollection.isPublic);
    } else {
      resetForm();
    }
  }, [editingCollection]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    const { isValid: formIsValid, errors: validationErrors } = validateForm();
    
    if (!formIsValid) {
      setSubmitError('Please fix the validation errors before creating the collection.');
      return;
    }

    try {
      setActionLoading('create');
      
      const collectionData = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        isPublic: values.isPublic,
      };

      await createCollection(collectionData);
      
      setSuccessMessage('Collection created successfully!');
      setShowCreateForm(false);
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      setSubmitError(error.message || 'Failed to create collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    const { isValid: formIsValid, errors: validationErrors } = validateForm();
    
    if (!formIsValid) {
      setSubmitError('Please fix the validation errors before updating the collection.');
      return;
    }

    try {
      setActionLoading('update');
      
      const collectionData = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        isPublic: values.isPublic,
      };

      await updateCollection(editingCollection.id, collectionData);
      
      setSuccessMessage('Collection updated successfully!');
      setEditingCollection(null);
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      setSubmitError(error.message || 'Failed to update collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(`delete-${collectionId}`);
      await deleteCollection(collectionId);
      setSuccessMessage('Collection deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      setSubmitError(error.message || 'Failed to delete collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectCollection = (collection) => {
    if (mode === 'select' && onSelectCollection) {
      onSelectCollection(collection);
      onClose();
    }
  };

  // Calculate form progress
  const totalFields = Object.keys(collectionValidationSchema).length;
  const validFields = Object.keys(collectionValidationSchema).filter(field => 
    touched[field] && !errors[field]
  ).length;

  const renderCreateForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create New Collection
        </h3>
        <button
          onClick={() => {
            setShowCreateForm(false);
            resetForm();
            setSubmitError('');
            setSuccessMessage('');
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <AccessibleForm 
        onSubmit={handleCreateCollection}
        className="space-y-4"
        aria-label="Create collection form"
      >
        <FormFieldWrapper
          label="Collection Name"
          name="name"
          required
          hint="Choose a unique name for your collection (2-50 characters)"
          error={getFieldError('name')}
        >
          <ValidatedInput
            name="name"
            type="text"
            value={values.name}
            onChange={(e) => updateField('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={getFieldError('name')}
            placeholder="My Favorite Artworks"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Description (Optional)"
          name="description"
          hint="Add a description to help you remember what's in this collection"
          error={getFieldError('description')}
        >
          <ValidatedTextarea
            name="description"
            rows={3}
            value={values.description}
            onChange={(e) => updateField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            error={getFieldError('description')}
            placeholder="A collection of my favorite AI-generated artworks..."
          />
        </FormFieldWrapper>

        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={values.isPublic}
            onChange={(e) => updateField('isPublic', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Make this collection public
          </label>
        </div>

        {/* Form Progress */}
        <FormProgress 
          totalFields={totalFields}
          validFields={validFields}
        />

        {/* Form Summary */}
        {isDirty && (
          <FormSummary errors={errors} />
        )}

        {/* Error and Success Messages */}
        {submitError && (
          <ValidationMessage type="error" message={submitError} />
        )}
        {successMessage && (
          <ValidationMessage type="success" message={successMessage} />
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              resetForm();
              setSubmitError('');
              setSuccessMessage('');
            }}
            className="flex-1 rounded-2xl border border-gray-200 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || actionLoading === 'create'}
            className="flex-1 rounded-2xl bg-purple-600 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'create' ? 'Creating...' : 'Create Collection'}
          </button>
        </div>
      </AccessibleForm>
    </div>
  );

  const renderEditForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Edit Collection
        </h3>
        <button
          onClick={() => {
            setEditingCollection(null);
            resetForm();
            setSubmitError('');
            setSuccessMessage('');
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <AccessibleForm 
        onSubmit={handleUpdateCollection}
        className="space-y-4"
        aria-label="Edit collection form"
      >
        <FormFieldWrapper
          label="Collection Name"
          name="name"
          required
          hint="Choose a unique name for your collection (2-50 characters)"
          error={getFieldError('name')}
        >
          <ValidatedInput
            name="name"
            type="text"
            value={values.name}
            onChange={(e) => updateField('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={getFieldError('name')}
            placeholder="My Favorite Artworks"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Description (Optional)"
          name="description"
          hint="Add a description to help you remember what's in this collection"
          error={getFieldError('description')}
        >
          <ValidatedTextarea
            name="description"
            rows={3}
            value={values.description}
            onChange={(e) => updateField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            error={getFieldError('description')}
            placeholder="A collection of my favorite AI-generated artworks..."
          />
        </FormFieldWrapper>

        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={values.isPublic}
            onChange={(e) => updateField('isPublic', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Make this collection public
          </label>
        </div>

        {/* Form Progress */}
        <FormProgress 
          totalFields={totalFields}
          validFields={validFields}
        />

        {/* Form Summary */}
        {isDirty && (
          <FormSummary errors={errors} />
        )}

        {/* Error and Success Messages */}
        {submitError && (
          <ValidationMessage type="error" message={submitError} />
        )}
        {successMessage && (
          <ValidationMessage type="success" message={successMessage} />
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingCollection(null);
              resetForm();
              setSubmitError('');
              setSuccessMessage('');
            }}
            className="flex-1 rounded-2xl border border-gray-200 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || actionLoading === 'update'}
            className="flex-1 rounded-2xl bg-purple-600 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'update' ? 'Updating...' : 'Update Collection'}
          </button>
        </div>
      </AccessibleForm>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl dark:border-gray-800 dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'select' ? 'Select Collection' : 'Manage Collections'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && renderCreateForm()}

          {/* Edit Form */}
          {editingCollection && renderEditForm()}

          {/* Collections List */}
          {!showCreateForm && !editingCollection && (
            <div className="space-y-4">
              {/* Create Button */}
              {mode === 'manage' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-4 font-medium text-gray-600 hover:border-purple-300 hover:text-purple-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-purple-600"
                >
                  <FolderPlus className="h-5 w-5" />
                  Create New Collection
                </button>
              )}

              {/* Collections */}
              {collectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No collections yet. Create your first collection to organize your favorites.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 dark:border-gray-700 dark:hover:border-purple-600"
                    >
                      <button
                        onClick={() => handleSelectCollection(collection)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {collection.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {collection.isPublic ? (
                              <Globe className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            <span>{collection.artworkCount || 0} artworks</span>
                          </div>
                        </div>
                      </button>

                      {mode === 'manage' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingCollection(collection)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label={`Edit ${collection.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCollection(collection.id)}
                            disabled={actionLoading === `delete-${collection.id}`}
                            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                            aria-label={`Delete ${collection.name}`}
                          >
                            {actionLoading === `delete-${collection.id}` ? (
                              <div className="h-4 w-4 animate-spin border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Error and Success Messages */}
              {submitError && (
                <ValidationMessage type="error" message={submitError} />
              )}
              {successMessage && (
                <ValidationMessage type="success" message={successMessage} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionsManagerValidated;
