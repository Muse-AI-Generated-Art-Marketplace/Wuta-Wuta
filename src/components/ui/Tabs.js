import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const Tabs = React.forwardRef(({
  children,
  defaultValue,
  className = '',
  orientation = 'horizontal',
  ...props
}, ref) => {
  const [activeTab, setActiveTab] = useState(defaultValue || 0);
  
  const handleTabChange = (index) => {
    setActiveTab(index);
  };
  
  const orientationClasses = orientation === 'vertical'
    ? 'flex flex-col space-y-1'
    : 'flex space-x-1';
  
  return (
    <div ref={ref} className={`space-y-4 ${className}`} {...props}>
      <div className={orientationClasses}>
        {React.Children.map(children, (child, index) => {
          if (child.type.displayName === 'TabsList') {
            return React.cloneElement(child, { activeTab, onTabChange: handleTabChange });
          }
          return child;
        })}
      </div>
      
      <div>
        {React.Children.map(children, (child, index) => {
          if (child.type.displayName === 'TabsContent') {
            return React.cloneElement(child, { isActive: activeTab === index });
          }
          return null;
        })}
      </div>
    </div>
  );
});

Tabs.displayName = 'Tabs';

export const TabsList = ({ children, activeTab, onTabChange, className = '', ...props }) => {
  const baseClasses = 'flex p-1 bg-gray-100 rounded-lg';
  
  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {React.Children.map(children, (child, index) => {
        if (child.type.displayName === 'TabsTrigger') {
          return React.cloneElement(child, {
            isActive: activeTab === index,
            onClick: () => onTabChange(index)
          });
        }
        return child;
      })}
    </div>
  );
};

TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef(({
  children,
  isActive = false,
  onClick,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const baseClasses = 'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20';
  
  const stateClasses = isActive
    ? 'bg-white text-purple-700 shadow-sm'
    : disabled
    ? 'text-gray-400 cursor-not-allowed'
    : 'text-gray-600 hover:text-gray-900';
  
  const classes = `${baseClasses} ${stateClasses} ${className}`;
  
  return (
    <button
      ref={ref}
      className={classes}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = ({
  children,
  isActive = false,
  className = '',
  ...props
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={className}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

TabsContent.displayName = 'TabsContent';

export default Tabs;
