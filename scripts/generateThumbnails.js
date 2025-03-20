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
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
// Create a virtual DOM environment
var dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    contentType: 'text/html',
    pretendToBeVisual: true,
});
// Set up the global environment
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.CSSStyleDeclaration = dom.window.CSSStyleDeclaration;
// Now we can import our modules that require browser APIs
import { STYLE_PRESETS } from '../src/data/stylePresets';
import { processSvg } from '../src/utils/svgUtils';
import { letterSvgs } from '../src/data/letterMappings';
import { fetchSvg } from '../src/utils/letterUtils';
import { createSvgString } from '../src/components/GraffitiDisplay/utils/pngExport';
// Function to process a single letter into ProcessedSvg format
var processLetter = function (letter) { return __awaiter(void 0, void 0, void 0, function () {
    var svgPath, svgContent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                svgPath = letterSvgs[letter.toLowerCase()];
                if (!svgPath) {
                    throw new Error("No SVG found for letter ".concat(letter));
                }
                return [4 /*yield*/, fetchSvg(svgPath)];
            case 1:
                svgContent = _a.sent();
                return [2 /*return*/, processSvg(svgContent, letter)];
        }
    });
}); };
var generateThumbnails = function () { return __awaiter(void 0, void 0, void 0, function () {
    var thumbsDir, _i, STYLE_PRESETS_1, preset, demoText, processedSvgs, svgString, filename, filePath, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                thumbsDir = path.join(process.cwd(), 'public', 'assets', 'preset-thumbs');
                if (!fs.existsSync(thumbsDir)) {
                    fs.mkdirSync(thumbsDir, { recursive: true });
                }
                _i = 0, STYLE_PRESETS_1 = STYLE_PRESETS;
                _a.label = 1;
            case 1:
                if (!(_i < STYLE_PRESETS_1.length)) return [3 /*break*/, 6];
                preset = STYLE_PRESETS_1[_i];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                demoText = 'DEMO';
                return [4 /*yield*/, Promise.all(demoText.split('').map(processLetter))];
            case 3:
                processedSvgs = _a.sent();
                svgString = createSvgString(document.createElement('div'), // contentRef
                document.createElement('div'), // containerRef
                processedSvgs, preset.settings, 400, // contentWidth
                100, // contentHeight
                1, // scaleFactor
                0.9 // additionalScaleFactor
                );
                filename = "th-".concat(preset.id.toLowerCase().replace(/\s+/g, '-'), ".svg");
                filePath = path.join(thumbsDir, filename);
                // Save the SVG file
                fs.writeFileSync(filePath, svgString, 'utf8');
                console.log("Generated thumbnail for ".concat(preset.name, ": ").concat(filename));
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error("Error generating thumbnail for ".concat(preset.name, ":"), error_1);
                return [3 /*break*/, 5];
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/];
        }
    });
}); };
// Run the thumbnail generation
generateThumbnails().catch(console.error);
