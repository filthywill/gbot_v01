import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * BrandButton component that uses the theme system for consistent styling
 * throughout the application.
 */
export const BrandButton: React.FC<BrandButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  // Base classes that apply to all buttons
  const baseClasses = 'rounded-md font-medium transition-colors';
  
  // Size-specific classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  // Variant-specific classes
  let variantClasses = '';
  if (variant === 'primary') {
    variantClasses = 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white';
  } else if (variant === 'secondary') {
    variantClasses = 'bg-white text-indigo-600 border border-gray-200 hover:bg-gray-50';
  } else if (variant === 'white') {
    variantClasses = 'bg-white text-indigo-600 hover:bg-opacity-90';
  }
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default BrandButton; 