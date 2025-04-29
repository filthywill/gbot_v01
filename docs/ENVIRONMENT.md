# Environment Configuration Guide

This guide explains how environment configuration works in Stizack, focusing on the management of development and production modes.

## Overview

Stizack uses Vite's environment variable system which exposes variables with the `VITE_` prefix to the client-side code. We have implemented a custom environment detection system that:

1. Uses `VITE_APP_ENV` to determine the current environment
2. Controls debug features and overlays based on environment
3. Provides consistent behavior across local development and deployments

## Environment Variables

### Core Environment Variables

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `VITE_APP_ENV` | Determines environment mode | `development` | `production` |
| `VITE_SUPABASE_URL` | Supabase instance URL | - | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous API key | - | `eyJhbGciOiJI...` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | - | `123456789-abc...apps.googleusercontent.com` |
| `VITE_USE_HTTPS` | Enable HTTPS for dev/preview | `false` | `true` |

### Environment Files Structure

The application uses the following environment file structure:

```
/
├── .env                   # Base environment variables (committed to repo)
├── .env.local             # Local overrides (not committed)
└── .env.production        # Production-specific variables
```

### Environment Loading Order

Vite loads environment variables in a specific order, with later files taking precedence:

1. `.env` - Base environment shared across all modes
2. `.env.local` - Local overrides (not committed to the repository)
3. `.env.production` - Production mode variables (when running with `--mode production`)
4. `.env.production.local` - Production-specific local overrides

In development mode (default), Vite uses `.env` and `.env.local` files.

### NODE_ENV Behavior

**Important**: Do not set `NODE_ENV` directly in any `.env` files. Vite automatically manages this value based on the command being run:

- `vite` or `vite dev` → `NODE_ENV=development`
- `vite build` → `NODE_ENV=production`
- `vite preview` → `NODE_ENV=production`

Setting `NODE_ENV` manually in `.env` files can cause conflicts with Vite's internal mechanisms and lead to unexpected behavior.

### Setting Environment Variables

#### Local Development

Create a `.env.local` file in the project root:

```
VITE_APP_ENV=development
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Vercel Deployment

In the Vercel dashboard:
1. Go to Project → Settings → Environment Variables
2. Add each variable with the appropriate production values
3. **Important**: Set `VITE_APP_ENV=production` to disable debug overlays

## Feature Control Based on Environment

The environment determines which features are enabled:

| Feature | Development | Production |
|---------|-------------|------------|
| Debug Overlays | ✅ Visible | ❌ Hidden |
| Value Displays | ✅ Available | ❌ Hidden |
| Verbose Logging | ✅ Enabled | ❌ Minimal |
| Error Details | ✅ Detailed | ❌ User-friendly |
| Source Maps | ✅ Enabled | ❌ Disabled |
| Minification | ❌ Disabled | ✅ Enabled |

## NPM Scripts

The project includes several NPM scripts for different environments:

```json
"scripts": {
  "dev": "vite --port 3000 --host",
  "dev:https": "cross-env VITE_USE_HTTPS=true vite --port 3000 --host",
  "build": "vite build",
  "build:prod": "vite build --mode production",
  "preview": "vite preview",
  "preview:https": "cross-env VITE_USE_HTTPS=true vite preview"
}
```

- **Development Mode**: `npm run dev` - Default development mode using `.env` and `.env.local`
- **Development with HTTPS**: `npm run dev:https` - Same as above with HTTPS enabled
- **Production Build**: `npm run build:prod` - Explicitly uses production mode and `.env.production`
- **Preview Build**: `npm run preview` - Preview the production build locally

## Implementation Details

### Environment Detection

The core environment detection logic is in `src/lib/env.ts`:

```typescript
// Environment configuration utility
const ENV = {
  isDevelopment: import.meta.env.DEV || import.meta.env.VITE_APP_ENV !== 'production',
  isProduction: import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production',
  // Add other environment variables here
} as const;
```

This allows components to check the environment with:

```typescript
import { isDevelopment } from '@/lib/env';

// Later in component
{isDevelopment() && <DebugPanel />}
```

### Debug Components

Debug components should always check the environment before rendering:

```typescript
import { isDevelopment } from '@/lib/env';

const DebugOverlay = () => {
  // Only proceed if in development
  if (!isDevelopment()) return null;
  
  return <div>Debug information...</div>
}
```

### Environment Type Definitions

TypeScript typings for environment variables are defined in `src/types/env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_USE_HTTPS?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## Troubleshooting

### Debug Features Not Showing in Local Development

If debug overlays and features are not visible during local development:

1. Check that `.env.local` has `VITE_APP_ENV=development` or is not defining this variable
2. Ensure you've restarted the dev server after changing environment variables
3. Clear browser cache and do a hard reload

### Debug Features Showing in Production

If debug overlays appear in production:

1. Verify that `VITE_APP_ENV=production` is set in your Vercel environment variables
2. Ensure you've deployed after adding the environment variable
3. Check for any code that might be ignoring the environment setting

### Environment Variables Not Loading

If environment variables aren't being loaded correctly:

1. Verify the file naming follows Vite's conventions
2. Check the variables have the `VITE_` prefix for client-side access
3. Restart the dev server after making changes
4. Make sure you're not manually setting `NODE_ENV`

## Best Practices

1. Always use `isDevelopment()` and `isProduction()` helpers from `src/lib/env.ts`
2. Never hardcode environment checks in components
3. Don't rely on `process.env.NODE_ENV` for UI-related environment detection
4. Keep `.env.local` in your `.gitignore` file
5. Update `.env.example` when adding new environment variables
6. Use the `VITE_` prefix for variables that need to be accessible in the browser
7. Don't set `NODE_ENV` manually in .env files 