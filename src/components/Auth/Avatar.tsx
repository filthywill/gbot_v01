import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  useEffect(() => {
    const loadAvatar = async () => {
      setIsLoading(true);
      setImageError(false);
      
      // Try to get avatar from social provider metadata
      const socialAvatar = getSocialProviderAvatar(user);
      
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
  }, [user, showFallback]);

  // Extract avatar URL from social provider metadata
  const getSocialProviderAvatar = (user: User): string | null => {
    const metadata = user.user_metadata;
    
    if (!metadata) {
      return null;
    }

    // Handle different social providers
    // Google
    if (metadata.avatar_url) {
      return metadata.avatar_url;
    }
    if (metadata.picture) {
      return metadata.picture;
    }
    
    // GitHub
    if (metadata.avatar_url) {
      return metadata.avatar_url;
    }
    
    // Twitter/X (future)
    if (metadata.profile_image_url) {
      return metadata.profile_image_url;
    }
    
    // Discord (future)
    if (metadata.avatar && metadata.id) {
      const discordUrl = `https://cdn.discordapp.com/avatars/${metadata.id}/${metadata.avatar}.png`;
      return discordUrl;
    }
    
    // LinkedIn (future)
    if (metadata.profilePicture) {
      return metadata.profilePicture;
    }
    
    // Generic fallback for any provider that uses these common fields
    if (metadata.image) {
      return metadata.image;
    }
    if (metadata.photo) {
      return metadata.photo;
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
        sizeClasses[size],
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
          sizeClasses[size],
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
      sizeClasses[size],
      "rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center",
      isClickable && "transition-all duration-200 hover:ring-2 hover:ring-zinc-500 hover:ring-offset-2 hover:ring-offset-zinc-900 cursor-pointer hover:bg-zinc-600",
      className
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