# GraffitiErrorFallback Component

The `GraffitiErrorFallback` component provides graceful error handling for graffiti generation failures with three different presentation styles.

## Variants

### 1. Minimal (`variant="minimal"`)
A clean, subtle error display for non-critical errors:
```tsx
<GraffitiErrorFallback 
  inputText="HELLO"
  error={error}
  onRetry={handleRetry}
  variant="minimal"
/>
```

### 2. Detailed (`variant="detailed"`) - Default
A comprehensive error display with suggestions and actions:
```tsx
<GraffitiErrorFallback 
  inputText="HELLO"
  error={error}
  onRetry={handleRetry}
  variant="detailed"
  showSuggestions={true}
/>
```

### 3. Branded (`variant="branded"`)
An enhanced, visually appealing display for marketing pages:
```tsx
<GraffitiErrorFallback 
  inputText="HELLO"
  error={error}
  onRetry={handleRetry}
  variant="branded"
  showFallbackText={true}
  showSuggestions={true}
/>
```

## Configuration Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `inputText` | string | `''` | Text to display as fallback graffiti |
| `error` | Error | `undefined` | Error object for detailed messaging |
| `onRetry` | function | `undefined` | Callback for retry action |
| `showFallbackText` | boolean | `true` | Whether to show the styled text |
| `showSuggestions` | boolean | `true` | Whether to show help suggestions |
| `customMessage` | string | `undefined` | Override default error message |
| `variant` | string | `'detailed'` | Display style variant |

## Error Type Detection

The component automatically detects error types and provides appropriate messaging:

- **Connection Errors**: Network/fetch issues
- **Processing Errors**: Text parsing problems  
- **Performance Issues**: Memory/timeout problems
- **Generic Rendering Errors**: Fallback for unknown issues

## Styling

The component uses your app's design system:
- CSS custom properties for brand colors
- Tailwind utility classes for consistent spacing
- Dark mode support via CSS variables
- Responsive design for mobile devices

## Usage in Error Boundaries

```tsx
// In GraffitiErrorBoundary.tsx
<GraffitiErrorFallback 
  inputText={this.state.inputText}
  error={this.state.errorReport?.error}
  onRetry={this.resetError}
  variant="detailed"
/>
```

## Customization Examples

### Simple notification style:
```tsx
<GraffitiErrorFallback 
  customMessage="Service temporarily unavailable"
  variant="minimal"
  showFallbackText={false}
/>
```

### Full-featured error page:
```tsx
<GraffitiErrorFallback 
  inputText={userInput}
  error={processingError}
  onRetry={retryGeneration}
  variant="branded"
  showSuggestions={true}
/>
``` 