# Browser Tools Server

A powerful browser tools server for capturing and managing browser events, logs, and screenshots. This server works in conjunction with the Browser Tools Chrome Extension to provide comprehensive browser debugging capabilities.

## Features

- Console log capture
- Network request monitoring
- Screenshot capture
- Element selection tracking
- WebSocket real-time communication
- Configurable log limits and settings
- Lighthouse-powered accessibility, performance, SEO, and best practices audits

## Installation

```bash
npx @agentdeskai/browser-tools-server
```

Or install globally:

```bash
npm install -g @agentdeskai/browser-tools-server
```

## Usage

1. Start the server:

```bash
npx @agentdeskai/browser-tools-server
```

2. The server will start on port 3025 by default

3. Install and enable the Browser Tools Chrome Extension

4. The server exposes the following endpoints:

- `/console-logs` - Get console logs
- `/console-errors` - Get console errors
- `/network-errors` - Get network error logs
- `/network-success` - Get successful network requests
- `/all-xhr` - Get all network requests
- `/screenshot` - Capture screenshots
- `/selected-element` - Get currently selected DOM element
- `/accessibility-audit` - Run accessibility audit on current page
- `/performance-audit` - Run performance audit on current page
- `/seo-audit` - Run SEO audit on current page
- `/best-practices-audit` - Run best practices audit on current page

## Audit Functionality

The server provides Lighthouse-powered audit capabilities through four AI-optimized endpoints:

- **Accessibility Audit**: Evaluates web pages against WCAG standards
- **Performance Audit**: Analyzes page load speed and Core Web Vitals
- **SEO Audit**: Checks search engine optimization best practices
- **Best Practices Audit**: Evaluates adherence to web development best practices

## License

MIT 