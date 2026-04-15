import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'print-url-plugin',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          setTimeout(() => {
            console.log(
              '\n---------------------------------------------------',
            );
            console.log('🚀 PROJE AÇILDI! Lütfen bu linke tıkla:');
            console.log('👉 LİNK: http://127.0.0.1:5173 👈');
            console.log(
              '---------------------------------------------------\n',
            );
          }, 100);
        });
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }

          if (id.includes('react-router')) {
            return 'router-vendor';
          }

          if (
            id.includes('socket.io-client') ||
            id.includes('engine.io-client')
          ) {
            return 'socket-vendor';
          }

          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  clearScreen: false,
});
