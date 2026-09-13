const registerRoomHandlers = require('./room.socket');
const registerChatHandlers = require('./chat.socket');
const registerHandHandlers = require('./hand.socket');
const registerModerationHandlers = require('./moderation.socket');
const registerPollHandlers = require('./poll.socket');

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Nouvel utilisateur connecté : ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerHandHandlers(io, socket);
    registerModerationHandlers(io, socket);
    registerPollHandlers(io, socket);
  });
}

module.exports = { registerSocketHandlers };
