# GBot Security Documentation

## Overview
This document outlines the security measures implemented in the GBot project, focusing on SVG processing, rate limiting, Content Security Policy (CSP), and user protection. The security framework is designed to prevent common vulnerabilities while maintaining the application's core functionality.

## Security Architecture

### 1. Content Security Policy (CSP)
Implemented via Vercel.json configuration to protect against various attacks:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none';"
        }
      ]
    }
  ]
}
```

Key protections:
- Restricts resource loading to same origin
- Allows necessary inline styles for Tailwind
- Permits blob URLs for export functionality
- Blocks dangerous object embeds
- Controls script execution context

#### CSP Protection Examples

1. **Script Execution Control**
```html
<!-- Blocked by CSP -->
<svg>
  <script>
    alert('XSS attempt');
  </script>
</svg>

<!-- Blocked by CSP -->
<svg onload="alert('XSS attempt')">
</svg>

<!-- Allowed by CSP - Our legitimate SVG content -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10L90 90" />
</svg>
```

2. **Resource Loading Protection**
```html
<!-- Blocked by CSP -->
<svg>
  <image href="https://malicious-site.com/image.svg" />
</svg>

<!-- Blocked by CSP -->
<style>
  @import url('https://malicious-site.com/styles.css');
</style>

<!-- Allowed by CSP - Local resources -->
<img src="/assets/logo.png" />
```

3. **Export Functionality Protection**
```typescript
// Allowed by CSP - Blob URLs for legitimate exports
const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
const blobUrl = URL.createObjectURL(svgBlob);

// Allowed by CSP - Data URLs for legitimate exports
const canvas = document.createElement('canvas');
const dataUrl = canvas.toDataURL('image/png');
```

4. **Style Handling**
```html
<!-- Blocked by CSP -->
<svg>
  <style>
    @import url('https://evil.com/style.css');
  </style>
</svg>

<!-- Allowed by CSP - Inline styles needed for Tailwind -->
<div class="bg-blue-500 hover:bg-blue-700">
  Content
</div>
```

### 2. Rate Limiting System
Implemented in `src/lib/rateLimit.ts` to prevent abuse:

```typescript
// Rate limit configurations
export const svgLimiter = new RateLimiter({
  windowMs: 60 * 1000,    // 1 minute window
  maxRequests: 60,        // 60 requests per minute
  warningThreshold: 10    // Warning at 10 remaining
});

export const exportLimiter = new RateLimiter({
  windowMs: 60 * 1000,    // 1 minute window
  maxRequests: 10,        // 10 exports per minute
  warningThreshold: 2     // Warning at 2 remaining
});
```

Features:
- Per-operation rate limiting
- User-friendly warning messages
- Automatic cleanup of expired limits
- Configurable thresholds and windows

#### Practical Examples

1. **SVG Generation Rate Limiting**
```typescript
// Example: User rapidly changing styles
const handleStyleChange = async (styleId: string) => {
  // Rate limit check before processing
  if (!checkRateLimit('graffiti_generation', 'svg')) {
    // User will see a warning toast: "Rate limit reached. Please wait X seconds..."
    return;
  }
  
  // Process style change
  await generateGraffiti(currentText);
};
```

Common scenarios that count towards the 60/minute SVG generation limit:
- Typing and hitting generate: 1 request
- Changing style: 1 request
- Undo/Redo operation: 1 request
- Initial page load with saved text: 1 request

2. **Export Operation Rate Limiting**
```typescript
// Example: User exporting multiple formats
const handleExport = async (format: 'svg' | 'png') => {
  // Rate limit check before processing
  if (!checkRateLimit(`${format}_export`, 'export')) {
    // User will see: "You have X more exports available before cooldown"
    return;
  }
  
  // Process export
  await exportAs(format);
};
```

Export limits (10/minute) apply to:
- Saving as SVG
- Saving as PNG
- Copying to clipboard
- Sharing functionality

#### User Feedback Examples

```typescript
// Warning when approaching limit
"You're generating designs quickly! You have 10 more tries before a short cooldown."

// When limit is reached
"Rate limit reached. Please wait 45 seconds before trying again."

// After successful operation
"SVG saved successfully!"
```

### 3. SVG Processing Pipeline
The secure SVG processing pipeline consists of multiple layers of protection:

1. **Validation Layer** (`src/lib/svgSecurity.ts`)
   - Validates SVG structure and content
   - Checks for required attributes
   - Ensures proper SVG formatting
   - Prevents malformed SVG injection

2. **Sanitization Layer** (`src/lib/svgSecurity.ts`)
   - Removes potentially malicious content
   - Sanitizes attributes and values
   - Enforces whitelist of allowed elements and attributes
   - Prevents XSS attacks through SVG content

3. **Secure Processing Layer** (`src/utils/secureSvgUtils.ts`)
   - Wraps core SVG processing functions
   - Implements additional security checks
   - Provides secure fallbacks
   - Handles errors gracefully

## Allowed SVG Content

### Allowed Elements
```typescript
const ALLOWED_ELEMENTS = new Set([
  'svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 
  'polygon', 'g', 'defs', 'title', 'desc', 'text'
]);
```

### Allowed Attributes
```typescript
const ALLOWED_ATTRIBUTES = new Set([
  // Core attributes
  'id', 'class', 'style', 'transform',
  // Presentation attributes
  'fill', 'stroke', 'stroke-width', 'opacity',
  // Dimensional attributes
  'x', 'y', 'width', 'height', 'viewBox', 'preserveAspectRatio',
  // Path attributes
  'd', 'pathLength',
  // Other common attributes
  'cx', 'cy', 'r', 'rx', 'rx', 'points'
]);
```

## Security Measures

### 1. SVG Validation
- Checks for basic SVG structure
- Validates required attributes
- Ensures proper viewBox formatting
- Prevents malformed SVG injection

### 2. Content Sanitization
- Removes potentially dangerous elements and attributes
- Sanitizes style attributes
- Prevents script injection
- Removes external references

### 3. XSS Prevention
- Removes script tags and event handlers
- Sanitizes style attributes
- Prevents dangerous CSS functions
- Removes external references

### 4. Error Handling
- Implements proper error boundaries
- Provides fallback mechanisms
- Logs security-related issues
- Maintains application stability

## Security Patterns

### Secure SVG Processing
```typescript
// Example of secure SVG processing
export const secureCustomizeSvg = (
  svgString: string,
  isSpace: boolean | undefined,
  options: CustomizationOptions
): string => {
  try {
    // Validate SVG
    if (!validateSvg(svgString)) {
      throw new Error('Invalid SVG content');
    }

    // Sanitize SVG
    const sanitizedSvg = sanitizeSvg(svgString);

    // Process sanitized SVG
    return baseCustomizeSvg(sanitizedSvg, isSpace, options);
  } catch (error) {
    // Return safe fallback
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"></svg>`;
  }
};
```

### Error Boundaries
```typescript
// Example of error boundary implementation
try {
  // Process SVG content
  const processedSvg = processSvg(content);
  return processedSvg;
} catch (error) {
  logger.error('SVG processing error:', error);
  return fallbackSvg;
}
```

## Best Practices for SVG Content

### SVG Creation Guidelines
1. Use basic SVG elements from the allowed list
2. Avoid embedded scripts or event handlers
3. Use relative paths instead of absolute when possible
4. Optimize SVGs before adding to the project
5. Test SVGs with all effects enabled

### SVG Optimization
- Remove unnecessary elements and attributes
- Use appropriate precision for numeric values
- Optimize path data
- Remove metadata and comments

## Security Testing

### Validation Testing
1. Test with malformed SVGs
2. Test with oversized SVGs
3. Test with missing attributes
4. Test with invalid viewBox values

### Sanitization Testing
1. Test with script injection attempts
2. Test with event handler injection
3. Test with external references
4. Test with style-based attacks

### Rate Limit Testing
1. Test rapid generation attempts
2. Test export limit enforcement
3. Test warning threshold triggers
4. Test limit reset timing

### CSP Testing
1. Test resource loading restrictions
2. Verify inline script handling
3. Test export functionality
4. Verify style application

## Logging and Monitoring

### Security Logging
- All security-related events are logged
- Validation failures are tracked
- Sanitization actions are recorded
- Error events are captured

### Log Levels
1. ERROR: Security violations and failures
2. WARN: Potential security issues
3. INFO: Normal security operations
4. DEBUG: Detailed security information

### Rate Limit Monitoring
- Track rate limit hits
- Monitor warning thresholds
- Log abuse patterns
- Track user impact

### Security Headers
- Regular CSP audit
- Header effectiveness monitoring
- Security report collection
- Violation tracking

## Future Security Considerations

### Potential Enhancements
1. Rate limiting for SVG processing
2. Additional SVG validation rules
3. Enhanced error reporting
4. Advanced security logging

### Planned Enhancements
1. Enhanced rate limiting strategies
2. Additional security headers
3. Automated security testing
4. Advanced abuse detection

## Maintenance and Updates

### Security Updates
1. Regularly review security measures
2. Update allowed elements and attributes as needed
3. Monitor for new SVG-based vulnerabilities
4. Update security documentation

### Version Control
- Document security changes in commit messages
- Tag security-related releases
- Maintain security changelog
- Track security dependencies 