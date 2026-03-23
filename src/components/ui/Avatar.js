import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const Avatar = React.forwardRef(({
  src,
  alt,
  size = 'md',
  fallback,
  className = '',
  border = false,
  ...props
}, ref) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };
  
  const baseClasses = `relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white font-medium shadow-md overflow-hidden`;
  
  const borderClasses = border ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-50' : '';
  
  const classes = `${baseClasses} ${sizes[size]} ${borderClasses} ${className}`;
  
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const renderFallback = () => {
    if (fallback) {
      return <span className="font-medium">{getInitials(fallback)}</span>;
    }
    return <User className="w-1/2 h-1/2" />;
  };
  
  return (
    <motion.div
      ref={ref}
      className={classes}
      whileHover={{ scale: 1.05 }}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : null}
      {!src && renderFallback()}
    </motion.div>
  );
});

Avatar.displayName = 'Avatar';

export const AvatarGroup = ({
  children,
  max = 4,
  size = 'md',
  className = '',
  ...props
}) => {
  const avatars = React.Children.toArray(children);
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  
  const sizes = {
    xs: '-space-x-1',
    sm: '-space-x-1.5',
    md: '-space-x-2',
    lg: '-space-x-2.5',
    xl: '-space-x-3',
    '2xl': '-space-x-4'
  };
  
  return (
    <div className={`flex items-center ${sizes[size]} ${className}`} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className="relative">
          {React.cloneElement(avatar, {
            size,
            border: true,
            className: avatar.props.className || ''
          })}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={`relative flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium border-2 border-white shadow-md ${sizes[size]}`}
          title={`+${remainingCount} more`}
        >
          <span className="text-xs">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;
