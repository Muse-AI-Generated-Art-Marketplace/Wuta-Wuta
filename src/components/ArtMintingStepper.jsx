import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 'validate', label: 'Validating metadata', estimatedSeconds: 2 },
  { id: 'upload', label: 'Uploading to IPFS', estimatedSeconds: 8 },
  { id: 'generate', label: 'AI generation', estimatedSeconds: 15 },
  { id: 'sign', label: 'Signing transaction', estimatedSeconds: 5 },
  { id: 'confirm', label: 'Confirming on-chain', estimatedSeconds: 20 },
];

function totalEstimatedSeconds(fromStep = 0) {
  return STEPS.slice(fromStep).reduce((sum, s) => sum + s.estimatedSeconds, 0);
}

function formatSeconds(s) {
  if (s < 60) return `~${s}s`;
  return `~${Math.ceil(s / 60)}m`;
}

// Step status: 'pending' | 'active' | 'done' | 'error'
function StepRow({ step, status, errorMessage }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3"
    >
      <div className="mt-0.5 shrink-0">
        {status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        {status === 'active' && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
        {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
        {status === 'pending' && (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            status === 'done'
              ? 'text-green-700 dark:text-green-400'
              : status === 'active'
              ? 'text-purple-700 dark:text-purple-300'
              : status === 'error'
              ? 'text-red-700 dark:text-red-400'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {step.label}
          {status === 'active' && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {formatSeconds(step.estimatedSeconds)} remaining
            </span>
          )}
        </p>
        {status === 'error' && errorMessage && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
        )}
      </div>
    </motion.div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

/**
 * ArtMintingStepper
 *
 * Props:
 *   onMint: async () => void  — called to execute the actual minting logic
 *   onComplete: (result) => void  — called when minting succeeds
 *   onCancel: () => void  — called when user cancels
 *   artworkData: object  — metadata preview (title, prompt, aiModel)
 */
const ArtMintingStepper = ({ onMint, onComplete, onCancel, artworkData = {} }) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [stepStatuses, setStepStatuses] = useState(
    STEPS.map(() => 'pending')
  );
  const [errorStep, setErrorStep] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const progress =
    currentStep < 0
      ? 0
      : isDone
      ? 100
      : Math.round(((currentStep + 0.5) / STEPS.length) * 100);

  const remainingSeconds =
    currentStep >= 0 && !isDone && errorStep === null
      ? totalEstimatedSeconds(currentStep)
      : null;

  const setStatus = useCallback((stepIndex, status) => {
    setStepStatuses((prev) => {
      const next = [...prev];
      next[stepIndex] = status;
      return next;
    });
  }, []);

  const runMinting = useCallback(async () => {
    setIsMinting(true);
    setErrorStep(null);
    setErrorMessage('');
    setIsDone(false);
    setStepStatuses(STEPS.map(() => 'pending'));

    try {
      for (let i = 0; i < STEPS.length; i++) {
        setCurrentStep(i);
        setStatus(i, 'active');

        if (i === STEPS.length - 1 && onMint) {
          // Last step: run actual mint
          await onMint();
        } else {
          // Simulate step duration
          await new Promise((res) => setTimeout(res, STEPS[i].estimatedSeconds * 100));
        }

        setStatus(i, 'done');
      }

      setIsDone(true);
      if (onComplete) onComplete({ success: true });
    } catch (err) {
      const failedStep = currentStep >= 0 ? currentStep : 0;
      setStatus(failedStep, 'error');
      setErrorStep(failedStep);
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsMinting(false);
    }
  }, [onMint, onComplete, currentStep, setStatus]);

  const handleRetry = useCallback(() => {
    setCurrentStep(-1);
    runMinting();
  }, [runMinting]);

  // Auto-start when component mounts
  useEffect(() => {
    runMinting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-bold">Minting Artwork</h2>
        </div>
        {artworkData.title && (
          <p className="text-sm text-white/70 truncate">{artworkData.title}</p>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Progress bar + time estimate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{isDone ? 'Complete!' : errorStep !== null ? 'Failed' : isMinting ? 'In progress…' : 'Starting…'}</span>
            {remainingSeconds !== null && (
              <span>{formatSeconds(remainingSeconds)} total remaining</span>
            )}
          </div>
          <ProgressBar progress={progress} />
          <p className="text-right text-xs text-gray-400">{progress}%</p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              status={stepStatuses[index]}
              errorMessage={index === errorStep ? errorMessage : ''}
            />
          ))}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {errorStep !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-4 py-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Minting failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success banner */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-2xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/30 px-4 py-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                Artwork minted successfully!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {errorStep !== null && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
          {!isMinting && onCancel && (
            <button
              onClick={onCancel}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {isDone ? 'Close' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtMintingStepper;
