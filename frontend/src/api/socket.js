import { io } from 'socket.io-client';

// En développement, Vite proxy /socket.io vers le backend (voir vite.config.js).
// En production, le frontend sera servi par Nginx qui fera le même travail de proxy.
export const socket = io({ autoConnect: false });
