import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Adjust the output directory relative to the client folder
    outDir: 'public'
  },
  server: {
    // The following proxies any request starting with /api, /img, or /ui
    // to your Express server on port 3000.
    proxy: {
      '/js': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/sdui': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/analytics': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ui': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/img': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/stream': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
