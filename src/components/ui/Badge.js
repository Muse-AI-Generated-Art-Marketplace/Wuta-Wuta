import React from 'react';
import { motion } from 'framer-motion';

const Badge = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';
  
  const variants = {
    primary: 'bg-purple-100 text-purple-800 border border-purple-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    outline: 'border border-gray-300 text-gray-700 bg-transparent'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <motion.span
      ref={ref}
      className={classes}
      whileHover={{ scale: 1.05 }}
      {...props}
    >
      {Icon && <Icon className={`${iconSizes[size]} mr-1`} />}
      {children}
    </motion.span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
