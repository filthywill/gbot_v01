import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['zustand'],
    exclude: ['lucide-react'],
  },
  server: {
    host: true, // Listen on all addresses
    port: 3000, // Use port 3000 instead
    strictPort: true, // Fail if port is in use
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
