import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

// Determine if HTTPS should be enabled
const useHttps = process.env.VITE_USE_HTTPS !== 'false';

// https://vitejs.dev/config/
export default defineConfig({
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
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          zustand: ['zustand'],
        },
      },
    },
    // Improve performance of the build
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false,
  },
  // Add base URL configuration
  base: './',
  // Add resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
  }
});
