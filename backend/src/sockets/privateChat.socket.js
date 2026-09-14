const roomState = require('../services/roomState.service');

module.exports = function registerPrivateChatHandlers(io, socket) {
  socket.on('send-private-message', ({ roomId, fromId, toId, message }) => {
    if (!message?.trim()) return;

    const target = roomState.getParticipant(roomId, toId);
    if (!target) return;

    const payload = {
      fromId,
      toId,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Envoie au destinataire ET à l'expéditeur (pour que son propre écran s'actualise aussi)
    io.to(target.socketId).emit('receive-private-message', payload);
    socket.emit('receive-private-message', payload);
  });
};
