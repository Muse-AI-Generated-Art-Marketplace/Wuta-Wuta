import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Dropdown = React.forwardRef(({
  trigger,
  children,
  position = 'bottom-right',
  className = '',
  disabled = false,
  ...props
}, _ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const positions = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1',
    'left': 'top-1/2 right-full mr-1 transform -translate-y-1/2',
    'right': 'top-1/2 left-full ml-1 transform -translate-y-1/2'
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);
  
  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };
  
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`} {...props}>
      <div
        onClick={handleTriggerClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTriggerClick();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      >
        {trigger}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 ${positions[position]}`}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

export const DropdownItem = React.forwardRef(({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'flex items-center px-4 py-2 text-sm transition-colors focus:outline-none';
  
  const stateClasses = danger
    ? 'text-red-700 hover:bg-red-50 focus:bg-red-50'
    : disabled
    ? 'text-gray-400 cursor-not-allowed'
    : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-50';
  
  const classes = `${baseClasses} ${stateClasses} ${className}`;
  
  return (
    <button
      ref={ref}
      className={classes}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-3 flex-shrink-0" />}
      {children}
    </button>
  );
});

DropdownItem.displayName = 'DropdownItem';

export const DropdownSeparator = ({ className = '', ...props }) => (
  <div
    className={`border-t border-gray-100 my-1 ${className}`}
    {...props}
  />
);

DropdownSeparator.displayName = 'DropdownSeparator';

export const DropdownHeader = ({ children, className = '', ...props }) => (
  <div
    className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}
    {...props}
  >
    {children}
  </div>
);

DropdownHeader.displayName = 'DropdownHeader';

export default Dropdown;
