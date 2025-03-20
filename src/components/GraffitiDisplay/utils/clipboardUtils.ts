import { ProcessedSvg, CustomizationOptions } from '../../../types';
import { createSvgString } from './pngExport';
import { showSuccessMessage, isMobileDevice } from './exportUtils';

/**
 * Shows a modal with the image for mobile devices
 */
export const showMobileImageModal = (
  imageDataUrl: string,
  inputText: string
): void => {
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
};

/**
 * Shows an improved mobile image modal
 */
export const showImprovedMobileImageModal = (
  dataUrl: string,
  inputText: string
): void => {
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.style.position = 'fixed';
  modalContainer.style.top = '0';
  modalContainer.style.left = '0';
  modalContainer.style.width = '100%';
  modalContainer.style.height = '100%';
  modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modalContainer.style.zIndex = '9999';
  modalContainer.style.display = 'flex';
  modalContainer.style.flexDirection = 'column';
  modalContainer.style.alignItems = 'center';
  modalContainer.style.justifyContent = 'center';
  // Add animation properties
  modalContainer.style.opacity = '0';
  modalContainer.style.transition = 'opacity 0.25s ease-out';
  // Add accessibility attributes
  modalContainer.setAttribute('role', 'dialog');
  modalContainer.setAttribute('aria-modal', 'true');
  modalContainer.setAttribute('aria-labelledby', 'modal-title');
  
  // Add a hidden title for screen readers
  const modalTitle = document.createElement('h2');
  modalTitle.id = 'modal-title';
  modalTitle.textContent = 'Graffiti Image';
  modalTitle.style.position = 'absolute';
  modalTitle.style.width = '1px';
  modalTitle.style.height = '1px';
  modalTitle.style.padding = '0';
  modalTitle.style.margin = '-1px';
  modalTitle.style.overflow = 'hidden';
  modalTitle.style.clip = 'rect(0, 0, 0, 0)';
  modalTitle.style.whiteSpace = 'nowrap';
  modalTitle.style.border = '0';
  
  // Create image container with a very light background to prevent touch events from falling through
  const imageContainer = document.createElement('div');
  imageContainer.style.position = 'relative';
  imageContainer.style.maxWidth = '90%';
  imageContainer.style.maxHeight = '70%';
  imageContainer.style.display = 'flex';
  imageContainer.style.alignItems = 'center';
  imageContainer.style.justifyContent = 'center';
  imageContainer.style.padding = '10px';
  imageContainer.style.overflow = 'hidden'; // Changed from auto to hidden for better control
  imageContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
  imageContainer.style.borderRadius = '8px';
  // Add animation for the image container
  imageContainer.style.transform = 'scale(0.95)';
  imageContainer.style.transition = 'transform 0.25s ease-out';
  
  // Create image element with improved aspect ratio handling
  const imageElement = document.createElement('img');
  imageElement.src = dataUrl;
  imageElement.style.display = 'block';
  imageElement.style.maxWidth = '100%';
  imageElement.style.maxHeight = '100%';
  imageElement.style.objectFit = 'contain'; // Ensures image maintains aspect ratio
  imageElement.style.touchAction = 'none'; // Prevent default touch actions
  
  // Add accessibility attributes
  imageElement.setAttribute('alt', 'Graffiti artwork');
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginTop = '20px';
  buttonContainer.style.width = '100%';
  buttonContainer.style.maxWidth = '90%';
  buttonContainer.style.padding = '0 10px';
  // Add animation for the button container
  buttonContainer.style.transform = 'translateY(10px)';
  buttonContainer.style.opacity = '0';
  buttonContainer.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
  
  // Create save button
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Image';
  saveButton.style.padding = '10px 15px';
  saveButton.style.backgroundColor = '#4a90e2';
  saveButton.style.color = 'white';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '4px';
  saveButton.style.fontSize = '16px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.transition = 'transform 0.15s ease-out, background-color 0.15s ease-out';
  saveButton.style.flexGrow = '1';
  saveButton.style.maxWidth = '200px';
  // Add accessibility attributes
  saveButton.setAttribute('role', 'button');
  saveButton.setAttribute('aria-label', 'Save image to device');
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.padding = '10px 15px';
  closeButton.style.backgroundColor = '#6c757d';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '4px';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.transition = 'transform 0.15s ease-out, background-color 0.15s ease-out';
  closeButton.style.flexGrow = '1';
  closeButton.style.maxWidth = '200px';
  // Add accessibility attributes
  closeButton.setAttribute('role', 'button');
  closeButton.setAttribute('aria-label', 'Close dialog');
  
  // Add touch feedback to save button
  saveButton.addEventListener('touchstart', () => {
    saveButton.style.transform = 'scale(0.97)';
    saveButton.style.backgroundColor = '#3a7bc8'; // Darker blue
  });
  
  saveButton.addEventListener('touchend', () => {
    saveButton.style.transform = 'scale(1)';
    saveButton.style.backgroundColor = '#4a90e2'; // Original blue
  });
  
  // Add touch feedback to close button
  closeButton.addEventListener('touchstart', () => {
    closeButton.style.transform = 'scale(0.97)';
    closeButton.style.backgroundColor = '#5a6268'; // Darker gray
  });
  
  closeButton.addEventListener('touchend', () => {
    closeButton.style.transform = 'scale(1)';
    closeButton.style.backgroundColor = '#6c757d'; // Original gray
  });
  
  // Add event listeners
  saveButton.addEventListener('click', () => {
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'graffiti.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  // Improved close modal function with animation
  const closeModal = () => {
    modalContainer.style.opacity = '0';
    imageContainer.style.transform = 'scale(0.95)';
    buttonContainer.style.transform = 'translateY(10px)';
    buttonContainer.style.opacity = '0';
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      document.body.removeChild(modalContainer);
    }, 250);
  };
  
  closeButton.addEventListener('click', closeModal);
  
  // Add click event to close when clicking outside the image
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
      closeModal();
    }
  });
  
  // Prevent zooming and scrolling on the modal
  modalContainer.addEventListener('touchmove', (e) => {
    if (e.target === modalContainer || e.target === imageContainer) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent image from being dragged
  imageElement.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });
  
  // Add keyboard support for accessibility
  modalContainer.tabIndex = -1; // Make container focusable but not in tab order
  document.addEventListener('keydown', function handleKeyDown(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleKeyDown);
    }
  });
  
  // Add device-specific styling
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  if (isIOS) {
    // iOS buttons have a specific look
    saveButton.style.fontWeight = '600';
    closeButton.style.fontWeight = '600';
    
    // Add slight border radius to match iOS UI
    imageContainer.style.borderRadius = '13px';
    
    // iOS-style blur background (if supported)
    if (CSS.supports('backdrop-filter', 'blur(10px)')) {
      modalContainer.style.backdropFilter = 'blur(10px)';
      modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    }
  }
  
  // Assemble the modal
  imageContainer.appendChild(imageElement);
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(closeButton);
  modalContainer.appendChild(modalTitle);
  modalContainer.appendChild(imageContainer);
  modalContainer.appendChild(buttonContainer);
  
  // Add to document
  document.body.appendChild(modalContainer);
  
  // Set initial focus for accessibility
  setTimeout(() => {
    saveButton.focus();
  }, 50);
  
  // Trigger animations after a small delay to ensure DOM is ready
  setTimeout(() => {
    modalContainer.style.opacity = '1';
    imageContainer.style.transform = 'scale(1)';
    buttonContainer.style.transform = 'translateY(0)';
    buttonContainer.style.opacity = '1';
  }, 10);
};

/**
 * Copies the graffiti to clipboard as PNG
 */
export const copyToPngClipboard = async (
  contentRef: HTMLDivElement,
  containerRef: HTMLDivElement,
  processedSvgs: ProcessedSvg[],
  customizationOptions: CustomizationOptions,
  contentWidth: number,
  contentHeight: number,
  scaleFactor: number,
  additionalScaleFactor: number,
  inputText: string = ''
): Promise<void> => {
  if (!contentRef || processedSvgs.length === 0) {
    throw new Error('Content reference or SVGs not available');
  }
  
  // Create SVG string
  const svgString = createSvgString(
    contentRef,
    containerRef,
    processedSvgs,
    customizationOptions,
    contentWidth,
    contentHeight,
    scaleFactor,
    additionalScaleFactor
  );
  
  // Get the parent container dimensions
  const parentContainer = containerRef;
  const parentRect = parentContainer.getBoundingClientRect();
  const width = parentRect.width;
  const height = parentRect.height;
  
  // Create a Blob from the SVG string
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  // Create an Image object to load the SVG
  const img = new Image();
  
  // Create a Promise to handle the async image loading
  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      // Create a canvas with 1.5x dimensions for moderate resolution
      const canvas = document.createElement('canvas');
      const highResFactor = 1.5; // 1.5x the original size for moderate resolution
      
      let canvasWidth, canvasHeight, drawX, drawY, drawWidth, drawHeight;
      
      if (!customizationOptions.backgroundEnabled) {
        // If background is transparent, we'll crop the canvas to the content with a fixed 5px margin
        
        // Create a temporary canvas to analyze the image content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) {
          reject(new Error('Could not get temporary canvas context'));
          return;
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
          
          // Use a fixed 5px margin on all sides
          const marginX = 5;
          const marginY = 5;
          
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
      
      // Get the canvas context and draw the image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Enable high-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the image on the canvas with the calculated parameters
      ctx.drawImage(
        img, 
        0, 0, width, height, // Source rectangle
        drawX * highResFactor, drawY * highResFactor, // Destination position
        drawWidth * highResFactor, drawHeight * highResFactor // Destination size
      );
      
      // Check if we're on a mobile device
      const isMobile = isMobileDevice();
      
      // Convert the canvas to a PNG blob
      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) {
          reject(new Error('Could not create PNG blob'));
          return;
        }
        
        try {
          // Strategy 1: Try Clipboard API (best for desktop)
          if (navigator.clipboard && navigator.clipboard.write && !isMobile) {
            // Create a ClipboardItem with the PNG blob
            const clipboardItem = new ClipboardItem({
              [pngBlob.type]: pngBlob
            });
            
            // Write to clipboard
            await navigator.clipboard.write([clipboardItem]);
            console.log(`Image copied to clipboard!`);
            
            // Show success message
            showSuccessMessage('Copied to clipboard!');
            resolve();
          } 
          // Strategy 2: Try Web Share API (best for mobile)
          else if (navigator.share && isMobile) {
            try {
              // Create a File object from the blob
              const file = new File([pngBlob], 'graffiti.png', { type: pngBlob.type });
              
              // Check if we can share files
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: 'Graffiti Design',
                  text: 'Check out my graffiti design!'
                });
                
                console.log('Image shared successfully');
                showSuccessMessage('Shared successfully!');
                resolve();
              } else {
                // Fall back to improved modal if file sharing is not supported
                console.log('Web Share API does not support file sharing on this device');
                showImprovedMobileImageModal(canvas.toDataURL('image/png'), inputText);
                resolve();
              }
            } catch (shareError) {
              console.error('Error sharing via Web Share API:', shareError);
              // Fall back to improved modal
              showImprovedMobileImageModal(canvas.toDataURL('image/png'), inputText);
              resolve();
            }
          } 
          // Strategy 3: Fall back to improved modal display
          else {
            console.log('Using fallback modal for image sharing');
            showImprovedMobileImageModal(canvas.toDataURL('image/png'), inputText);
            resolve();
          }
        } catch (error) {
          console.error('Failed to copy/share:', error);
          // Final fallback - show improved modal
          showImprovedMobileImageModal(canvas.toDataURL('image/png'), inputText);
          resolve();
        }
        
        // Clean up
        URL.revokeObjectURL(svgUrl);
      }, 'image/png', 0.8); // Quality parameter (0.8) affects JPEG but not PNG
    };
    
    img.onerror = (error) => {
      console.error('Error loading SVG for PNG conversion:', error);
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG for PNG conversion'));
    };
    
    // Set the source of the image to the SVG URL
    img.src = svgUrl;
  });
}; 