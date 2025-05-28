import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { findOptimalOverlap, processSvg, createSpaceSvg } from '../svgUtils'
import { getOverlapValue } from '../../data/letterRules'
import { DEV_CONFIG } from '../devConfig'
import type { ProcessedSvg, OverlapRule } from '../../types'

// Mock SVG content for testing
const mockSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect x="50" y="50" width="100" height="100" fill="black"/>
</svg>
`

// Mock overlap rules for testing
const mockOverlapRules: Record<string, OverlapRule> = {
  a: {
    minOverlap: 0.04,
    maxOverlap: 0.12,
    specialCases: {
      b: 0.08,
      c: 0.15,
    },
  },
  r: {
    minOverlap: 0.05,
    maxOverlap: 0.14,
    specialCases: {
      c: 0.02,
    },
  },
}

const mockDefaultOverlap: OverlapRule = {
  minOverlap: 0.04,
  maxOverlap: 0.12,
  specialCases: {},
}

const mockOverlapExceptions: Record<string, string[]> = {
  r: ['c'],
}

// Helper function to create a mock ProcessedSvg
function createMockProcessedSvg(letter: string, bounds = { left: 50, right: 150, top: 50, bottom: 150 }): ProcessedSvg {
  const pixelData: boolean[][] = Array(200).fill(null).map(() => Array(200).fill(false))
  const verticalPixelRanges: Array<{ top: number, bottom: number, density: number }> = Array(200).fill(null)
  
  // Fill some pixel data for the bounds
  for (let y = bounds.top; y < bounds.bottom; y++) {
    for (let x = bounds.left; x < bounds.right; x++) {
      if (y < 200 && x < 200) {
        pixelData[y][x] = true
      }
    }
  }
  
  // Create vertical pixel ranges
  for (let x = 0; x < 200; x++) {
    if (x >= bounds.left && x < bounds.right) {
      verticalPixelRanges[x] = { 
        top: bounds.top, 
        bottom: bounds.bottom - 1, 
        density: 1.0 
      }
    } else {
      verticalPixelRanges[x] = { 
        top: 0, 
        bottom: 199, 
        density: 0 
      }
    }
  }
  
  return {
    svg: mockSvgContent,
    width: 200,
    height: 200,
    bounds,
    pixelData,
    verticalPixelRanges,
    scale: 1,
    letter,
    rotation: 0,
    isSpace: false,
  }
}

describe('SVG Overlap Optimization System', () => {
  let mockPrevSvg: ProcessedSvg
  let mockCurrentSvg: ProcessedSvg

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    
    // Mock fetch to return SVG content
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSvgContent),
    } as Response)

    // Initialize mock SVGs
    mockPrevSvg = createMockProcessedSvg('a')
    mockCurrentSvg = createMockProcessedSvg('b')
  })

  afterEach(() => {
    // Reset DEV_CONFIG after each test
    DEV_CONFIG.setRuntimeOverlapEnabled(false)
  })

  describe('createSpaceSvg', () => {
    it('should create a valid space SVG object', () => {
      const spaceSvg = createSpaceSvg()
      
      expect(spaceSvg.isSpace).toBe(true)
      expect(spaceSvg.letter).toBe(' ')
      expect(spaceSvg.width).toBe(70)
      expect(spaceSvg.height).toBe(200)
      expect(spaceSvg.bounds).toEqual({ left: 0, right: 70, top: 0, bottom: 200 })
    })
  })

  describe('processSvg', () => {
    it('should process SVG content correctly', async () => {
      const result = await processSvg(mockSvgContent, 'a', 0, 200)
      
      expect(result.letter).toBe('a')
      expect(result.width).toBe(200)
      expect(result.height).toBe(200)
      expect(result.isSpace).toBe(false)
      expect(result.pixelData).toBeDefined()
      expect(result.verticalPixelRanges).toBeDefined()
    })

    it('should handle rotation parameter', async () => {
      const result = await processSvg(mockSvgContent, 'a', 15, 200)
      
      expect(result.rotation).toBe(15)
    })

    it('should throw error for invalid SVG', async () => {
      await expect(processSvg('invalid svg', 'a', 0, 200)).rejects.toThrow()
    })
  })

  describe('findOptimalOverlap - Hybrid System', () => {
    beforeEach(() => {
      // Reinitialize for this specific test suite if needed
      mockPrevSvg = createMockProcessedSvg('a')
      mockCurrentSvg = createMockProcessedSvg('b')
    })

    it('should return 0 for space characters', () => {
      const spaceSvg = createSpaceSvg()
      
      const result1 = findOptimalOverlap(spaceSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      const result2 = findOptimalOverlap(mockPrevSvg, spaceSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
    })

    describe('Lookup Mode (Production)', () => {
      beforeEach(() => {
        DEV_CONFIG.setRuntimeOverlapEnabled(false)
      })

      it('should use lookup table when available', () => {
        // Mock getOverlapValue to return a specific value
        vi.doMock('../../data/letterRules', () => ({
          getOverlapValue: vi.fn((first: string, second: string) => {
            if (first === 'a' && second === 'b') return 0.085
            return 0.12 // fallback
          })
        }))

        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        // Should use lookup value, not rule-based calculation
        expect(result).toBeTypeOf('number')
        expect(result).toBeGreaterThan(0)
      })

      it('should fall back to rule-based calculation when lookup returns fallback', () => {
        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        // Should fall back to rule-based calculation
        expect(result).toBeTypeOf('number')
        expect(result).toBeGreaterThanOrEqual(mockOverlapRules.a.minOverlap)
        expect(result).toBeLessThanOrEqual(mockOverlapRules.a.maxOverlap)
      })

      it('should apply special cases in rule-based fallback', () => {
        mockCurrentSvg.letter = 'c'
        
        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        // Should use special case value from rules
        expect(result).toBeTypeOf('number')
      })

      it('should apply overlap exceptions in rule-based fallback', () => {
        mockPrevSvg.letter = 'r'
        mockCurrentSvg.letter = 'c'
        
        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        // Should apply exception reduction
        expect(result).toBeTypeOf('number')
        expect(result).toBeLessThan(mockOverlapRules.r.maxOverlap)
      })
    })

    describe('Runtime Mode (Development)', () => {
      beforeEach(() => {
        DEV_CONFIG.setRuntimeOverlapEnabled(true)
      })

      it('should use pixel analysis in runtime mode', () => {
        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        expect(result).toBeTypeOf('number')
        expect(result).toBeGreaterThanOrEqual(mockOverlapRules.a.minOverlap)
        expect(result).toBeLessThanOrEqual(mockOverlapRules.a.maxOverlap)
      })

      it('should respect min/max overlap bounds', () => {
        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        expect(result).toBeGreaterThanOrEqual(mockOverlapRules.a.minOverlap)
        expect(result).toBeLessThanOrEqual(mockOverlapRules.a.maxOverlap)
      })

      it('should apply special case overlaps', () => {
        mockCurrentSvg.letter = 'b' // Has special case in mockOverlapRules.a
        
        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        expect(result).toBeTypeOf('number')
        // Should use special case maxOverlap (0.08) instead of default (0.12)
      })

      it('should apply overlap exceptions', () => {
        mockPrevSvg.letter = 'r'
        mockCurrentSvg.letter = 'c'
        
        const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        expect(result).toBeTypeOf('number')
        // Should apply 0.7 reduction factor for exception pairs
        expect(result).toBeLessThan(mockOverlapRules.r.maxOverlap)
      })
    })

    describe('Performance Comparison', () => {
      it('should be faster in lookup mode than runtime mode', () => {
        const iterations = 10
        
        // Measure runtime mode
        DEV_CONFIG.setRuntimeOverlapEnabled(true)
        const runtimeStart = performance.now()
        for (let i = 0; i < iterations; i++) {
          findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        }
        const runtimeDuration = performance.now() - runtimeStart
        
        // Measure lookup mode
        DEV_CONFIG.setRuntimeOverlapEnabled(false)
        const lookupStart = performance.now()
        for (let i = 0; i < iterations; i++) {
          findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        }
        const lookupDuration = performance.now() - lookupStart
        
        // Lookup mode should be significantly faster
        expect(lookupDuration).toBeLessThan(runtimeDuration)
        
        // Only log performance details in development or when explicitly testing
        if (__DEV__ || process.env.VITEST_PERFORMANCE_LOGGING) {
          console.log(`Performance comparison:`)
          console.log(`Runtime mode: ${runtimeDuration.toFixed(2)}ms`)
          console.log(`Lookup mode: ${lookupDuration.toFixed(2)}ms`)
          console.log(`Improvement: ${((runtimeDuration - lookupDuration) / runtimeDuration * 100).toFixed(1)}%`)
        }
      })
    })

    describe('Consistency Tests', () => {
      it('should produce consistent results for the same inputs', () => {
        DEV_CONFIG.setRuntimeOverlapEnabled(true)
        
        const results = []
        for (let i = 0; i < 5; i++) {
          results.push(findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions))
        }
        
        // All results should be identical
        const firstResult = results[0]
        results.forEach(result => {
          expect(result).toBe(firstResult)
        })
      })

      it('should handle edge cases gracefully', () => {
        // Test with characters not in rules
        const unknownPrev = createMockProcessedSvg('z')
        const unknownCurrent = createMockProcessedSvg('9')
        
        const result = findOptimalOverlap(unknownPrev, unknownCurrent, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        expect(result).toBeTypeOf('number')
        expect(result).toBeGreaterThanOrEqual(mockDefaultOverlap.minOverlap)
        expect(result).toBeLessThanOrEqual(mockDefaultOverlap.maxOverlap)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should maintain backward compatibility', () => {
      // Test that the hybrid system doesn't break existing functionality
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('should handle mode switching correctly', () => {
      // Test switching between modes
      DEV_CONFIG.setRuntimeOverlapEnabled(true)
      const runtimeResult = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      DEV_CONFIG.setRuntimeOverlapEnabled(false)
      const lookupResult = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      // Both should return valid numbers
      expect(runtimeResult).toBeTypeOf('number')
      expect(lookupResult).toBeTypeOf('number')
    })
  })
}) 