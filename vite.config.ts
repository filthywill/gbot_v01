import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine if HTTPS should be enabled
  const useHttps = env.VITE_USE_HTTPS === 'true';

  return {
    plugins: [
      react(),
      // Only add SSL plugin when HTTPS is enabled
      useHttps && basicSsl()
    ].filter(Boolean),
    optimizeDeps: {
      include: ['zustand'],
      exclude: ['lucide-react'],
    },
    server: {
      port: 3000,
      strictPort: false, // Allow Vite to try different ports if 3000 is in use
      host: true, // Listen on all local IPs
      // HTTPS is handled by the basicSsl plugin when enabled
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      },
      headers: {
        // Add Content Security Policy to allow Google's authentication script and blob URLs
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleusercontent.com https://apis.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.googleusercontent.com https://*.google.com",
          "frame-src 'self' https://accounts.google.com https://content.googleapis.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://apis.google.com https://content.googleapis.com",
        ].join('; '),
        // Add CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      }
    },
    build: {
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            zustand: ['zustand'],
          },
        },
        plugins: [
          // Strip console logs in production
          mode === 'production' && {
            name: 'strip-console',
            transform(code: string, id: string) {
              // Skip node_modules and certain file types
              if (id.includes('node_modules') || id.endsWith('.css') || id.endsWith('.scss')) {
                return null;
              }
              
              // More precise regex that handles multiline console statements
              const strippedCode = code
                .replace(/console\.(log|debug|info)\s*\([^;]*\);?/g, '')
                .replace(/console\.(log|debug|info)\s*\(\s*[^)]*\s*\)\s*;?/g, '');
              
              return strippedCode !== code ? { code: strippedCode, map: null } : null;
            }
          }
        ].filter(Boolean)
      },
      // Improve performance of the build
      target: 'esnext',
      cssMinify: mode === 'production',
      reportCompressedSize: false,
    },
    // Add base URL configuration for absolute asset loading
    base: '/',
    // Add resolve configuration
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // Add conditions for Vite 6 compatibility
      conditions: ['import', 'module', 'browser', 'default']
    },
    // Configure static asset handling
    publicDir: 'public',
    assetsInclude: ['**/*.svg'],
    preview: {
      port: 3000,
      strictPort: false,
      headers: {
        // Add same headers for preview mode
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleusercontent.com https://apis.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.googleusercontent.com https://*.google.com",
          "frame-src 'self' https://accounts.google.com https://content.googleapis.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://apis.google.com https://content.googleapis.com",
        ].join('; '),
      }
    },
    define: {
      // Make additional env variables available to client
      __APP_ENV__: JSON.stringify(env.APP_ENV || mode),
      __DEV__: JSON.stringify(mode === 'development'),
      __PROD__: JSON.stringify(mode === 'production'),
      // SVG Processing build flags
      __DEV_SVG_PROCESSING__: JSON.stringify(mode === 'development'),
      __PROD_LOOKUP_ONLY__: JSON.stringify(mode === 'production'),
    }
  };
});
