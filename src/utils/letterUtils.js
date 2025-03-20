var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { letterSvgs, firstLetterSvgs, lastLetterSvgs } from '../data/letterMappings.js';
import { LETTER_ROTATION_RULES } from '../data/letterRules.js';
import { svgMemoryCache, generateSvgCacheKey } from './svgCache.js';

// Check if a specific SVG file exists
export function svgExists(path) {
    // This is a simple check to see if the path is defined in our mappings
    return !!path;
}

// Get the appropriate SVG for a letter based on position and style
export function getLetterSvg(letter, isAlternate, isFirst, isLast, style) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalizedLetter = letter.toLowerCase();
        console.log(`Getting SVG for letter '${normalizedLetter}', isFirst=${isFirst}, isLast=${isLast}, style=${style}`);
        let svgPath;
        // Check for first letter variant
        if (style !== 'straight' && isFirst && firstLetterSvgs[normalizedLetter]) {
            svgPath = firstLetterSvgs[normalizedLetter];
            console.log(`Using first letter variant: ${svgPath}`);
        }
        // Check for last letter variant
        else if (style !== 'straight' && isLast && lastLetterSvgs[normalizedLetter]) {
            svgPath = lastLetterSvgs[normalizedLetter];
            console.log(`Using last letter variant: ${svgPath}`);
        }
        // Check for alternate version (only if it exists)
        else if (isAlternate) {
            const alternateKey = `${normalizedLetter}2`;
            if (letterSvgs[alternateKey]) {
                svgPath = letterSvgs[alternateKey];
                console.log(`Using alternate variant: ${svgPath}`);
            }
        }
        // If no special variant was found or applicable, use the standard version
        if (!svgPath) {
            svgPath = letterSvgs[normalizedLetter];
            console.log(`Using standard variant: ${svgPath}`);
        }
        // If we still don't have a path, this is a truly missing letter
        if (!svgPath) {
            console.error(`No SVG found for letter '${normalizedLetter}'`);
            throw new Error(`No SVG found for letter '${normalizedLetter}'`);
        }
        // Remove leading slash if present
        svgPath = svgPath.startsWith('/') ? svgPath.slice(1) : svgPath;
        return svgPath;
    });
}

// Fetch and parse an SVG using browser fetch API or filesystem in Node.js
export function fetchSvg(url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Fetching SVG from path: ${url}`);
        const cacheKey = generateSvgCacheKey(url);
        const cachedContent = svgMemoryCache.get(cacheKey);

        if (cachedContent) {
            console.log(`Cache hit for ${url}`);
            return cachedContent;
        }

        const validateSvgContent = (content) => {
            const isValid = content.includes('<svg') && content.includes('</svg>');
            if (!isValid) {
                console.warn('Invalid SVG content:', content);
            }
            return isValid;
        };

        try {
            let svgText;
            
            // Check if we're running in Node.js
            if (typeof process !== 'undefined' && process.versions && process.versions.node) {
                const fs = yield import('fs/promises');
                const path = yield import('path');
                const filePath = path.join(process.cwd(), 'public', url);
                svgText = yield fs.readFile(filePath, 'utf8');
            } else {
                // Browser environment
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch SVG: ${response.statusText}`);
                }
                svgText = yield response.text();
            }
            
            if (!validateSvgContent(svgText)) {
                throw new Error('Invalid SVG content in file');
            }

            svgMemoryCache.set(cacheKey, svgText);
            return svgText;
        } catch (error) {
            console.error(`Error fetching SVG file: ${error.message}`);
            throw error;
        }
    });
}

// Determine if a letter should use an alternate version
export function shouldUseAlternate(letter, index, letters) {
    // Only suggest alternate if we know it exists
    var alternateExists = !!letterSvgs["".concat(letter, "2")];
    if (!alternateExists) {
        return false;
    }
    // Since we've removed l2, always return false for 'l'
    if (letter === 'l') {
        return false;
    }
    // For other letters with alternates (if any are added in the future)
    return false;
}

// Get letter-specific rotation
export function getLetterRotation(letter, prevLetter) {
    if (!prevLetter)
        return 0;
    var rules = LETTER_ROTATION_RULES[prevLetter.toLowerCase()];
    return rules && rules[letter.toLowerCase()] ? rules[letter.toLowerCase()] : 0;
}
