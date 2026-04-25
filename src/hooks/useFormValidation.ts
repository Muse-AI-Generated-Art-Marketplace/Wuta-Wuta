import { useState, useCallback, useEffect, useRef } from 'react';

// Type definitions for form validation
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  debounce?: number;
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string | null;
}

export interface ValidationState {
  errors: ValidationErrors;
  touched: { [fieldName: string]: boolean };
  isValid: boolean;
  isDirty: boolean;
  isValidating: { [fieldName: string]: boolean };
}

export interface UseFormValidationOptions {
  schema: ValidationSchema;
  initialValues?: { [fieldName: string]: any };
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  accessibility?: {
    announceErrors?: boolean;
    errorAnnouncementDelay?: number;
  };
}

/**
 * Comprehensive form validation hook with real-time feedback and accessibility
 * 
 * Features:
 * - Real-time validation with debouncing
 * - Accessibility support with ARIA attributes and screen reader announcements
 * - Field-level and form-level validation states
 * - Custom validation rules
 * - Error handling and user feedback
 * - Performance optimizations
 */
export function useFormValidation({
  schema,
  initialValues = {},
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  accessibility = {
    announceErrors: true,
    errorAnnouncementDelay: 1000,
  },
}: UseFormValidationOptions) {
  const [values, setValues] = useState<{ [fieldName: string]: any }>(initialValues);
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
    isValidating: {},
  });

  const debounceTimers = useRef<{ [fieldName: string]: NodeJS.Timeout }>({});
  const announcementTimeout = useRef<NodeJS.Timeout | null>(null);
  const previousErrors = useRef<ValidationErrors>({});

  // Accessibility: Announce errors to screen readers
  const announceErrors = useCallback((errors: ValidationErrors) => {
    if (!accessibility.announceErrors) return;

    const newErrors = Object.entries(errors).filter(([field, error]) => 
      error && error !== previousErrors.current[field]
    );

    if (newErrors.length === 0) return;

    // Clear previous timeout
    if (announcementTimeout.current) {
      clearTimeout(announcementTimeout.current);
    }

    announcementTimeout.current = setTimeout(() => {
      const announcement = newErrors
        .map(([field, error]) => `${field}: ${error}`)
        .join(', ');

      const announcementElement = document.createElement('div');
      announcementElement.setAttribute('role', 'status');
      announcementElement.setAttribute('aria-live', 'polite');
      announcementElement.setAttribute('aria-atomic', 'true');
      announcementElement.className = 'sr-only';
      announcementElement.textContent = `Form validation errors: ${announcement}`;

      document.body.appendChild(announcementElement);
      
      setTimeout(() => {
        document.body.removeChild(announcementElement);
      }, 1000);
    }, accessibility.errorAnnouncementDelay);

    previousErrors.current = { ...errors };
  }, [accessibility.announceErrors, accessibility.errorAnnouncementDelay]);

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rules = schema[fieldName];
    if (!rules) return null;

    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type-specific validations
    if (typeof value === 'string') {
      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        return `${fieldName} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `${fieldName} must be no more than ${rules.maxLength} characters`;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return `${fieldName} format is invalid`;
      }
    }

    if (typeof value === 'number') {
      // Range validation
      if (rules.min !== undefined && value < rules.min) {
        return `${fieldName} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return `${fieldName} must be no more than ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    return null;
  }, [schema]);

  // Validate all fields
  const validateAll = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};
    let isValid = true;

    Object.keys(schema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      errors[fieldName] = error;
      if (error) isValid = false;
    });

    return errors;
  }, [schema, values, validateField]);

  // Update field value with validation
  const updateField = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    setValidationState(prev => ({ 
      ...prev, 
      isDirty: true,
      touched: { ...prev.touched, [fieldName]: true }
    }));

    if (validateOnChange) {
      // Clear existing debounce timer for this field
      if (debounceTimers.current[fieldName]) {
        clearTimeout(debounceTimers.current[fieldName]);
      }

      // Set validating state
      setValidationState(prev => ({
        ...prev,
        isValidating: { ...prev.isValidating, [fieldName]: true }
      }));

      // Debounced validation
      const fieldDebounceMs = schema[fieldName]?.debounce || debounceMs;
      debounceTimers.current[fieldName] = setTimeout(() => {
        const error = validateField(fieldName, value);
        
        setValidationState(prev => {
          const newErrors = { ...prev.errors, [fieldName]: error };
          const newIsValid = Object.values(newErrors).every(e => !e);
          
          // Announce errors for accessibility
          announceErrors(newErrors);
          
          return {
            ...prev,
            errors: newErrors,
            isValid: newIsValid,
            isValidating: { ...prev.isValidating, [fieldName]: false }
          };
        });
      }, fieldDebounceMs);
    }
  }, [validateOnChange, schema, debounceMs, validateField, announceErrors]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: string) => {
    setValidationState(prev => ({ 
      ...prev, 
      touched: { ...prev.touched, [fieldName]: true }
    }));

    if (validateOnBlur) {
      const error = validateField(fieldName, values[fieldName]);
      
      setValidationState(prev => {
        const newErrors = { ...prev.errors, [fieldName]: error };
        const newIsValid = Object.values(newErrors).every(e => !e);
        
        // Announce errors for accessibility
        announceErrors(newErrors);
        
        return {
          ...prev,
          errors: newErrors,
          isValid: newIsValid
        };
      });
    }
  }, [validateOnBlur, values, validateField, announceErrors]);

  // Validate form manually
  const validateForm = useCallback(() => {
    const errors = validateAll();
    const isValid = Object.values(errors).every(error => !error);
    
    setValidationState(prev => ({
      ...prev,
      errors,
      isValid,
      touched: Object.keys(schema).reduce((acc, field) => ({ ...acc, [field]: true }), {})
    }));

    announceErrors(errors);
    return { isValid, errors };
  }, [validateAll, schema, announceErrors]);

  // Reset form
  const resetForm = useCallback((newValues?: { [fieldName: string]: any }) => {
    setValues(newValues || initialValues);
    setValidationState({
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
      isValidating: {},
    });

    // Clear all debounce timers
    Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    debounceTimers.current = {};

    if (announcementTimeout.current) {
      clearTimeout(announcementTimeout.current);
      announcementTimeout.current = null;
    }
  }, [initialValues]);

  // Clear field error
  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors, [fieldName]: null };
      const newIsValid = Object.values(newErrors).every(e => !e);
      
      return {
        ...prev,
        errors: newErrors,
        isValid: newIsValid
      };
    });
  }, []);

  // Get field props for accessibility and validation
  const getFieldProps = useCallback((fieldName: string) => ({
    value: values[fieldName] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateField(fieldName, e.target.value);
    },
    onBlur: () => handleBlur(fieldName),
    'aria-invalid': validationState.errors[fieldName] ? 'true' : 'false',
    'aria-describedby': validationState.errors[fieldName] ? `${fieldName}-error` : undefined,
    'aria-required': schema[fieldName]?.required ? 'true' : 'false',
  }), [values, validationState.errors, schema, updateField, handleBlur]);

  // Get error message for a field
  const getFieldError = useCallback((fieldName: string) => {
    return validationState.touched[fieldName] ? validationState.errors[fieldName] : null;
  }, [validationState.errors, validationState.touched]);

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: string) => {
    return !validationState.errors[fieldName];
  }, [validationState.errors]);

  // Check if field is dirty
  const isFieldDirty = useCallback((fieldName: string) => {
    return validationState.touched[fieldName];
  }, [validationState.touched]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
      if (announcementTimeout.current) {
        clearTimeout(announcementTimeout.current);
      }
    };
  }, []);

  return {
    // State
    values,
    validationState,
    
    // Actions
    updateField,
    handleBlur,
    validateForm,
    resetForm,
    clearFieldError,
    
    // Helpers
    getFieldProps,
    getFieldError,
    isFieldValid,
    isFieldDirty,
    
    // Computed
    isValid: validationState.isValid,
    isDirty: validationState.isDirty,
    errors: validationState.errors,
    touched: validationState.touched,
  };
}

// Pre-defined validation rules
export const ValidationRules = {
  required: (message?: string) => ({
    required: true,
    custom: (value: any) => (!value ? message || 'This field is required' : null)
  }),

  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return null;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Please enter a valid email address';
    }
  },

  url: {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      if (!value) return null;
      try {
        new URL(value);
        return /^https?:\/\/.+/.test(value) ? null : 'Please enter a valid URL starting with http:// or https://';
      } catch {
        return 'Please enter a valid URL';
      }
    }
  },

  ethereumAddress: {
    pattern: /^0x[a-fA-F0-9]{40}$/,
    custom: (value: string) => {
      if (!value) return null;
      return /^0x[a-fA-F0-9]{40}$/.test(value) ? null : 'Please enter a valid Ethereum address (0x...)';
    }
  },

  ipfsUri: {
    pattern: /^ipfs:\/\/.+/,
    custom: (value: string) => {
      if (!value) return null;
      return /^ipfs:\/\/.+/.test(value) ? null : 'Please enter a valid IPFS URI (ipfs://...)';
    }
  },

  percentage: {
    min: 0,
    max: 100,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0 || num > 100) return 'Percentage must be between 0 and 100';
      return null;
    }
  },

  minLength: (min: number) => ({
    minLength: min,
    custom: (value: string) => {
      if (!value) return null;
      return value.length >= min ? null : `Must be at least ${min} characters`;
    }
  }),

  maxLength: (max: number) => ({
    maxLength: max,
    custom: (value: string) => {
      if (!value) return null;
      return value.length <= max ? null : `Must be no more than ${max} characters`;
    }
  }),

  range: (min: number, max: number) => ({
    min,
    max,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < min || num > max) return `Must be between ${min} and ${max}`;
      return null;
    }
  }),
};
