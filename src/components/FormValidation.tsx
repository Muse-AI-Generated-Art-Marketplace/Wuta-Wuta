import React from 'react';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

// Type definitions
export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  isValidating?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface ValidationMessageProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  className?: string;
  showIcon?: boolean;
}

export interface FormFieldWrapperProps {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  isValidating?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible form field wrapper with validation support
 * 
 * Features:
 * - Proper ARIA attributes
 * - Error and hint association
 * - Screen reader support
 * - Visual validation states
 */
export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  name,
  required = false,
  hint,
  error,
  isValidating = false,
  children,
  className = '',
}) => {
  const fieldId = `${name}-field`;
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      {/* Field */}
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required ? 'true' : 'false',
          className: `${(children as React.ReactElement).props.className || ''} ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          } ${
            isValidating ? 'opacity-75' : ''
          }`,
        })}
        
        {/* Validating indicator */}
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" aria-hidden="true" />
          </div>
        )}
        
        {/* Success indicator */}
        {!error && !isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Hint */}
      {hint && (
        <p 
          id={hintId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {hint}
        </p>
      )}

      {/* Error */}
      {error && (
        <div 
          id={errorId}
          className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Validation message component with accessibility support
 */
export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type,
  message,
  className = '',
  showIcon = true,
}) => {
  const baseClasses = 'flex items-start gap-2 p-3 rounded-lg text-sm';
  
  const typeClasses = {
    error: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
  };

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
    warning: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {showIcon && <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
};

/**
 * Enhanced input component with built-in validation support
 */
export const ValidatedInput: React.FC<{
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string | null;
  isValidating?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  isValidating,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${name}-error` : undefined}
    />
  );
};

/**
 * Enhanced textarea component with built-in validation support
 */
export const ValidatedTextarea: React.FC<{
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  error?: string | null;
  isValidating?: boolean;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}> = ({
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  isValidating,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
}) => {
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      rows={rows}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${name}-error` : undefined}
    />
  );
};

/**
 * Enhanced select component with built-in validation support
 */
export const ValidatedSelect: React.FC<{
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string | null;
  isValidating?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({
  name,
  value,
  onChange,
  onBlur,
  error,
  isValidating,
  required = false,
  disabled = false,
  className = '',
  children,
}) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      {children}
    </select>
  );
};

/**
 * Form progress indicator showing validation status
 */
export const FormProgress: React.FC<{
  totalFields: number;
  validFields: number;
  className?: string;
}> = ({ totalFields, validFields, className = '' }) => {
  const progress = totalFields > 0 ? (validFields / totalFields) * 100 : 0;
  const remainingFields = totalFields - validFields;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Form Progress
        </span>
        <span className={`font-medium ${
          remainingFields === 0 ? 'text-green-600' : 'text-blue-600'
        }`}>
          {validFields} of {totalFields} complete
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${
            remainingFields === 0 
              ? 'bg-green-500' 
              : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={validFields}
          aria-valuemin={0}
          aria-valuemax={totalFields}
          aria-label={`Form progress: ${validFields} of ${totalFields} fields complete`}
        />
      </div>
      
      {remainingFields > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {remainingFields} field{remainingFields !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  );
};

/**
 * Form summary showing all validation errors
 */
export const FormSummary: React.FC<{
  errors: Record<string, string | null>;
  className?: string;
}> = ({ errors, className = '' }) => {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error);

  if (errorEntries.length === 0) {
    return (
      <ValidationMessage
        type="success"
        message="All fields are valid"
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
        Please fix the following issues:
      </h3>
      <ul className="space-y-1 text-sm">
        {errorEntries.map(([field, error]) => (
          <li key={field} className="flex items-start gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>
              <strong>{field}:</strong> {error}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Accessible form wrapper with proper ARIA attributes
 */
export const AccessibleForm: React.FC<{
  onSubmit: (e: React.FormEvent) => void;
  noValidate?: boolean;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
}> = ({ 
  onSubmit, 
  noValidate = true, 
  className = '', 
  children,
  ...ariaProps 
}) => {
  return (
    <form
      onSubmit={onSubmit}
      noValidate={noValidate}
      className={className}
      {...ariaProps}
    >
      {children}
    </form>
  );
};

/**
 * Field-level help text with accessibility support
 */
export const FieldHelp: React.FC<{
  id: string;
  text: string;
  type?: 'hint' | 'error' | 'success';
  className?: string;
}> = ({ id, text, type = 'hint', className = '' }) => {
  const baseClasses = 'text-sm';
  const typeClasses = {
    hint: 'text-gray-500 dark:text-gray-400',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
  };

  return (
    <p
      id={id}
      className={`${baseClasses} ${typeClasses[type]} ${className}`}
      role={type === 'error' ? 'alert' : undefined}
      aria-live={type === 'error' ? 'polite' : undefined}
    >
      {text}
    </p>
  );
};
