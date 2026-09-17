const roomState = require('../services/roomState.service');

module.exports = function registerScreenShareHandlers(io, socket) {
  socket.on('start-screen-share', ({ roomId, requesterId }) => {
    const requester = roomState.getParticipant(roomId, requesterId);
    if (!requester || !['moderator', 'presenter'].includes(requester.role)) return;
    socket.to(roomId).emit('screen-share-started', { peerId: requesterId });
  });

  socket.on('stop-screen-share', ({ roomId, requesterId }) => {
    socket.to(roomId).emit('screen-share-stopped', { peerId: requesterId });
  });
};
