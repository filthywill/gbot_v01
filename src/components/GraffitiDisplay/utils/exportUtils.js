/**
 * Creates a filename based on input text
 */
export var createFilename = function (inputText, extension) {
    if (!inputText || inputText.trim() === '') {
        return "graff-default.".concat(extension);
    }
    // Clean the input text to make it suitable for a filename
    // Replace spaces with underscores and remove special characters
    var cleanedText = inputText.trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w\-]/g, '')
        .toLowerCase();
    // Use the cleaned text for the filename, with a fallback if it's empty after cleaning
    var filename = cleanedText ? "graff-".concat(cleanedText, ".").concat(extension) : "graff-design.".concat(extension);
    // Limit filename length to avoid excessively long filenames
    if (filename.length > 50) {
        return "".concat(filename.substring(0, 46), ".").concat(extension);
    }
    return filename;
};
/**
 * Creates an SVG element with the specified dimensions
 */
export var createSvgElement = function (width, height, backgroundEnabled, backgroundColor) {
    var svgNamespace = "http://www.w3.org/2000/svg";
    var newSvg = document.createElementNS(svgNamespace, "svg");
    newSvg.setAttribute("width", "".concat(width));
    newSvg.setAttribute("height", "".concat(height));
    newSvg.setAttribute("viewBox", "0 0 ".concat(width, " ").concat(height));
    // Add background if enabled
    if (backgroundEnabled) {
        var background = document.createElementNS(svgNamespace, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", "".concat(width));
        background.setAttribute("height", "".concat(height));
        background.setAttribute("fill", backgroundColor);
        newSvg.appendChild(background);
    }
    return newSvg;
};
/**
 * Creates a content group with the appropriate transform
 */
export var createContentGroup = function (svgNamespace, centerX, centerY, scaleFactor, additionalScaleFactor, contentWidth, contentHeight) {
    var contentGroup = document.createElementNS(svgNamespace, "g");
    contentGroup.setAttribute("transform", "translate(".concat(centerX, ", ").concat(centerY, ") scale(").concat(scaleFactor * additionalScaleFactor, ") translate(-").concat(contentWidth / 2, ", -").concat(contentHeight / 2, ")"));
    return contentGroup;
};
/**
 * Shows a success message toast
 */
export const showSuccessMessage = (message) => {
    console.log(message);
};
/**
 * Detects if the current device is mobile
 */
export var isMobileDevice = function () {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};
/**
 * Layer order for SVG export
 */
export var LAYER_ORDER = [
    '.shield-layer',
    '.shadow-shield-layer',
    '.shadow-layer',
    '.stamp-layer',
    '.main-layer'
];

// Function to show an improved mobile image modal
export const showImprovedMobileImageModal = (imageUrl) => {
    console.log('Opening mobile image modal:', imageUrl);
};
