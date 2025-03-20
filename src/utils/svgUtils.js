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
// Function to get bounding box for an SVG element
function getBoundingBox(element) {
    const viewBox = element.getAttribute('viewBox');
    if (viewBox) {
        const [x, y, width, height] = viewBox.split(' ').map(Number);
        return { x, y, width, height };
    }
    return { x: 0, y: 0, width: 100, height: 100 };
}

// Function to process an SVG string into a ProcessedSvg object
export const processSvg = (svgContent, letter) => __awaiter(void 0, void 0, void 0, function* () {
    let tempContainer;
    let svgElement;

    // Check if we're in Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const jsdom = yield import('jsdom');
        const { JSDOM } = jsdom;
        const dom = new JSDOM();
        const document = dom.window.document;
        
        tempContainer = document.createElement('div');
        tempContainer.innerHTML = svgContent;
        svgElement = tempContainer.querySelector('svg');
    } else {
        // Browser environment
        tempContainer = document.createElement('div');
        tempContainer.innerHTML = svgContent;
        svgElement = tempContainer.querySelector('svg');
    }

    if (!svgElement) {
        throw new Error('No SVG element found in content');
    }

    // Get the viewBox
    const viewBox = svgElement.getAttribute('viewBox');
    const [x, y, width, height] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 100, 100];

    // Add class for styling
    svgElement.classList.add('letter-svg');

    // Calculate pixel data for overlap optimization
    const paths = Array.from(svgElement.querySelectorAll('path'));
    const pixelData = calculatePixelData(paths, width, height);
    const verticalPixelRanges = calculateVerticalPixelRanges(pixelData);

    return {
        svg: svgElement.outerHTML,
        letter,
        width,
        height,
        x,
        y,
        bounds: {
            left: x,
            right: x + width,
            top: y,
            bottom: y + height
        },
        pixelData,
        verticalPixelRanges,
        scale: 1,
        isSpace: false,
        rotation: 0
    };
});

// Calculate pixel data from SVG paths
function calculatePixelData(paths, width, height) {
    const resolution = 10; // Resolution for pixel sampling
    const pixelData = Array(Math.ceil(height / resolution))
        .fill(0)
        .map(() => Array(Math.ceil(width / resolution)).fill(false));

    paths.forEach(path => {
        const bbox = getBoundingBox(path);
        const startX = Math.floor(bbox.x / resolution);
        const startY = Math.floor(bbox.y / resolution);
        const endX = Math.ceil((bbox.x + bbox.width) / resolution);
        const endY = Math.ceil((bbox.y + bbox.height) / resolution);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (y >= 0 && y < pixelData.length && x >= 0 && x < pixelData[0].length) {
                    pixelData[y][x] = true;
                }
            }
        }
    });

    return pixelData;
}

// Calculate vertical pixel ranges for efficient overlap calculation
function calculateVerticalPixelRanges(pixelData) {
    const ranges = [];
    const height = pixelData.length;
    const width = pixelData[0].length;

    for (let x = 0; x < width; x++) {
        let inRange = false;
        let rangeStart = 0;
        let pixelCount = 0;

        for (let y = 0; y < height; y++) {
            if (pixelData[y][x]) {
                pixelCount++;
                if (!inRange) {
                    inRange = true;
                    rangeStart = y;
                }
            } else if (inRange) {
                ranges.push({
                    top: rangeStart,
                    bottom: y - 1,
                    density: pixelCount / (y - rangeStart)
                });
                inRange = false;
                pixelCount = 0;
            }
        }

        if (inRange) {
            ranges.push({
                top: rangeStart,
                bottom: height - 1,
                density: pixelCount / (height - rangeStart)
            });
        }
    }

    return ranges;
}

// Function to find optimal overlap between two letters
export const findOptimalOverlap = (prev, current, overlapRules, defaultOverlap, overlapExceptions) => {
    if (prev.isSpace || current.isSpace) return 0;
    
    // Only convert to lowercase if it's a letter
    const prevLetter = /[a-zA-Z]/.test(prev.letter) ? prev.letter.toLowerCase() : prev.letter;
    const currentLetter = /[a-zA-Z]/.test(current.letter) ? current.letter.toLowerCase() : current.letter;
    
    // Get rules from the parameters
    const rules = overlapRules[prevLetter] || defaultOverlap;
    let minOverlap = rules.minOverlap;
    let maxOverlap = rules.maxOverlap;
    
    // Check for special case overlaps - this takes precedence
    if (rules.specialCases && rules.specialCases[currentLetter] !== undefined) {
        // For special cases, we use the special case value directly
        return rules.specialCases[currentLetter];
    }
    
    // Check if current letter is in the exceptions list for the previous letter
    const exceptions = overlapExceptions[prevLetter] || [];
    if (exceptions.includes(currentLetter)) {
        // For exceptions, we reduce the overlap
        maxOverlap = Math.max(minOverlap, maxOverlap * 0.7);
    }
    
    // If no special case, use the default overlap range
    return (minOverlap + maxOverlap) / 2;
};

// Calculate a score for how well two letters overlap
function calculateOverlapScore(prevRanges, currentRanges, overlap) {
    let score = 0;
    const overlapWidth = Math.min(prevRanges.length, currentRanges.length);
    
    for (let i = 0; i < overlapWidth; i++) {
        const prevRange = prevRanges[i];
        const currentRange = currentRanges[i];
        
        if (prevRange && currentRange) {
            // Higher score for ranges that don't completely overlap
            const overlapAmount = Math.min(prevRange.bottom, currentRange.bottom) - 
                                Math.max(prevRange.top, currentRange.top);
            
            if (overlapAmount <= 0) {
                score += 1; // Good - no vertical overlap
            } else {
                // Penalize based on overlap amount and density
                score -= (overlapAmount * prevRange.density * currentRange.density);
            }
        }
    }
    
    return score;
}

// Function to create a space SVG
export const createSpaceSvg = (width = 50) => {
    return {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="1" viewBox="0 0 ${width} 1"></svg>`,
        letter: ' ',
        width,
        height: 1,
        x: 0,
        y: 0,
        bounds: {
            left: 0,
            right: width,
            top: 0,
            bottom: 1
        },
        pixelData: [[false]],
        verticalPixelRanges: [],
        scale: 1,
        isSpace: true,
        rotation: 0
    };
};
