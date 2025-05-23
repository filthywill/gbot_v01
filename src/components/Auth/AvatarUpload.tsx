import React, { useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { Upload, Trash2, Camera, Loader } from 'lucide-react';
import Avatar from './Avatar';
import { useProfileManagement } from '../../hooks/useProfileManagement';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface AvatarUploadProps {
  user: User;
  profile: {
    avatar_url: string | null;
  } | null;
  onAvatarUpdate?: (newAvatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  user,
  profile,
  onAvatarUpdate,
  size = 'lg',
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { uploadAvatar, deleteAvatar, isUploading, isSaving, error, clearError } = useProfileManagement();

  const hasCustomAvatar = profile?.avatar_url && 
    !profile.avatar_url.includes('gravatar.com') && 
    !profile.avatar_url.includes('googleapis.com') &&
    !profile.avatar_url.includes('github.com');

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Clear any previous errors
    clearError();

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      const avatarUrl = await uploadAvatar(file, user.id);
      if (avatarUrl && onAvatarUpdate) {
        onAvatarUpdate(avatarUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!hasCustomAvatar) return;

    try {
      const success = await deleteAvatar(user.id);
      if (success && onAvatarUpdate) {
        onAvatarUpdate(null);
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Avatar Display with Upload Zone */}
      <div
        className={cn(
          'relative group',
          sizeClasses[size],
          'rounded-full overflow-hidden cursor-pointer transition-all duration-200',
          dragOver && 'ring-2 ring-brand-primary-500 ring-offset-2 ring-offset-app',
          'hover:ring-2 hover:ring-zinc-500 hover:ring-offset-2 hover:ring-offset-app'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {/* Avatar Image */}        <Avatar           user={user}           profile={profile}          size={size}          className="w-full h-full"          showFallback={true}        />

        {/* Upload Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          (isUploading || isSaving) && 'opacity-100'
        )}>
          {isUploading || isSaving ? (
            <Loader className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 bg-brand-primary-500 bg-opacity-20 flex items-center justify-center border-2 border-brand-primary-500 border-dashed">
            <Upload className="h-6 w-6 text-brand-primary-500" />
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading || isSaving}
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={triggerFileInput}
          disabled={isUploading || isSaving}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>

        {hasCustomAvatar && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteAvatar}
            disabled={isUploading || isSaving}
            className="flex items-center gap-1 text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-secondary">
          Click or drag an image to upload
        </p>
        <p className="text-xs text-secondary">
          JPG, PNG, or WebP • Max 5MB
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-500 text-center max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}; 