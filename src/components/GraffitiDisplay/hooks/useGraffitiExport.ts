// src/components/GraffitiDisplay/hooks/useGraffitiExport.ts
import { useCallback, useState, RefObject } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../../../types';
import { exportAsSvg } from '../utils/svgExport';
import { createSvgString, exportAsPng } from '../utils/pngExport';
import { showSuccessMessage } from '../utils/exportUtils';
import { showImprovedMobileImageModal } from '../utils/clipboardUtils';
import { checkRateLimit } from '../../../lib/rateLimit';
import logger from '../../../lib/logger';
import { showError, showSuccess } from '../../../lib/toast';

interface UseGraffitiExportProps {
  processedSvgs: ProcessedSvg[];
  contentRef: RefObject<HTMLDivElement>;
  containerRef: RefObject<HTMLDivElement>;
  contentWidth: number;
  contentHeight: number;
  scaleFactor: number;
  additionalScaleFactor: number;
  customizationOptions: CustomizationOptions;
  inputText?: string;
}

interface UseGraffitiExportReturn {
  isExporting: boolean;
  saveAsSvg: () => void;
  saveAsPng: () => void;
  copyToPngClipboard: () => void;
  shareImage: () => void;
}

export const useGraffitiExport = ({
  processedSvgs,
  contentRef,
  containerRef,
  contentWidth,
  contentHeight,
  scaleFactor,
  additionalScaleFactor,
  customizationOptions,
  inputText = ''
}: UseGraffitiExportProps): UseGraffitiExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  
  // Implementation of SVG export function
  const saveAsSvg = useCallback(() => {
    if (!contentRef.current || !containerRef.current || processedSvgs.length === 0) return;
    
    // Check rate limit before proceeding
    if (!checkRateLimit('svg_export', 'export')) {
      // Toast message is now handled by the rate limiter
      return;
    }
    
    setIsExporting(true);
    
    try {
      exportAsSvg(
        contentRef.current,
        containerRef.current,
        processedSvgs,
        customizationOptions,
        contentWidth,
        contentHeight,
        scaleFactor,
        additionalScaleFactor,
        inputText
      );
      showSuccess('SVG saved successfully!');
    } catch (error) {
      console.error('Error saving SVG:', error);
      showError('Failed to save SVG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [
    processedSvgs, 
    contentRef, 
    containerRef, 
    customizationOptions, 
    inputText, 
    scaleFactor, 
    additionalScaleFactor, 
    contentWidth, 
    contentHeight
  ]);
  
  // Implementation of PNG export function
  const saveAsPng = useCallback(async () => {
    if (!contentRef.current || !containerRef.current || processedSvgs.length === 0) return;
    
    // Check rate limit before proceeding
    if (!checkRateLimit('png_export', 'export')) {
      // Toast message is now handled by the rate limiter
      return;
    }
    
    setIsExporting(true);
    
    try {
      await exportAsPng(
        contentRef.current,
        containerRef.current,
        processedSvgs,
        customizationOptions,
        contentWidth,
        contentHeight,
        scaleFactor,
        additionalScaleFactor,
        inputText
      );
      showSuccess('PNG saved successfully!');
    } catch (error) {
      console.error('Error saving PNG:', error);
      showError('Failed to save PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [
    processedSvgs, 
    contentRef, 
    containerRef, 
    customizationOptions, 
    inputText, 
    scaleFactor, 
    additionalScaleFactor, 
    contentWidth, 
    contentHeight
  ]);
  
  // Implementation of copy to clipboard function - simplified to only use modal
  const copyToClipboard = useCallback(async () => {
    if (!contentRef.current || !containerRef.current || processedSvgs.length === 0) return;
    
    // Check rate limit before proceeding
    if (!checkRateLimit('clipboard_copy', 'export')) {
      // Toast message is now handled by the rate limiter
      return;
    }
    
    setIsExporting(true);
    
    try {
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
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const highResFactor = 1.5;
        
        // Get dimensions from container
        const parentContainer = containerRef.current;
        if (!parentContainer) {
          throw new Error('Parent container ref not available');
        }
        const parentRect = parentContainer.getBoundingClientRect();
        const width = parentRect.width;
        const height = parentRect.height;
        
        let canvasWidth, canvasHeight, drawX, drawY, drawWidth, drawHeight;
        
        if (!customizationOptions.backgroundEnabled) {
          // If background is transparent, we'll crop the canvas to the content with a fixed 1px margin
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (!tempCtx) {
            throw new Error('Could not get temporary canvas context');
          }
          
          // Draw the image on the temporary canvas
          tempCtx.drawImage(img, 0, 0, width, height);
          
          // Get the image data to analyze non-transparent pixels
          const imageData = tempCtx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Find the bounds of non-transparent pixels
          let minX = width;
          let minY = height;
          let maxX = 0;
          let maxY = 0;
          
          // Scan the image data to find the bounding box of non-transparent pixels
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const alpha = data[(y * width + x) * 4 + 3]; // Alpha channel
              if (alpha > 0) { // Non-transparent pixel
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }
          
          // If we found non-transparent pixels
          if (minX < maxX && minY < maxY) {
            // Calculate the content width and height independently
            const contentBoxWidth = maxX - minX;
            const contentBoxHeight = maxY - minY;
            
            // Use a fixed 1px margin on all sides
            const marginX = 1;
            const marginY = 1;
            
            // Calculate the final dimensions with margin
            const finalWidth = contentBoxWidth + (marginX * 2);
            const finalHeight = contentBoxHeight + (marginY * 2);
            
            // Set the canvas dimensions with high resolution factor
            canvasWidth = finalWidth * highResFactor;
            canvasHeight = finalHeight * highResFactor;
            
            // Calculate drawing parameters
            drawX = -minX + marginX;
            drawY = -minY + marginY;
            drawWidth = width;
            drawHeight = height;
          } else {
            // Fallback if no non-transparent pixels found
            canvasWidth = width * highResFactor;
            canvasHeight = height * highResFactor;
            drawX = 0;
            drawY = 0;
            drawWidth = width;
            drawHeight = height;
          }
        } else {
          // If background is enabled, use the full dimensions
          canvasWidth = width * highResFactor;
          canvasHeight = height * highResFactor;
          drawX = 0;
          drawY = 0;
          drawWidth = width;
          drawHeight = height;
        }
        
        // Set the canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image on the canvas with the calculated parameters
        ctx.drawImage(
          img,
          0, 0, width, height, // Source rectangle
          drawX * highResFactor, drawY * highResFactor, // Destination position
          drawWidth * highResFactor, drawHeight * highResFactor // Destination size
        );
        
        // Show the modal with the image
        showImprovedMobileImageModal(canvas.toDataURL('image/png'), inputText);
        URL.revokeObjectURL(svgUrl);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        throw new Error('Failed to load SVG for PNG conversion');
      };
      
      img.src = svgUrl;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    } finally {
      setIsExporting(false);
    }
  }, [
    processedSvgs,
    contentRef,
    containerRef,
    customizationOptions,
    inputText,
    scaleFactor,
    additionalScaleFactor,
    contentWidth,
    contentHeight
  ]);

  // New implementation of share function using Web Share API
  const shareImage = useCallback(async () => {
    if (!contentRef.current || !containerRef.current || processedSvgs.length === 0) return;
    
    setIsExporting(true);
    
    try {
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
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const highResFactor = 1.5;
        
        // Get dimensions from container
        const parentContainer = containerRef.current;
        if (!parentContainer) {
          throw new Error('Parent container ref not available');
        }
        const parentRect = parentContainer.getBoundingClientRect();
        const width = parentRect.width;
        const height = parentRect.height;
        
        let canvasWidth, canvasHeight, drawX, drawY, drawWidth, drawHeight;
        
        if (!customizationOptions.backgroundEnabled) {
          // If background is transparent, we'll crop the canvas to the content with a fixed 1px margin
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (!tempCtx) {
            throw new Error('Could not get temporary canvas context');
          }
          
          // Draw the image on the temporary canvas
          tempCtx.drawImage(img, 0, 0, width, height);
          
          // Get the image data to analyze non-transparent pixels
          const imageData = tempCtx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Find the bounds of non-transparent pixels
          let minX = width;
          let minY = height;
          let maxX = 0;
          let maxY = 0;
          
          // Scan the image data to find the bounding box of non-transparent pixels
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const alpha = data[(y * width + x) * 4 + 3]; // Alpha channel
              if (alpha > 0) { // Non-transparent pixel
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }
          
          // If we found non-transparent pixels
          if (minX < maxX && minY < maxY) {
            // Calculate the content width and height independently
            const contentBoxWidth = maxX - minX;
            const contentBoxHeight = maxY - minY;
            
            // Use a fixed 1px margin on all sides
            const marginX = 1;
            const marginY = 1;
            
            // Calculate the final dimensions with margin
            const finalWidth = contentBoxWidth + (marginX * 2);
            const finalHeight = contentBoxHeight + (marginY * 2);
            
            // Set the canvas dimensions with high resolution factor
            canvasWidth = finalWidth * highResFactor;
            canvasHeight = finalHeight * highResFactor;
            
            // Calculate drawing parameters
            drawX = -minX + marginX;
            drawY = -minY + marginY;
            drawWidth = width;
            drawHeight = height;
          } else {
            // Fallback if no non-transparent pixels found
            canvasWidth = width * highResFactor;
            canvasHeight = height * highResFactor;
            drawX = 0;
            drawY = 0;
            drawWidth = width;
            drawHeight = height;
          }
        } else {
          // If background is enabled, use the full dimensions
          canvasWidth = width * highResFactor;
          canvasHeight = height * highResFactor;
          drawX = 0;
          drawY = 0;
          drawWidth = width;
          drawHeight = height;
        }
        
        // Set the canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image on the canvas with the calculated parameters
        ctx.drawImage(
          img,
          0, 0, width, height, // Source rectangle
          drawX * highResFactor, drawY * highResFactor, // Destination position
          drawWidth * highResFactor, drawHeight * highResFactor // Destination size
        );
        
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) {
            throw new Error('Could not create PNG blob');
          }
          
          try {
            const file = new File([pngBlob], 'graffiti.png', { type: pngBlob.type });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Graffiti Design',
                text: 'Check out my graffiti design!'
              });
              
              showSuccessMessage('Shared successfully!');
            } else {
              throw new Error('Web Share API not supported');
            }
          } catch (error) {
            console.error('Error sharing image:', error);
            showSuccessMessage('Sharing not supported on this device');
          }
          
          URL.revokeObjectURL(svgUrl);
        }, 'image/png', 0.8);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        throw new Error('Failed to load SVG for PNG conversion');
      };
      
      img.src = svgUrl;
    } catch (error) {
      console.error('Error preparing image for share:', error);
    } finally {
      setIsExporting(false);
    }
  }, [
    processedSvgs,
    contentRef,
    containerRef,
    customizationOptions,
    inputText,
    scaleFactor,
    additionalScaleFactor,
    contentWidth,
    contentHeight
  ]);
  
  return {
    isExporting,
    saveAsSvg,
    saveAsPng,
    copyToPngClipboard: copyToClipboard,
    shareImage
  };
};

export default useGraffitiExport; 