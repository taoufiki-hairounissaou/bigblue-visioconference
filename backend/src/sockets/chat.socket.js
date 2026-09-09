module.exports = function registerChatHandlers(io, socket) {
  socket.on('send-message', ({ roomId, userId, message }) => {
    if (!roomId || !message || !message.trim()) return;

    io.to(roomId).emit('receive-message', {
      userId,
      message: message.trim(),
      timestamp: new Date().toISOString()
    });
  });
};
