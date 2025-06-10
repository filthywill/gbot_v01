import React, { useState, useRef, useEffect } from 'react';
import { SavedProject } from '../services/projectService';
import { X, Edit2, Check, X as Cancel } from 'lucide-react';

interface SavedProjectCardProps {
  project: SavedProject;
  onLoad: (project: SavedProject) => void;
  onDelete: (projectId: string) => void;
  onUpdateName: (projectId: string, newName: string) => Promise<SavedProject | null>;
}

export const SavedProjectCard: React.FC<SavedProjectCardProps> = ({
  project,
  onLoad,
  onDelete,
  onUpdateName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(project.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLoad = () => {
    if (!isEditing) onLoad(project);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(project.name);
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditValue(project.name);
  };

  const handleEditSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editValue.trim() === project.name.trim()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    const result = await onUpdateName(project.id, editValue.trim());
    setIsUpdating(false);
    
    if (result) {
      setIsEditing(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave(e as any);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel(e as any);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /**
   * Calculates a dynamic scale for the thumbnail image based on the input text length.
   * This uses a tiered system inspired by the main graffiti display's scaling logic
   * to create a "smart zoom" effect. Shorter text is scaled up more to appear
   * more prominently in the thumbnail.
   * @returns {number} The calculated scale factor.
   */
  const getSmartScale = () => {
    const textLength = project.inputText.length;

    // --- ADJUST THE TIERS BELOW TO TWEAK THE ZOOM BEHAVIOR ---
    // This function uses a tiered scaling system based on the length of the text.
    // Shorter text gets a larger scale value (more "zoom") to fill the thumbnail space.

    if (textLength <= 0) return 1.1; // Default for no text
    if (textLength <= 4) {
      return 1.3; // Max zoom for 1-3 characters
    }
    if (textLength <= 6) {
      return 1.4 // High zoom for 4-5 characters
    }
    if (textLength <= 8) {
      return 1.5; // Medium zoom for 6-8 characters
    }
    if (textLength <= 9) {
      return 1.6; // Medium zoom for 6-8 characters
    }
    if (textLength <= 10) {
      return 2.1; // Low zoom for 9-12 characters
    }
    if (textLength <= 12) {
      return 2.3; // Low zoom for 9-12 characters
    }
    if (textLength <= 18) {
      return 2.5; // Low zoom for 9-12 characters
    }
    // Default, minimal zoom for very long text (> 12 characters)
    return 1.1;
  };

  const imageScale = getSmartScale();
  
  return (
    <div 
      className="group flex items-center gap-3 bg-panel border border-app rounded p-0.5 cursor-pointer hover:border-brand-primary-500 transition-colors"
      onClick={handleLoad}
      title={`Load project: "${project.name}"`}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-7 bg-panel border border-app rounded overflow-hidden flex-shrink-0">
        {project.thumbnailUrl ? (
          <>
            <div className="absolute inset-0 bg-checkerboard" />
            <img
              src={project.thumbnailUrl}
              alt={project.name}
              className="relative w-full h-full object-cover"
              style={{ transform: `scale(${imageScale})` }}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-neutral-100">
            <span className="text-brand-neutral-400 text-xs font-medium">
              {project.inputText.substring(0, 6)}...
            </span>
          </div>
        )}
      </div>
      
      {/* Project Name */}
      <div className="flex-1 min-w-0 flex items-center gap-1">
        {isEditing ? (
          <div className="flex items-center gap-1 w-full">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm font-medium bg-brand-neutral-100 text-brand-neutral-900 border border-brand-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary-500"
              maxLength={50}
              disabled={isUpdating}
            />
            <button
              onClick={handleEditSave}
              disabled={isUpdating || !editValue.trim()}
              className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save name"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleEditCancel}
              disabled={isUpdating}
              className="flex-shrink-0 w-5 h-5 bg-brand-neutral-600 text-white rounded-full flex items-center justify-center hover:bg-brand-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel editing"
            >
              <Cancel className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 w-full">
            <span className="text-sm font-medium text-primary truncate block flex-1">
              {project.name}
            </span>
            <button
              onClick={handleEditStart}
              className="flex-shrink-0 w-4 h-4 text-brand-neutral-400 hover:text-brand-primary-500 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out"
              title="Edit project name"
            >
              <Edit2 className="w-3 h-3" />
            </button>
        </div>
        )}
      </div>
      
      {/* Delete Button */}
      {!isEditing && (
        <button
          onClick={handleDelete}
          className="flex-shrink-0 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out hover:bg-red-700 hover:scale-110"
          title="Delete project"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}; 