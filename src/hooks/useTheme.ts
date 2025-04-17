import { brandColors, appColors } from '../styles/theme/colors';

/**
 * Custom hook for accessing and using theme colors consistently 
 * throughout the application. This centralizes all color-related 
 * functionality in one place.
 */
export function useTheme() {
  /**
   * Get a CSS class for brand gradients
   * @param variant - The gradient variant to use
   * @param hover - Whether to include hover states
   * @returns CSS class string for the gradient
   */
  const getGradientClass = (
    variant: 'primary' = 'primary',
    hover: boolean = false
  ): string => {
    const baseGradient = 'bg-gradient-to-r';
    
    if (variant === 'primary') {
      // Using hardcoded Tailwind classes instead of dynamic values to ensure it works
      if (hover) {
        return `${baseGradient} from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700`;
      }
      
      return `${baseGradient} from-indigo-600 to-purple-600`;
    }
    
    // Default fallback
    return baseGradient;
  };

  /**
   * Get CSS classes for a button based on variant
   * @param variant - The button variant to use
   * @returns CSS class string for the button
   */
  const getButtonClasses = (
    variant: 'primary' | 'secondary' | 'white' = 'primary',
    size: 'sm' | 'md' | 'lg' = 'md'
  ): string => {
    // Base classes that apply to all buttons
    const baseClasses = 'rounded-md font-medium transition-colors';
    
    // Size-specific classes
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base'
    };
    
    // Variant-specific classes
    if (variant === 'primary') {
      return `${baseClasses} ${sizeClasses[size]} ${getGradientClass('primary', true)} text-white`;
    }
    
    if (variant === 'secondary') {
      return `${baseClasses} ${sizeClasses[size]} bg-white text-[${brandColors.primary[600]}] border border-gray-200 hover:bg-gray-50`;
    }
    
    if (variant === 'white') {
      return `${baseClasses} ${sizeClasses[size]} bg-white text-[${brandColors.primary[600]}] hover:bg-opacity-90`;
    }
    
    // Default fallback
    return `${baseClasses} ${sizeClasses[size]}`;
  };

  /**
   * Get CSS classes for text links
   * @param variant - The link variant to use
   * @returns CSS class string for the link
   */
  const getLinkClasses = (
    variant: 'default' | 'subtle' | 'underline' = 'default'
  ): string => {
    const baseClasses = 'transition-colors';
    
    if (variant === 'underline') {
      return `${baseClasses} text-[${brandColors.primary[600]}] hover:text-[${brandColors.primary[700]}] hover:underline`;
    }
    
    if (variant === 'subtle') {
      return `${baseClasses} text-gray-600 hover:text-[${brandColors.primary[600]}]`;
    }
    
    // Default
    return `${baseClasses} text-[${brandColors.primary[600]}] hover:text-[${brandColors.primary[700]}]`;
  };

  return {
    colors: brandColors,
    appColors,
    getGradientClass,
    getButtonClasses,
    getLinkClasses
  };
}

export default useTheme; 