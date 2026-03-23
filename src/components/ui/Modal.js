import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  ...props
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl border border-gray-100 ${className}`}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              {...props}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  {title && (
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ModalHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

export const ModalTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-xl font-bold text-gray-900 ${className}`} {...props}>
    {children}
  </h2>
);

export const ModalBody = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-t border-gray-100 flex items-center justify-end space-x-3 ${className}`} {...props}>
    {children}
  </div>
);

export default Modal;
