require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = require('./app');
const { registerSocketHandlers } = require('./sockets');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// --- Socket.io : signalisation temps réel (chat, salles, modération, etc.) ---
const io = new Server(server, {
  cors: { origin: '*' } // à restreindre à l'URL du frontend en production
});

registerSocketHandlers(io);

// --- PeerJS : serveur de signalisation WebRTC (audio/vidéo) ---
const peerServer = ExpressPeerServer(server);
app.use('/peerjs', peerServer);

server.listen(PORT, () => {
  console.log(`Serveur BigBlue démarré sur le port ${PORT}`);
});
