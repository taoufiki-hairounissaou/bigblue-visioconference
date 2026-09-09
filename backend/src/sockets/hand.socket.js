const roomState = require('../services/roomState.service');

module.exports = function registerHandHandlers(io, socket) {
  socket.on('raise-hand', ({ roomId, userId }) => {
    roomState.updateParticipant(roomId, userId, { handRaised: true });
    socket.to(roomId).emit('hand-raised', { userId });
  });

  socket.on('lower-hand', ({ roomId, userId }) => {
    roomState.updateParticipant(roomId, userId, { handRaised: false });
    socket.to(roomId).emit('hand-lowered', { userId });
  });
};
