import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const handleError = useCallback((error, errorInfo = null) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    setError(error);
    setErrorInfo(errorInfo);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  const generateErrorId = () => {
    return `HOOK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  };

  return {
    error,
    errorInfo,
    handleError,
    resetError,
    generateErrorId,
    hasError: !!error
  };
};

export default useErrorHandler;
