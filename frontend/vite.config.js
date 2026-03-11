import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'print-url-plugin',
            configureServer(server) {
                server.httpServer?.once('listening', () => {
                    setTimeout(() => {
                        console.log('\n---------------------------------------------------');
                        console.log('🚀 PROJE AÇILDI! Lütfen bu linke tıkla:');
                        console.log('👉 LİNK: http://127.0.0.1:5173 👈');
                        console.log('---------------------------------------------------\n');
                    }, 100);
                });
            }
        }
    ],
    server: {
        host: true,
        port: 5173,
        strictPort: true,
    },
    clearScreen: false
})
