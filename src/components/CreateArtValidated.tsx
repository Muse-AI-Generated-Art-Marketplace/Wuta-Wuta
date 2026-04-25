import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Cpu, Plus, RefreshCw, Settings2, Sparkles, Loader2, Eye } from 'lucide-react';
import { sendPrompt } from '../ai/wutaAi';
import { getImageSrc } from '../utils/image';
import { useMuseStore } from '../store/museStore';
import { useTransactionNotificationStore } from '../store/transactionNotificationStore';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import { 
  FormFieldWrapper, 
  ValidationMessage, 
  FormProgress, 
  FormSummary, 
  AccessibleForm,
  ValidatedInput,
  ValidatedTextarea,
  ValidatedSelect
} from './FormValidation';
import ProgressIndicator from './ui/ProgressIndicator';

function normalizeModels(aiModels = []) {
  return aiModels.map((model) => {
    if (typeof model === 'string') {
      return { id: model, name: model, description: '' };
    }

    return {
      id: model.id || model.name || '',
      name: model.name || model.id || 'Unnamed model',
      description: model.description || '',
    };
  });
}

function isValidUri(value) {
  if (!value) return false;
  if (value.startsWith('ipfs://')) return value.length > 'ipfs://'.length;

  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function clampContribution(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

function generateHash() {
  const alphabet = 'abcdef0123456789';
  let hash = '0x';

  for (let index = 0; index < 64; index += 1) {
    hash += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return hash;
}

/**
 * Enhanced CreateArt component with comprehensive form validation
 * 
 * Features:
 * - Real-time validation with debouncing
 * - Accessibility support with ARIA attributes
 * - Visual feedback for validation states
 * - Form progress tracking
 * - Error summaries and field-level help
 */
const CreateArtValidated = () => {
  const store = useMuseStore();
  const { isConnected, createArtworkAction, error: storeError, clearError } = useMuseStore();
  const { updateTransactionStatus, STATUS } = useTransactionNotificationStore();

  // Form state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [previewArtwork, setPreviewArtwork] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [creationProgress, setCreationProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validation schema
  const validationSchema = {
    aiModel: {
      required: true,
      custom: (value) => {
        if (!value) return 'Please select an AI model';
        return null;
      }
    },
    humanContribution: {
      required: true,
      custom: (value) => {
        const num = Number(value);
        if (isNaN(num)) return 'Please enter a valid number';
        if (num < 0 || num > 100) return 'Human contribution must be between 0 and 100';
        return null;
      }
    },
    aiContribution: {
      required: true,
      custom: (value) => {
        const num = Number(value);
        if (isNaN(num)) return 'Please enter a valid number';
        if (num < 0 || num > 100) return 'AI contribution must be between 0 and 100';
        return null;
      }
    },
    prompt: {
      required: true,
      minLength: 10,
      maxLength: 1000,
      custom: (value) => {
        if (!value || value.trim().length < 10) {
          return 'Prompt must be at least 10 characters long';
        }
        if (value.length > 1000) {
          return 'Prompt must be no more than 1000 characters';
        }
        return null;
      }
    },
    tokenURI: {
      required: false,
      custom: (value) => {
        if (!value) return null; // Optional field
        if (!isValidUri(value)) {
          return 'Please enter a valid URL or IPFS URI';
        }
        return null;
      }
    },
    contentHash: {
      required: false,
      pattern: /^0x[a-fA-F0-9]{64}$/,
      custom: (value) => {
        if (!value) return null; // Optional field
        if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
          return 'Content hash must be a valid 64-character hexadecimal string starting with 0x';
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
    schema: validationSchema,
    initialValues: {
      aiModel: '',
      humanContribution: 50,
      aiContribution: 50,
      prompt: '',
      tokenURI: '',
      contentHash: '',
      canEvolve: false,
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    accessibility: {
      announceErrors: true,
      errorAnnouncementDelay: 1000,
    },
  });

  const models = useMemo(() => normalizeModels(store.aiModels), [store.aiModels]);

  const creationSteps = [
    { id: 0, label: 'Uploading metadata', status: 'pending' },
    { id: 1, label: 'Generating artwork', status: 'pending' },
    { id: 2, label: 'Submitting to blockchain', status: 'pending' },
    { id: 3, label: 'Finalizing', status: 'pending' },
  ];

  const handleHumanContributionChange = (e) => {
    const value = clampContribution(e.target.value);
    updateField('humanContribution', value);
    updateField('aiContribution', 100 - value);
  };

  const handleAiContributionChange = (e) => {
    const value = clampContribution(e.target.value);
    updateField('aiContribution', value);
    updateField('humanContribution', 100 - value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const { isValid: formIsValid, errors: validationErrors } = validateForm();
    
    if (!formIsValid) {
      setSubmitError('Please fix the validation errors before submitting.');
      return;
    }

    // Check contribution totals
    const total = Number(values.humanContribution) + Number(values.aiContribution);
    if (total !== 100) {
      setSubmitError('Human and AI contributions must total 100%.');
      return;
    }

    try {
      const txId = `create-${Date.now()}`;
      updateTransactionStatus(txId, STATUS.PENDING);
      setCurrentStep(0);
      setCreationProgress(10);

      // Step 1: Metadata upload simulation
      await new Promise(r => setTimeout(r, 1000));
      setCreationProgress(25);

      setCurrentStep(1);
      // Step 2: AI Generation
      const generatedArtwork = await sendPrompt(values.prompt.trim());
      setPreviewArtwork(generatedArtwork);
      setCreationProgress(50);

      setCurrentStep(2);
      // Step 3: Blockchain submission
      const payload = {
        aiModel: values.aiModel,
        prompt: values.prompt.trim(),
        tokenURI: values.tokenURI.trim(),
        humanContribution: values.humanContribution,
        aiContribution: values.aiContribution,
        contentHash: values.contentHash || generateHash(),
        canEvolve: values.canEvolve,
      };

      await createArtworkAction(payload);
      setCreationProgress(85);

      setCurrentStep(3);
      // Step 4: Finalizing
      await new Promise(r => setTimeout(r, 1000));
      setCreationProgress(100);

      updateTransactionStatus(txId, STATUS.CONFIRMED);
      setSuccessMessage('Artwork created successfully.');

      resetForm({
        aiModel: '',
        humanContribution: 50,
        aiContribution: 50,
        prompt: '',
        tokenURI: '',
        contentHash: '',
        canEvolve: false,
      });
      setPreviewArtwork(null);

      setTimeout(() => {
        setCurrentStep(-1);
        setCreationProgress(0);
      }, 3000);

    } catch (error) {
      updateTransactionStatus(txId, STATUS.FAILED, { error: error.message });
      setSubmitError(error.message || 'Creation failed');
      setCurrentStep(-1);
      setCreationProgress(0);
    }
  };

  // Calculate form progress
  const totalFields = Object.keys(validationSchema).length;
  const validFields = Object.keys(validationSchema).filter(field => 
    touched[field] && !errors[field]
  ).length;

  if (!isConnected) {
    return (
      <section className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-purple-200 bg-white p-10 text-center shadow-sm dark:border-purple-900/40 dark:bg-gray-900">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Collaborative Artwork</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Please connect your wallet to create artwork.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-blue-600 p-8 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Creative Studio</p>
              <h1 className="text-3xl font-bold">Create Collaborative Artwork</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">
                Turn a prompt into a collectible, define how human and AI contributions are split, and prepare the metadata needed for minting.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <Cpu className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Form Progress */}
        <FormProgress 
          totalFields={totalFields}
          validFields={validFields}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        />

        {currentStep >= 0 && (
          <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-md dark:border-purple-900/20 dark:bg-gray-900">
            <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              Generation in Progress
            </h3>
            <ProgressIndicator steps={creationSteps} currentStep={currentStep} />
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${creationProgress}%` }}
              />
            </div>
          </div>
        )}

        <AccessibleForm 
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8"
          aria-label="Create artwork form"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* AI Model Field */}
            <FormFieldWrapper
              label="AI Model"
              name="aiModel"
              required
              hint="Select the AI model to generate your artwork"
              error={getFieldError('aiModel')}
            >
              <ValidatedSelect
                name="aiModel"
                value={values.aiModel}
                onChange={(e) => updateField('aiModel', e.target.value)}
                onBlur={() => handleBlur('aiModel')}
                error={getFieldError('aiModel')}
              >
                <option value="">Select a model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </ValidatedSelect>
            </FormFieldWrapper>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-purple-700"
              >
                <Plus className="h-4 w-4" />
                Register New AI Model
              </button>
            </div>

            {/* Human Contribution Field */}
            <FormFieldWrapper
              label="Human Contribution (%)"
              name="humanContribution"
              required
              hint="Percentage of human contribution to the artwork"
              error={getFieldError('humanContribution')}
            >
              <ValidatedInput
                name="humanContribution"
                type="number"
                min="0"
                max="100"
                value={values.humanContribution}
                onChange={handleHumanContributionChange}
                onBlur={() => handleBlur('humanContribution')}
                error={getFieldError('humanContribution')}
              />
            </FormFieldWrapper>

            {/* AI Contribution Field */}
            <FormFieldWrapper
              label="AI Contribution (%)"
              name="aiContribution"
              required
              hint="Percentage of AI contribution to the artwork"
              error={getFieldError('aiContribution')}
            >
              <ValidatedInput
                name="aiContribution"
                type="number"
                min="0"
                max="100"
                value={values.aiContribution}
                onChange={handleAiContributionChange}
                onBlur={() => handleBlur('aiContribution')}
                error={getFieldError('aiContribution')}
              />
            </FormFieldWrapper>
          </div>

          {/* Contribution Validation Error */}
          {values.humanContribution + values.aiContribution !== 100 && (
            <ValidationMessage
              type="error"
              message="Human and AI contributions must total 100%"
            />
          )}

          {/* Prompt Field */}
          <FormFieldWrapper
            label="Prompt"
            name="prompt"
            required
            hint="Describe the artwork you want to create (minimum 10 characters)"
            error={getFieldError('prompt')}
          >
            <ValidatedTextarea
              name="prompt"
              rows={5}
              value={values.prompt}
              onChange={(e) => updateField('prompt', e.target.value)}
              onBlur={() => handleBlur('prompt')}
              error={getFieldError('prompt')}
              placeholder="Describe the artwork you want to create..."
            />
          </FormFieldWrapper>

          {/* Token URI Field */}
          <FormFieldWrapper
            label="Token URI (Optional)"
            name="tokenURI"
            hint="URL or IPFS URI for the artwork metadata"
            error={getFieldError('tokenURI')}
          >
            <ValidatedInput
              name="tokenURI"
              type="text"
              value={values.tokenURI}
              onChange={(e) => updateField('tokenURI', e.target.value)}
              onBlur={() => handleBlur('tokenURI')}
              error={getFieldError('tokenURI')}
              placeholder="https://metadata.example.com/artwork/1"
            />
          </FormFieldWrapper>

          {/* Advanced Options */}
          <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/60">
            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={showAdvanced}
              aria-controls="advanced-options"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 text-purple-600 shadow-sm dark:bg-gray-900">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Advanced Options</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Metadata controls and generation settings</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-purple-600">{showAdvanced ? 'Hide' : 'Show'}</span>
            </button>

            {showAdvanced && (
              <div id="advanced-options" className="mt-5 grid gap-5 md:grid-cols-2">
                {/* Content Hash Field */}
                <FormFieldWrapper
                  label="Content Hash (Optional)"
                  name="contentHash"
                  hint="SHA-256 hash of the artwork content"
                  error={getFieldError('contentHash')}
                >
                  <div className="flex flex-col gap-3 md:flex-row">
                    <ValidatedInput
                      name="contentHash"
                      type="text"
                      value={values.contentHash}
                      onChange={(e) => updateField('contentHash', e.target.value)}
                      onBlur={() => handleBlur('contentHash')}
                      error={getFieldError('contentHash')}
                      placeholder="0x..."
                      className="font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateField('contentHash', generateHash())}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:text-gray-200"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Generate Hash
                    </button>
                  </div>
                </FormFieldWrapper>

                {/* Can Evolve Checkbox */}
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                  <input
                    id="canEvolve"
                    type="checkbox"
                    checked={values.canEvolve}
                    onChange={(e) => updateField('canEvolve', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="canEvolve" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Can Evolve
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Form Summary */}
          {isDirty && (
            <div className="mt-6">
              <FormSummary errors={errors} />
            </div>
          )}

          {/* Server Errors */}
          {(submitError || storeError) && (
            <ValidationMessage
              type="error"
              message={submitError || storeError}
              className="mt-6"
            />
          )}

          {/* Success Message */}
          {successMessage && (
            <ValidationMessage
              type="success"
              message={successMessage}
              className="mt-6"
            />
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={!isValid || (isDirty && Object.keys(errors).some(field => errors[field]))}
              className="w-full rounded-2xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Artwork
            </button>
          </div>
        </AccessibleForm>

        {/* Preview */}
        {previewArtwork && (
          <div className="mt-6 rounded-3xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-900/40 dark:bg-purple-950/20">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Preview</h3>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={getImageSrc(previewArtwork)}
                alt="Generated artwork preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CreateArtValidated;
