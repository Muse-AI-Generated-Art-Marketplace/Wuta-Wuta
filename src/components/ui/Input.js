import React from 'react';
import { motion } from 'framer-motion';

const Input = React.forwardRef(({
  type = 'text',
  label,
  placeholder,
  error,
  helper,
  required = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const baseClasses = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500 bg-white hover:border-gray-300';
  
  const iconClasses = Icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : '';
  
  const classes = `${baseClasses} ${stateClasses} ${iconClasses} ${className}`;
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        
        <motion.input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={classes}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <Icon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({
  label,
  placeholder,
  error,
  helper,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed resize-none';
  
  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500 bg-white hover:border-gray-300';
  
  const classes = `${baseClasses} ${stateClasses} ${className}`;
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <motion.textarea
        ref={ref}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={classes}
        whileFocus={{ scale: 1.01 }}
        {...props}
      />
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
