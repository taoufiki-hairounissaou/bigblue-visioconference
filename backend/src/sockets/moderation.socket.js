const roomState = require('../services/roomState.service');

module.exports = function registerModerationHandlers(io, socket) {
  // requesterId : peerId de la personne qui déclenche l'action (doit être modérateur)

  socket.on('mute-user', ({ roomId, requesterId, targetId }) => {
    const authorized = roomState.isModerator(roomId, requesterId);
    console.log(`Tentative mute-user par ${requesterId} sur ${targetId} — autorisé : ${authorized}`);
    if (!authorized) return;
    roomState.updateParticipant(roomId, targetId, { muted: true });
    io.to(roomId).emit('user-muted', { targetId });
  });

  socket.on('unmute-user', ({ roomId, requesterId, targetId }) => {
    if (!roomState.isModerator(roomId, requesterId)) return;
    roomState.updateParticipant(roomId, targetId, { muted: false });
    io.to(roomId).emit('user-unmuted', { targetId });
  });

  socket.on('kick-user', ({ roomId, requesterId, targetId }) => {
    if (!roomState.isModerator(roomId, requesterId)) return;
    const target = roomState.getParticipant(roomId, targetId);
    roomState.removeParticipant(roomId, targetId);
    io.to(roomId).emit('user-kicked', { targetId });
    io.to(roomId).emit('room-users', roomState.listParticipants(roomId));
    if (target) {
      io.to(target.socketId).emit('you-were-kicked');
    }
  });

  socket.on('promote-presenter', ({ roomId, requesterId, targetId }) => {
    if (!roomState.isModerator(roomId, requesterId)) return;
    roomState.updateParticipant(roomId, targetId, { role: 'presenter' });
    io.to(roomId).emit('room-users', roomState.listParticipants(roomId));
  });

  socket.on('revoke-presenter', ({ roomId, requesterId, targetId }) => {
    if (!roomState.isModerator(roomId, requesterId)) return;
    roomState.updateParticipant(roomId, targetId, { role: 'participant' });
    io.to(roomId).emit('room-users', roomState.listParticipants(roomId));
  });
};
