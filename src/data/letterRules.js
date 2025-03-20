// Default overlap settings
export const DEFAULT_OVERLAP = {
    minOverlap: 0.1,
    maxOverlap: 0.3,
};
// Letter-specific overlap rules
export const LETTER_OVERLAP_RULES = {
    'a': { minOverlap: 0.1, maxOverlap: 0.3 },
    'b': { minOverlap: 0.1, maxOverlap: 0.3 },
    'c': { minOverlap: 0.1, maxOverlap: 0.3 },
    'd': { minOverlap: 0.1, maxOverlap: 0.3 },
    'e': { minOverlap: 0.1, maxOverlap: 0.3 },
    'f': { minOverlap: 0.1, maxOverlap: 0.3 },
    'g': { minOverlap: 0.1, maxOverlap: 0.3 },
    'h': { minOverlap: 0.1, maxOverlap: 0.3 },
    'i': { minOverlap: 0.1, maxOverlap: 0.3 },
    'j': { minOverlap: 0.1, maxOverlap: 0.3 },
    'k': { minOverlap: 0.1, maxOverlap: 0.3 },
    'l': { minOverlap: 0.1, maxOverlap: 0.3 },
    'm': { minOverlap: 0.1, maxOverlap: 0.3 },
    'n': { minOverlap: 0.1, maxOverlap: 0.3 },
    'o': { minOverlap: 0.1, maxOverlap: 0.3 },
    'p': { minOverlap: 0.1, maxOverlap: 0.3 },
    'q': { minOverlap: 0.1, maxOverlap: 0.3 },
    'r': { minOverlap: 0.1, maxOverlap: 0.3 },
    's': { minOverlap: 0.1, maxOverlap: 0.3 },
    't': { minOverlap: 0.1, maxOverlap: 0.3 },
    'u': { minOverlap: 0.1, maxOverlap: 0.3 },
    'v': { minOverlap: 0.1, maxOverlap: 0.3 },
    'w': { minOverlap: 0.1, maxOverlap: 0.3 },
    'x': { minOverlap: 0.1, maxOverlap: 0.3 },
    'y': { minOverlap: 0.1, maxOverlap: 0.3 },
    'z': { minOverlap: 0.1, maxOverlap: 0.3 },
};
// Exceptions to normal overlapping rules
export const overlapExceptions = {
    'a': ['v', 'w', 'y'],
    'v': ['a', 'e', 'o'],
    'w': ['a', 'e', 'o'],
    'y': ['a', 'e', 'o'],
};
// Letter-specific rotation rules
export const LETTER_ROTATION_RULES = {
    'a': { after: { 'v': 5, 'w': 5, 'y': 5 } },
    'v': { before: { 'a': -5, 'e': -5, 'o': -5 } },
    'w': { before: { 'a': -5, 'e': -5, 'o': -5 } },
    'y': { before: { 'a': -5, 'e': -5, 'o': -5 } },
};
