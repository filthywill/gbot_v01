import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '');
  
  // Enable HTTPS based on env var
  const useHttps = env.VITE_USE_HTTPS === 'true';
  let httpsConfig = {};
  
  if (useHttps) {
    httpsConfig = {
      https: {
        key: fs.readFileSync('certs/localhost-key.pem'),
        cert: fs.readFileSync('certs/localhost.pem'),
      }
    };
  }
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      cors: true,
      headers: {
        'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob: https://tailwindui.com https://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; frame-src 'self' https://*.supabase.co; worker-src 'self' blob:;",
      },
      ...httpsConfig
    },
    build: {
      outDir: 'dist',
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          callback: path.resolve(__dirname, 'src/auth-pages/callback.html'),
          'reset-password': path.resolve(__dirname, 'src/auth-pages/reset-password.html'),
          error: path.resolve(__dirname, 'src/auth-pages/error.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
