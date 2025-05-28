import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock HTML5 Canvas API for SVG processing tests
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4 * 200 * 200), // 200x200 RGBA
      width: 200,
      height: 200,
    })),
  })),
})

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock fetch for SVG loading
global.fetch = vi.fn()

// Mock DOMParser for SVG parsing
const originalDOMParser = global.DOMParser
global.DOMParser = class MockDOMParser {
  parseFromString(str: string, type: string) {
    // Create a simple mock document for SVG parsing
    const mockDoc = {
      querySelector: vi.fn((selector: string) => {
        if (selector === 'parsererror') return null
        if (selector === 'svg') {
          return {
            getAttribute: vi.fn((attr: string) => {
              if (attr === 'viewBox') return '0 0 200 200'
              if (attr === 'width') return '200'
              if (attr === 'height') return '200'
              return null
            }),
            setAttribute: vi.fn(),
            hasAttribute: vi.fn(() => true),
            outerHTML: str,
            querySelector: vi.fn(() => null),
            firstChild: null,
            appendChild: vi.fn(),
            removeChild: vi.fn(),
          }
        }
        return null
      }),
    }
    return mockDoc
  }
} as any

// Mock Image constructor
global.Image = class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src: string = ''
  
  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
} as any

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock performance.now for timing tests
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
} 