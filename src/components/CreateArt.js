import React, { useMemo, useState } from 'react';
import { CheckCircle2, Cpu, Plus, RefreshCw, Settings2, Sparkles } from 'lucide-react';

import { useMuseStore } from '../store/museStore';

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

const defaultAdvancedParameters = {
  temperature: 0.8,
  topK: 50,
  topP: 0.9,
  guidanceScale: 7.5,
  numInferenceSteps: 50,
};

const CreateArt = () => {
  const store = useMuseStore();
  const isConnected = store.isConnected || Boolean(store.userAddress);
  const isLoading = store.isLoading;
  const clearError = store.clearError;
  const setAdvancedParameters = store.setAdvancedParameters;
  const registerAIModel = store.registerAIModel;
  const createArtworkAction = store.createArtwork || store.createCollaborativeArtwork;
  const models = useMemo(() => normalizeModels(store.aiModels), [store.aiModels]);
  const advancedParameters = store.advancedParameters || defaultAdvancedParameters;

  const [form, setForm] = useState({
    aiModel: models[0]?.id || '',
    humanContribution: 50,
    aiContribution: 50,
    prompt: '',
    tokenURI: '',
    contentHash: '',
    canEvolve: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerModelName, setRegisterModelName] = useState('');
  const [registerModelDescription, setRegisterModelDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleHumanContributionChange = (event) => {
    const nextHuman = clampContribution(event.target.value);
    updateField('humanContribution', nextHuman);
    updateField('aiContribution', 100 - nextHuman);
  };

  const handleAiContributionChange = (event) => {
    const nextAi = clampContribution(event.target.value);
    updateField('aiContribution', nextAi);
    updateField('humanContribution', 100 - nextAi);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.aiModel) nextErrors.aiModel = 'AI Model is required';
    if (!form.prompt.trim()) nextErrors.prompt = 'Prompt is required';

    if (!form.tokenURI.trim()) {
      nextErrors.tokenURI = 'Token URI is required';
    } else if (!isValidUri(form.tokenURI.trim())) {
      nextErrors.tokenURI = 'Please enter a valid URI';
    }

    if (form.humanContribution < 0 || form.humanContribution > 100) {
      nextErrors.humanContribution = 'Contribution must be between 0 and 100';
    }

    if (form.aiContribution < 0 || form.aiContribution > 100) {
      nextErrors.aiContribution = 'Contribution must be between 0 and 100';
    }

    if (form.humanContribution + form.aiContribution !== 100) {
      nextErrors.contributions = 'Contributions must sum to 100%';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegisterModel = async (event) => {
    event.preventDefault();
    if (!registerModelName.trim()) return;

    const payload = {
      id: registerModelName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: registerModelName.trim(),
      description: registerModelDescription.trim(),
    };

    try {
      if (registerAIModel) {
        await registerAIModel(payload);
      }

      setForm((current) => ({ ...current, aiModel: payload.id }));
      setShowRegisterModal(false);
      setRegisterModelName('');
      setRegisterModelDescription('');
    } catch (error) {
      setSubmitError(error.message || 'Failed to register AI model');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setSubmitError('');

    if (!validateForm()) return;

    if (!createArtworkAction) {
      setSubmitError('Artwork creation is not available in the current store.');
      return;
    }

    try {
      const payload = {
        aiModel: form.aiModel,
        prompt: form.prompt.trim(),
        tokenURI: form.tokenURI.trim(),
        humanContribution: form.humanContribution,
        aiContribution: form.aiContribution,
        contentHash: form.contentHash || generateHash(),
        canEvolve: form.canEvolve,
      };

      await createArtworkAction(payload);
      setSuccessMessage('Artwork created successfully.');
      setForm((current) => ({
        ...current,
        prompt: '',
        tokenURI: '',
        contentHash: '',
      }));
    } catch (error) {
      setSubmitError(error.message || 'Creation failed');
    }
  };

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

        <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="aiModel" className="text-sm font-semibold text-gray-900 dark:text-white">
                AI Model
              </label>
              <select
                id="aiModel"
                value={form.aiModel}
                onChange={(event) => updateField('aiModel', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Select a model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {errors.aiModel && <p className="text-sm text-red-600">{errors.aiModel}</p>}
            </div>

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

            <div className="space-y-2">
              <label htmlFor="humanContribution" className="text-sm font-semibold text-gray-900 dark:text-white">
                Human Contribution (%)
              </label>
              <input
                id="humanContribution"
                type="number"
                min="0"
                max="100"
                value={form.humanContribution}
                onChange={handleHumanContributionChange}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
              {errors.humanContribution && <p className="text-sm text-red-600">{errors.humanContribution}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="aiContribution" className="text-sm font-semibold text-gray-900 dark:text-white">
                AI Contribution (%)
              </label>
              <input
                id="aiContribution"
                type="number"
                min="0"
                max="100"
                value={form.aiContribution}
                onChange={handleAiContributionChange}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
              {errors.aiContribution && <p className="text-sm text-red-600">{errors.aiContribution}</p>}
            </div>
          </div>

          {errors.contributions && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {errors.contributions}
            </div>
          )}

          <div className="mt-6 space-y-2">
            <label htmlFor="prompt" className="text-sm font-semibold text-gray-900 dark:text-white">
              Prompt
            </label>
            <textarea
              id="prompt"
              rows={5}
              value={form.prompt}
              onChange={(event) => updateField('prompt', event.target.value)}
              placeholder="Describe the artwork you want to create..."
              className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-4 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            {errors.prompt && <p className="text-sm text-red-600">{errors.prompt}</p>}
          </div>

          <div className="mt-6 space-y-2">
            <label htmlFor="tokenURI" className="text-sm font-semibold text-gray-900 dark:text-white">
              Token URI
            </label>
            <input
              id="tokenURI"
              type="text"
              value={form.tokenURI}
              onChange={(event) => updateField('tokenURI', event.target.value)}
              placeholder="https://metadata.example.com/artwork/1"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            {errors.tokenURI && <p className="text-sm text-red-600">{errors.tokenURI}</p>}
          </div>

          <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/60">
            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
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
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="contentHash" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Content Hash
                  </label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <input
                      id="contentHash"
                      type="text"
                      value={form.contentHash}
                      onChange={(event) => updateField('contentHash', event.target.value)}
                      placeholder="0x..."
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                  <input
                    id="canEvolve"
                    type="checkbox"
                    checked={form.canEvolve}
                    onChange={(event) => updateField('canEvolve', event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Can Evolve</span>
                </label>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                  <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Generation Controls</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Temperature {advancedParameters.temperature}, Top K {advancedParameters.topK}, Top P {advancedParameters.topP}, Guidance {advancedParameters.guidanceScale}, Steps {advancedParameters.numInferenceSteps}
                  </p>
                  {setAdvancedParameters && (
                    <button
                      type="button"
                      onClick={() => setAdvancedParameters(defaultAdvancedParameters)}
                      className="mt-3 text-sm font-semibold text-purple-600"
                    >
                      Reset advanced parameters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {(submitError || store.error) && (
            <div className="mt-6 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              <p>{submitError || store.error}</p>
              {clearError && (
                <button type="button" onClick={clearError} className="font-semibold text-red-700 dark:text-red-300">
                  Clear
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <p>{successMessage}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Contribution split: <span className="font-semibold text-gray-900 dark:text-white">{form.humanContribution}% Human / {form.aiContribution}% AI</span>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4" />
              {isLoading ? 'Creating artwork...' : 'Create Artwork'}
            </button>
          </div>
        </form>
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register AI Model</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add a new model option for future artwork generation.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRegisterModel} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="modelName" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Model Name
                </label>
                <input
                  id="modelName"
                  type="text"
                  value={registerModelName}
                  onChange={(event) => setRegisterModelName(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="modelDescription" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Description
                </label>
                <textarea
                  id="modelDescription"
                  rows={3}
                  value={registerModelDescription}
                  onChange={(event) => setRegisterModelDescription(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded-2xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 font-semibold text-white"
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CreateArt;
