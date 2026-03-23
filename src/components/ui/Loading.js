import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Loading = ({
  size = 'md',
  text,
  className = '',
  overlay = false,
  ...props
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const baseClasses = 'flex items-center justify-center';
  
  const overlayClasses = overlay 
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50' 
    : '';
  
  const classes = `${baseClasses} ${overlayClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      <div className="flex flex-col items-center space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={`${sizes[size]} text-purple-600`} />
        </motion.div>
        
        {text && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${textSizes[size]} text-gray-600 font-medium`}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export const Skeleton = ({
  className = '',
  variant = 'rect',
  width,
  height,
  ...props
}) => {
  const baseClasses = 'bg-gray-200 rounded animate-pulse';
  
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${className}`;
  
  const style = {
    width: width || 'auto',
    height: height || 'auto'
  };
  
  return (
    <div
      className={classes}
      style={style}
      {...props}
    />
  );
};

export const Spinner = ({
  size = 'md',
  className = '',
  color = 'purple',
  ...props
}) => {
  const sizes = {
    xs: 'w-4 h-4 border',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };
  
  const colors = {
    purple: 'border-purple-600 border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    red: 'border-red-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent'
  };
  
  const classes = `${sizes[size]} ${colors[color]} rounded-full animate-spin ${className}`;
  
  return (
    <motion.div
      className={classes}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      {...props}
    />
  );
};

export default Loading;
