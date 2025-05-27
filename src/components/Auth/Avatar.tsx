import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  getCachedAvatar, 
  preloadAndCacheAvatar, 
  generateAvatarCacheKey 
} from '../../utils/avatarCache';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showFallback?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'sm', 
  className = '',
  showFallback = true,
  onClick,
  isClickable = false,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate stable cache key based on user data
  const cacheKey = useMemo(() => {
    return generateAvatarCacheKey(user.id, user.user_metadata, user.email);
  }, [user.id, user.user_metadata?.avatar_url, user.user_metadata?.picture, user.email]);

  // Size configurations - ensure consistent sizing across all states
  const sizeClasses = useMemo(() => ({
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }), []);

  const iconSizes = useMemo(() => ({
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }), []);

  // Extract avatar URL from social provider metadata - optimized
  const getSocialProviderAvatar = useCallback((user: User): string | null => {
    const metadata = user.user_metadata;
    if (!metadata) return null;

    // Check common avatar fields in priority order
    return metadata.avatar_url || 
           metadata.picture || 
           metadata.profile_image_url ||
           metadata.image ||
           metadata.photo ||
           (metadata.avatar && metadata.id ? 
             `https://cdn.discordapp.com/avatars/${metadata.id}/${metadata.avatar}.png` : null) ||
           metadata.profilePicture ||
           null;
  }, []);

  // Generate Gravatar URL - optimized
  const getGravatarUrl = useCallback(async (email: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `https://www.gravatar.com/avatar/${hashHex}?s=80&d=404`;
  }, []);

  // Simplified loading logic
  useEffect(() => {
    const loadAvatar = async () => {
      // Check cache first
      const cachedUrl = getCachedAvatar(cacheKey);
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      
      try {
        // Try social provider avatar first
        const socialAvatar = getSocialProviderAvatar(user);
        
        if (socialAvatar) {
          const cachedUrl = await preloadAndCacheAvatar(socialAvatar, cacheKey);
          setImageUrl(cachedUrl);
          setIsLoading(false);
          return;
        }

        // Fallback to Gravatar if enabled
        if (user.email && showFallback) {
          const gravatarUrl = await getGravatarUrl(user.email);
          const cachedUrl = await preloadAndCacheAvatar(gravatarUrl, `${cacheKey}-gravatar`);
          setImageUrl(cachedUrl);
          setIsLoading(false);
          return;
        }

        // No avatar available
        setIsLoading(false);
        
      } catch (error) {
        setHasError(true);
        setImageUrl(null);
        setIsLoading(false);
      }
    };

    loadAvatar();
  }, [cacheKey, getSocialProviderAvatar, getGravatarUrl, user.email, showFallback]);

  const handleImageError = useCallback(() => {
    setHasError(true);
    setImageUrl(null);
  }, []);

  // Common container classes that ensure fixed dimensions across all states
  const containerClasses = cn(
    sizeClasses[size],
    "rounded-full flex-shrink-0", // flex-shrink-0 prevents size changes
    isClickable && "transition-all duration-200 hover:ring-2 hover:ring-zinc-500 hover:ring-offset-2 hover:ring-offset-zinc-900 cursor-pointer",
    className
  );

  // Show loading state - maintain exact same dimensions
  if (isLoading) {
    return (
      <div className={cn(
        containerClasses,
        "bg-zinc-700 animate-pulse border border-zinc-600"
      )} />
    );
  }

  // Show avatar image if available and not errored
  if (imageUrl && !hasError) {
    const imageElement = (
      <div className={containerClasses}>
        <img
          src={imageUrl}
          alt={`${user.email || 'User'} avatar`}
          className={cn(
            sizeClasses[size],
            "rounded-full object-cover border border-zinc-600"
          )}
          onError={handleImageError}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      </div>
    );

    if (isClickable && onClick) {
      return (
        <button
          onClick={onClick}
          className="focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900 rounded-full"
          aria-label={ariaLabel}
          aria-expanded={ariaExpanded}
        >
          {imageElement}
        </button>
      );
    }

    return imageElement;
  }

  // Fallback to default icon - maintain exact same dimensions
  const fallbackElement = (
    <div className={cn(
      containerClasses,
      "bg-zinc-700 border border-zinc-600 flex items-center justify-center",
      isClickable && "hover:bg-zinc-600"
    )}>
      <UserIcon className={cn(iconSizes[size], "text-zinc-400")} />
    </div>
  );

  if (isClickable && onClick) {
    return (
      <button
        onClick={onClick}
        className="focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900 rounded-full"
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
      >
        {fallbackElement}
      </button>
    );
  }

  return fallbackElement;
};

export default Avatar; 