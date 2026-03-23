import React from 'react';
import { motion } from 'framer-motion';

const Card = React.forwardRef(({
  children,
  className = '',
  hover = true,
  glass = false,
  padding = 'md',
  shadow = 'md',
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'rounded-xl transition-all duration-300';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  };
  
  const glassClasses = glass 
    ? 'bg-white/80 backdrop-blur-xl border border-white/20' 
    : 'bg-white border border-gray-100';
  
  const hoverClasses = hover 
    ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer' 
    : '';
  
  const classes = `${baseClasses} ${glassClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${hoverClasses} ${className}`;
  
  const MotionComponent = hover || onClick ? motion.div : 'div';
  
  return (
    <MotionComponent
      ref={ref}
      className={classes}
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </MotionComponent>
  );
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <h3 ref={ref} className={`text-xl font-bold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <p ref={ref} className={`text-gray-600 text-sm mt-1 ${className}`} {...props}>
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`${className}`} {...props}>
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`mt-4 pt-4 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export default Card;
