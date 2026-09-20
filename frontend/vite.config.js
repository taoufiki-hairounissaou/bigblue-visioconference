import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem')
    },
    proxy: {
      '/socket.io': { target: BACKEND_URL, ws: true, changeOrigin: true },
      '/peerjs': { target: BACKEND_URL, ws: true, changeOrigin: true },
      '/api': { target: BACKEND_URL, changeOrigin: true }
    }
  }
});
