// src/components/GraffitiDisplay/GraffitiContent.tsx
import React, { useMemo, useRef, useLayoutEffect, useState, useEffect, useCallback } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../../types';
import { useGraffitiScaling } from './hooks/useGraffitiScaling';
import { MemoizedGraffitiLayers } from './MemoizedGraffitiLayers';
import '../../styles/graffitiContent.css';

interface GraffitiContentProps {
  processedSvgs: ProcessedSvg[];
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  customizationOptions: CustomizationOptions;
  inputText?: string;
}

// Simplified component with better performance
const GraffitiContent: React.FC<GraffitiContentProps> = ({
  processedSvgs,
  positions,
  contentWidth,
  contentHeight,
  containerScale,
  customizationOptions,
  inputText = ''
}) => {
  // Use a ref to track previous SVGs for optimization
  const prevSvgsRef = useRef<ProcessedSvg[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // State for animation control
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // State for export buttons
  const [isExporting, setIsExporting] = useState(false);
  
  // Apply an additional scaling factor to make content smaller
  // Adjust this value to fine-tune the overall size (0.9 = 90% of original size)
  const additionalScaleFactor = 0.9;
  
  // Extract only the options needed for scaling calculations to minimize dependency array
  const { 
    shadowEffectEnabled, 
    shadowEffectOffsetX, 
    shadowEffectOffsetY,
    stampEnabled,
    stampWidth,
    shieldEnabled,
    shieldWidth,
    backgroundColor,
    backgroundEnabled
  } = customizationOptions;
  
  // This hook handles measuring container and calculating scale
  const { containerRef, scaleFactor } = useGraffitiScaling(
    processedSvgs, 
    contentWidth, 
    contentHeight, 
    containerScale, 
    {
      shadowEffectEnabled,
      shadowEffectOffsetX,
      shadowEffectOffsetY,
      stampEnabled,
      stampWidth,
      shieldEnabled,
      shieldWidth
    }
  );
  
  // Add keyframe animation for the cascading effect
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Create a style element for our keyframe animation if it doesn't exist
    if (!document.getElementById('letter-animation-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'letter-animation-style';
      
      // Different animation timing for mobile vs desktop
      const mobileKeyframes = `
        @keyframes letterPopIn {
          0% { transform: scale(0.7); opacity: 1; }
          40% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes containerFadeIn {
          0% { opacity: 1; }
          100% { opacity: 1; }
        }
      `;
      
      const desktopKeyframes = `
        @keyframes letterPopIn {
          0% { transform: scale(0.7); opacity: 1; }
          30% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes containerFadeIn {
          0% { opacity: 1; }
          100% { opacity: 1; }
        }
      `;
      
      // Use the appropriate keyframes based on device
      styleEl.innerHTML = isMobile ? mobileKeyframes : desktopKeyframes;
      document.head.appendChild(styleEl);
      
      // Clean up on unmount
      return () => {
        const element = document.getElementById('letter-animation-style');
        if (element) {
          element.parentNode?.removeChild(element);
        }
      };
    }
  }, []);
  
  // Simplified transition handling
  useLayoutEffect(() => {
    // Skip if no content
    if (processedSvgs.length === 0) {
      setIsReady(false);
      setIsAnimating(false);
      return;
    }
    
    // Check if content has changed significantly
    const contentChanged = 
      processedSvgs.length !== prevSvgsRef.current.length || 
      JSON.stringify(processedSvgs.map(svg => svg.letter)) !== 
      JSON.stringify(prevSvgsRef.current.map(svg => svg.letter));
    
    if (contentChanged) {
      // Update ref for next comparison
      prevSvgsRef.current = processedSvgs;
      
      // Prepare for animation
      setIsReady(false);
      setIsAnimating(false);
      
      // Use a single RAF for better performance
      requestAnimationFrame(() => {
        setIsReady(true);
        setIsAnimating(true);
        
        // Reset animation state after animation completes
        // Use the total animation duration (base + delay per letter)
        const totalDuration = 800 + (processedSvgs.length * 20);
        setTimeout(() => {
          setIsAnimating(false);
        }, totalDuration);
      });
    } else if (!isReady) {
      // Content hasn't changed but we need to show it (e.g. after initial mount)
      setIsReady(true);
    }
  }, [processedSvgs, isReady]);
  
  // Function to save the graffiti as an SVG file
  const saveAsSvg = useCallback(() => {
    if (!contentRef.current || processedSvgs.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Get the content container dimensions
      const contentContainer = contentRef.current;
      
      // Get the parent container (which contains the background)
      const parentContainer = containerRef.current;
      if (!parentContainer) {
        console.error('Parent container ref not available');
        setIsExporting(false);
        return;
      }
      
      // Get the dimensions of the parent container (this will be our SVG canvas size)
      const parentRect = parentContainer.getBoundingClientRect();
      const width = parentRect.width;
      const height = parentRect.height;
      
      // Create a new SVG document with the same dimensions as the parent container
      const svgNamespace = "http://www.w3.org/2000/svg";
      const newSvg = document.createElementNS(svgNamespace, "svg");
      newSvg.setAttribute("width", `${width}`);
      newSvg.setAttribute("height", `${height}`);
      newSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      
      // Add background if enabled
      if (backgroundEnabled) {
        const background = document.createElementNS(svgNamespace, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", `${width}`);
        background.setAttribute("height", `${height}`);
        background.setAttribute("fill", backgroundColor);
        newSvg.appendChild(background);
      }
      
      // Create a group for all the content
      const contentGroup = document.createElementNS(svgNamespace, "g");
      
      // Get all SVG elements in the content container
      const svgElements = contentContainer.querySelectorAll('.svg-layer svg');
      
      // Skip if no SVG elements found
      if (svgElements.length === 0) {
        console.error('No SVG elements found in content container');
        setIsExporting(false);
        return;
      }
      
      // Get the computed style of the content container to extract its transform
      const contentStyle = window.getComputedStyle(contentContainer);
      const contentTransform = contentStyle.transform;
      
      // Parse the transform to get the scale and translation
      let contentScale = 1;
      let translateX = 0;
      let translateY = 0;
      
      if (contentTransform && contentTransform !== 'none') {
        // Extract values from the transform matrix
        const matrix = new DOMMatrix(contentTransform);
        contentScale = (matrix.a + matrix.d) / 2; // Average of scaleX and scaleY
        translateX = matrix.e;
        translateY = matrix.f;
      }
      
      // Calculate the center of the parent container
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Apply the same transform to the content group that's applied to the content container
      // This ensures the content is positioned and scaled correctly
      contentGroup.setAttribute("transform", `translate(${centerX}, ${centerY}) scale(${scaleFactor * additionalScaleFactor}) translate(-${contentWidth/2}, -${contentHeight/2})`);
      
      // Process layers in the correct order
      const layerOrder = [
        '.shield-layer',
        '.shadow-shield-layer',
        '.shadow-layer',
        '.stamp-layer',
        '.main-layer'
      ];
      
      // Create a map to store layers by selector for ordered processing
      const layerMap = new Map();
      
      // First, collect all layers
      layerOrder.forEach(selector => {
        const elements = contentContainer.querySelectorAll(selector);
        if (elements.length > 0) {
          layerMap.set(selector, Array.from(elements));
        }
      });
      
      // Process layers in the specified order
      layerOrder.forEach(selector => {
        const layers = layerMap.get(selector);
        if (!layers) return;
        
        layers.forEach((layer: Element) => {
          const svg = layer.querySelector('svg');
          if (!svg) return;
          
          // Clone the SVG
          const clonedSvg = svg.cloneNode(true) as SVGElement;
          
          // Create a group for this layer
          const layerGroup = document.createElementNS(svgNamespace, "g");
          
          // Get the computed style of the layer
          const layerStyle = window.getComputedStyle(layer as HTMLElement);
          
          // Get the left position from the style
          const left = parseFloat(layerStyle.left);
          
          // Get the transform from the layer
          const transform = layerStyle.transform;
          
          // Set the transform on the group
          layerGroup.setAttribute("transform", `translate(${left}, 0) ${transform}`);
          
          // Add the cloned SVG to the layer group
          layerGroup.appendChild(clonedSvg);
          
          // Add the layer group to the content group
          contentGroup.appendChild(layerGroup);
        });
      });
      
      // Add the content group to the SVG
      newSvg.appendChild(contentGroup);
      
      // Convert the SVG to a string
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(newSvg);
      
      // Add XML declaration
      svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;
      
      // Create a blob and download link
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Generate filename from input text
      let filename = 'graff-default.svg';
      
      if (inputText && inputText.trim() !== '') {
        // Clean the input text to make it suitable for a filename
        // Replace spaces with underscores and remove special characters
        const cleanedText = inputText.trim()
          .replace(/\s+/g, '_')
          .replace(/[^\w\-]/g, '')
          .toLowerCase();
        
        // Use the cleaned text for the filename, with a fallback if it's empty after cleaning
        filename = cleanedText ? `graff-${cleanedText}.svg` : 'graff-design.svg';
        
        // Limit filename length to avoid excessively long filenames
        if (filename.length > 50) {
          filename = `${filename.substring(0, 46)}.svg`;
        }
      }
      
      // Create a download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`SVG saved successfully as ${filename}`);
    } catch (error) {
      console.error('Error saving SVG:', error);
    } finally {
      setIsExporting(false);
    }
  }, [processedSvgs, backgroundEnabled, backgroundColor, inputText, scaleFactor, contentWidth, contentHeight, additionalScaleFactor]);
  
  // Function to save the graffiti as a PNG file
  const saveAsPng = useCallback(() => {
    if (!contentRef.current || processedSvgs.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Get the parent container (which contains the background)
      const parentContainer = containerRef.current;
      if (!parentContainer) {
        console.error('Parent container ref not available');
        setIsExporting(false);
        return;
      }
      
      // First create an SVG string (reusing most of the SVG export logic)
      const parentRect = parentContainer.getBoundingClientRect();
      const width = parentRect.width;
      const height = parentRect.height;
      
      // Create a new SVG document with the same dimensions as the parent container
      const svgNamespace = "http://www.w3.org/2000/svg";
      const newSvg = document.createElementNS(svgNamespace, "svg");
      newSvg.setAttribute("width", `${width}`);
      newSvg.setAttribute("height", `${height}`);
      newSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      
      // Add background if enabled
      if (backgroundEnabled) {
        const background = document.createElementNS(svgNamespace, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", `${width}`);
        background.setAttribute("height", `${height}`);
        background.setAttribute("fill", backgroundColor);
        newSvg.appendChild(background);
      }
      
      // Create a group for all the content
      const contentGroup = document.createElementNS(svgNamespace, "g");
      
      // Apply the same transform to the content group that's applied to the content container
      const centerX = width / 2;
      const centerY = height / 2;
      contentGroup.setAttribute("transform", `translate(${centerX}, ${centerY}) scale(${scaleFactor * additionalScaleFactor}) translate(-${contentWidth/2}, -${contentHeight/2})`);
      
      // Process all SVG elements from the content container
      const contentContainer = contentRef.current;
      const layerOrder = [
        '.shield-layer',
        '.shadow-shield-layer',
        '.shadow-layer',
        '.stamp-layer',
        '.main-layer'
      ];
      
      // Create a map to store layers by selector for ordered processing
      const layerMap = new Map();
      
      // First, collect all layers
      layerOrder.forEach(selector => {
        const elements = contentContainer.querySelectorAll(selector);
        if (elements.length > 0) {
          layerMap.set(selector, Array.from(elements));
        }
      });
      
      // Process layers in the specified order
      layerOrder.forEach(selector => {
        const layers = layerMap.get(selector);
        if (!layers) return;
        
        layers.forEach((layer: Element) => {
          const svg = layer.querySelector('svg');
          if (!svg) return;
          
          // Clone the SVG
          const clonedSvg = svg.cloneNode(true) as SVGElement;
          
          // Create a group for this layer
          const layerGroup = document.createElementNS(svgNamespace, "g");
          
          // Get the computed style of the layer
          const layerStyle = window.getComputedStyle(layer as HTMLElement);
          
          // Get the left position from the style
          const left = parseFloat(layerStyle.left);
          
          // Get the transform from the layer
          const transform = layerStyle.transform;
          
          // Set the transform on the group
          layerGroup.setAttribute("transform", `translate(${left}, 0) ${transform}`);
          
          // Add the cloned SVG to the layer group
          layerGroup.appendChild(clonedSvg);
          
          // Add the layer group to the content group
          contentGroup.appendChild(layerGroup);
        });
      });
      
      // Add the content group to the SVG
      newSvg.appendChild(contentGroup);
      
      // Convert the SVG to a string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(newSvg);
      
      // Create a Blob from the SVG string
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create an Image object to load the SVG
      const img = new Image();
      img.onload = () => {
        // Create a canvas with 3x dimensions for higher resolution
        const canvas = document.createElement('canvas');
        const scaleFactor = 3; // 3x the original size
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        
        // Get the canvas context and draw the image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get canvas context');
          setIsExporting(false);
          return;
        }
        
        // Enable high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image on the canvas at 3x scale
        ctx.drawImage(img, 0, 0, width * scaleFactor, height * scaleFactor);
        
        // Convert the canvas to a PNG blob
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            console.error('Could not create PNG blob');
            setIsExporting(false);
            return;
          }
          
          // Create a URL for the PNG blob
          const pngUrl = URL.createObjectURL(pngBlob);
          
          // Generate filename from input text
          let filename = 'graff-default.png';
          
          if (inputText && inputText.trim() !== '') {
            // Clean the input text to make it suitable for a filename
            // Replace spaces with underscores and remove special characters
            const cleanedText = inputText.trim()
              .replace(/\s+/g, '_')
              .replace(/[^\w\-]/g, '')
              .toLowerCase();
            
            // Use the cleaned text for the filename, with a fallback if it's empty after cleaning
            filename = cleanedText ? `graff-${cleanedText}.png` : 'graff-design.png';
            
            // Limit filename length to avoid excessively long filenames
            if (filename.length > 50) {
              filename = `${filename.substring(0, 46)}.png`;
            }
          }
          
          // Create a download link
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(svgUrl);
          
          console.log(`PNG saved successfully as ${filename} (3x resolution)`);
          setIsExporting(false);
        }, 'image/png');
      };
      
      img.onerror = (error) => {
        console.error('Error loading SVG for PNG conversion:', error);
        URL.revokeObjectURL(svgUrl);
        setIsExporting(false);
      };
      
      // Set the source of the image to the SVG URL
      img.src = svgUrl;
      
    } catch (error) {
      console.error('Error saving PNG:', error);
      setIsExporting(false);
    }
  }, [processedSvgs, backgroundEnabled, backgroundColor, inputText, scaleFactor, contentWidth, contentHeight, additionalScaleFactor]);
  
  // Function to copy the graffiti to clipboard as PNG
  const copyToPngClipboard = useCallback(() => {
    if (!contentRef.current || processedSvgs.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Get the parent container (which contains the background)
      const parentContainer = containerRef.current;
      if (!parentContainer) {
        console.error('Parent container ref not available');
        setIsExporting(false);
        return;
      }
      
      // First create an SVG string (reusing most of the SVG export logic)
      const parentRect = parentContainer.getBoundingClientRect();
      const width = parentRect.width;
      const height = parentRect.height;
      
      // Create a new SVG document with the same dimensions as the parent container
      const svgNamespace = "http://www.w3.org/2000/svg";
      const newSvg = document.createElementNS(svgNamespace, "svg");
      newSvg.setAttribute("width", `${width}`);
      newSvg.setAttribute("height", `${height}`);
      newSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      
      // Add background if enabled
      if (backgroundEnabled) {
        const background = document.createElementNS(svgNamespace, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", `${width}`);
        background.setAttribute("height", `${height}`);
        background.setAttribute("fill", backgroundColor);
        newSvg.appendChild(background);
      }
      
      // Create a group for all the content
      const contentGroup = document.createElementNS(svgNamespace, "g");
      
      // Apply the same transform to the content group that's applied to the content container
      const centerX = width / 2;
      const centerY = height / 2;
      contentGroup.setAttribute("transform", `translate(${centerX}, ${centerY}) scale(${scaleFactor * additionalScaleFactor}) translate(-${contentWidth/2}, -${contentHeight/2})`);
      
      // Process all SVG elements from the content container
      const contentContainer = contentRef.current;
      const layerOrder = [
        '.shield-layer',
        '.shadow-shield-layer',
        '.shadow-layer',
        '.stamp-layer',
        '.main-layer'
      ];
      
      // Create a map to store layers by selector for ordered processing
      const layerMap = new Map();
      
      // First, collect all layers
      layerOrder.forEach(selector => {
        const elements = contentContainer.querySelectorAll(selector);
        if (elements.length > 0) {
          layerMap.set(selector, Array.from(elements));
        }
      });
      
      // Process layers in the specified order
      layerOrder.forEach(selector => {
        const layers = layerMap.get(selector);
        if (!layers) return;
        
        layers.forEach((layer: Element) => {
          const svg = layer.querySelector('svg');
          if (!svg) return;
          
          // Clone the SVG
          const clonedSvg = svg.cloneNode(true) as SVGElement;
          
          // Create a group for this layer
          const layerGroup = document.createElementNS(svgNamespace, "g");
          
          // Get the computed style of the layer
          const layerStyle = window.getComputedStyle(layer as HTMLElement);
          
          // Get the left position from the style
          const left = parseFloat(layerStyle.left);
          
          // Get the transform from the layer
          const transform = layerStyle.transform;
          
          // Set the transform on the group
          layerGroup.setAttribute("transform", `translate(${left}, 0) ${transform}`);
          
          // Add the cloned SVG to the layer group
          layerGroup.appendChild(clonedSvg);
          
          // Add the layer group to the content group
          contentGroup.appendChild(layerGroup);
        });
      });
      
      // Add the content group to the SVG
      newSvg.appendChild(contentGroup);
      
      // Convert the SVG to a string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(newSvg);
      
      // Create a Blob from the SVG string
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create an Image object to load the SVG
      const img = new Image();
      img.onload = () => {
        // Create a canvas with 3x dimensions for higher resolution
        const canvas = document.createElement('canvas');
        const scaleFactor = 3; // 3x the original size
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        
        // Get the canvas context and draw the image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get canvas context');
          setIsExporting(false);
          return;
        }
        
        // Enable high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image on the canvas at 3x scale
        ctx.drawImage(img, 0, 0, width * scaleFactor, height * scaleFactor);
        
        // Check if we're on a mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Convert the canvas to a PNG blob
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) {
            console.error('Could not create PNG blob');
            setIsExporting(false);
            return;
          }
          
          try {
            // Try to use the Clipboard API first
            if (navigator.clipboard && navigator.clipboard.write) {
              // Create a ClipboardItem with the PNG blob
              const clipboardItem = new ClipboardItem({
                [pngBlob.type]: pngBlob
              });
              
              // Write to clipboard
              await navigator.clipboard.write([clipboardItem]);
              console.log('High-resolution image (3x) copied to clipboard');
              
              // Show a temporary success message
              const successMessage = document.createElement('div');
              successMessage.textContent = 'Copied to clipboard! (3x resolution)';
              successMessage.style.position = 'absolute';
              successMessage.style.top = '50px';
              successMessage.style.left = '50%';
              successMessage.style.transform = 'translateX(-50%)';
              successMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
              successMessage.style.color = 'white';
              successMessage.style.padding = '8px 16px';
              successMessage.style.borderRadius = '4px';
              successMessage.style.zIndex = '9999';
              successMessage.style.fontSize = '14px';
              document.body.appendChild(successMessage);
              
              // Remove the message after 2 seconds
              setTimeout(() => {
                document.body.removeChild(successMessage);
              }, 2000);
            } else {
              // Fallback for mobile devices or browsers without clipboard support
              showMobileImageModal(canvas.toDataURL('image/png'));
            }
          } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Fallback for clipboard permission denied or other errors
            showMobileImageModal(canvas.toDataURL('image/png'));
          }
          
          // Clean up
          URL.revokeObjectURL(svgUrl);
          setIsExporting(false);
        }, 'image/png');
      };
      
      img.onerror = (error) => {
        console.error('Error loading SVG for PNG conversion:', error);
        URL.revokeObjectURL(svgUrl);
        setIsExporting(false);
      };
      
      // Set the source of the image to the SVG URL
      img.src = svgUrl;
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setIsExporting(false);
    }
  }, [processedSvgs, backgroundEnabled, backgroundColor, scaleFactor, contentWidth, contentHeight, additionalScaleFactor]);
  
  // Function to show a modal with the image for mobile devices
  const showMobileImageModal = useCallback((imageDataUrl: string) => {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.style.position = 'fixed';
    modalContainer.style.top = '0';
    modalContainer.style.left = '0';
    modalContainer.style.width = '100%';
    modalContainer.style.height = '100%';
    modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    modalContainer.style.display = 'flex';
    modalContainer.style.flexDirection = 'column';
    modalContainer.style.alignItems = 'center';
    modalContainer.style.justifyContent = 'center';
    modalContainer.style.zIndex = '10000';
    modalContainer.style.padding = '20px';
    modalContainer.style.boxSizing = 'border-box';
    
    // Create instructions
    const instructions = document.createElement('div');
    instructions.style.color = 'white';
    instructions.style.textAlign = 'center';
    instructions.style.marginBottom = '20px';
    instructions.style.fontSize = '16px';
    instructions.style.maxWidth = '90%';
    instructions.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    instructions.innerHTML = 'Press and hold on the image to save it<br>Tap outside the image to close';
    
    // Create image element
    const imageElement = document.createElement('img');
    imageElement.src = imageDataUrl;
    imageElement.style.maxWidth = '90%';
    imageElement.style.maxHeight = '70%';
    imageElement.style.objectFit = 'contain';
    imageElement.style.borderRadius = '8px';
    imageElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    imageElement.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '20px';
    closeButton.style.padding = '12px 24px';
    closeButton.style.backgroundColor = '#4F46E5'; // Indigo-600
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '6px';
    closeButton.style.fontSize = '14px';
    closeButton.style.fontWeight = '500';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    closeButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    
    // Add hover effect to close button
    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = '#4338CA'; // Indigo-700
    };
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = '#4F46E5'; // Indigo-600
    };
    
    // Add elements to modal
    modalContainer.appendChild(instructions);
    modalContainer.appendChild(imageElement);
    modalContainer.appendChild(closeButton);
    
    // Add modal to body
    document.body.appendChild(modalContainer);
    
    // Close modal when clicking outside or on close button
    const closeModal = () => {
      document.body.removeChild(modalContainer);
    };
    
    closeButton.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    });
    
    // Prevent propagation from image to avoid closing when clicking on image
    imageElement.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
  }, []);
  
  // Memoize the transform style to prevent unnecessary calculations
  const transformStyle = useMemo(() => {
    const baseStyle = {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      width: `${contentWidth}px`,
      height: `${contentHeight}px`,
      transformOrigin: 'center center',
      overflow: 'visible' as const,
      opacity: isReady ? 1 : 0,
      // Hardware acceleration hints
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
    };
    
    // Calculate the final scale with the additional factor
    const finalScale = scaleFactor * additionalScaleFactor;
    
    // Apply container animation
    if (isAnimating) {
      return {
        ...baseStyle,
        animation: 'containerFadeIn 0.3s ease-out forwards',
        transform: `translate(-50%, -50%) scale(${finalScale})`,
      };
    } else {
      return {
        ...baseStyle,
        transform: `translate(-50%, -50%) scale(${finalScale})`,
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
      };
    }
  }, [contentWidth, contentHeight, scaleFactor, isReady, isAnimating, additionalScaleFactor]);
  
  // Skip rendering if no SVGs to display
  if (processedSvgs.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      />
    );
  }
  
  return (
    <div
      ref={containerRef}
      className="graffiti-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'visible'
      }}
    >
      {/* Export Buttons */}
      <div className="absolute top-2 left-2 z-50 flex space-x-1">
        {/* Copy to Clipboard Button */}
        <button
          onClick={copyToPngClipboard}
          disabled={isExporting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
          title="Copy to Clipboard (3x Resolution)"
          style={{ width: '36px', height: '36px' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" 
            />
          </svg>
        </button>
        
        {/* PNG Export Button */}
        {/*}
        <button
          onClick={saveAsPng}
          disabled={isExporting}
          className="bg-purple-600 hover:bg-purple-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
          title="Save as PNG (3x Resolution)"
          style={{ width: '36px', height: '36px' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </button>
        */}

        {/* SVG Export Button - Hidden */}
        {/* 
        <button
          onClick={saveAsSvg}
          disabled={isExporting}
          className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
          title="Save as SVG"
          style={{ width: '36px', height: '36px' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
        </button>
        */}
      </div>
      
      <div ref={contentRef} className="graffiti-content" style={transformStyle}>
        <MemoizedGraffitiLayers 
          processedSvgs={processedSvgs}
          positions={positions}
          customizationOptions={customizationOptions}
          isAnimating={isAnimating}
        />
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(GraffitiContent);