import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Add the SSL plugin
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  optimizeDeps: {
    include: ['zustand'],
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // Listen on all addresses
    port: 3000, // Use port 3000 instead
    strictPort: false, // Allow fallback to another port if 3000 is in use
  },
  build: {
    rollupOptions: {
      external: [],
    },
    minify: true,
    sourcemap: false
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
});
