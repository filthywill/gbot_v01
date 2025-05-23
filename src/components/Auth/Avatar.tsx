import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showFallback?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'sm', 
  className = '',
  showFallback = true 
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
      
      // Debug logging to see what metadata we have
      console.log('🔍 Avatar Debug - Full user object:', user);
      console.log('🔍 Avatar Debug - User metadata:', user.user_metadata);
      console.log('🔍 Avatar Debug - User email:', user.email);
      
      // Try to get avatar from social provider metadata
      const socialAvatar = getSocialProviderAvatar(user);
      console.log('🔍 Avatar Debug - Social avatar URL:', socialAvatar);
      
      if (socialAvatar) {
        setImageUrl(socialAvatar);
        setIsLoading(false);
        return;
      }

      // Fallback to Gravatar if no social avatar
      if (user.email && showFallback) {
        const gravatarUrl = await getGravatarUrl(user.email);
        console.log('🔍 Avatar Debug - Gravatar URL:', gravatarUrl);
        setImageUrl(gravatarUrl);
      }
      
      setIsLoading(false);
    };

    loadAvatar();
  }, [user, showFallback]);

  // Extract avatar URL from social provider metadata
  const getSocialProviderAvatar = (user: User): string | null => {
    const metadata = user.user_metadata;
    
    console.log('🔍 getSocialProviderAvatar - Checking metadata:', metadata);
    
    if (!metadata) {
      console.log('🔍 getSocialProviderAvatar - No metadata found');
      return null;
    }

    // Handle different social providers
    // Google
    if (metadata.avatar_url) {
      console.log('🔍 getSocialProviderAvatar - Found avatar_url:', metadata.avatar_url);
      return metadata.avatar_url;
    }
    if (metadata.picture) {
      console.log('🔍 getSocialProviderAvatar - Found picture:', metadata.picture);
      return metadata.picture;
    }
    
    // GitHub
    if (metadata.avatar_url) {
      console.log('🔍 getSocialProviderAvatar - Found GitHub avatar_url:', metadata.avatar_url);
      return metadata.avatar_url;
    }
    
    // Twitter/X (future)
    if (metadata.profile_image_url) {
      console.log('🔍 getSocialProviderAvatar - Found profile_image_url:', metadata.profile_image_url);
      return metadata.profile_image_url;
    }
    
    // Discord (future)
    if (metadata.avatar && metadata.id) {
      const discordUrl = `https://cdn.discordapp.com/avatars/${metadata.id}/${metadata.avatar}.png`;
      console.log('🔍 getSocialProviderAvatar - Found Discord avatar:', discordUrl);
      return discordUrl;
    }
    
    // LinkedIn (future)
    if (metadata.profilePicture) {
      console.log('🔍 getSocialProviderAvatar - Found profilePicture:', metadata.profilePicture);
      return metadata.profilePicture;
    }
    
    // Generic fallback for any provider that uses these common fields
    if (metadata.image) {
      console.log('🔍 getSocialProviderAvatar - Found image:', metadata.image);
      return metadata.image;
    }
    if (metadata.photo) {
      console.log('🔍 getSocialProviderAvatar - Found photo:', metadata.photo);
      return metadata.photo;
    }
    
    console.log('🔍 getSocialProviderAvatar - No avatar found in metadata');
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
    console.log('🔍 Avatar Debug - Image failed to load:', imageUrl);
    console.log('🔍 Avatar Debug - Current hostname:', window.location.hostname);
    console.log('🔍 Avatar Debug - Is localhost?', window.location.hostname === 'localhost');
    
    // Check if this might be a Google profile picture CORS issue
    if (imageUrl && imageUrl.includes('googleusercontent.com')) {
      console.log('🚨 Avatar Debug - Google profile picture failed! This is likely due to localhost CORS restrictions');
      console.log('💡 Avatar Debug - Try using 127.0.0.1:3000 instead of localhost:3000');
    }
    
    setImageError(true);
    setImageUrl(null);
  };

  const handleImageLoad = () => {
    console.log('🔍 Avatar Debug - Image loaded successfully:', imageUrl);
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
    return (
      <img
        src={imageUrl}
        alt={`${user.email || 'User'} avatar`}
        className={cn(
          sizeClasses[size],
          "rounded-full object-cover border border-zinc-600",
          className
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    );
  }

  // Fallback to default icon
  return (
    <div className={cn(
      sizeClasses[size],
      "rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center",
      className
    )}>
      <UserIcon className={cn(iconSizes[size], "text-zinc-400")} />
    </div>
  );
};

export default Avatar; 