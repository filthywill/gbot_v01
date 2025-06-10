import { RefObject } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../types';
import { 
  createSvgElement, 
  createContentGroup, 
  LAYER_ORDER 
} from '../components/GraffitiDisplay/utils/exportUtils';
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
 * Creates an SVG string with content-aware dimensions for thumbnails.
 * This ensures consistent aspect ratios across all devices by calculating
 * dimensions based on the actual graffiti content rather than container size.
 * It uses the SAME helper functions and layer order as the PNG export.
 */
const createContentAwareSvgString = (
  contentRef: HTMLDivElement,
  processedSvgs: ProcessedSvg[],
  customizationOptions: CustomizationOptions,
  contentWidth: number,
  contentHeight: number,
  // The scale factors below are from the on-screen display and are now IGNORED.
  // We calculate a new, thumbnail-specific scale factor for consistency.
  _scaleFactor: number,
  _additionalScaleFactor: number
): string => {
  if (!contentRef || processedSvgs.length === 0) {
    throw new Error('Content reference or SVGs not available');
  }

  // Define a fixed, high-resolution canvas with a 16:9 aspect ratio for the source SVG.
  // This ensures the background layer is never cropped.
  const SVG_WIDTH = 800; // Fixed width for high-res source
  const SVG_HEIGHT = 450; // Fixed height for 16:9 aspect ratio
  const PADDING = 100;     // Padding inside the SVG canvas. Increased from 40 to add more space. The more space added the more the background color fills.

  const svgNamespace = "http://www.w3.org/2000/svg";

  // Calculate a new, thumbnail-specific scale factor to fit the content within our fixed SVG size.
  const availableWidth = SVG_WIDTH - PADDING * 2;
  const availableHeight = SVG_HEIGHT - PADDING * 2;
  const scaleX = contentWidth > 0 ? availableWidth / contentWidth : 0;
  const scaleY = contentHeight > 0 ? availableHeight / contentHeight : 0;
  const thumbnailScale = Math.min(scaleX, scaleY);

  const newSvg = createSvgElement(
    SVG_WIDTH, 
    SVG_HEIGHT, 
    customizationOptions.backgroundEnabled, 
    customizationOptions.backgroundColor
  );
  
  const centerX = SVG_WIDTH / 2;
  const centerY = SVG_HEIGHT / 2;

  // Create the content group using the NEW thumbnail-specific scale factor.
  const contentGroup = createContentGroup(
    svgNamespace,
    centerX,
    centerY,
    thumbnailScale, // Use our new, consistent scale factor
    1.0,            // Additional scale factor is not needed here
    contentWidth,
    contentHeight
  );

  const layerMap = new Map();
  
  LAYER_ORDER.forEach(selector => {
    const elements = contentRef.querySelectorAll(selector);
    if (elements.length > 0) {
      layerMap.set(selector, Array.from(elements));
    }
  });

  LAYER_ORDER.forEach(selector => {
    const layers = layerMap.get(selector);
    if (!layers) return;
    
    layers.forEach((layer: Element) => {
      const svg = layer.querySelector('svg');
      if (!svg) return;
      
      const clonedSvg = svg.cloneNode(true) as SVGElement;
      
      const layerGroup = document.createElementNS(svgNamespace, "g");
      
      const layerStyle = window.getComputedStyle(layer as HTMLElement);
      
      const left = parseFloat(layerStyle.left);
      
      const transform = layerStyle.transform;
      
      layerGroup.setAttribute("transform", `translate(${left}, 0) ${transform}`);
      
      layerGroup.appendChild(clonedSvg);
      
      contentGroup.appendChild(layerGroup);
    });
  });

  newSvg.appendChild(contentGroup);
  
  const serializer = new XMLSerializer();
  return serializer.serializeToString(newSvg);
};

/**
 * Generates a thumbnail using content-aware dimensions to ensure consistent 
 * aspect ratios across desktop and mobile devices.
 * This uses the SAME layer processing as PNG export but with content-aware sizing.
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

    // Use content-aware SVG generation for consistent thumbnails across devices
    const svgString = createContentAwareSvgString(
      contentRef.current,
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
 * Uses object-contain behavior to preserve entire graffiti content without cropping
 */
async function uploadThumbnail(svgString: string, userId: string): Promise<string> {
  // Create canvas for thumbnail
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const thumbWidth = 200;
  const thumbHeight = 112.5; // 16:9 aspect ratio
  canvas.width = thumbWidth;
  canvas.height = thumbHeight;
  
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, thumbWidth, thumbHeight);
        
        // The source SVG now has the same aspect ratio as the thumbnail canvas,
        // so we can draw it directly without letterboxing or cropping.
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        URL.revokeObjectURL(svgUrl);
        
        // Convert to blob and upload to Supabase
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('Failed to create thumbnail blob');
          
          const fileName = `${userId}/${Date.now()}.png`;
          const { data, error } = await supabase.storage
            .from('project-thumbnails')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: false,
              cacheControl: '3600' // Add cache control for better performance
            });
          
          if (error) throw error;
          
          const { data: publicData } = supabase.storage
            .from('project-thumbnails')
            .getPublicUrl(data.path);
          
          resolve(publicData.publicUrl);
        }, 'image/png', 0.9); // Increased quality slightly
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