import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

// Constants moved outside component to prevent recreation
const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16'
} as const;

const ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
} as const;

// Avatar field priority for social providers (most common first)
const AVATAR_FIELDS = [
  'picture',        // Google primary
  'avatar_url',     // Google/GitHub secondary  
  'profile_image_url', // Twitter/X
  'image',          // Generic fallback
  'photo',          // Generic fallback
  'profilePicture'  // LinkedIn
] as const;

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

const Avatar: React.FC<AvatarProps> = React.memo(({ 
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
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize user metadata extraction
  const socialAvatar = useMemo(() => getSocialProviderAvatar(user), [user]);

  useEffect(() => {
    const loadAvatar = async () => {
      setIsLoading(true);
      setImageError(false);
      
      // Try to get avatar from social provider metadata
      if (socialAvatar) {
        setImageUrl(socialAvatar);
        setIsLoading(false);
        return;
      }

      // Fallback to Gravatar if no social avatar
      if (user.email && showFallback) {
        const gravatarUrl = await getGravatarUrl(user.email);
        setImageUrl(gravatarUrl);
      }
      
      setIsLoading(false);
    };

    loadAvatar();
  }, [user, showFallback, socialAvatar]);

  // Extract avatar URL from social provider metadata
  const getSocialProviderAvatar = (user: User): string | null => {
    const metadata = user.user_metadata;
    
    if (!metadata) return null;

    // Check each field in priority order
    for (const field of AVATAR_FIELDS) {
      if (metadata[field]) {
        return metadata[field];
      }
    }

    // Special case for Discord (requires both avatar and id)
    if (metadata.avatar && metadata.id) {
      return `https://cdn.discordapp.com/avatars/${metadata.id}/${metadata.avatar}.png`;
    }
    
    return null;
  };

  // Generate Gravatar URL
  const getGravatarUrl = async (email: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return Gravatar URL with fallback to 404 (so we can handle the error)
    return `https://www.gravatar.com/avatar/${hashHex}?s=80&d=404`;
  };

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(null);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Show loading state
  if (isLoading && imageUrl) {
    return (
      <div className={cn(
        SIZE_CLASSES[size],
        "rounded-full bg-zinc-700 animate-pulse",
        className
      )} />
    );
  }

  // Show avatar image if available and not errored
  if (imageUrl && !imageError) {
    const imageElement = (
      <img
        src={imageUrl}
        alt={`${user.email || 'User'} avatar`}
        className={cn(
          SIZE_CLASSES[size],
          "rounded-full object-cover border border-zinc-600",
          isClickable && "transition-all duration-200 hover:ring-2 hover:ring-zinc-500 hover:ring-offset-2 hover:ring-offset-zinc-900 cursor-pointer",
          className
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
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

  // Fallback to default icon
  const fallbackElement = (
    <div className={cn(
      SIZE_CLASSES[size],
      "rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center",
      isClickable && "transition-all duration-200 hover:ring-2 hover:ring-zinc-500 hover:ring-offset-2 hover:ring-offset-zinc-900 cursor-pointer hover:bg-zinc-600",
      className
    )}>
      <UserIcon className={cn(ICON_SIZES[size], "text-zinc-400")} />
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
});

Avatar.displayName = 'Avatar';

export default Avatar; 