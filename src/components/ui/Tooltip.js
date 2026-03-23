import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = React.forwardRef(({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const triggerRef = useRef(null);
  
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  const arrows = {
    top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent'
  };
  
  const arrowColors = {
    top: 'border-t-gray-900',
    bottom: 'border-b-gray-900',
    left: 'border-l-gray-900',
    right: 'border-r-gray-900'
  };
  
  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  
  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      {...props}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${positions[position]} ${className}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            {content}
            
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 ${arrows[position]} ${arrowColors[position]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

export default Tooltip;
