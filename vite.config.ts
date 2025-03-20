import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Add the SSL plugin
  ],
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
  },
  // Add base URL configuration
  base: './',
  // Add resolve configuration
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Configure static asset handling
  publicDir: 'public',
  assetsInclude: ['**/*.svg'],
});
