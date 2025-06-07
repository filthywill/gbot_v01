import { RefObject } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../types';
import { createSvgString } from '../components/GraffitiDisplay/utils/pngExport';
import { supabase } from '../lib/supabase';

interface ThumbnailOptions {
  contentRef: RefObject<HTMLDivElement>;
  containerRef: RefObject<HTMLDivElement>;
  processedSvgs: ProcessedSvg[];
  customizationOptions: CustomizationOptions;
  contentWidth: number;
  contentHeight: number;
  scaleFactor: number;
  additionalScaleFactor: number;
  userId: string;
}

/**
 * Generates a thumbnail using the SAME method as our "Save PNG" button
 * This ensures it uses LOOKUP MODE in production, not development processing
 */
export const generateThumbnail = async (options: ThumbnailOptions): Promise<string | null> => {
  try {
    const {
      contentRef,
      containerRef,
      processedSvgs,
      customizationOptions,
      contentWidth,
      contentHeight,
      scaleFactor,
      additionalScaleFactor,
      userId
    } = options;

    // Validate required refs
    if (!contentRef.current || !containerRef.current) {
      console.error('Thumbnail generation failed: Missing content or container refs');
      return null;
    }

    if (processedSvgs.length === 0) {
      console.error('Thumbnail generation failed: No processed SVGs available');
      return null;
    }

    // Use the EXACT same function as our "Save PNG" button
    // This ensures we get production-ready SVGs from LOOKUP MODE
    const svgString = createSvgString(
      contentRef.current,
      containerRef.current,
      processedSvgs,
      customizationOptions,
      contentWidth,
      contentHeight,
      scaleFactor,
      additionalScaleFactor
    );

    // Convert to thumbnail and upload
    return await uploadThumbnail(svgString, userId);
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return null;
  }
};

/**
 * Converts SVG to 200x120 thumbnail PNG and uploads to Supabase Storage
 */
async function uploadThumbnail(svgString: string, userId: string): Promise<string> {
  // Create canvas for thumbnail
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 200;
  canvas.height = 120;
  
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Remove background fill
        // ctx.fillStyle = '#f8f9fa';
        // ctx.fillRect(0, 0, 200, 120);
        
        // Remove padding calculations
        const imgAspect = img.width / img.height;
        const thumbAspect = 200 / 120;
        
        let sx, sy, sWidth, sHeight;

        if (imgAspect > thumbAspect) {
          // Image is wider, crop sides
          sHeight = img.height;
          sWidth = sHeight * thumbAspect;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          // Image is taller, crop top/bottom
          sWidth = img.width;
          sHeight = sWidth / thumbAspect;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }
        
        // Draw the image to cover the entire canvas
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 200, 120);
        URL.revokeObjectURL(svgUrl);
        
        // Convert to blob and upload to Supabase
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('Failed to create thumbnail blob');
          
          const fileName = `${userId}/${Date.now()}.png`;
          const { data, error } = await supabase.storage
            .from('project-thumbnails')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: false
            });
          
          if (error) throw error;
          
          const { data: publicData } = supabase.storage
            .from('project-thumbnails')
            .getPublicUrl(data.path);
          
          resolve(publicData.publicUrl);
        }, 'image/png', 0.8);
      } catch (error) {
        URL.revokeObjectURL(svgUrl);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG for thumbnail'));
    };
    
    img.src = svgUrl;
  });
}

/**
 * Deletes a thumbnail from Supabase Storage
 */
export const deleteThumbnail = async (thumbnailUrl: string): Promise<void> => {
  try {
    const url = new URL(thumbnailUrl);
    const pathParts = url.pathname.split('/');
    const filePath = `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}`;
    
    const { error } = await supabase.storage
      .from('project-thumbnails')
      .remove([filePath]);
    
    if (error) {
      console.error('Failed to delete thumbnail:', error);
    }
  } catch (error) {
    console.error('Thumbnail deletion failed:', error);
  }
}; 