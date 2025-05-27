## Implementation Plan: Logging Cleanup & Security Enhancement

### Phase 1: Immediate Security & Production Fixes (Week 1)
**Priority: CRITICAL - Deploy ASAP**

#### 1.1 Create Environment-Aware Logger Utility
```typescript
// src/lib/logger.ts - Enhanced version
enum LogLevel {
  ERROR = 0,
  WARN = 1, 
  INFO = 2,
  DEBUG = 3
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  sanitizeData: boolean;
}

class Logger {
  private config: LoggerConfig;
  
  constructor() {
    this.config = {
      level: this.getLogLevel(),
      enableConsole: this.shouldEnableConsole(),
      enableRemote: import.meta.env.PROD,
      sanitizeData: import.meta.env.PROD
    };
  }
  
  private getLogLevel(): LogLevel {
    if (import.meta.env.PROD) return LogLevel.ERROR;
    if (import.meta.env.VITE_APP_ENV === 'staging') return LogLevel.WARN;
    return LogLevel.DEBUG;
  }
  
  private shouldEnableConsole(): boolean {
    return !import.meta.env.PROD || import.meta.env.VITE_ENABLE_PROD_LOGS === 'true';
  }
  
  error(message: string, data?: any) {
    if (this.config.level >= LogLevel.ERROR) {
      const sanitizedData = this.config.sanitizeData ? this.sanitize(data) : data;
      console.error(`[ERROR] ${message}`, sanitizedData);
    }
  }
  
  warn(message: string, data?: any) {
    if (this.config.level >= LogLevel.WARN && this.config.enableConsole) {
      console.warn(`[WARN] ${message}`, this.sanitize(data));
    }
  }
  
  info(message: string, data?: any) {
    if (this.config.level >= LogLevel.INFO && this.config.enableConsole) {
      console.info(`[INFO] ${message}`, this.sanitize(data));
    }
  }
  
  debug(message: string, data?: any) {
    if (this.config.level >= LogLevel.DEBUG && this.config.enableConsole) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
  
  private sanitize(data: any): any {
    if (!this.config.sanitizeData) return data;
    // Implement data sanitization logic
    return this.deepSanitize(data);
  }
}

export const logger = new Logger();
```

#### 1.2 Remove Critical Security Exposures
**Files to modify immediately:**

1. **src/App.tsx** - Remove lines 37-42:
```typescript
// REMOVE THIS BLOCK ENTIRELY
useEffect(() => {
  console.log('SUPABASE URL BEING USED:', import.meta.env.VITE_SUPABASE_URL);
  console.log('APP ENV:', import.meta.env.VITE_APP_ENV);
  console.log('NODE ENV:', process.env.NODE_ENV);
}, []);
```

2. **src/App.tsx** - Wrap feature flag logging:
```typescript
// REPLACE lines 95-102 with:
useEffect(() => {
  if (import.meta.env.DEV) {
    logger.debug('Feature Flags Initialized', {
      USE_NEW_AUTH_HOOKS: FLAGS.USE_NEW_AUTH_HOOKS,
      USE_NEW_COMPONENTS: FLAGS.USE_NEW_COMPONENTS,
      DEBUG_AUTH_STATE: FLAGS.DEBUG_AUTH_STATE
    });
  }
}, []);
```

3. **Remove App.tsx.backup** - This file contains "NEW IMPLEMENTATION" logs and should not be in production

#### 1.3 Update Build Configuration
**vite.config.ts** - Add production log stripping:
```typescript
export default defineConfig({
  // ... existing config
  define: {
    __DEV__: JSON.stringify(!process.env.NODE_ENV || process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },
  build: {
    rollupOptions: {
      plugins: [
        // Strip console logs in production
        process.env.NODE_ENV === 'production' && {
          name: 'strip-console',
          transform(code, id) {
            if (id.includes('node_modules')) return null;
            return code.replace(/console\.(log|debug|info)\([^)]*\);?/g, '');
          }
        }
      ].filter(Boolean)
    }
  }
});
```

### Phase 2: Systematic Logging Replacement (Week 2)

#### 2.1 Authentication Module Cleanup
**Priority Order:**
1. `src/store/useAuthStore.ts` - Replace all console.log with logger calls
2. `src/hooks/auth/useEmailVerification.ts` - Sanitize email logging
3. `src/components/Auth/` - Remove debug statements
4. `src/lib/auth/` - Implement secure logging

#### 2.2 Core Application Modules
1. **src/hooks/useGraffitiGeneratorWithZustand.ts** - Replace debug logging
2. **src/components/GraffitiDisplay/** - Remove performance logs
3. **src/utils/** - Standardize error logging

#### 2.3 Development Tools Isolation
```typescript
// src/lib/debug.ts - Enhanced version
interface DebugConfig {
  readonly enableConsoleLogging: boolean;
  readonly enableDebugPanels: boolean;
  readonly enableValueOverlays: boolean;
  readonly enablePerformanceLogging: boolean;
}

const DEBUG_CONFIG: DebugConfig = {
  enableConsoleLogging: import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGGING !== 'false',
  enableDebugPanels: import.meta.env.DEV && import.meta.env.VITE_DEBUG_PANELS === 'true',
  enableValueOverlays: import.meta.env.DEV && import.meta.env.VITE_VALUE_OVERLAYS === 'true',
  enablePerformanceLogging: import.meta.env.DEV && import.meta.env.VITE_PERF_LOGGING === 'true',
};

export const debugLog = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.enableConsoleLogging) {
    logger.debug(message, data);
  }
};
```

### Phase 3: Environment Configuration Enhancement (Week 3)

#### 3.1 Environment Variable Structure
```bash
# .env.production
VITE_APP_ENV=production
VITE_ENABLE_PROD_LOGS=false
VITE_DEBUG_LOGGING=false
VITE_DEBUG_PANELS=false

# .env.staging  
VITE_APP_ENV=staging
VITE_ENABLE_PROD_LOGS=true
VITE_DEBUG_LOGGING=true
VITE_DEBUG_PANELS=false

# .env.development
VITE_APP_ENV=development
VITE_ENABLE_PROD_LOGS=true
VITE_DEBUG_LOGGING=true
VITE_DEBUG_PANELS=true
VITE_VALUE_OVERLAYS=true
VITE_PERF_LOGGING=true
```

#### 3.2 Build Script Enhancement
```json
// package.json
{
  "scripts": {
    "dev": "vite --mode development",
    "dev:staging": "vite --mode staging",
    "build": "vite build --mode production",
    "build:staging": "vite build --mode staging",
    "build:local": "vite build --mode development",
    "preview": "vite preview",
    "preview:staging": "vite preview --mode staging"
  }
}
```

### Phase 4: Performance & Monitoring Integration (Week 4)

#### 4.1 Implement Conditional Compilation
```typescript
// src/lib/compile-time.ts
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;
export const IS_STAGING = import.meta.env.VITE_APP_ENV === 'staging';

// Usage throughout codebase:
if (IS_DEV) {
  // Development-only code that gets stripped in production
}
```

#### 4.2 Error Tracking Integration
```typescript
// src/lib/errorTracking.ts
interface ErrorTracker {
  captureException(error: Error, context?: any): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
}

class ProductionErrorTracker implements ErrorTracker {
  captureException(error: Error, context?: any) {
    // Integrate with Sentry, LogRocket, etc.
    logger.error('Exception captured', { error: error.message, context });
  }
  
  captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    logger[level](message);
  }
}

export const errorTracker = IS_PROD ? new ProductionErrorTracker() : new DevErrorTracker();
```

### Phase 5: Verification & Optimization (Week 5)

#### 5.1 Bundle Analysis
```bash
# Add to package.json
"analyze": "vite build --mode production && npx vite-bundle-analyzer dist"
```

#### 5.2 Performance Monitoring
- Implement Core Web Vitals tracking
- Add bundle size monitoring
- Set up performance budgets

#### 5.3 Security Audit
- Review all remaining console.log statements
- Audit environment variable exposure
- Validate data sanitization

## Implementation Priority Matrix

| Task | Security Impact | Performance Impact | Effort | Priority |
|------|----------------|-------------------|---------|----------|
| Remove env var logging | HIGH | LOW | LOW | 1 |
| Create logger utility | HIGH | MEDIUM | MEDIUM | 2 |
| Strip production logs | HIGH | HIGH | LOW | 3 |
| Replace auth logging | HIGH | LOW | HIGH | 4 |
| Environment config | MEDIUM | LOW | MEDIUM | 5 |
| Error tracking | MEDIUM | LOW | HIGH | 6 |

## Deployment Strategy

### Immediate Hotfix (Deploy Today)
1. Remove environment variable logging
2. Remove "NEW IMPLEMENTATION" debug messages
3. Add basic production log stripping

### Weekly Releases
- **Week 1**: Security fixes + basic logger
- **Week 2**: Core module cleanup
- **Week 3**: Environment enhancement
- **Week 4**: Performance optimization
- **Week 5**: Final verification

## Monitoring & Validation

### Success Metrics
- **Security**: Zero sensitive data in production logs
- **Performance**: <5% bundle size increase, faster load times
- **Developer Experience**: Maintained debugging capabilities in dev
- **Production**: Clean, actionable error logs only

### Testing Strategy
1. **Local Development**: Verify all debug features work
2. **Staging**: Confirm appropriate log levels
3. **Production**: Validate clean, secure logging

This plan maintains your current Vite + React + TypeScript structure while systematically addressing the logging and security concerns. The phased approach allows for immediate security fixes while building toward a robust, production-ready logging system.
