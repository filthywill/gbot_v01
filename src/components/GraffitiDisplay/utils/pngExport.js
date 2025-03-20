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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * Creates an SVG string from the graffiti content
 */
export const createSvgString = (
    contentRef,
    containerRef,
    processedSvgs,
    settings,
    contentWidth,
    contentHeight,
    scaleFactor = 1,
    additionalScaleFactor = 1
) => {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);

    // Clone the content and container
    const contentClone = contentRef.cloneNode(true);
    const containerClone = containerRef.cloneNode(true);

    // Set up the container
    containerClone.style.width = `${contentWidth}px`;
    containerClone.style.height = `${contentHeight}px`;
    containerClone.style.position = 'relative';
    containerClone.style.overflow = 'visible';

    // Add content to container
    containerClone.appendChild(contentClone);
    tempContainer.appendChild(containerClone);

    // Create SVG string
    const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${contentWidth}" height="${contentHeight}" viewBox="0 0 ${contentWidth} ${contentHeight}">
            <style>
                .letter-svg {
                    fill: ${settings.color || '#000000'};
                }
            </style>
            <g transform="scale(${scaleFactor * additionalScaleFactor})">
                ${processedSvgs.map(svg => svg.svg).join('')}
            </g>
        </svg>
    `;

    // Clean up
    document.body.removeChild(tempContainer);

    return svgString;
};
/**
 * Exports the graffiti as a PNG file
 */
export var exportAsPng = function (contentRef_1, containerRef_1, processedSvgs_1, customizationOptions_1, contentWidth_1, contentHeight_1, scaleFactor_1, additionalScaleFactor_1) {
    var args_1 = [];
    for (var _i = 8; _i < arguments.length; _i++) {
        args_1[_i - 8] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([contentRef_1, containerRef_1, processedSvgs_1, customizationOptions_1, contentWidth_1, contentHeight_1, scaleFactor_1, additionalScaleFactor_1], args_1, true), void 0, function (contentRef, containerRef, processedSvgs, customizationOptions, contentWidth, contentHeight, scaleFactor, additionalScaleFactor, inputText) {
        var svgString, parentContainer, parentRect, width, height, svgBlob, svgUrl, img;
        if (inputText === void 0) { inputText = ''; }
        return __generator(this, function (_a) {
            if (!contentRef || processedSvgs.length === 0) {
                throw new Error('Content reference or SVGs not available');
            }
            svgString = createSvgString(contentRef, containerRef, processedSvgs, customizationOptions, contentWidth, contentHeight, scaleFactor, additionalScaleFactor);
            parentContainer = containerRef;
            parentRect = parentContainer.getBoundingClientRect();
            width = parentRect.width;
            height = parentRect.height;
            svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            svgUrl = URL.createObjectURL(svgBlob);
            img = new Image();
            // Create a Promise to handle the async image loading
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    img.onload = function () {
                        // Create a canvas with 1.5x dimensions for moderate resolution
                        var canvas = document.createElement('canvas');
                        var highResFactor = 1.5; // 1.5x the original size for moderate resolution
                        var canvasWidth, canvasHeight, drawX, drawY, drawWidth, drawHeight;
                        if (!customizationOptions.backgroundEnabled) {
                            // If background is transparent, we'll crop the canvas to the content with a fixed 5px margin
                            // Create a temporary canvas to analyze the image content
                            var tempCanvas = document.createElement('canvas');
                            tempCanvas.width = width;
                            tempCanvas.height = height;
                            var tempCtx = tempCanvas.getContext('2d');
                            if (!tempCtx) {
                                reject(new Error('Could not get temporary canvas context'));
                                return;
                            }
                            // Draw the image on the temporary canvas
                            tempCtx.drawImage(img, 0, 0, width, height);
                            // Get the image data to analyze non-transparent pixels
                            var imageData = tempCtx.getImageData(0, 0, width, height);
                            var data = imageData.data;
                            // Find the bounds of non-transparent pixels
                            var minX = width;
                            var minY = height;
                            var maxX = 0;
                            var maxY = 0;
                            // Scan the image data to find the bounding box of non-transparent pixels
                            for (var y = 0; y < height; y++) {
                                for (var x = 0; x < width; x++) {
                                    var alpha = data[(y * width + x) * 4 + 3]; // Alpha channel
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
                                var contentBoxWidth = maxX - minX;
                                var contentBoxHeight = maxY - minY;
                                // Use a fixed 5px margin on all sides
                                var marginX = 5;
                                var marginY = 5;
                                // Calculate the final dimensions with margin
                                var finalWidth = contentBoxWidth + (marginX * 2);
                                var finalHeight = contentBoxHeight + (marginY * 2);
                                // Set the canvas dimensions with high resolution factor
                                canvasWidth = finalWidth * highResFactor;
                                canvasHeight = finalHeight * highResFactor;
                                // Calculate drawing parameters
                                drawX = -minX + marginX;
                                drawY = -minY + marginY;
                                drawWidth = width;
                                drawHeight = height;
                            }
                            else {
                                // Fallback if no non-transparent pixels found
                                canvasWidth = width * highResFactor;
                                canvasHeight = height * highResFactor;
                                drawX = 0;
                                drawY = 0;
                                drawWidth = width;
                                drawHeight = height;
                            }
                        }
                        else {
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
                        var ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Could not get canvas context'));
                            return;
                        }
                        // Enable high-quality image scaling
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        // Draw the image on the canvas with the calculated parameters
                        ctx.drawImage(img, 0, 0, width, height, // Source rectangle
                        drawX * highResFactor, drawY * highResFactor, // Destination position
                        drawWidth * highResFactor, drawHeight * highResFactor // Destination size
                        );
                        // Convert the canvas to a PNG blob
                        canvas.toBlob(function (pngBlob) {
                            if (!pngBlob) {
                                reject(new Error('Could not create PNG blob'));
                                return;
                            }
                            // Create a URL for the PNG blob
                            var pngUrl = URL.createObjectURL(pngBlob);
                            // Generate filename from input text
                            var filename = createFilename(inputText, 'png');
                            // Create a download link
                            var link = document.createElement('a');
                            link.href = pngUrl;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            // Clean up
                            document.body.removeChild(link);
                            URL.revokeObjectURL(pngUrl);
                            URL.revokeObjectURL(svgUrl);
                            console.log("PNG saved successfully as ".concat(filename));
                            resolve();
                        }, 'image/png', 0.8); // Quality parameter (0.8) affects JPEG but not PNG
                    };
                    img.onerror = function (error) {
                        console.error('Error loading SVG for PNG conversion:', error);
                        URL.revokeObjectURL(svgUrl);
                        reject(new Error('Failed to load SVG for PNG conversion'));
                    };
                    // Set the source of the image to the SVG URL
                    img.src = svgUrl;
                })];
        });
    });
};
