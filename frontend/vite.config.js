import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Adresse du backend : en dev, on la lit depuis une variable d'environnement
// pour ne pas coder en dur une IP dans le dépôt (voir .env.example).
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/socket.io': { target: BACKEND_URL, ws: true, changeOrigin: true },
      '/peerjs': { target: BACKEND_URL, ws: true, changeOrigin: true },
      '/api': { target: BACKEND_URL, changeOrigin: true }
    }
  }
});
