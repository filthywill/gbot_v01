import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateThumbnail, deleteThumbnail } from '../thumbnailService';
import { createSvgString } from '../../components/GraffitiDisplay/utils/pngExport';

// Mock the dependencies
vi.mock('../../components/GraffitiDisplay/utils/pngExport', () => ({
  createSvgString: vi.fn()
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ 
          data: { path: 'user123/12345.png' }, 
          error: null 
        }),
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'https://example.com/user123/12345.png' } 
        }),
        remove: vi.fn().mockResolvedValue({ error: null })
      }))
    }
  }
}));

describe('thumbnailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock DOM APIs needed for thumbnail generation
    global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn()
    } as any));
    
    global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      callback(mockBlob);
    });
    
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
      width = 400;
      height = 300;
    } as any;
    
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should use the same createSvgString function as PNG export', async () => {
    const mockSvgString = '<svg>mock content</svg>';
    (createSvgString as any).mockReturnValue(mockSvgString);

    const mockOptions = {
      contentRef: { current: document.createElement('div') },
      containerRef: { current: document.createElement('div') },
      processedSvgs: [{ letter: 'A', svgContent: '<svg>A</svg>' }],
      customizationOptions: { backgroundEnabled: true, backgroundColor: '#ffffff' },
      contentWidth: 400,
      contentHeight: 300,
      scaleFactor: 1,
      additionalScaleFactor: 1,
      userId: 'user123'
    };

    const result = await generateThumbnail(mockOptions as any);

    expect(createSvgString).toHaveBeenCalledWith(
      mockOptions.contentRef.current,
      mockOptions.containerRef.current,
      mockOptions.processedSvgs,
      mockOptions.customizationOptions,
      mockOptions.contentWidth,
      mockOptions.contentHeight,
      mockOptions.scaleFactor,
      mockOptions.additionalScaleFactor
    );
    
    expect(result).toBe('https://example.com/user123/12345.png');
  });

  it('should handle missing refs gracefully', async () => {
    const mockOptions = {
      contentRef: { current: null },
      containerRef: { current: document.createElement('div') },
      processedSvgs: [{ letter: 'A', svgContent: '<svg>A</svg>' }],
      customizationOptions: { backgroundEnabled: true, backgroundColor: '#ffffff' },
      contentWidth: 400,
      contentHeight: 300,
      scaleFactor: 1,
      additionalScaleFactor: 1,
      userId: 'user123'
    };

    const result = await generateThumbnail(mockOptions as any);
    expect(result).toBeNull();
  });

  it('should handle empty processedSvgs gracefully', async () => {
    const mockOptions = {
      contentRef: { current: document.createElement('div') },
      containerRef: { current: document.createElement('div') },
      processedSvgs: [],
      customizationOptions: { backgroundEnabled: true, backgroundColor: '#ffffff' },
      contentWidth: 400,
      contentHeight: 300,
      scaleFactor: 1,
      additionalScaleFactor: 1,
      userId: 'user123'
    };

    const result = await generateThumbnail(mockOptions as any);
    expect(result).toBeNull();
  });
}); 