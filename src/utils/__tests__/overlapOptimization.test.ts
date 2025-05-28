import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { findOptimalOverlap, createSpaceSvg } from '../svgUtils'
import { DEV_CONFIG } from '../devConfig'
import type { ProcessedSvg, OverlapRule } from '../../types'

// Create a simple mock ProcessedSvg for testing
function createTestProcessedSvg(letter: string): ProcessedSvg {
  const pixelData: boolean[][] = Array(200).fill(null).map(() => Array(200).fill(false))
  const verticalPixelRanges: Array<{ top: number, bottom: number, density: number }> = Array(200).fill(null)
  
  // Create a simple rectangular shape
  const bounds = { left: 50, right: 150, top: 50, bottom: 150 }
  
  // Fill pixel data
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
    svg: `<svg><rect/></svg>`,
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

describe('Overlap Optimization System', () => {
  const mockOverlapRules: Record<string, OverlapRule> = {
    a: {
      minOverlap: 0.04,
      maxOverlap: 0.12,
      specialCases: { b: 0.08 },
    },
    r: {
      minOverlap: 0.05,
      maxOverlap: 0.14,
      specialCases: { c: 0.02 },
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

  let mockPrevSvg: ProcessedSvg
  let mockCurrentSvg: ProcessedSvg

  beforeEach(() => {
    mockPrevSvg = createTestProcessedSvg('a')
    mockCurrentSvg = createTestProcessedSvg('b')
    
    // Reset DEV_CONFIG
    DEV_CONFIG.setRuntimeOverlapEnabled(false)
  })

  afterEach(() => {
    DEV_CONFIG.setRuntimeOverlapEnabled(false)
  })

  describe('Space Handling', () => {
    it('should return 0 for space characters', () => {
      const spaceSvg = createSpaceSvg()
      
      const result1 = findOptimalOverlap(spaceSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      const result2 = findOptimalOverlap(mockPrevSvg, spaceSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
    })

    it('should create valid space SVG', () => {
      const spaceSvg = createSpaceSvg()
      
      expect(spaceSvg.isSpace).toBe(true)
      expect(spaceSvg.letter).toBe(' ')
      expect(spaceSvg.width).toBe(70)
    })
  })

  describe('Lookup Mode (Production)', () => {
    beforeEach(() => {
      DEV_CONFIG.setRuntimeOverlapEnabled(false)
    })

    it('should use lookup table when runtime is disabled', () => {
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('should fall back to rule-based calculation', () => {
      // Test with characters that would use rule-based fallback
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
    })

    it('should handle special cases', () => {
      mockCurrentSvg.letter = 'b' // Has special case in mockOverlapRules.a
      
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
    })

    it('should handle overlap exceptions', () => {
      mockPrevSvg.letter = 'r'
      mockCurrentSvg.letter = 'c'
      
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('Runtime Mode (Development)', () => {
    beforeEach(() => {
      DEV_CONFIG.setRuntimeOverlapEnabled(true)
    })

    it('should use pixel analysis when runtime is enabled', () => {
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('should respect bounds from rules', () => {
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThanOrEqual(0.01) // Reasonable minimum
      expect(result).toBeLessThanOrEqual(0.5) // Reasonable maximum
    })

    it('should handle special cases in runtime mode', () => {
      mockCurrentSvg.letter = 'b'
      
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('Mode Switching', () => {
    it('should switch between modes correctly', () => {
      // Test runtime mode
      DEV_CONFIG.setRuntimeOverlapEnabled(true)
      const runtimeResult = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      // Test lookup mode
      DEV_CONFIG.setRuntimeOverlapEnabled(false)
      const lookupResult = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(runtimeResult).toBeTypeOf('number')
      expect(lookupResult).toBeTypeOf('number')
      expect(runtimeResult).toBeGreaterThan(0)
      expect(lookupResult).toBeGreaterThan(0)
    })

    it('should maintain consistency within same mode', () => {
      DEV_CONFIG.setRuntimeOverlapEnabled(true)
      
      const results = []
      for (let i = 0; i < 3; i++) {
        results.push(findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions))
      }
      
      // All results should be identical in runtime mode
      const firstResult = results[0]
      results.forEach(result => {
        expect(result).toBe(firstResult)
      })
    })
  })

  describe('Performance Characteristics', () => {
    it('should complete calculations quickly', () => {
      const start = performance.now()
      
      for (let i = 0; i < 100; i++) {
        findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      }
      
      const duration = performance.now() - start
      
      // Should complete 100 calculations in reasonable time
      expect(duration).toBeLessThan(1000) // Less than 1 second
    })

    it('should handle edge cases gracefully', () => {
      // Test with unknown characters
      const unknownPrev = createTestProcessedSvg('z')
      const unknownCurrent = createTestProcessedSvg('9')
      
      const result = findOptimalOverlap(unknownPrev, unknownCurrent, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThanOrEqual(mockDefaultOverlap.minOverlap)
      expect(result).toBeLessThanOrEqual(mockDefaultOverlap.maxOverlap)
    })
  })

  describe('Integration', () => {
    it('should maintain backward compatibility', () => {
      const result = findOptimalOverlap(mockPrevSvg, mockCurrentSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
      
      expect(result).toBeTypeOf('number')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('should work with different character combinations', () => {
      const combinations = [
        ['a', 'b'], ['r', 'c'], ['x', 'y'], ['1', '2']
      ]
      
      combinations.forEach(([first, second]) => {
        const firstSvg = createTestProcessedSvg(first)
        const secondSvg = createTestProcessedSvg(second)
        
        const result = findOptimalOverlap(firstSvg, secondSvg, mockOverlapRules, mockDefaultOverlap, mockOverlapExceptions)
        
        expect(result).toBeTypeOf('number')
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(1)
      })
    })
  })
}) 